const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { col } = require('../db');
const { AppError, asyncHandler } = require('../utils/errors');

const SECRET = process.env.JWT_SECRET || 'dev-only-secret';
const COOKIE = 'rn_token';

function issueToken(res, user) {
  const token = jwt.sign({ sub: String(user._id), role: user.role }, SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
}

const clearToken = (res) => res.clearCookie(COOKIE);

// Attaches req.user when a valid cookie is present; never blocks the request.
const loadUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies && req.cookies[COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET);
      const user = await col('users').findOne(
        { _id: new ObjectId(payload.sub) },
        { projection: { passwordHash: 0 } }
      );
      if (user) req.user = user;
    } catch {
      /* invalid/expired token => treated as logged out */
    }
  }
  next();
});

const requireAuth = (req, res, next) => {
  if (!req.user) return next(new AppError(401, 'Please log in to continue'));
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError(401, 'Please log in to continue'));
  if (!roles.includes(req.user.role)) {
    return next(new AppError(403, `Only ${roles.join('/')} accounts can do this`));
  }
  next();
};

const requireAuthPage = (req, res, next) => {
  if (!req.user) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  next();
};

module.exports = { loadUser, requireAuth, requireRole, requireAuthPage, issueToken, clearToken };
