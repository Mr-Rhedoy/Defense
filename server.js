require('dotenv').config();

const express = require('express');
const path = require('path');
const os = require('os');
const bcrypt = require('bcryptjs');

const { load, save } = require('./db');
const { startFarmAlertScheduler } = require('./services/farmAlerts');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use('/api', (req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
        const time = new Date().toLocaleTimeString();
        const who = req.user ? ` user=${req.user.username}` : '';
        console.log(`[${time}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)${who}`);
    });
    next();
});

// Only public/ is exposed to the browser. Root files and secrets stay private.
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/authRoutes'));
app.get('/api/config', (req, res) => res.json({ publicUrl: process.env.PUBLIC_URL || '' }));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/animals', require('./routes/animalRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/a/:key', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'animal.html'));
});

app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));

app.use((error, req, res, next) => {
    console.error('Server error:', error);
    if (res.headersSent) return next(error);
    res.status(500).json({ message: 'Server error.' });
});

function validateEnvironment() {
    const jwtSecret = String(process.env.JWT_SECRET || '');
    if (jwtSecret.length < 32 || /replace|change-me|your-secret/i.test(jwtSecret)) {
        throw new Error('Set JWT_SECRET in .env to a private random string of at least 32 characters before starting.');
    }

    const username = String(process.env.MAIN_ADMIN_USERNAME || 'Rhedoy').trim();
    const password = String(process.env.MAIN_ADMIN_PASSWORD || '');

    if (username.toLowerCase() !== 'rhedoy') {
        throw new Error('MAIN_ADMIN_USERNAME must be Rhedoy, as configured for the main administrator.');
    }
    if (password.length < 8) {
        throw new Error('Set MAIN_ADMIN_PASSWORD in .env. It must contain at least 8 characters.');
    }

    const email = String(process.env.MAIN_ADMIN_EMAIL || '').trim();
    if (email && !/^[^\s@]+@gmail\.com$/i.test(email)) {
        throw new Error('MAIN_ADMIN_EMAIL must be a valid Gmail address or left blank.');
    }
}

async function bootstrapMainAdmin() {
    const username = 'Rhedoy';
    const password = String(process.env.MAIN_ADMIN_PASSWORD);
    const configuredEmail = String(process.env.MAIN_ADMIN_EMAIL || '').trim().toLowerCase();
    const db = load();

    const mainAdmin = db.users.find(user =>
        user.username.toLowerCase() === username.toLowerCase()
    );

    if (configuredEmail) {
        const emailOwner = db.users.find(user =>
            user.username.toLowerCase() !== username.toLowerCase() &&
            (user.email || '').toLowerCase() === configuredEmail
        );
        if (emailOwner) {
            throw new Error('MAIN_ADMIN_EMAIL is already assigned to another account. Choose a different Gmail address.');
        }
    }

    if (!db.system.mainAdminConfigured) {
        // Give legacy unowned animals a stable owner before roles are migrated.
        // Prefer the first legacy User; if there are no users, assign them to Rhedoy.
        const firstLegacyUser = db.users.find(user => (user.role || 'user') === 'user');
        const legacyOwner = firstLegacyUser ? firstLegacyUser.username : username;
        db.animals.forEach(animal => {
            if (!animal.owner) animal.owner = legacyOwner;
        });

        let account = mainAdmin;
        if (!account) {
            account = {
                username,
                createdAt: new Date().toISOString(),
                lastLoginAt: null,
                isActive: true
            };
            db.users.push(account);
        }

        account.username = username;
        account.password = await bcrypt.hash(password, 12);
        account.role = 'admin';
        account.isMainAdmin = true;
        account.isActive = true;
        account.subscription = null;

        if (configuredEmail && configuredEmail !== (account.email || '').toLowerCase()) {
            account.email = configuredEmail;
            account.emailVerified = false;
        } else if (!account.email) {
            account.emailVerified = false;
        }

        db.system.mainAdminConfigured = true;
        db.system.mainAdminConfiguredAt = new Date().toISOString();
        save(db);
        console.log('Main administrator account initialized: Rhedoy');
        return;
    }

    if (!mainAdmin) {
        throw new Error('The main administrator record Rhedoy is missing from data.json. Restore your database backup.');
    }

    // Protect the main-admin role without resetting its password on every restart.
    mainAdmin.role = 'admin';
    mainAdmin.isMainAdmin = true;
    mainAdmin.isActive = true;
    save(db);
}

async function start() {
    validateEnvironment();
    await bootstrapMainAdmin();

    const port = Number(process.env.PORT || 5000);
    const host = process.env.HOST || '0.0.0.0';

    app.listen(port, host, () => {
        console.log('Smart-Agro server is running.');
        console.log(`Open: http://localhost:${port}`);

        Object.values(os.networkInterfaces()).flat()
            .filter(item => item && item.family === 'IPv4' && !item.internal)
            .forEach(item => console.log(`Phone on same Wi-Fi: http://${item.address}:${port}`));

        startFarmAlertScheduler();
    });
}

start().catch(error => {
    console.error('Could not start Smart-Agro:', error.message);
    process.exit(1);
});
