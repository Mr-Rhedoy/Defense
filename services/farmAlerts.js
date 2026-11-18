const { load, save, localDate } = require('../db');
const { logDays, opProfit } = require('../public/calc');
const { sendEmail, isEmailConfigured } = require('./emailService');

let running = false;

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

function ownerOf(db, animal) {
    const firstUser = db.users.find(user => (user.role || 'user') === 'user');
    return animal.owner || (firstUser && firstUser.username);
}

function getFarmAlerts(animals) {
    const today = localDate();
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);
    const limitDate = localDate(limit);
    const alerts = [];

    for (const animal of animals) {
        if (animal.status !== 'active') continue;

        if (animal.nextVaccine && animal.nextVaccine <= limitDate) {
            const overdue = animal.nextVaccine < today;
            alerts.push({
                type: 'vaccine',
                title: overdue ? 'Vaccination overdue' : 'Vaccination due soon',
                detail: `${animal.id}: ${overdue ? 'overdue since' : 'scheduled for'} ${animal.nextVaccine}`
            });
        }

        const safeAnimal = { ...animal, logs: Array.isArray(animal.logs) ? animal.logs : [] };
        if (logDays(safeAnimal) >= 4 && opProfit(safeAnimal) < 0) {
            alerts.push({
                type: 'loss',
                title: 'Operating loss alert',
                detail: `${animal.id}: recorded milk income is lower than recorded operating expenses.`
            });
        }
    }
    return alerts;
}

async function sendFarmAlerts() {
    if (running || !isEmailConfigured()) return;
    running = true;

    try {
        const db = load();
        const today = localDate();
        let changed = false;

        const users = db.users.filter(user =>
            (user.role || 'user') === 'user' &&
            user.isActive !== false &&
            user.emailVerified === true &&
            typeof user.email === 'string' &&
            user.email.includes('@') &&
            user.lastFarmAlertEmailDate !== today
        );

        for (const user of users) {
            const animals = db.animals.filter(animal => ownerOf(db, animal) === user.username);
            const alerts = getFarmAlerts(animals);
            if (!alerts.length) continue;

            const rows = alerts.map(alert =>
                `<li style="margin:8px 0"><strong>${escapeHtml(alert.title)}:</strong> ${escapeHtml(alert.detail)}</li>`
            ).join('');

            const text = `Smart-Agro Farm Alerts\n\n${alerts.map(alert => `${alert.title}: ${alert.detail}`).join('\n')}\n\nPlease open Smart-Agro to review your farm records.`;
            const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7f5;padding:24px;color:#17231c"><div style="max-width:600px;margin:auto;background:#fff;border-radius:14px;padding:28px"><h2 style="color:#15803d">Smart-Agro Farm Alerts</h2><p>Hello ${escapeHtml(user.username)}, here is your farm alert summary for ${today}.</p><ul>${rows}</ul><p>Please open Smart-Agro to review your farm records.</p></div></body></html>`;

            try {
                await sendEmail({
                    to: user.email,
                    subject: `Smart-Agro farm alerts – ${today}`,
                    text,
                    html
                });
                user.lastFarmAlertEmailDate = today;
                user.lastFarmAlertEmailAt = new Date().toISOString();
                changed = true;
                console.log(`Farm alert email sent to ${user.email} (${alerts.length} alert(s)).`);
            } catch (error) {
                console.error(`Could not send farm alerts to ${user.email}:`, error.message);
            }
        }

        if (changed) save(db);
    } catch (error) {
        console.error('Farm alert scheduler error:', error.message);
    } finally {
        running = false;
    }
}

function startFarmAlertScheduler() {
    if (!isEmailConfigured()) {
        console.warn('Email alerts are disabled until GMAIL_USER and GMAIL_APP_PASSWORD are set in .env.');
        return;
    }
    // Check shortly after startup, then every 6 hours. Each user receives at most one digest per day.
    setTimeout(() => sendFarmAlerts(), 15000);
    setInterval(() => sendFarmAlerts(), 6 * 60 * 60 * 1000);
    console.log('Farm email alert scheduler started (checks every 6 hours).');
}

module.exports = { sendFarmAlerts, startFarmAlertScheduler };
