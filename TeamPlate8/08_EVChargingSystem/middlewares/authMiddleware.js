const jwt = require('jsonwebtoken');
// Middleware to protect routes by verifying JWT
const protect = async (req, res, next) => {
  let token;
  // Check if token exists in Authorization header and starts with Bearer
  if (     req.headers.authorization && req.headers.authorization.startsWith('Bearer')   ) {
    try {
      // Extract token: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sdn302_secret_key');
      // Attach decoded payload (id, username, role) to req.user
      req.user = decoded;
      next();
    }  catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({
        message: 'Not authorized, token failed'
      });
    }
  }
  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token provided'
    });
  }
};
module.exports = {
  protect
};
