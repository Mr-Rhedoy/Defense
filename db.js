// Simple file database. Later, replace these two functions with MongoDB (mongoose).
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'data.json');

function load() {
    try {
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch (e) {
        return { users: [], animals: [] };
    }
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

module.exports = { load, save };
