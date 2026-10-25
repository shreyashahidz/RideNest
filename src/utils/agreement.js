const crypto = require('crypto');
const { col } = require('../db');
const { readJson, writeJson } = require('./json-store');

const sha256 = (v) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');

function makeAgreementNo(date = new Date()) {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `RN-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// Hash covers everything that is legally binding (parties, vehicle, times, money, clauses)
const contentOf = (a) => ({
  agreementNo: a.agreementNo,
  termsVersion: a.termsVersion,
  owner: a.owner,
  renter: a.renter,
  vehicle: a.vehicle,
  rental: a.rental,
  clauses: a.clauses,
});

async function persistCopy(agreement) {
  const { _id, ...plain } = agreement;
  await writeJson(`agreements/${agreement.agreementNo}.json`, plain);
}

async function createAgreement({ booking, vehicle, owner, renter }) {
  const terms = await readJson('terms.json');
  const agreement = {
    bookingId: booking._id,
    agreementNo: makeAgreementNo(),
    title: terms.title,
    termsVersion: terms.version,
    owner: { id: owner._id, name: owner.name, phone: owner.phone, email: owner.email },
    renter: { id: renter._id, name: renter.name, phone: renter.phone, email: renter.email, licenseNo: booking.licenseNo },
    vehicle: {
      id: vehicle._id,
      type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registrationNo: vehicle.registrationNo,
      fuel: vehicle.fuel,
      kmLimitPerDay: vehicle.kmLimitPerDay,
      pickupLocation: vehicle.pickupLocation,
      city: vehicle.city,
    },
    rental: {
      pickupAt: booking.pickupAt,
      dropAt: booking.dropAt,
      pricePerHour: vehicle.pricePerHour,
      pricePerDay: vehicle.pricePerDay,
      ...booking.pricing,
    },
    clauses: terms.clauses,
    signatures: { owner: null, renter: null },
    status: 'pending_signatures',
    createdAt: new Date(),
  };
  agreement.contentHash = sha256(contentOf(agreement));
  const { insertedId } = await col('agreements').insertOne(agreement);
  agreement._id = insertedId;
  await persistCopy(agreement);
  return agreement;
}

async function signAgreement(agreement, party, user, signatureName, ip) {
  const signature = {
    name: signatureName,
    userId: user._id,
    signedAt: new Date(),
    ip,
    contentHash: agreement.contentHash,
  };
  const signatures = { ...agreement.signatures, [party]: signature };
  const status = signatures.owner && signatures.renter ? 'fully_signed' : 'pending_signatures';
  await col('agreements').updateOne({ _id: agreement._id }, { $set: { [`signatures.${party}`]: signature, status } });
  const updated = { ...agreement, signatures, status };
  await persistCopy(updated);
  return updated;
}

const verifyIntegrity = (a) => sha256(contentOf(a)) === a.contentHash;

module.exports = { createAgreement, signAgreement, verifyIntegrity };
