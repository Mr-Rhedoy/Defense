const express = require('express');
const { load, save } = require('../db');
const auth = require('../authMiddleware');
const crypto = require('crypto');
const { localDate } = require('../public/calc');

const newKey = () => crypto.randomBytes(8).toString('hex'); // secret part of the QR link

const router = express.Router();
router.use(auth); // every animal route needs login

// Each user sees only their own animals (old animals without owner belong to the first user)
const ownerOf = (db, a) => a.owner || (db.users[0] && db.users[0].username);
const mine = (db, req) => db.animals.filter(a => ownerOf(db, a) === req.user.username);
const find = (db, req, id) => mine(db, req).find(a => a.id.toLowerCase() === String(id).toLowerCase());

// A valid money/liter value: a real number, 0 or more. Returns null if not valid.
const amount = v => (v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null);
const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));

router.get('/', (req, res) => {
    const db = load();
    let changed = false;
    db.animals.forEach(a => { if (!a.qrKey) { a.qrKey = newKey(); changed = true; } }); // old animals get a QR key
    if (changed) save(db);
    res.json(mine(db, req));
});

router.post('/', (req, res) => {
    const { id, buyPrice, birthDate, lastVaccine, nextVaccine } = req.body || {};
    if (!id || !String(id).trim() || !validDate(birthDate)) {
        return res.status(400).json({ message: 'ID and birth date are required.' });
    }
    if (amount(buyPrice) === null) return res.status(400).json({ message: 'Purchase price must be 0 or more.' });
    const db = load();
    if (find(db, req, id)) return res.status(409).json({ message: 'This Animal ID already exists.' });
    db.animals.push({
        owner: req.user.username, qrKey: newKey(), id: String(id).trim(), buyPrice: amount(buyPrice), birthDate, lastVaccine, nextVaccine,
        status: 'active', logs: [], sellPrice: null, soldDate: null
    });
    save(db);
    res.json({ message: 'Animal registered.' });
});

router.put('/:id', (req, res) => {
    const db = load();
    const a = find(db, req, req.params.id);
    if (!a) return res.status(404).json({ message: 'Animal not found.' });
    const { buyPrice, birthDate, lastVaccine, nextVaccine } = req.body || {};
    if (amount(buyPrice) === null) return res.status(400).json({ message: 'Purchase price must be 0 or more.' });
    a.buyPrice = amount(buyPrice); a.birthDate = birthDate;
    a.lastVaccine = lastVaccine; a.nextVaccine = nextVaccine;
    save(db);
    res.json({ message: 'Animal updated.' });
});

// One record per day. Saving the same date again REPLACES that day (so nothing is counted twice).
router.post('/:id/logs', (req, res) => {
    const db = load();
    const a = find(db, req, req.params.id);
    if (!a) return res.status(404).json({ message: 'Animal not found.' });
    if (a.status !== 'active') return res.status(400).json({ message: 'This animal is already sold.' });
    const { date, milk, price, expense } = req.body || {};
    if (!validDate(date)) return res.status(400).json({ message: 'A valid date is required.' });
    if (amount(milk) === null || amount(price) === null || amount(expense) === null) {
        return res.status(400).json({ message: 'Milk, price and expense must be numbers, 0 or more.' });
    }
    const entry = { date, milk: amount(milk), price: amount(price), expense: amount(expense) };
    const i = a.logs.findIndex(l => l.date === date);
    if (i >= 0) a.logs[i] = entry; else a.logs.push(entry);
    a.logs.sort((x, y) => x.date.localeCompare(y.date));
    save(db);
    res.json({ message: i >= 0 ? `The record for ${date} was updated.` : 'Daily log saved.', replaced: i >= 0 });
});

// Fix a wrong daily record
router.put('/:id/logs/:date', (req, res) => {
    const db = load();
    const a = find(db, req, req.params.id);
    if (!a) return res.status(404).json({ message: 'Animal not found.' });
    if (a.status !== 'active') return res.status(400).json({ message: 'This animal is already sold.' });
    const log = a.logs.find(l => l.date === req.params.date);
    if (!log) return res.status(404).json({ message: 'Record not found.' });
    const { milk, price, expense } = req.body || {};
    if (amount(milk) === null || amount(price) === null || amount(expense) === null) {
        return res.status(400).json({ message: 'Milk, price and expense must be numbers, 0 or more.' });
    }
    log.milk = amount(milk); log.price = amount(price); log.expense = amount(expense);
    save(db);
    res.json({ message: `The record for ${log.date} was updated.` });
});

// Delete a wrong daily record
router.delete('/:id/logs/:date', (req, res) => {
    const db = load();
    const a = find(db, req, req.params.id);
    if (!a) return res.status(404).json({ message: 'Animal not found.' });
    if (a.status !== 'active') return res.status(400).json({ message: 'This animal is already sold.' });
    const before = a.logs.length;
    a.logs = a.logs.filter(l => l.date !== req.params.date);
    if (a.logs.length === before) return res.status(404).json({ message: 'Record not found.' });
    save(db);
    res.json({ message: 'Record deleted.' });
});

router.post('/:id/sell', (req, res) => {
    const db = load();
    const a = find(db, req, req.params.id);
    if (!a) return res.status(404).json({ message: 'Animal not found.' });
    if (a.status === 'sold') return res.status(400).json({ message: 'This animal is already sold.' });
    if (amount(req.body && req.body.sellPrice) === null) {
        return res.status(400).json({ message: 'Selling price must be a number, 0 or more.' });
    }
    a.status = 'sold';
    a.sellPrice = amount(req.body.sellPrice);
    a.soldDate = localDate();
    save(db);
    res.json({ message: 'Animal sold.', animal: a });
});

router.delete('/', (req, res) => {
    const db = load();
    const own = new Set(mine(db, req));
    db.animals = db.animals.filter(a => !own.has(a));
    save(db);
    res.json({ message: 'All your animal data deleted.' });
});

router.delete('/:id', (req, res) => {
    const db = load();
    const a = find(db, req, req.params.id);
    if (!a) return res.status(404).json({ message: 'Animal not found.' });
    db.animals = db.animals.filter(x => x !== a);
    save(db);
    res.json({ message: 'Animal deleted.' });
});

module.exports = router;
