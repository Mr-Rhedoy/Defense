const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { load, save, starterSubscription } = require('../db');
const auth = require('../authMiddleware');
const { SECRET } = require('../authMiddleware');
const emailService = require('../services/emailService');
const { sendOtpEmail } = emailService;

console.log('[AUTH EMAIL CHECK]', {
    servicePath: require.resolve('../services/emailService'),
    configured: emailService.isEmailConfigured(),
    gmailPresent: Boolean(process.env.GMAIL_USER),
    passwordLength: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').length
});

const router = express.Router();
const OTP_MINUTES = 10;
const OTP_RESEND_SECONDS = 60;
const emailPattern = /^[^\s@]+@gmail\.com$/i;
const newOtp = () => String(crypto.randomInt(100000, 1000000));
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const normalizeUsername = value => String(value || '').trim();

function tokenFor(user) {
    return jwt.sign({ username: user.username }, SECRET, { expiresIn: '7d' });
}

function otpExpired(user, field) {
    const expiry = user[field];
    return !expiry || new Date(expiry).getTime() < Date.now();
}

function sendError(res, error, language = 'en') {
    console.error('Email delivery error:', error.message);
    const bangla = language === 'bn';
    return res.status(503).json({
        message: error.code === 'EMAIL_NOT_CONFIGURED'
            ? (bangla
                ? 'ইমেইল সার্ভিস সেটআপ করা হয়নি। .env ফাইলে GMAIL_USER এবং GMAIL_APP_PASSWORD যোগ করুন।'
                : 'Email is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.')
            : (bangla
                ? 'ইমেইল পাঠানো যায়নি। Gmail সেটিংস ও App Password পরীক্ষা করুন।'
                : 'Could not send the email. Check the Gmail settings and App Password.')
    });
}

async function saveOtpAndSend(user, email, purpose) {
    const now = Date.now();
    const sentAtField = purpose === 'reset' ? 'resetOtpSentAt' : 'verificationOtpSentAt';
    const hashField = purpose === 'reset' ? 'resetOtpHash' : 'emailOtpHash';
    const expiryField = purpose === 'reset' ? 'resetOtpExpiresAt' : 'emailOtpExpiresAt';

    if (user[sentAtField] && now - new Date(user[sentAtField]).getTime() < OTP_RESEND_SECONDS * 1000) {
        const wait = Math.ceil((OTP_RESEND_SECONDS * 1000 - (now - new Date(user[sentAtField]).getTime())) / 1000);
        const error = new Error(`Please wait ${wait} seconds before requesting another code.`);
        error.code = 'OTP_COOLDOWN';
        throw error;
    }

    const code = newOtp();
    await sendOtpEmail(email, code, purpose);
    user[hashField] = await bcrypt.hash(code, 10);
    user[expiryField] = new Date(now + OTP_MINUTES * 60 * 1000).toISOString();
    user[sentAtField] = new Date(now).toISOString();
    if (purpose === 'reset') user.resetOtpAttempts = 0;
    else user.emailOtpAttempts = 0;
    return code;
}

// Create a normal user account and send an email verification code.
router.post('/signup', async (req, res, next) => {
    try {
        const username = normalizeUsername(req.body && req.body.username);
        const email = normalizeEmail(req.body && req.body.email);
        const password = req.body && req.body.password;

        if (username.length < 3 || username.length > 40 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
            return res.status(400).json({ message: 'Username must be 3–40 characters and may contain letters, numbers, dot, underscore or hyphen.' });
        }
        if (!emailPattern.test(email)) return res.status(400).json({ message: 'Please enter a valid Gmail address.' });
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
        }

        const db = load();
        if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            return res.status(409).json({ message: 'This username is already taken.' });
        }
        if (db.users.some(u => (u.email || '').toLowerCase() === email)) {
            return res.status(409).json({ message: 'This Gmail address is already registered.' });
        }

        const user = {
            username,
            email,
            emailVerified: false,
            password: await bcrypt.hash(password, 12),
            role: 'user',
            isMainAdmin: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: null,
            subscription: starterSubscription()
        };

        await saveOtpAndSend(user, email, 'verify');
        db.users.push(user);
        save(db);

        res.status(201).json({
            message: 'Account created. A 6-digit verification code has been sent to your Gmail.',
            email,
            verificationRequired: true
        });
    } catch (error) {
        if (error.code === 'OTP_COOLDOWN') return res.status(429).json({ message: error.message });
        if (error.code === 'EMAIL_NOT_CONFIGURED' || error.isEmailDeliveryError) return sendError(res, error);
        next(error);
    }
});

