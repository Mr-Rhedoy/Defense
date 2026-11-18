// JSON-file database for this project. Existing farm records are preserved during migration.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data.json');

function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function starterSubscription() {
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    return {
        planCode: 'starter',
        planName: 'Starter',
        status: 'active',
        startDate: localDate(start),
        endDate: localDate(end),
        price: 0,
        paymentStatus: 'not_required'
    };
}

function save(data) {
    const tempFile = `${FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, FILE);
}

function load() {
    let data;

    try {
        data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') {
            data = { users: [], animals: [], system: {} };
        } else {
            // Never silently replace a corrupt database with an empty one.
            throw new Error(`Could not read data.json. Make a backup and repair the JSON file: ${error.message}`);
        }
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('data.json must contain a JSON object. Restore a valid backup before starting the server.');
    }

    if (!Array.isArray(data.users)) data.users = [];
    if (!Array.isArray(data.animals)) data.animals = [];
    if (!data.system || typeof data.system !== 'object' || Array.isArray(data.system)) {
        data.system = {};
    }

    let changed = false;

    for (const user of data.users) {
        if (!user || typeof user !== 'object') continue;

        if (!user.role) { user.role = 'user'; changed = true; }
        if (typeof user.isActive !== 'boolean') { user.isActive = true; changed = true; }
        if (!user.createdAt) { user.createdAt = new Date().toISOString(); changed = true; }
        if (!Object.prototype.hasOwnProperty.call(user, 'lastLoginAt')) { user.lastLoginAt = null; changed = true; }
        if (!Object.prototype.hasOwnProperty.call(user, 'isMainAdmin')) { user.isMainAdmin = false; changed = true; }
        if (!Object.prototype.hasOwnProperty.call(user, 'emailVerified')) { user.emailVerified = false; changed = true; }

        if (typeof user.username !== 'string' || !user.username.trim()) {
            throw new Error('An account in data.json has an invalid username. Restore or repair the database before starting.');
        }

        if (typeof user.email === 'string') {
            const normalizedEmail = user.email.trim().toLowerCase();
            if (normalizedEmail !== user.email) { user.email = normalizedEmail; changed = true; }
        }

        // Existing subscriptions are retained. Legacy plan labels are normalized.
        if (user.subscription && typeof user.subscription === 'object') {
            if (user.subscription.planCode === 'demo' || /demo/i.test(user.subscription.planName || '')) {
                user.subscription.planCode = 'starter';
                user.subscription.planName = 'Starter';
                user.subscription.paymentStatus = 'not_required';
                delete user.subscription.simulated;
                changed = true;
            }
        }

        if (!user.subscription && user.role === 'user') {
            user.subscription = starterSubscription();
            changed = true;
        }
    }

    if (changed) save(data);
    return data;
}

module.exports = { load, save, starterSubscription, localDate };
