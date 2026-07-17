const jwt = require('jsonwebtoken');
const protect = (req, res, next) => { const header = req.headers.authorization; if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized, no token provided' }); try { req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'sdn302_secret_key'); next(); } catch (_) { return res.status(401).json({ message: 'Not authorized, token failed' }); } };
module.exports = { protect };
