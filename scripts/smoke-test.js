const BASE = process.env.BASE || 'http://localhost:3000';
let failed = 0;

function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(BASE + path, {
      method,
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    let data = null;
    try { data = await res.json(); } catch { /* not json */ }
    return { status: res.status, data, location: res.headers.get('location') };
  };
}

const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`);
  if (!cond) failed++;
};

(async () => {
  const renter = client();
  const owner = client();
  const anon = client();
  const stranger = client();

  check('unauthenticated booking is rejected', (await anon('POST', '/api/bookings', {})).status === 401);
  check('bad login rejected', (await anon('POST', '/api/auth/login', { email: 'x@y.com', password: 'nope' })).status === 401);
  check('login renter', (await renter('POST', '/api/auth/login', { email: 'renter@demo.com', password: 'Demo@1234' })).status === 200);
  check('login owner', (await owner('POST', '/api/auth/login', { email: 'owner@demo.com', password: 'Demo@1234' })).status === 200);
  const reg = await stranger('POST', '/api/auth/register', { name: 'Test Person', email: `t${Date.now()}@x.com`, password: 'password123', role: 'renter', phone: '9999999999' });
  check('register new renter', reg.status === 201);
  check('duplicate email rejected', (await anon('POST', '/api/auth/register', { name: 'Dup', email: 'renter@demo.com', password: 'password123', role: 'renter', phone: '9999999999' })).status === 409);

  const list = await anon('GET', '/api/vehicles?city=Mumbai&type=car&sort=priceAsc');
  check('filtered search', list.status === 200 && list.data.items.length >= 2 && list.data.items[0].pricePerDay <= list.data.items[1].pricePerDay);
  check('text search', (await anon('GET', '/api/vehicles?q=Creta')).data.total >= 1);
  check('invalid id -> 400', (await anon('GET', '/api/vehicles/abc')).status === 400);
  check('unknown id -> 404', (await anon('GET', '/api/vehicles/000000000000000000000000')).status === 404);
  check('/api/v1 alias works', (await anon('GET', '/api/v1/vehicles/cities')).status === 200);

  const v = list.data.items[0];
  const start = new Date(Date.now() + 2 * 3600e3);
  const end = new Date(start.getTime() + 26 * 3600e3);
  const win = { pickupAt: start.toISOString(), dropAt: end.toISOString() };

  const quote = await renter('POST', '/api/bookings/quote', { vehicleId: v._id, ...win });
  // 26h = 1 day + 2h
  check('quote math', quote.data?.pricing?.rentAmount === v.pricePerDay + 2 * v.pricePerHour, JSON.stringify(quote.data));

  check('owner cannot book', (await owner('POST', '/api/bookings', { vehicleId: v._id, ...win, licenseNo: 'ABC12345' })).status === 403);
  const bk = await renter('POST', '/api/bookings', { vehicleId: v._id, ...win, licenseNo: 'mh0220190012345' });
  check('create booking', bk.status === 201, JSON.stringify(bk.data));
  const bid = bk.data.booking._id;

  const clash = await stranger('POST', '/api/bookings', { vehicleId: v._id, ...win, licenseNo: 'ZZ9999999' });
  check('overlapping booking blocked', clash.status === 409, JSON.stringify(clash.data));
  const avail = await anon('GET', `/api/vehicles?city=Mumbai&type=car&pickup=${encodeURIComponent(win.pickupAt)}&drop=${encodeURIComponent(win.dropAt)}`);
  check('availability filter hides booked car', !avail.data.items.some((x) => x._id === v._id));

  check('stranger cannot read agreement', (await stranger('GET', `/api/agreements/${bid}`)).status === 403);
  check('pickup before signing blocked', (await owner('PATCH', `/api/bookings/${bid}/status`, { action: 'pickup' })).status === 409);
  check('wrong signature name rejected', (await renter('POST', `/api/agreements/${bid}/sign`, { signatureName: 'Someone Else', agree: true })).status === 400);
  check('renter signs', (await renter('POST', `/api/agreements/${bid}/sign`, { signatureName: 'Rohan Kulkarni', agree: true })).status === 200);
  check('double sign rejected', (await renter('POST', `/api/agreements/${bid}/sign`, { signatureName: 'Rohan Kulkarni', agree: true })).status === 409);
  const os = await owner('POST', `/api/agreements/${bid}/sign`, { signatureName: 'Aarav Mehta', agree: true });
  check('owner signs -> fully_signed', os.data?.agreement?.status === 'fully_signed');
  const ag = await renter('GET', `/api/agreements/${bid}`);
  check('agreement integrity ok', ag.data?.integrityOk === true);

  check('renter cannot hand over', (await renter('PATCH', `/api/bookings/${bid}/status`, { action: 'pickup' })).status === 403);
  check('owner hands over', (await owner('PATCH', `/api/bookings/${bid}/status`, { action: 'pickup' })).status === 200);
  check('cannot cancel active', (await renter('PATCH', `/api/bookings/${bid}/status`, { action: 'cancel' })).status === 409);
  check('owner marks returned', (await owner('PATCH', `/api/bookings/${bid}/status`, { action: 'return' })).status === 200);

  const rv = await renter('POST', `/api/vehicles/${v._id}/reviews`, { bookingId: bid, rating: 5, comment: 'Great car' });
  check('review after completed trip', rv.status === 201, JSON.stringify(rv.data));
  check('second review rejected', (await renter('POST', `/api/vehicles/${v._id}/reviews`, { bookingId: bid, rating: 4 })).status === 409);

  const st = await owner('GET', '/api/stats/owner');
  check('owner stats aggregation', st.data?.totals?.bookings >= 1 && st.data.perVehicle.length >= 1, JSON.stringify(st.data));
  check('renter blocked from owner stats', (await renter('GET', '/api/stats/owner')).status === 403);

  const nv = await owner('POST', '/api/vehicles', { type: 'bike', make: 'Yamaha', model: 'FZ', year: 2022, fuel: 'petrol', transmission: 'manual', seats: 2, registrationNo: 'mh01zz0001', city: 'Mumbai', pickupLocation: 'Test lane', pricePerHour: 60, pricePerDay: 700 });
  check('owner creates listing', nv.status === 201, JSON.stringify(nv.data));
  check('invalid listing rejected and does not change role', (await renter('POST', '/api/vehicles', {})).status === 400 && (await renter('GET', '/api/auth/me')).data.user.role === 'renter');
  check('owner deletes listing', (await owner('DELETE', `/api/vehicles/${nv.data.vehicle._id}`)).status === 200);

  const redirect = await anon('GET', '/cars');
  check('redirect /cars', redirect.status === 301 && redirect.location === '/vehicles?type=car');
  const prot = await anon('GET', '/dashboard');
  check('protected page redirects to login', prot.status === 302 && prot.location.startsWith('/login'));
  check('unknown page -> 404', (await anon('GET', '/nope')).status === 404);

  console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
  process.exit(failed ? 1 : 0);
})();
