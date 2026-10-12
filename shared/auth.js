// shared/auth.js
// Authentication & Role-Based Authorization Middleware (RBAC)

function authenticate(req, res, next) {
  // Extract user info from custom demo headers or standard Authorization Bearer header
  const authHeader = req.headers['authorization'];
  const userRole = req.headers['x-user-role'] || 'PATIENT'; // default to PATIENT for public demo
  const userId = req.headers['x-user-id'] || 'pat-101';

  req.user = {
    id: userId,
    role: userRole.toUpperCase() // 'PATIENT', 'DOCTOR', 'ADMIN'
  };

  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. Please provide valid credentials.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Role '${req.user.role}' is not authorized to access this resource. Allowed: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

module.exports = { authenticate, requireRole };
