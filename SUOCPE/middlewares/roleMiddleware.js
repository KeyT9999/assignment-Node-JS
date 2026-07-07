// Middleware to authorize specific roles (e.g., 'admin', 'customer')
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated and has correct role
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Role '${req.user ? req.user.role : 'none'}' is not allowed to access this resource`
      });
    }
    next();
  };
};

module.exports = { authorizeRoles };