// Login accepts either username or a verified Gmail address.
router.post('/login', async (req, res, next) => {
    try {
        const identifier = String(req.body && (req.body.identifier || req.body.username) || '').trim();
        const password = typeof (req.body && req.body.password) === 'string' ? req.body.password : '';
        const requestedRole = req.body && req.body.loginAs === 'admin' ? 'admin' : 'user';
        const lower = identifier.toLowerCase();
        const db = load();
        const user = db.users.find(u =>
            u.username.toLowerCase() === lower ||
            (u.email && u.email.toLowerCase() === lower)
        );

        if (!user || !(await bcrypt.compare(password, user.password || ''))) {
            return res.status(401).json({ message: 'Incorrect username/email or password.' });
        }

        const actualRole = user.role || 'user';
        if (actualRole !== requestedRole) {
            return res.status(403).json({ message: `This account is not registered as an ${requestedRole} account.` });
        }
        if (user.isActive === false) {
            return res.status(403).json({ message: 'This account is inactive. Contact the administrator.' });
        }

        // The main admin can always recover access by username. Other accounts must verify Gmail before login.
        const usedEmail = Boolean(user.email && lower === user.email.toLowerCase());
        if (usedEmail && user.emailVerified !== true) {
            return res.status(403).json({
                needsVerification: true,
                email: user.email,
                message: 'Please verify your Gmail address before logging in.'
            });
        }
        if (actualRole === 'admin' && user.isMainAdmin !== true && !user.email) {
            return res.status(403).json({ message: 'This admin account needs a Gmail address. Ask the main administrator to update it.' });
        }
        if (user.email && user.emailVerified !== true && user.isMainAdmin !== true) {
            return res.status(403).json({
                needsVerification: true,
                email: user.email,
                message: 'Please verify your Gmail address before logging in.'
            });
        }

        user.lastLoginAt = new Date().toISOString();
        save(db);

        res.json({
            message: 'Login successful.',
            token: tokenFor(user),
            username: user.username,
            email: user.email || null,
            emailVerified: user.emailVerified === true,
            role: actualRole,
            isMainAdmin: user.isMainAdmin === true
        });
    } catch (error) { next(error); }
});

// Verify the email address after signup.
router.post('/verify-email', async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body && req.body.email);
        const code = String(req.body && req.body.code || '').trim();
        if (!emailPattern.test(email) || !/^\d{6}$/.test(code)) {
            return res.status(400).json({ message: 'Enter a valid Gmail address and 6-digit code.' });
        }
        const db = load();
        const user = db.users.find(u => (u.email || '').toLowerCase() === email);
        if (!user) return res.status(400).json({ message: 'Email or verification code is incorrect.' });
        if (user.emailVerified === true) return res.json({ message: 'Email is already verified.' });
        user.emailOtpAttempts = Number(user.emailOtpAttempts || 0) + 1;
        if (user.emailOtpAttempts > 5 || otpExpired(user, 'emailOtpExpiresAt') || !user.emailOtpHash || !(await bcrypt.compare(code, user.emailOtpHash))) {
            if (user.emailOtpAttempts > 5) {
                delete user.emailOtpHash;
                delete user.emailOtpExpiresAt;
            }
            save(db);
            return res.status(400).json({ message: 'Verification code is incorrect or expired. Request a new code.' });
        }

        user.emailVerified = true;
        delete user.emailOtpHash;
        delete user.emailOtpExpiresAt;
        delete user.verificationOtpSentAt;
        delete user.emailOtpAttempts;
        save(db);

        res.json({
            message: 'Email verified successfully.',
            token: tokenFor(user),
            username: user.username,
            email: user.email,
            role: user.role || 'user',
            isMainAdmin: user.isMainAdmin === true
        });
    } catch (error) { next(error); }
});

