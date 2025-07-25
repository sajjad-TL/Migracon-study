const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.role === 'Super Admin') return next();
    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
