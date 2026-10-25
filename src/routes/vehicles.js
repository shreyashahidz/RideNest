const express = require('express');
const fs = require('fs');
const path = require('path');
const { col } = require('../db');
const { asyncHandler, asyncParam, AppError } = require('../utils/errors');
const { requireRole, requireAuth, issueToken } = require('../middleware/auth');
const { toObjectId, str, num, oneOf, date, escapeRegex } = require('../utils/validate');

const router = express.Router();

const TYPES = ['car', 'bike'];
const FUEL = ['petrol', 'diesel', 'electric', 'cng', 'hybrid'];
const TRANSMISSION = ['manual', 'automatic'];
const BLOCKING = ['confirmed', 'active'];

router.param('id', asyncParam(async (req, res, next, id) => {
  const _id = toObjectId(id, 'vehicle id');
  const vehicle = await col('vehicles').findOne({ _id });
  if (!vehicle) throw new AppError(404, 'Vehicle not found');
  req.vehicle = vehicle;
  next();
}));

const withRatingPipeline = [
  {
    $lookup: {
      from: 'reviews',
      localField: '_id',
      foreignField: 'vehicleId',
      pipeline: [{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }],
      as: 'ratingStats',
    },
  },
  {
    $addFields: {
      rating: { $round: [{ $ifNull: [{ $first: '$ratingStats.avg' }, 0] }, 1] },
      reviewCount: { $ifNull: [{ $first: '$ratingStats.count' }, 0] },
    },
  },
  { $project: { ratingStats: 0 } },
];

