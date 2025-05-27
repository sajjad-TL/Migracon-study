const verifyAdminToken = (req, res, next) => {
  console.log('🔐 verifyAdminToken middleware called');

  const token = req.headers['authorization']?.split(' ')[1];
  console.log('📦 Token received:', token);

  if (!token) {
    console.log('❌ No token provided');
    return res.status(403).json({ message: 'Access Denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
    console.log('✅ Token verified. Decoded:', decoded);

    if (decoded.role !== 'admin' || !decoded.isSuperAdmin) {
      console.log('❌ Not a super admin');
      return res.status(403).json({ message: 'Forbidden: Not a super admin' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
