const express = require('express');
const { col } = require('../db');
const { asyncHandler } = require('../utils/errors');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/public',
  asyncHandler(async (req, res) => {
    const [vehicles, owners, completed, byType] = await Promise.all([
      col('vehicles').countDocuments({ available: true }),
      col('users').countDocuments({ role: 'owner' }),
      col('bookings').countDocuments({ status: { $in: ['completed', 'active', 'confirmed'] } }),
      col('vehicles').aggregate([{ $match: { available: true } }, { $group: { _id: '$type', n: { $sum: 1 } } }]).toArray(),
    ]);
    res.json({ vehicles, owners, trips: completed, byType: Object.fromEntries(byType.map((t) => [t._id, t.n])) });
  })
);

router.get(
  '/owner',
  requireRole('owner'),
  asyncHandler(async (req, res) => {
    const earningStatuses = ['confirmed', 'active', 'completed'];
    const base = { ownerId: req.user._id, status: { $in: earningStatuses } };

    const [totals] = await col('bookings')
      .aggregate([
        { $match: base },
        {
          $group: {
            _id: null,
            bookings: { $sum: 1 },
            earnings: { $sum: '$pricing.rentAmount' },
            hours: { $sum: '$pricing.hours' },
          },
        },
      ])
      .toArray();

    const perVehicle = await col('bookings')
      .aggregate([
        { $match: base },
        { $group: { _id: '$vehicleId', bookings: { $sum: 1 }, earnings: { $sum: '$pricing.rentAmount' } } },
        { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'v' } },
        { $unwind: '$v' },
        { $project: { _id: 0, vehicleId: '$_id', name: { $concat: ['$v.make', ' ', '$v.model'] }, bookings: 1, earnings: 1 } },
        { $sort: { earnings: -1 } },
      ])
      .toArray();

    const perMonth = await col('bookings')
      .aggregate([
        { $match: base },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$pickupAt' } },
            bookings: { $sum: 1 },
            earnings: { $sum: '$pricing.rentAmount' },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, month: '$_id', bookings: 1, earnings: 1 } },
      ])
      .toArray();

    const statusCounts = await col('bookings')
      .aggregate([{ $match: { ownerId: req.user._id } }, { $group: { _id: '$status', n: { $sum: 1 } } }])
      .toArray();

    res.json({
      totals: totals || { bookings: 0, earnings: 0, hours: 0 },
      perVehicle,
      perMonth,
      statuses: Object.fromEntries(statusCounts.map((s) => [s._id, s.n])),
    });
  })
);

module.exports = router;