router.post('/resend-verification', async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body && req.body.email);
        if (!emailPattern.test(email)) return res.status(400).json({ message: 'Enter a valid Gmail address.' });
        const db = load();
        const user = db.users.find(u => (u.email || '').toLowerCase() === email);
        if (!user || user.emailVerified === true) {
            return res.json({ message: 'If the account needs verification, a new code will be sent.' });
        }
        console.log('[SIGNUP EMAIL CHECK]', {
    configured: emailService.isEmailConfigured(),
    gmailPresent: Boolean(process.env.GMAIL_USER),
    passwordLength: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').length
});
        await saveOtpAndSend(user, email, 'verify');
        save(db);
        res.json({ message: 'A new verification code has been sent.' });
    } catch (error) {
        if (error.code === 'OTP_COOLDOWN') return res.status(429).json({ message: error.message });
        if (error.code === 'EMAIL_NOT_CONFIGURED' || error.isEmailDeliveryError) return sendError(res, error);
        next(error);
    }
});

// Begin a password reset using a one-time code sent to the verified Gmail address.
router.post('/forgot/send-otp', async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body && req.body.email);
        if (!emailPattern.test(email)) return res.status(400).json({ message: 'Enter a valid Gmail address.' });
        const db = load();
        const user = db.users.find(u => (u.email || '').toLowerCase() === email && u.emailVerified === true);
        if (!user) {
            return res.json({ message: 'If a verified account exists for this Gmail address, a password reset code will be sent.' });
        }
        await saveOtpAndSend(user, email, 'reset');
        save(db);
        res.json({ message: 'A password reset code has been sent to your Gmail.' });
    } catch (error) {
        if (error.code === 'OTP_COOLDOWN') return res.status(429).json({ message: error.message });
        if (error.code === 'EMAIL_NOT_CONFIGURED' || error.isEmailDeliveryError) return sendError(res, error);
        next(error);
    }
});

router.post('/forgot/reset', async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body && req.body.email);
        const code = String(req.body && req.body.code || '').trim();
        const newPassword = req.body && req.body.newPassword;
        if (!emailPattern.test(email) || !/^\d{6}$/.test(code) || typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ message: 'Enter your Gmail, 6-digit OTP and a new password with at least 8 characters.' });
        }
        const db = load();
        const user = db.users.find(u => (u.email || '').toLowerCase() === email && u.emailVerified === true);
        if (!user || otpExpired(user, 'resetOtpExpiresAt') || !user.resetOtpHash) {
            return res.status(400).json({ message: 'The reset code is incorrect or expired. Request a new code.' });
        }
        user.resetOtpAttempts = Number(user.resetOtpAttempts || 0) + 1;
        if (user.resetOtpAttempts > 5 || !(await bcrypt.compare(code, user.resetOtpHash))) {
            if (user.resetOtpAttempts > 5) {
                delete user.resetOtpHash;
                delete user.resetOtpExpiresAt;
            }
            save(db);
            return res.status(400).json({ message: 'The reset code is incorrect or expired. Request a new code.' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        delete user.resetOtpHash;
        delete user.resetOtpExpiresAt;
        delete user.resetOtpSentAt;
        delete user.resetOtpAttempts;
        save(db);
        res.json({ message: 'Password changed successfully. Please log in with your new password.' });
    } catch (error) { next(error); }
});

