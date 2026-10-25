const express = require('express');
const path = require('path');
const { requireAuthPage } = require('../middleware/auth');

const router = express.Router();
const view = (name) => (req, res) => res.sendFile(path.join(__dirname, '..', '..', 'views', `${name}.html`));

router.get('/cars', (req, res) => res.redirect(301, '/vehicles?type=car'));
router.get('/bikes', (req, res) => res.redirect(301, '/vehicles?type=bike'));
router.get(['/listings', '/browse', '/vehicles.html'], (req, res) => res.redirect(301, '/vehicles'));
router.get('/index.html', (req, res) => res.redirect(301, '/'));
router.get('/signin', (req, res) => res.redirect(301, '/login'));
router.get('/signup', (req, res) => res.redirect(301, '/register'));
router.get('/my-bookings', (req, res) => res.redirect(302, '/dashboard'));
router.get('/list-your-vehicle', (req, res) => res.redirect(302, '/dashboard/vehicles/new'));

router.get('/', view('index'));
router.get('/vehicles', view('vehicles'));
router.get('/vehicles/:id', view('vehicle'));
router.get('/login', view('login'));
router.get('/register', view('register'));
router.get('/how-it-works', view('how-it-works'));

router.get('/dashboard', requireAuthPage, view('dashboard'));
router.get('/dashboard/vehicles/new', requireAuthPage, view('vehicle-form'));
router.get('/dashboard/vehicles/:id/edit', requireAuthPage, view('vehicle-form'));
router.get('/agreement/:bookingId', requireAuthPage, view('agreement'));

module.exports = router;
