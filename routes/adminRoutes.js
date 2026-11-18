const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { load, save, starterSubscription } = require('../db');
const auth = require('../authMiddleware');
const { requireRole, requireMainAdmin } = require('../authMiddleware');
const { sendOtpEmail } = require('../services/emailService');

const router = express.Router();

// All admin APIs require an active administrator account.
router.use(auth, requireRole('admin'));

const EMAIL_PATTERN = /^[^\s@]+@gmail\.com$/i;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;

const AUDIT_ACTIONS = new Set([
    'user.created',
    'admin.created',
    'user.status_changed',
    'admin.status_changed'
]);

const normalizeEmail = value =>
    String(value || '').trim().toLowerCase();

const normalizeUsername = value =>
    String(value || '').trim();

const newOtp = () =>
    String(crypto.randomInt(100000, 1000000));


// ======================================================
// DATE AND SUBSCRIPTION HELPERS
// ======================================================

function dateKeyInDhaka(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
}


function subStatus(subscription) {
    if (!subscription || subscription.status !== 'active') {
        return 'inactive';
    }

    const today = dateKeyInDhaka(new Date());

    if (subscription.endDate && subscription.endDate < today) {
        return 'expired';
    }

    return 'active';
}


function validDate(value) {
    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}


function monthKey(date) {
    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, '0')}`;
}


function monthLabel(key) {
    const [year, month] = key.split('-').map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString('en', {
        month: 'short',
        year: 'numeric'
    });
}


function getMonthKeys(count = 6) {
    const now = new Date();
    const keys = [];

    for (let offset = count - 1; offset >= 0; offset--) {
        const date = new Date(
            now.getFullYear(),
            now.getMonth() - offset,
            1
        );

        keys.push(monthKey(date));
    }

    return keys;
}


// ======================================================
// DATABASE AND AUDIT HELPERS
// ======================================================

function ensureSystem(db) {
    if (
        !db.system ||
        typeof db.system !== 'object' ||
        Array.isArray(db.system)
    ) {
        db.system = {};
    }

    return db.system;
}


function recordAudit(db, actor, action, target, summary) {
    const system = ensureSystem(db);

    if (!Array.isArray(system.adminAuditLogs)) {
        system.adminAuditLogs = [];
    }

    system.adminAuditLogs.push({
        id: crypto.randomBytes(16).toString('hex'),

        actor: actor && actor.username
            ? actor.username
            : 'Unknown admin',

        actorRole: actor && actor.isMainAdmin
            ? 'Main administrator'
            : 'Administrator',

        action,

        target: String(target || '').slice(0, 100),

        summary: String(summary || '').slice(0, 300),

        createdAt: new Date().toISOString()
    });

    // Retain the latest 2,000 audit events.
    if (system.adminAuditLogs.length > 2000) {
        system.adminAuditLogs =
            system.adminAuditLogs.slice(-2000);
    }
}


// ======================================================
// DATE RANGE VALIDATION
// Dashboard date input is interpreted in Bangladesh time.
// ======================================================

function parseDateRange(fromValue, toValue, maximumDays = 366) {
    const from = String(fromValue || '').trim();
    const to = String(toValue || '').trim();

    const pattern = /^\d{4}-\d{2}-\d{2}$/;

    if (
        !pattern.test(from) ||
        !pattern.test(to) ||
        from > to
    ) {
        return {
            error: 'Choose a valid date range.'
        };
    }

    const start = new Date(
        `${from}T00:00:00.000+06:00`
    );

    const end = new Date(
        `${to}T23:59:59.999+06:00`
    );

    const [fromYear, fromMonth, fromDay] =
        from.split('-').map(Number);

    const [toYear, toMonth, toDay] =
        to.split('-').map(Number);

    const fromDayNumber = Date.UTC(
        fromYear,
        fromMonth - 1,
        fromDay
    );

    const toDayNumber = Date.UTC(
        toYear,
        toMonth - 1,
        toDay
    );

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        new Date(fromDayNumber).toISOString().slice(0, 10) !== from ||
        new Date(toDayNumber).toISOString().slice(0, 10) !== to
    ) {
        return {
            error: 'Choose real calendar dates.'
        };
    }

    const days = Math.floor(
        (toDayNumber - fromDayNumber) / 86400000
    ) + 1;

    if (days < 1 || days > maximumDays) {
        return {
            error: `Choose a date range of ${maximumDays} days or less.`
        };
    }

    return {
        from,
        to,
        start,
        end,
        days,
        fromDayNumber
    };
}


// ======================================================
// PAGINATION HELPER
// ======================================================

function parsePagination(query, defaultLimit = 10) {
    const rawPage = Number.parseInt(query.page, 10);
    const rawLimit = Number.parseInt(query.limit, 10);

    const page =
        Number.isFinite(rawPage) && rawPage > 0
            ? Math.min(rawPage, 100000)
            : 1;

    const limit =
        Number.isFinite(rawLimit) && rawLimit > 0
            ? Math.min(rawLimit, 100)
            : defaultLimit;

    return {
        page,
        limit
    };
}


// ======================================================
// SAFE USER DATA
// Never return password hashes or OTP information.
// ======================================================

function safeUserRecord(user) {
    return {
        username: user.username,

        email: user.email || null,

        emailVerified: user.emailVerified === true,

        isActive: user.isActive !== false,

        createdAt: user.createdAt || null,

        lastLoginAt: user.lastLoginAt || null,

        subscription: user.subscription || null,

        subscriptionStatus: subStatus(user.subscription)
    };
}


// ======================================================
// ACCOUNT CREATION
// ======================================================

async function createAccount({
    username,
    email,
    password,
    role,
    isMainAdmin = false,
    actor
}) {
    const db = load();

    const name = normalizeUsername(username);

    const address = normalizeEmail(email);


    // Username validation

    if (
        name.length < 3 ||
        name.length > 40 ||
        !USERNAME_PATTERN.test(name)
    ) {
        const error = new Error(
            'Username must be 3–40 characters and may contain letters, numbers, dot, underscore or hyphen.'
        );

        error.status = 400;

        throw error;
    }


    // Gmail validation

    if (!EMAIL_PATTERN.test(address)) {
        const error = new Error(
            'Enter a valid Gmail address.'
        );

        error.status = 400;

        throw error;
    }


    // Password validation

    if (
        typeof password !== 'string' ||
        password.length < 8
    ) {
        const error = new Error(
            'Password must contain at least 8 characters.'
        );

        error.status = 400;

        throw error;
    }


    // Duplicate username check

    if (
        db.users.some(user =>
            String(user.username || '').toLowerCase() ===
            name.toLowerCase()
        )
    ) {
        const error = new Error(
            'This username is already taken.'
        );

        error.status = 409;

        throw error;
    }


    // Duplicate Gmail check

    if (
        db.users.some(user =>
            normalizeEmail(user.email) === address
        )
    ) {
        const error = new Error(
            'This Gmail address is already registered.'
        );

        error.status = 409;

        throw error;
    }


    // Generate and email OTP

    const code = newOtp();

    await sendOtpEmail(address, code, 'verify');


    // Create account

    const user = {
        username: name,

        email: address,

        emailVerified: false,

        emailOtpHash: await bcrypt.hash(code, 10),

        emailOtpExpiresAt: new Date(
            Date.now() + 10 * 60 * 1000
        ).toISOString(),

        verificationOtpSentAt: new Date().toISOString(),

        password: await bcrypt.hash(password, 12),

        role,

        isMainAdmin,

        isActive: true,

        createdAt: new Date().toISOString(),

        lastLoginAt: null,

        subscription:
            role === 'user'
                ? starterSubscription()
                : null
    };


    db.users.push(user);


    // Audit record

    recordAudit(
        db,
        actor,
        role === 'admin'
            ? 'admin.created'
            : 'user.created',
        name,
        `${role === 'admin' ? 'Administrator' : 'User'} account created; Gmail verification email sent.`
    );


    save(db);

    return {
        username: name,
        email: address
    };
}


// ======================================================
// PHASE 1: DASHBOARD STATISTICS
// ======================================================

router.get('/stats', (req, res, next) => {
    try {
        const db = load();

        const users = db.users.filter(
            user => (user.role || 'user') === 'user'
        );

        const admins = db.users.filter(
            user => (user.role || 'user') === 'admin'
        );

        const enabledUsers = users.filter(
            user => user.isActive !== false
        );

        const disabledUsers = users.filter(
            user => user.isActive === false
        );


        const now = new Date();

        const sevenDaysAgo =
            now.getTime() - 7 * 24 * 60 * 60 * 1000;


        const recentLoginUsers = users.filter(user => {
            const lastLogin = validDate(user.lastLoginAt);

            return (
                lastLogin &&
                lastLogin.getTime() >= sevenDaysAgo
            );
        }).length;


        // Monthly registrations

        const keys = getMonthKeys(6);

        const registrationCounts = Object.fromEntries(
            keys.map(key => [key, 0])
        );

        for (const user of users) {
            const created = validDate(user.createdAt);

            if (!created) continue;

            const key = monthKey(created);

            if (
                Object.prototype.hasOwnProperty.call(
                    registrationCounts,
                    key
                )
            ) {
                registrationCounts[key]++;
            }
        }

        const registrationsByMonth = keys.map(key => ({
            month: monthLabel(key),
            count: registrationCounts[key]
        }));


        // Subscription distribution

        const subscriptionsByPlanMap = new Map();

        for (const user of users) {
            const subscription = user.subscription;

            if (!subscription) continue;

            const planName = String(
                subscription.planName ||
                subscription.planCode ||
                'Unassigned'
            );

            subscriptionsByPlanMap.set(
                planName,
                (subscriptionsByPlanMap.get(planName) || 0) + 1
            );
        }

        const subscriptionsByPlan =
            [...subscriptionsByPlanMap.entries()]
                .map(([plan, count]) => ({
                    plan,
                    count
                }))
                .sort((a, b) => b.count - a.count);


        // Current month registrations

        const currentMonth = monthKey(now);

        const registeredThisMonth = users.filter(user => {
            const created = validDate(user.createdAt);

            return (
                created &&
                monthKey(created) === currentMonth
            );
        }).length;


        // Recent registrations

        const recentRegistrations = [...users]
            .sort((a, b) =>
                (validDate(b.createdAt)?.getTime() || 0) -
                (validDate(a.createdAt)?.getTime() || 0)
            )
            .slice(0, 6)
            .map(user => ({
                username: user.username,
                email: user.email || null,
                emailVerified: user.emailVerified === true,
                isActive: user.isActive !== false,
                planName: user.subscription?.planName || 'No plan',
                createdAt: user.createdAt || null
            }));


        // Recent administrator sign-ins

        const recentAdminSignIns = admins
            .filter(admin => validDate(admin.lastLoginAt))
            .sort((a, b) =>
                validDate(b.lastLoginAt).getTime() -
                validDate(a.lastLoginAt).getTime()
            )
            .slice(0, 6)
            .map(admin => ({
                username: admin.username,
                email: admin.email || null,
                isMainAdmin: admin.isMainAdmin === true,
                isActive: admin.isActive !== false,
                lastLoginAt: admin.lastLoginAt
            }));


        res.json({
            totalUsers: users.length,

            activeUsers: enabledUsers.length,

            inactiveUsers: disabledUsers.length,

            recentLoginUsers7d: recentLoginUsers,

            registeredThisMonth,

            totalAdmins: admins.length,

            activeAdmins: admins.filter(
                admin => admin.isActive !== false
            ).length,

            totalAnimals: db.animals.length,

            verifiedUsers: users.filter(
                user => user.emailVerified === true
            ).length,

            unverifiedUsers: users.filter(
                user => user.emailVerified !== true
            ).length,

            subscriptionActive: users.filter(
                user => subStatus(user.subscription) === 'active'
            ).length,

            subscriptionExpired: users.filter(
                user => subStatus(user.subscription) === 'expired'
            ).length,

            subscriptionInactive: users.filter(
                user => subStatus(user.subscription) === 'inactive'
            ).length,

            registrationsByMonth,

            subscriptionsByPlan,

            recentRegistrations,

            recentAdminSignIns,

            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// PHASE 1: USER LIST (BACKWARD COMPATIBLE)
// ======================================================

router.get('/users', (req, res, next) => {
    try {
        const db = load();

        const users = db.users
            .filter(
                user => (user.role || 'user') === 'user'
            )
            .map(safeUserRecord)
            .sort(
                (a, b) => a.username.localeCompare(b.username)
            );

        res.json(users);

    } catch (error) {
        next(error);
    }
});


// ======================================================
// PHASE 2: USER SEARCH, FILTER AND PAGINATION
// ======================================================

router.get('/users/search', (req, res, next) => {
    try {
        const db = load();

        const query = String(
            req.query.search || ''
        ).trim().toLowerCase();

        if (query.length > 100) {
            return res.status(400).json({
                message: 'Search text is too long.'
            });
        }


        const accountStatus = String(
            req.query.status || 'all'
        );

        const emailStatus = String(
            req.query.email || 'all'
        );

        const subscriptionStatus = String(
            req.query.subscription || 'all'
        );

        const planFilter = String(
            req.query.plan || 'all'
        ).trim().toLowerCase();


        // Validate filters

        const allowedAccountStatuses = new Set([
            'all',
            'enabled',
            'disabled'
        ]);

        const allowedEmailStatuses = new Set([
            'all',
            'verified',
            'unverified'
        ]);

        const allowedSubscriptionStatuses = new Set([
            'all',
            'active',
            'expired',
            'inactive'
        ]);

        // These codes match the subscriptionRoutes.js plan catalog.
        const allowedPlans = new Set([
            'all',
            'starter',
            'basic',
            'standard',
            'premium'
        ]);


        if (!allowedAccountStatuses.has(accountStatus)) {
            return res.status(400).json({
                message: 'Invalid account status filter.'
            });
        }

        if (!allowedEmailStatuses.has(emailStatus)) {
            return res.status(400).json({
                message: 'Invalid email verification filter.'
            });
        }

        if (!allowedSubscriptionStatuses.has(subscriptionStatus)) {
            return res.status(400).json({
                message: 'Invalid subscription filter.'
            });
        }

        if (!allowedPlans.has(planFilter)) {
            return res.status(400).json({
                message: 'Invalid plan filter.'
            });
        }


        const { page, limit } = parsePagination(
            req.query,
            10
        );


        let users = db.users.filter(
            user => (user.role || 'user') === 'user'
        );


        // Search username and Gmail

        if (query) {
            users = users.filter(user =>
                String(user.username || '')
                    .toLowerCase()
                    .includes(query) ||

                normalizeEmail(user.email).includes(query)
            );
        }


        // Account status

        if (accountStatus === 'enabled') {
            users = users.filter(
                user => user.isActive !== false
            );

        } else if (accountStatus === 'disabled') {
            users = users.filter(
                user => user.isActive === false
            );
        }


        // Email verification

        if (emailStatus === 'verified') {
            users = users.filter(
                user => user.emailVerified === true
            );

        } else if (emailStatus === 'unverified') {
            users = users.filter(
                user => user.emailVerified !== true
            );
        }


        // Subscription status

        if (subscriptionStatus !== 'all') {
            users = users.filter(
                user => subStatus(user.subscription) === subscriptionStatus
            );
        }


        // Subscription plan

        if (planFilter !== 'all') {
            users = users.filter(user => {
                const subscription = user.subscription || {};

                const code = String(
                    subscription.planCode || ''
                ).toLowerCase();

                const name = String(
                    subscription.planName || ''
                ).toLowerCase();

                return (
                    code === planFilter ||
                    name === planFilter
                );
            });
        }


        // Newest registrations first

        users.sort((a, b) =>
            (validDate(b.createdAt)?.getTime() || 0) -
            (validDate(a.createdAt)?.getTime() || 0)
        );


        const total = users.length;

        const totalPages = Math.max(
            1,
            Math.ceil(total / limit)
        );

        const safePage = Math.min(page, totalPages);

        const offset = (safePage - 1) * limit;


        res.json({
            items: users
                .slice(offset, offset + limit)
                .map(safeUserRecord),

            total,

            page: safePage,

            limit,

            totalPages
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// PHASE 1: CREATE USER
// ======================================================

router.post('/users', async (req, res, next) => {
    try {
        const result = await createAccount({
            username: req.body && req.body.username,
            email: req.body && req.body.email,
            password: req.body && req.body.password,
            role: 'user',
            actor: req.user
        });

        res.status(201).json({
            message: 'User account created. A Gmail verification code has been sent.',
            ...result
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                message: error.message
            });
        }

        if (
            error.code === 'EMAIL_NOT_CONFIGURED' ||
            error.isEmailDeliveryError
        ) {
            console.error(
                'User creation email error:',
                error.message
            );

            return res.status(503).json({
                message: 'Could not send the verification email. Check your email provider settings in .env.'
            });
        }

        next(error);
    }
});


// ======================================================
// PHASE 1: ADMIN LIST
// ======================================================

router.get('/admins', (req, res, next) => {
    try {
        const db = load();

        const admins = db.users
            .filter(
                user => (user.role || 'user') === 'admin'
            )
            .map(user => ({
                username: user.username,

                email: user.email || null,

                emailVerified: user.emailVerified === true,

                isMainAdmin: user.isMainAdmin === true,

                isActive: user.isActive !== false,

                createdAt: user.createdAt || null,

                lastLoginAt: user.lastLoginAt || null
            }))
            .sort((a, b) =>
                Number(b.isMainAdmin) - Number(a.isMainAdmin) ||
                a.username.localeCompare(b.username)
            );

        res.json(admins);

    } catch (error) {
        next(error);
    }
});


// ======================================================
// PHASE 1: CREATE ADMIN
// MAIN ADMIN ONLY
// ======================================================

router.post(
    '/admins',
    requireMainAdmin,
    async (req, res, next) => {
        try {
            const result = await createAccount({
                username: req.body && req.body.username,
                email: req.body && req.body.email,
                password: req.body && req.body.password,
                role: 'admin',
                isMainAdmin: false,
                actor: req.user
            });

            res.status(201).json({
                message: 'Admin account created. A Gmail verification code has been sent.',
                ...result
            });

        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({
                    message: error.message
                });
            }

            if (
                error.code === 'EMAIL_NOT_CONFIGURED' ||
                error.isEmailDeliveryError
            ) {
                console.error(
                    'Admin creation email error:',
                    error.message
                );

                return res.status(503).json({
                    message: 'Could not send the verification email. Check your email provider settings in .env.'
                });
            }

            next(error);
        }
    }
);


// ======================================================
// PHASE 1 + 2: USER ACCOUNT STATUS
// ======================================================

router.patch('/users/:username/status', (req, res, next) => {
    try {
        const isActive = req.body && req.body.isActive;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                message: 'isActive must be true or false.'
            });
        }

        const db = load();

        const requestedUsername = String(
            req.params.username || ''
        ).toLowerCase();


        const user = db.users.find(item =>
            String(item.username || '').toLowerCase() ===
                requestedUsername &&

            (item.role || 'user') === 'user'
        );


        if (!user) {
            return res.status(404).json({
                message: 'User account not found.'
            });
        }


        const previousStatus = user.isActive !== false;

        user.isActive = isActive;


        // Record only actual status changes.

        if (previousStatus !== isActive) {
            recordAudit(
                db,
                req.user,
                'user.status_changed',
                user.username,
                `User account ${isActive ? 'enabled' : 'disabled'}.`
            );
        }


        save(db);

        res.json({
            message: isActive
                ? 'Account activated.'
                : 'Account deactivated.',

            isActive
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// PHASE 1 + 2: ADMIN ACCOUNT STATUS
// MAIN ADMIN ONLY
// ======================================================

router.patch(
    '/admins/:username/status',
    requireMainAdmin,
    (req, res, next) => {
        try {
            const isActive = req.body && req.body.isActive;

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    message: 'isActive must be true or false.'
                });
            }

            const db = load();

            const requestedUsername = String(
                req.params.username || ''
            ).toLowerCase();


            const admin = db.users.find(item =>
                String(item.username || '').toLowerCase() ===
                    requestedUsername &&

                (item.role || 'user') === 'admin'
            );


            if (!admin) {
                return res.status(404).json({
                    message: 'Admin account not found.'
                });
            }


            // Main admin protection.

            if (admin.isMainAdmin) {
                return res.status(403).json({
                    message: 'The main admin account cannot be deactivated here.'
                });
            }


            const previousStatus = admin.isActive !== false;

            admin.isActive = isActive;


            if (previousStatus !== isActive) {
                recordAudit(
                    db,
                    req.user,
                    'admin.status_changed',
                    admin.username,
                    `Administrator account ${isActive ? 'enabled' : 'disabled'}.`
                );
            }


            save(db);

            res.json({
                message: isActive
                    ? 'Admin activated.'
                    : 'Admin deactivated.',

                isActive
            });

        } catch (error) {
            next(error);
        }
    }
);


// ======================================================
// PHASE 2: DATE-RANGE REGISTRATION ANALYTICS
// ======================================================

router.get('/analytics', (req, res, next) => {
    try {
        const today = dateKeyInDhaka(new Date());

        const defaultStartDate = new Date(
            Date.now() - 29 * 86400000
        );

        const fromValue =
            req.query.from ||
            dateKeyInDhaka(defaultStartDate);

        const toValue =
            req.query.to ||
            today;


        const range = parseDateRange(
            fromValue,
            toValue,
            366
        );

        if (range.error) {
            return res.status(400).json({
                message: range.error
            });
        }


        const db = load();

        const users = db.users.filter(
            user => (user.role || 'user') === 'user'
        );


        // Users created within selected dates.

        const matched = users.filter(user => {
            const created = validDate(user.createdAt);

            return (
                created &&
                created >= range.start &&
                created <= range.end
            );
        });


        // Use daily buckets up to 45 days.
        // Use monthly buckets for longer ranges.

        const useDailyBuckets = range.days <= 45;

        const buckets = new Map();


        if (useDailyBuckets) {
            for (let offset = 0; offset < range.days; offset++) {
                const dayNumber =
                    range.fromDayNumber + offset * 86400000;

                const key = new Date(dayNumber)
                    .toISOString()
                    .slice(0, 10);

                buckets.set(key, 0);
            }

        } else {
            const cursor = new Date(
                `${range.from.slice(0, 7)}-01T00:00:00.000Z`
            );

            const lastMonth = new Date(
                `${range.to.slice(0, 7)}-01T00:00:00.000Z`
            );

            while (cursor <= lastMonth) {
                buckets.set(
                    cursor.toISOString().slice(0, 7),
                    0
                );

                cursor.setUTCMonth(
                    cursor.getUTCMonth() + 1
                );
            }
        }


        // Count registrations in the appropriate bucket.

        for (const user of matched) {
            const created = validDate(user.createdAt);

            const dhakaDateKey = dateKeyInDhaka(created);

            const key = useDailyBuckets
                ? dhakaDateKey
                : dhakaDateKey.slice(0, 7);

            if (buckets.has(key)) {
                buckets.set(
                    key,
                    buckets.get(key) + 1
                );
            }
        }


        const series = [...buckets.entries()].map(
            ([key, count]) => ({
                label: useDailyBuckets
                    ? new Date(
                        `${key}T00:00:00.000+06:00`
                    ).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'Asia/Dhaka'
                    })
                    : new Date(
                        `${key}-01T00:00:00.000+06:00`
                    ).toLocaleDateString('en', {
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'Asia/Dhaka'
                    }),

                count
            })
        );


        res.json({
            from: range.from,

            to: range.to,

            days: range.days,

            summary: {
                newUsers: matched.length,

                enabledUsers: matched.filter(
                    user => user.isActive !== false
                ).length,

                disabledUsers: matched.filter(
                    user => user.isActive === false
                ).length,

                verifiedUsers: matched.filter(
                    user => user.emailVerified === true
                ).length
            },

            series,

            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// PHASE 2: ADMIN AUDIT HISTORY
// ======================================================

router.get('/audit-logs', (req, res, next) => {
    try {
        const action = String(
            req.query.action || 'all'
        );


        if (
            action !== 'all' &&
            !AUDIT_ACTIONS.has(action)
        ) {
            return res.status(400).json({
                message: 'Invalid audit activity filter.'
            });
        }


        const { page, limit } = parsePagination(
            req.query,
            15
        );


        const db = load();

        const system = ensureSystem(db);

        let logs = Array.isArray(system.adminAuditLogs)
            ? [...system.adminAuditLogs]
            : [];


        // Activity type filter.

        if (action !== 'all') {
            logs = logs.filter(
                item => item.action === action
            );
        }


        // Date filters.

        const from = String(
            req.query.from || ''
        ).trim();

        const to = String(
            req.query.to || ''
        ).trim();


        if (from || to) {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;

            if (
                (from && !datePattern.test(from)) ||
                (to && !datePattern.test(to)) ||
                (from && to && from > to)
            ) {
                return res.status(400).json({
                    message: 'Choose valid audit filter dates.'
                });
            }


            let start = null;
            let end = null;


            if (from) {
                start = new Date(
                    `${from}T00:00:00.000+06:00`
                );

                const [year, month, day] =
                    from.split('-').map(Number);

                const check = new Date(
                    Date.UTC(year, month - 1, day)
                ).toISOString().slice(0, 10);

                if (
                    Number.isNaN(start.getTime()) ||
                    check !== from
                ) {
                    return res.status(400).json({
                        message: 'Invalid audit start date.'
                    });
                }
            }


            if (to) {
                const endStart = new Date(
                    `${to}T00:00:00.000+06:00`
                );

                const [year, month, day] =
                    to.split('-').map(Number);

                const check = new Date(
                    Date.UTC(year, month - 1, day)
                ).toISOString().slice(0, 10);

                if (
                    Number.isNaN(endStart.getTime()) ||
                    check !== to
                ) {
                    return res.status(400).json({
                        message: 'Invalid audit end date.'
                    });
                }

                end = new Date(
                    `${to}T23:59:59.999+06:00`
                );
            }


            logs = logs.filter(item => {
                const created = validDate(item.createdAt);

                if (!created) return false;

                if (start && created < start) return false;

                if (end && created > end) return false;

                return true;
            });
        }


        // Newest events first.

        logs.sort((a, b) =>
            (validDate(b.createdAt)?.getTime() || 0) -
            (validDate(a.createdAt)?.getTime() || 0)
        );


        const total = logs.length;

        const totalPages = Math.max(
            1,
            Math.ceil(total / limit)
        );

        const safePage = Math.min(page, totalPages);

        const offset = (safePage - 1) * limit;


        res.json({
            items: logs.slice(offset, offset + limit),

            total,

            page: safePage,

            limit,

            totalPages,

            retentionLimit: 2000
        });

    } catch (error) {
        next(error);
    }
});


module.exports = router;