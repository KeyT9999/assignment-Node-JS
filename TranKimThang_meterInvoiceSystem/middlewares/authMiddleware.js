const jwt = require('jsonwebtoken');
exports.verifyToken = (req, res, next) => {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!t)return res.status(401).json({
    message: 'Authentication required'
  });
  try {
    req.user = jwt.verify(t, process.env.JWT_SECRET || 'pe-secret');
    next();
  } catch (e) {
    res.status(401).json({
      message: 'Invalid token'
    });
  }
};
exports.requireRole = (...roles) => (req, res, next) => roles.includes(req.user.role)?next():res.status(403).json({
  message: 'Forbidden'
});
