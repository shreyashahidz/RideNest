const express = require('express');
const bcrypt = require('bcryptjs');
const { col } = require('../db');
const { asyncHandler, AppError } = require('../utils/errors');
const { str, oneOf } = require('../utils/validate');
const { issueToken, clearToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  city: u.city,
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const name = str(b.name, { min: 2, max: 60, label: 'Name' });
    const email = str(b.email, { min: 5, max: 120, label: 'Email' }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError(400, 'Enter a valid email address');
    const password = str(b.password, { min: 8, max: 100, label: 'Password' });
    const role = oneOf(b.role, ['renter', 'owner'], 'Role');
    const phone = str(b.phone, { min: 7, max: 20, label: 'Phone' });
    const city = typeof b.city === 'string' ? b.city.trim().slice(0, 60) : '';

    const user = {
      name,
      email,
      phone,
      city,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date(),
    };
    const { insertedId } = await col('users').insertOne(user);
    user._id = insertedId;
    issueToken(res, user);
    res.status(201).json({ user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = await col('users').findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'Incorrect email or password');
    }
    issueToken(res, user);
    res.json({ user: publicUser(user) });
  })
);

router.post('/logout', (req, res) => {
  clearToken(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const update = {};
    if (b.name !== undefined) update.name = str(b.name, { min: 2, max: 60, label: 'Name' });
    if (b.phone !== undefined) update.phone = str(b.phone, { min: 7, max: 20, label: 'Phone' });
    if (b.city !== undefined) update.city = String(b.city).trim().slice(0, 60);
    if (!Object.keys(update).length) throw new AppError(400, 'Nothing to update');
    await col('users').updateOne({ _id: req.user._id }, { $set: update });
    res.json({ user: publicUser({ ...req.user, ...update }) });
  })
);

module.exports = router;
