require('dotenv').config(); // works even if .env is missing
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Shows every API request in this terminal (passwords and form data are NOT printed)
app.use('/api', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const time = new Date().toLocaleTimeString();
        const who = req.user ? ' user=' + req.user.username : '';
        console.log(`[${time}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)${who}`);
    });
    next();
});

// Only the "public" folder is visible to the browser (server.js, .env, data.json stay private)
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/authRoutes'));
app.get('/api/config', (req, res) => res.json({ publicUrl: process.env.PUBLIC_URL || '' }));
app.use('/api/public', require('./routes/publicRoutes')); // QR scan data (read-only)
app.use('/api/animals', require('./routes/animalRoutes'));

// QR link page: /a/<secret key>
app.get('/a/:key', (req, res) => res.sendFile(path.join(__dirname, 'public', 'animal.html')));

app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Server is running (no database, using data.json)');
    console.log('Open: http://localhost:' + PORT);
    // Address for phones on the same Wi-Fi (needed for QR scanning while running on your computer)
    Object.values(require('os').networkInterfaces()).flat()
        .filter(i => i && i.family === 'IPv4' && !i.internal)
        .forEach(i => console.log('Phone on same Wi-Fi: http://' + i.address + ':' + PORT));
});

// MongoDB later:
// const mongoose = require('mongoose');
// mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'));
