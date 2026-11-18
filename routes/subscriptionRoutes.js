const express = require('express');
const { load, save } = require('../db');
const auth = require('../authMiddleware');
const { requireRole } = require('../authMiddleware');

const router = express.Router();
router.use(auth, requireRole('user'));

const PLANS = [
    { code: 'starter', name: 'Starter', durationDays: 30, price: 0, description: 'Essential farm management access' },
    { code: 'basic', name: 'Basic', durationDays: 30, price: 499, description: 'One month of farm management access' },
    { code: 'standard', name: 'Standard', durationDays: 90, price: 1299, description: 'Three months of farm management access' },
    { code: 'premium', name: 'Premium', durationDays: 365, price: 4499, description: 'One year of farm management access' }
];

function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function info(user) {
    const subscription = user.subscription || null;
    const expired = Boolean(subscription && subscription.endDate && subscription.endDate < localDate());
    return {
        username: user.username,
        subscription: subscription ? {
            ...subscription,
            status: subscription.status === 'active' && !expired ? 'active' : 'expired'
        } : null,
        plans: PLANS
    };
}

router.get('/me', (req, res) => res.json(info(req.account)));

router.post('/select', (req, res) => {
    const plan = PLANS.find(item => item.code === (req.body && req.body.planCode));
    if (!plan) return res.status(400).json({ message: 'Please select a valid subscription plan.' });

    const db = load();
    const user = db.users.find(item => item.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'Account not found.' });

    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.durationDays);
    user.subscription = {
        planCode: plan.code,
        planName: plan.name,
        status: 'active',
        startDate: localDate(start),
        endDate: localDate(end),
        price: plan.price,
        paymentStatus: plan.price === 0 ? 'not_required' : 'awaiting_payment'
    };
    save(db);
    res.json({ message: 'Subscription plan updated.', ...info(user) });
});

module.exports = router;
