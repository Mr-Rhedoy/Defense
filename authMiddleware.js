const jwt = require('jsonwebtoken');
const { load } = require('./db');

const SECRET = process.env.JWT_SECRET || '';

function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Please log in first.' });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        const db = load();
        const account = db.users.find(user =>
            user.username.toLowerCase() === String(decoded.username || '').toLowerCase()
        );

        if (!account) {
            return res.status(401).json({ message: 'Account not found. Please log in again.' });
        }

        if (account.isActive === false) {
            return res.status(403).json({ message: 'This account is inactive. Contact the administrator.' });
        }

        req.account = account;
        req.user = {
            username: account.username,
            role: account.role || 'user',
            isMainAdmin: account.isMainAdmin === true,
            email: account.email || null
        };

        next();
    } catch (error) {
        if (error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
        next(error);
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: 'You do not have permission to access this resource.' });
        }
        next();
    };
}

function requireMainAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin' || req.user.isMainAdmin !== true) {
        return res.status(403).json({ message: 'Only the main administrator can perform this action.' });
    }
    next();
}

module.exports = auth;
module.exports.SECRET = SECRET;
module.exports.requireRole = requireRole;
module.exports.requireMainAdmin = requireMainAdmin;
