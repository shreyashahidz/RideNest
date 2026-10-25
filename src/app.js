const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const logger = require('./middleware/logger');
const { loadUser } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.disable('x-powered-by');
app.use(logger);
app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
  });
  next();
});

app.use((req, res, next) => {
  if (req.url.startsWith('/api/v1/')) req.url = req.url.replace('/api/v1/', '/api/');
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: 0,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

app.use(loadUser);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/agreements', require('./routes/agreements'));
app.use('/api/stats', require('./routes/stats'));
app.use('/', require('./routes/pages'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
