const express = require('express');
const { col } = require('../db');
const { asyncHandler, AppError } = require('../utils/errors');
const { requireAuth, requireRole } = require('../middleware/auth');
const { toObjectId, str, date, oneOf } = require('../utils/validate');
const { calcRental } = require('../utils/pricing');
const { createAgreement } = require('../utils/agreement');

const router = express.Router();
const BLOCKING = ['confirmed', 'active'];
const MIN_HOURS = 1;
const MAX_DAYS = 30;

function parseWindow(body) {
  const pickupAt = date(body.pickupAt, 'Pickup time');
  const dropAt = date(body.dropAt, 'Drop time');
  const now = Date.now();
  if (pickupAt.getTime() < now - 5 * 60 * 1000) throw new AppError(400, 'Pickup time cannot be in the past');
  if (dropAt <= pickupAt) throw new AppError(400, 'Drop time must be after pickup time');
  const hours = (dropAt - pickupAt) / 36e5;
  if (hours < MIN_HOURS) throw new AppError(400, `Minimum rental is ${MIN_HOURS} hour`);
  if (hours > MAX_DAYS * 24) throw new AppError(400, `Maximum rental is ${MAX_DAYS} days`);
  return { pickupAt, dropAt };
}

const overlapFilter = (vehicleId, pickupAt, dropAt) => ({
  vehicleId,
  status: { $in: BLOCKING },
  pickupAt: { $lt: dropAt },
  dropAt: { $gt: pickupAt },
});

async function loadBookableVehicle(vehicleId, user) {
  const vehicle = await col('vehicles').findOne({ _id: toObjectId(vehicleId, 'vehicle id') });
  if (!vehicle) throw new AppError(404, 'Vehicle not found');
  if (!vehicle.available) throw new AppError(409, 'This vehicle is not currently available for rent');
  if (user && String(vehicle.ownerId) === String(user._id)) throw new AppError(400, 'You cannot book your own vehicle');
  return vehicle;
}

function listPipeline(match) {
  return [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'vehicles', localField: 'vehicleId', foreignField: '_id', as: 'vehicle' } },
    { $unwind: '$vehicle' },
    { $lookup: { from: 'users', localField: 'renterId', foreignField: '_id', as: 'renter' } },
    { $unwind: '$renter' },
    { $lookup: { from: 'agreements', localField: '_id', foreignField: 'bookingId', as: 'agreement' } },
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'bookingId', as: 'review' } },
    {
      $project: {
        vehicleId: 1, ownerId: 1, renterId: 1, pickupAt: 1, dropAt: 1, status: 1, pricing: 1, createdAt: 1,
        returnedAt: 1,
        'vehicle.make': 1, 'vehicle.model': 1, 'vehicle.type': 1, 'vehicle.imageUrl': 1, 'vehicle.city': 1,
        'vehicle.pickupLocation': 1, 'vehicle.ownerName': 1,
        'renter.name': 1, 'renter.phone': 1,
        agreementStatus: { $first: '$agreement.status' },
        reviewed: { $gt: [{ $size: '$review' }, 0] },
      },
    },
  ];
}

router.post(
  '/quote',
  asyncHandler(async (req, res) => {
    const vehicle = await loadBookableVehicle(req.body?.vehicleId, null);
    const { pickupAt, dropAt } = parseWindow(req.body || {});
    const clash = await col('bookings').countDocuments(overlapFilter(vehicle._id, pickupAt, dropAt));
    res.json({ pricing: calcRental(pickupAt, dropAt, vehicle), available: clash === 0 });
  })
);

