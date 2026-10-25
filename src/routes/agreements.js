const express = require('express');
const path = require('path');
const { col } = require('../db');
const { asyncHandler, asyncParam, AppError } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const { toObjectId, str } = require('../utils/validate');
const { signAgreement, verifyIntegrity } = require('../utils/agreement');
const { DATA_DIR } = require('../utils/json-store');

const router = express.Router();
router.use(requireAuth);

router.param('bookingId', asyncParam(async (req, res, next, id) => {
  const bookingId = toObjectId(id, 'booking id');
  const agreement = await col('agreements').findOne({ bookingId });
  if (!agreement) throw new AppError(404, 'Agreement not found');
  const uid = String(req.user._id);
  if (String(agreement.owner.id) === uid) req.party = 'owner';
  else if (String(agreement.renter.id) === uid) req.party = 'renter';
  else throw new AppError(403, 'You are not a party to this agreement');
  req.agreement = agreement;
  next();
}));

router.get(
  '/:bookingId',
  asyncHandler(async (req, res) => {
    const booking = await col('bookings').findOne({ _id: req.agreement.bookingId }, { projection: { status: 1 } });
    res.json({
      agreement: req.agreement,
      you: req.party,
      bookingStatus: booking?.status,
      integrityOk: verifyIntegrity(req.agreement),
    });
  })
);

router.post(
  '/:bookingId/sign',
  asyncHandler(async (req, res) => {
    const { agreement, party } = req;
    if (agreement.signatures[party]) throw new AppError(409, 'You have already signed this agreement');
    const booking = await col('bookings').findOne({ _id: agreement.bookingId });
    if (booking.status === 'cancelled') throw new AppError(409, 'This booking was cancelled');
    if (req.body?.agree !== true) throw new AppError(400, 'Please tick the consent box to sign');

    const signatureName = str(req.body?.signatureName, { min: 2, max: 80, label: 'Signature name' });
    if (signatureName.toLowerCase() !== agreement[party].name.toLowerCase()) {
      throw new AppError(400, `Type your full name exactly as registered: "${agreement[party].name}"`);
    }
    const updated = await signAgreement(agreement, party, req.user, signatureName, req.ip);
    res.json({ agreement: updated, you: party });
  })
);

// Download the stored JSON copy of the agreement
router.get('/:bookingId/download', (req, res, next) => {
  const file = path.join(DATA_DIR, 'agreements', `${req.agreement.agreementNo}.json`);
  res.download(file, `${req.agreement.agreementNo}.json`, (err) => {
    if (err) next(new AppError(404, 'Agreement file not found'));
  });
});

module.exports = router;
