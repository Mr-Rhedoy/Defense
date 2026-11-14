const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { load, save } = require('../db');
const { SECRET } = require('../authMiddleware');

const router = express.Router();

// Recovery code is shown to the user once. Only its hash is saved.
const newCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

router.post('/signup', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ message: 'Enter a username and a password with at least 6 characters.' });
    }
    const name = username.trim();
    const db = load();
    if (db.users.some(u => u.username.toLowerCase() === name.toLowerCase())) {
        return res.status(409).json({ message: 'This username is already taken.' });
    }
    const code = newCode();
    db.users.push({ username: name, password: await bcrypt.hash(password, 10), recoveryHash: await bcrypt.hash(code, 10) });
    save(db);
    res.json({ message: 'Account created. Please log in.', recoveryCode: code });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    const db = load();
    const user = db.users.find(u => u.username.toLowerCase() === (username || '').trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password || '', user.password))) {
        return res.status(401).json({ message: 'Wrong username or password.' });
    }
    const out = { message: 'Login successful', token: jwt.sign({ username: user.username }, SECRET, { expiresIn: '7d' }) };
    if (!user.recoveryHash) { // old account: give it a recovery code now
        out.recoveryCode = newCode();
        user.recoveryHash = await bcrypt.hash(out.recoveryCode, 10);
        save(db);
    }
    res.json(out);
});

router.post('/forgot', async (req, res) => {
    const { username, recoveryCode, newPassword } = req.body || {};
    if (!username || !recoveryCode || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Fill all fields. New password needs 6+ characters.' });
    }
    const db = load();
    const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user || !user.recoveryHash || !(await bcrypt.compare(recoveryCode.trim().toUpperCase(), user.recoveryHash))) {
        return res.status(401).json({ message: 'Username or recovery code is wrong.' });
    }
    const code = newCode(); // old code stops working
    user.password = await bcrypt.hash(newPassword, 10);
    user.recoveryHash = await bcrypt.hash(code, 10);
    save(db);
    res.json({ message: 'Password changed. Please log in.', recoveryCode: code });
});

module.exports = router;