function parseVehicleBody(b) {
  const type = oneOf(b.type, TYPES, 'Type');
  const doc = {
    type,
    make: str(b.make, { max: 40, label: 'Make' }),
    model: str(b.model, { max: 40, label: 'Model' }),
    year: num(b.year, { min: 1990, max: new Date().getFullYear() + 1, int: true, label: 'Year' }),
    fuel: oneOf(b.fuel, FUEL, 'Fuel'),
    transmission: oneOf(b.transmission, TRANSMISSION, 'Transmission'),
    seats: num(b.seats, { min: 1, max: 9, int: true, label: 'Seats' }),
    registrationNo: str(b.registrationNo, { min: 4, max: 20, label: 'Registration number' }).toUpperCase(),
    city: str(b.city, { max: 60, label: 'City' }),
    pickupLocation: str(b.pickupLocation, { max: 150, label: 'Pickup location' }),
    pricePerHour: num(b.pricePerHour, { min: 1, max: 100000, label: 'Hourly price' }),
    pricePerDay: num(b.pricePerDay, { min: 1, max: 1000000, label: 'Daily price' }),
    securityDeposit: num(b.securityDeposit ?? 0, { min: 0, max: 1000000, label: 'Security deposit' }),
    kmLimitPerDay: num(b.kmLimitPerDay ?? 200, { min: 10, max: 2000, int: true, label: 'Daily km limit' }),
    description: str(b.description ?? '', { min: 0, max: 800, label: 'Description' }),
    features: Array.isArray(b.features)
      ? b.features.map((f) => String(f).trim().slice(0, 30)).filter(Boolean).slice(0, 10)
      : [],
    imageUrl: typeof b.imageUrl === 'string' && /^(https?:\/\/|\/)/i.test(b.imageUrl.trim()) ? b.imageUrl.trim().slice(0, 500) : '',
  };
  if (doc.pricePerDay < doc.pricePerHour) throw new AppError(400, 'Daily price should not be lower than the hourly price');
  return doc;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = req.query;
    const match = { available: true };
    if (q.type) match.type = oneOf(q.type, TYPES, 'type');
    if (q.city) match.city = new RegExp(`^${escapeRegex(String(q.city).trim())}$`, 'i');
    if (q.transmission) match.transmission = oneOf(q.transmission, TRANSMISSION, 'transmission');
    if (q.fuel) match.fuel = oneOf(q.fuel, FUEL, 'fuel');
    if (q.minPrice || q.maxPrice) {
      match.pricePerDay = {};
      if (q.minPrice) match.pricePerDay.$gte = num(q.minPrice, { min: 0, label: 'minPrice' });
      if (q.maxPrice) match.pricePerDay.$lte = num(q.maxPrice, { min: 0, label: 'maxPrice' });
    }
    if (q.q) match.$text = { $search: String(q.q).slice(0, 80) };

    // availability for a time window: exclude vehicles with an overlapping booking
    if (q.pickup && q.drop) {
      const pickupAt = date(q.pickup, 'Pickup');
      const dropAt = date(q.drop, 'Drop');
      if (dropAt <= pickupAt) throw new AppError(400, 'Drop time must be after pickup time');
      const busy = await col('bookings').distinct('vehicleId', {
        status: { $in: BLOCKING },
        pickupAt: { $lt: dropAt },
        dropAt: { $gt: pickupAt },
      });
      if (busy.length) match._id = { $nin: busy };
    }

    const sorts = {
      priceAsc: { pricePerDay: 1 },
      priceDesc: { pricePerDay: -1 },
      rating: { rating: -1, reviewCount: -1 },
      newest: { createdAt: -1 },
    };
    const sort = sorts[q.sort] || sorts.newest;
    const page = Math.max(1, parseInt(q.page, 10) || 1);
    const limit = Math.min(24, Math.max(1, parseInt(q.limit, 10) || 9));

    const [result] = await col('vehicles')
      .aggregate([
        { $match: match },
        ...withRatingPipeline,
        { $sort: sort },
        {
          $facet: {
            items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            total: [{ $count: 'n' }],
          },
        },
      ])
      .toArray();

    const total = result.total[0]?.n || 0;
    res.json({ items: result.items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.get(
  '/cities',
  asyncHandler(async (req, res) => {
    const cities = await col('vehicles').distinct('city', { available: true });
    res.json({ cities: cities.sort() });
  })
);

router.get(
  '/mine',
  requireRole('owner'),
  asyncHandler(async (req, res) => {
    const items = await col('vehicles')
      .aggregate([{ $match: { ownerId: req.user._id } }, ...withRatingPipeline, { $sort: { createdAt: -1 } }])
      .toArray();
    res.json({ items });
  })
);

router.post(
  '/upload-image',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { image } = req.body || {};
    if (!image || typeof image !== 'string') {
      throw new AppError(400, 'No image file provided');
    }
    const match = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
    if (!match) {
      throw new AppError(400, 'Invalid image format. Supported formats: PNG, JPG, WebP');
    }
    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 8 * 1024 * 1024) {
      throw new AppError(400, 'Image exceeds maximum 8MB size limit');
    }
    const uploadsDir = path.join(__dirname, '..', '..', 'public', 'img', 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `vehicle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    res.json({ imageUrl: `/img/uploads/${filename}` });
  })
);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const fields = parseVehicleBody(req.body || {}); // validate first: a bad request must not change the account
    if (req.user.role !== 'owner') {
      await col('users').updateOne({ _id: req.user._id }, { $set: { role: 'owner' } });
      req.user.role = 'owner';
      issueToken(res, req.user);
    }
    const doc = {
      ...fields,
      ownerId: req.user._id,
      ownerName: req.user.name, // denormalised for fast listing reads
      available: true,
      createdAt: new Date(),
    };
    const { insertedId } = await col('vehicles').insertOne(doc);
    res.status(201).json({ vehicle: { ...doc, _id: insertedId } });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const [stats] = await col('reviews')
      .aggregate([
        { $match: { vehicleId: req.vehicle._id } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ])
      .toArray();
    const booked = await col('bookings')
      .find(
        { vehicleId: req.vehicle._id, status: { $in: BLOCKING }, dropAt: { $gt: new Date() } },
        { projection: { pickupAt: 1, dropAt: 1 } }
      )
      .sort({ pickupAt: 1 })
      .toArray();
    res.json({
      vehicle: {
        ...req.vehicle,
        rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
        reviewCount: stats ? stats.count : 0,
      },
      bookedSlots: booked,
    });
  })
);

function assertOwns(req) {
  if (String(req.vehicle.ownerId) !== String(req.user._id)) {
    throw new AppError(403, 'You can only manage your own vehicles');
  }
}

router.put(
  '/:id',
  requireRole('owner'),
  asyncHandler(async (req, res) => {
    assertOwns(req);
    const update = parseVehicleBody(req.body || {});
    await col('vehicles').updateOne({ _id: req.vehicle._id }, { $set: { ...update, updatedAt: new Date() } });
    res.json({ vehicle: { ...req.vehicle, ...update } });
  })
);

router.patch(
  '/:id/availability',
  requireRole('owner'),
  asyncHandler(async (req, res) => {
    assertOwns(req);
    const available = !!req.body?.available;
    await col('vehicles').updateOne({ _id: req.vehicle._id }, { $set: { available } });
    res.json({ available });
  })
);

router.delete(
  '/:id',
  requireRole('owner'),
  asyncHandler(async (req, res) => {
    assertOwns(req);
    const open = await col('bookings').countDocuments({
      vehicleId: req.vehicle._id,
      status: { $in: BLOCKING },
    });
    if (open) throw new AppError(409, 'Cannot delete a vehicle that has upcoming or active bookings');
    await col('vehicles').deleteOne({ _id: req.vehicle._id });
    res.json({ ok: true });
  })
);

router.get(
  '/:id/reviews',
  asyncHandler(async (req, res) => {
    const items = await col('reviews').find({ vehicleId: req.vehicle._id }).sort({ createdAt: -1 }).limit(20).toArray();
    res.json({ items });
  })
);

router.post(
  '/:id/reviews',
  requireRole('renter'),
  asyncHandler(async (req, res) => {
    const rating = num(req.body?.rating, { min: 1, max: 5, int: true, label: 'Rating' });
    const comment = str(req.body?.comment ?? '', { min: 0, max: 400, label: 'Comment' });
    const booking = await col('bookings').findOne({
      _id: toObjectId(req.body?.bookingId, 'booking id'),
      vehicleId: req.vehicle._id,
      renterId: req.user._id,
      status: 'completed',
    });
    if (!booking) throw new AppError(403, 'You can only review vehicles from your completed trips');
    const review = {
      vehicleId: req.vehicle._id,
      bookingId: booking._id,
      renterId: req.user._id,
      renterName: req.user.name,
      rating,
      comment,
      createdAt: new Date(),
    };
    await col('reviews').insertOne(review);
    res.status(201).json({ review });
  })
);

module.exports = router;
module.exports.BLOCKING = BLOCKING;
