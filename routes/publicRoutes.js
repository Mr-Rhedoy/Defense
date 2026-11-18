// Read-only page data for QR scans. No login needed, but the link contains a secret random key.
const express = require('express');
const jwt = require('jsonwebtoken');
const { load } = require('../db');
const { SECRET } = require('../authMiddleware');
const calc = require('../public/calc');

const router = express.Router();

router.get('/animal/:key', (req, res) => {
    const db = load();
    const a = db.animals.find(x => x.qrKey && x.qrKey === req.params.key);
    if (!a) return res.status(404).json({ message: 'Animal not found. This QR tag is old, or the animal was removed.' });

    // If the owner is logged in on this phone, money details are included too
    let isOwner = false;
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) {
        try {
            const u = jwt.verify(h.slice(7), SECRET);
            const legacyOwner = (db.users.find(x => (x.role || 'user') === 'user') || {}).username;
            isOwner = u.username === (a.owner || legacyOwner);
        } catch (e) { /* not logged in */ }
    }

    const logs = [...a.logs].sort((x, y) => y.date.localeCompare(x.date));
    const out = {
        id: a.id, status: a.status, birthDate: a.birthDate, lastVaccine: a.lastVaccine, nextVaccine: a.nextVaccine,
        soldDate: a.soldDate, daysRecorded: calc.logDays(a),
        totalMilk: calc.r2(a.logs.reduce((s, l) => s + calc.num(l.milk), 0)),
        isOwner,
        logs: logs.map(l => (isOwner ? { date: l.date, milk: l.milk, price: l.price, expense: l.expense, profit: calc.logProfit(l) } : { date: l.date, milk: l.milk }))
    };
    if (isOwner) {
        out.finance = {
            buyPrice: a.buyPrice, sellPrice: a.sellPrice, totalIncome: calc.totalIncome(a), totalExpense: calc.totalExpense(a),
            opProfit: calc.opProfit(a), netSoFar: calc.netSoFar(a), finalProfit: calc.finalProfit(a)
        };
    }
    res.json(out);
});

module.exports = router;
