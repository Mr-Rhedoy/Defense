const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

module.exports = function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please log in first.' });
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (e) {
        res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
};
module.exports.SECRET = SECRET;
