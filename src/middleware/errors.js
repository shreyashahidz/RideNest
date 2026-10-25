const path = require('path');
const { AppError } = require('../utils/errors');

const isApi = (req) => req.originalUrl.startsWith('/api');

const notFound = (req, res, next) => {
  if (isApi(req)) return next(new AppError(404, `Route not found: ${req.method} ${req.path}`));
  res.status(404).sendFile(path.join(__dirname, '..', '..', 'views', '404.html'));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err.code === 11000) {
    status = 409;
    message = 'That record already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (status === 500) {
    console.error(err);
    message = 'Something went wrong on our side';
  }
  res.status(status).json({ error: message, details: err.details });
};

module.exports = { notFound, errorHandler };
