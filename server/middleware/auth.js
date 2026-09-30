const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const secret = process.env.JWT_SECRET || 'job_portal_fallback_jwt_secret_key_84920';
    req.user = jwt.verify(token, secret); // { id, role }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden' });
