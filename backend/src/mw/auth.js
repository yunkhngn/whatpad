const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'No token provided', errorCode: 'NO_TOKEN' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'Token expired', errorCode: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ ok: false, message: 'Invalid token', errorCode: 'INVALID_TOKEN' });
  }
};

module.exports = auth;
