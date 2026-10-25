class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const asyncParam = (fn) => (req, res, next, value) => Promise.resolve(fn(req, res, next, value)).catch(next);

module.exports = { AppError, asyncHandler, asyncParam };