router.post(
  '/',
  requireRole('renter'),
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const vehicle = await loadBookableVehicle(b.vehicleId, req.user);
    const { pickupAt, dropAt } = parseWindow(b);
    const licenseNo = str(b.licenseNo, { min: 5, max: 30, label: 'Driving licence number' }).toUpperCase();
    const purpose = str(b.purpose ?? '', { min: 0, max: 200, label: 'Purpose' });

    if (await col('bookings').countDocuments(overlapFilter(vehicle._id, pickupAt, dropAt))) {
      throw new AppError(409, 'Sorry, this vehicle is already booked for part of that time. Try different times.');
    }

    const booking = {
      vehicleId: vehicle._id,
      ownerId: vehicle.ownerId,
      renterId: req.user._id,
      pickupAt,
      dropAt,
      licenseNo,
      purpose,
      pricing: calcRental(pickupAt, dropAt, vehicle),
      status: 'confirmed',
      createdAt: new Date(),
    };
    const { insertedId } = await col('bookings').insertOne(booking);
    booking._id = insertedId;

    // Concurrency guard: if someone else grabbed the same slot first, back out.
    const earlier = await col('bookings').countDocuments({
      ...overlapFilter(vehicle._id, pickupAt, dropAt),
      _id: { $lt: insertedId },
    });
    if (earlier) {
      await col('bookings').deleteOne({ _id: insertedId });
      throw new AppError(409, 'Someone just booked this vehicle for that time. Please pick another slot.');
    }

    const owner = await col('users').findOne({ _id: vehicle.ownerId });
    const agreement = await createAgreement({ booking, vehicle, owner, renter: req.user });
    res.status(201).json({ booking, agreementNo: agreement.agreementNo });
  })
);

router.get(
  '/mine',
  requireRole('renter'),
  asyncHandler(async (req, res) => {
    const items = await col('bookings').aggregate(listPipeline({ renterId: req.user._id })).toArray();
    res.json({ items });
  })
);

router.get(
  '/incoming',
  requireRole('owner'),
  asyncHandler(async (req, res) => {
    const items = await col('bookings').aggregate(listPipeline({ ownerId: req.user._id })).toArray();
    res.json({ items });
  })
);

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const _id = toObjectId(req.params.id, 'booking id');
    const [booking] = await col('bookings').aggregate(listPipeline({ _id })).toArray();
    if (!booking) throw new AppError(404, 'Booking not found');
    const mine = [String(booking.renterId), String(booking.ownerId)].includes(String(req.user._id));
    if (!mine) throw new AppError(403, 'This booking belongs to someone else');
    res.json({ booking });
  })
);

router.patch(
  '/:id/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const _id = toObjectId(req.params.id, 'booking id');
    const action = oneOf(req.body?.action, ['cancel', 'pickup', 'return'], 'Action');
    const booking = await col('bookings').findOne({ _id });
    if (!booking) throw new AppError(404, 'Booking not found');

    const isOwner = String(booking.ownerId) === String(req.user._id);
    const isRenter = String(booking.renterId) === String(req.user._id);
    if (!isOwner && !isRenter) throw new AppError(403, 'This booking belongs to someone else');

    let set;
    if (action === 'cancel') {
      if (booking.status !== 'confirmed') throw new AppError(409, 'Only confirmed bookings can be cancelled');
      set = { status: 'cancelled', cancelledAt: new Date(), cancelledBy: isOwner ? 'owner' : 'renter' };
    } else {
      if (!isOwner) throw new AppError(403, 'Only the vehicle owner can do this');
      if (action === 'pickup') {
        if (booking.status !== 'confirmed') throw new AppError(409, 'Booking is not waiting for pickup');
        const ag = await col('agreements').findOne({ bookingId: _id });
        if (!ag || ag.status !== 'fully_signed') {
          throw new AppError(409, 'Both parties must sign the rental agreement before handing over the keys');
        }
        set = { status: 'active', pickedUpAt: new Date() };
      } else {
        if (booking.status !== 'active') throw new AppError(409, 'Vehicle has not been picked up yet');
        const returnedAt = new Date();
        const lateHours = Math.max(0, Math.ceil((returnedAt - booking.dropAt) / 36e5));
        set = { status: 'completed', returnedAt, lateHours };
      }
    }
    await col('bookings').updateOne({ _id }, { $set: set });
    res.json({ status: set.status });
  })
);

module.exports = router;