// Authenticated user/admin can add or change their own Gmail address.
router.post('/email/request-verification', auth, async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body && req.body.email);
        if (!emailPattern.test(email)) return res.status(400).json({ message: 'Enter a valid Gmail address.' });

        const db = load();
        const user = db.users.find(u => u.username.toLowerCase() === req.user.username.toLowerCase());
        const taken = db.users.some(u => u.username !== user.username && (u.email || '').toLowerCase() === email);
        if (taken) return res.status(409).json({ message: 'This Gmail address is already used by another account.' });

        await saveOtpAndSend(user, email, 'verify');
        user.pendingEmail = email;
        save(db);
        res.json({ message: 'A verification code has been sent to the new Gmail address.' });
    } catch (error) {
        if (error.code === 'OTP_COOLDOWN') return res.status(429).json({ message: error.message });
        if (error.code === 'EMAIL_NOT_CONFIGURED' || error.isEmailDeliveryError) return sendError(res, error);
        next(error);
    }
});

router.post('/email/verify', auth, async (req, res, next) => {
    try {
        const code = String(req.body && req.body.code || '').trim();
        const db = load();
        const user = db.users.find(u => u.username.toLowerCase() === req.user.username.toLowerCase());
        if (!user || !user.pendingEmail || !/^\d{6}$/.test(code)) {
            return res.status(400).json({ message: 'Verification code is incorrect or expired.' });
        }
        user.emailOtpAttempts = Number(user.emailOtpAttempts || 0) + 1;
        if (user.emailOtpAttempts > 5 || otpExpired(user, 'emailOtpExpiresAt') || !user.emailOtpHash || !(await bcrypt.compare(code, user.emailOtpHash))) {
            if (user.emailOtpAttempts > 5) {
                delete user.emailOtpHash;
                delete user.emailOtpExpiresAt;
            }
            save(db);
            return res.status(400).json({ message: 'Verification code is incorrect or expired.' });
        }
        user.email = user.pendingEmail;
        user.emailVerified = true;
        delete user.pendingEmail;
        delete user.emailOtpHash;
        delete user.emailOtpExpiresAt;
        delete user.verificationOtpSentAt;
        delete user.emailOtpAttempts;
        save(db);
        res.json({ message: 'Gmail address verified successfully.', email: user.email, emailVerified: true });
    } catch (error) { next(error); }
});
// ======================================================
// USER PROFILE UPDATE
// Display name, farm name and farm location
// Login username and account credentials remain unchanged.
// ======================================================

router.patch('/profile', auth, (req, res, next) => {
    try {
        const cleanText = (value, maxLength) => {
            return String(value || '')
                .replace(/[\u0000-\u001F\u007F]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, maxLength);
        };

        const profileName = cleanText(
            req.body && req.body.profileName,
            60
        );

        const farmName = cleanText(
            req.body && req.body.farmName,
            80
        );

        const farmLocation = cleanText(
            req.body && req.body.farmLocation,
            100
        );

        if (profileName.length < 2) {
            return res.status(400).json({
                message: 'Display name must contain at least 2 characters.'
            });
        }

        if (farmName.length === 1) {
            return res.status(400).json({
                message: 'Farm name must be empty or contain at least 2 characters.'
            });
        }

        const db = load();

        const user = db.users.find(item =>
            String(item.username || '').toLowerCase() ===
            String(req.user.username || '').toLowerCase()
        );

        if (!user) {
            return res.status(404).json({
                message: 'Account not found. Please log in again.'
            });
        }

        user.profileName = profileName;
        user.farmName = farmName;
        user.farmLocation = farmLocation;
        user.profileUpdatedAt = new Date().toISOString();

        save(db);

        res.json({
            message: 'Profile updated successfully.',

            profile: {
                username: user.username,
                profileName: user.profileName,
                farmName: user.farmName,
                farmLocation: user.farmLocation,
                email: user.email || null,
                emailVerified: user.emailVerified === true,
                createdAt: user.createdAt || null
            }
        });

    } catch (error) {
        next(error);
    }
});

