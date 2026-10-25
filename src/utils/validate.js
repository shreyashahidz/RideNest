const { ObjectId } = require('mongodb');
const { AppError } = require('./errors');

const toObjectId = (value, label = 'id') => {
  if (typeof value !== 'string' || !/^[0-9a-fA-F]{24}$/.test(value)) {
    throw new AppError(400, `Invalid ${label}`);
  }
  return new ObjectId(value);
};

const str = (v, { min = 1, max = 200, label = 'Field' } = {}) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length < min || s.length > max) {
    throw new AppError(400, `${label} must be between ${min} and ${max} characters`);
  }
  return s;
};

const num = (v, { min = -Infinity, max = Infinity, label = 'Value', int = false } = {}) => {
  const n = typeof v === 'string' && v.trim() === '' ? NaN : Number(v);
  if (!Number.isFinite(n) || n < min || n > max || (int && !Number.isInteger(n))) {
    throw new AppError(400, `${label} must be ${int ? 'a whole ' : 'a '}number between ${min} and ${max}`);
  }
  return n;
};

const oneOf = (v, allowed, label = 'Value') => {
  if (!allowed.includes(v)) throw new AppError(400, `${label} must be one of: ${allowed.join(', ')}`);
  return v;
};

const date = (v, label = 'Date') => {
  const d = new Date(v);
  if (!v || Number.isNaN(d.getTime())) throw new AppError(400, `${label} is not a valid date`);
  return d;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { toObjectId, str, num, oneOf, date, escapeRegex };