router.get('/me', auth, (req, res) => {
    const user = req.account;

    res.json({
        username: user.username,

        profileName: user.profileName || user.username,

        farmName: user.farmName || '',

        farmLocation: user.farmLocation || '',

        email: user.email || null,

        emailVerified: user.emailVerified === true,

        role: user.role || 'user',

        isMainAdmin: user.isMainAdmin === true,

        isActive: user.isActive !== false,

        createdAt: user.createdAt || null,

        lastLoginAt: user.lastLoginAt || null,

        subscription: user.subscription || null
    });
});

module.exports = router;
// ======================================================
// PERMANENTLY DELETE OWN USER ACCOUNT
// Requires current password + exact confirmation phrase.
// Deletes the user's account and all associated farm data.
// Admin and main-admin accounts cannot use this endpoint.
// ======================================================

router.delete('/account', auth, async (req, res, next) => {
    try {
        const password =
            typeof (req.body && req.body.password) === 'string'
                ? req.body.password
                : '';

        const confirmation = String(
            req.body && req.body.confirmation || ''
        ).trim();


        // Only normal user accounts can self-delete.

        if (
            (req.account.role || 'user') !== 'user' ||
            req.account.isMainAdmin === true
        ) {
            return res.status(403).json({
                message: 'Administrator accounts cannot be deleted from the user profile.'
            });
        }


        // Require explicit typed confirmation.

        if (confirmation !== 'DELETE MY ACCOUNT') {
            return res.status(400).json({
                message: 'Type DELETE MY ACCOUNT exactly to confirm.'
            });
        }


        // Require current password for this sensitive action.

        if (!password) {
            return res.status(400).json({
                message: 'Enter your current password.'
            });
        }


        const db = load();

        const username = String(
            req.account.username || ''
        ).trim();

        const usernameKey = username.toLowerCase();


        const user = db.users.find(item =>
            String(item.username || '').toLowerCase() === usernameKey
        );


        if (!user || (user.role || 'user') !== 'user') {
            return res.status(404).json({
                message: 'Account not found or already deleted.'
            });
        }


        const passwordMatches = await bcrypt.compare(
            password,
            user.password || ''
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Your current password is incorrect.'
            });
        }


        // The existing animalRoutes.js assigns animals without
        // an owner to the first normal user account.
        // Preserve that ownership rule during deletion.

        const firstUser = db.users.find(item =>
            (item.role || 'user') === 'user'
        );

        const legacyOwnerKey = firstUser
            ? String(firstUser.username || '').toLowerCase()
            : null;


        const belongsToDeletingUser = animal => {
            const explicitOwner = String(
                animal.owner || ''
            ).trim();

            if (explicitOwner) {
                return explicitOwner.toLowerCase() === usernameKey;
            }

            // Legacy animals without owner belong to the
            // first normal user, as defined in animalRoutes.js.

            return legacyOwnerKey === usernameKey;
        };


        const originalAnimalCount = db.animals.length;

        db.animals = db.animals.filter(
            animal => !belongsToDeletingUser(animal)
        );

        const deletedAnimals =
            originalAnimalCount - db.animals.length;


        // Remove the account itself.
        // This also removes profile, password hash, OTP data,
        // recovery data and subscription information stored
        // inside this user record.

        db.users = db.users.filter(item =>
            String(item.username || '').toLowerCase() !== usernameKey
        );


        // Save both account and farm-data deletion together.

        save(db);


        // The current JWT becomes unusable because auth middleware
        // checks the user against data.json on every request.

        return res.json({
            success: true,

            message: 'Your account and associated farm data have been permanently deleted.',

            deletedAnimals
        });

    } catch (error) {
        next(error);
    }
});