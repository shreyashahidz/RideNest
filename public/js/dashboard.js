(async function () {
  const { api, renderChrome, esc, inr, fmtDT, artOrImg, toast } = window.RN;
  const user = await renderChrome('/dashboard');
  if (!user) return (location.href = '/login?next=/dashboard');
  const page = document.getElementById('page');
  const isOwner = user.role === 'owner';

  const STATUS = {
    confirmed: ['info', 'Confirmed'], active: ['warn', 'On the road'], completed: ['ok', 'Completed'], cancelled: ['bad', 'Cancelled'],
  };
  const AGREE = { pending_signatures: ['warn', 'Awaiting signatures'], fully_signed: ['ok', 'Fully signed'] };

  page.innerHTML = `
    <div class="page-head">
      <div><h1 style="font-size:1.8rem;margin:0">Hi, ${esc(user.name.split(' ')[0])} &#128075;</h1>
      <span class="muted">${isOwner ? 'Manage your listings and incoming bookings.' : 'Your bookings and rental agreements.'}</span></div>
      ${isOwner ? '<a class="btn accent" href="/dashboard/vehicles/new">+ List a vehicle</a>' : '<a class="btn accent" href="/vehicles">Find a vehicle</a>'}
    </div>
    <div class="tabs" id="tabs"></div>
    <div id="panel"><div class="spinner"></div></div>`;

  const tabs = isOwner
    ? [['overview', 'Earnings'], ['bookings', 'Bookings'], ['vehicles', 'My vehicles']]
    : [['upcoming', 'Upcoming & active'], ['past', 'Past trips']];
  let current = location.hash.slice(1);
  if (!tabs.some((t) => t[0] === current)) current = tabs[0][0];

  const tabsEl = document.getElementById('tabs');
  const panel = document.getElementById('panel');
  function drawTabs() {
    tabsEl.innerHTML = tabs.map(([k, l]) => `<button data-t="${k}" class="${k === current ? 'active' : ''}">${l}</button>`).join('');
    tabsEl.querySelectorAll('button').forEach((b) => (b.onclick = () => { current = b.dataset.t; history.replaceState(null, '', '#' + current); drawTabs(); load(); }));
  }

  const bookingItem = (b) => {
    const [cls, label] = STATUS[b.status] || ['', b.status];
    const [acls, alabel] = AGREE[b.agreementStatus] || ['', ''];
    const who = isOwner ? `Renter: <strong>${esc(b.renter.name)}</strong> (${esc(b.renter.phone)})` : `Owner: ${esc(b.vehicle.ownerName)}`;
    const actions = [`<a class="btn small secondary" href="/agreement/${b._id}">Agreement</a>`];
    if (isOwner && b.status === 'confirmed') actions.push(`<button class="btn small" data-act="pickup" data-id="${b._id}">Hand over keys</button>`);
    if (isOwner && b.status === 'active') actions.push(`<button class="btn small" data-act="return" data-id="${b._id}">Mark returned</button>`);
    if (b.status === 'confirmed') actions.push(`<button class="btn small danger" data-act="cancel" data-id="${b._id}">Cancel</button>`);
    if (!isOwner && b.status === 'completed' && !b.reviewed) actions.push(`<a class="btn small" href="/vehicles/${b.vehicleId}">Leave review</a>`);
    return `<div class="card item">
      <div class="thumb">${artOrImg({ ...b.vehicle, _id: b.vehicleId })}</div>
      <div>
        <h3 style="margin:0"><a href="/vehicles/${b.vehicleId}">${esc(b.vehicle.make)} ${esc(b.vehicle.model)}</a></h3>
        <div class="small muted">${fmtDT(b.pickupAt)} &rarr; ${fmtDT(b.dropAt)}</div>
        <div class="small">${who}</div>
        <div class="small muted">&#128205; ${esc(b.vehicle.pickupLocation)}, ${esc(b.vehicle.city)}</div>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
          <span class="chip ${cls}">${label}</span>${alabel ? `<span class="chip ${acls}">${alabel}</span>` : ''}
          <span class="chip">${isOwner ? 'You earn ' + inr(b.pricing.rentAmount) : 'Total ' + inr(b.pricing.total)}</span>
        </div>
      </div>
      <div class="actions">${actions.join('')}</div></div>`;
  };

  async function bookingAction(id, action) {
    if (action === 'cancel' && !confirm('Cancel this booking?')) return;
    try {
      await api(`/bookings/${id}/status`, { method: 'PATCH', body: { action } });
      toast('Booking updated');
      load();
    } catch (e) { toast(e.message, 'error'); }
  }
  const wireActions = () =>
    panel.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => bookingAction(b.dataset.id, b.dataset.act)));

  async function load() {
    panel.innerHTML = '<div class="spinner"></div>';
    try {
      if (!isOwner) {
        const { items } = await api('/bookings/mine');
        const open = (b) => ['confirmed', 'active'].includes(b.status);
        const list = items.filter((b) => (current === 'upcoming' ? open(b) : !open(b)));
        panel.innerHTML = list.length
          ? `<div class="list">${list.map(bookingItem).join('')}</div>`
          : `<div class="empty"><h3>${current === 'upcoming' ? 'No upcoming trips' : 'No past trips yet'}</h3><a class="btn" href="/vehicles">Browse vehicles</a></div>`;
        wireActions();
      } else if (current === 'overview') {
        const s = await api('/stats/owner');
        const max = Math.max(1, ...s.perVehicle.map((v) => v.earnings));
        const maxM = Math.max(1, ...s.perMonth.map((m) => m.earnings));
        panel.innerHTML = `
          <div class="kpis">
            <div class="card kpi"><span class="muted small">Total earnings</span><strong>${inr(s.totals.earnings)}</strong></div>
            <div class="card kpi"><span class="muted small">Bookings</span><strong>${s.totals.bookings}</strong></div>
            <div class="card kpi"><span class="muted small">Hours rented</span><strong>${s.totals.hours}</strong></div>
            <div class="card kpi"><span class="muted small">Awaiting handover</span><strong>${s.statuses.confirmed || 0}</strong></div>
          </div>
          <div class="row" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
            <div class="card card-pad bars"><h3>Earnings by vehicle</h3>${s.perVehicle.length ? s.perVehicle.map((v) => `<div class="bar"><span>${esc(v.name)}</span><div class="track"><div class="fill" style="width:${(v.earnings / max) * 100}%"></div></div><strong>${inr(v.earnings)}</strong></div>`).join('') : '<p class="muted">No bookings yet.</p>'}</div>
            <div class="card card-pad bars"><h3>Earnings by month</h3>${s.perMonth.length ? s.perMonth.map((m) => `<div class="bar"><span>${esc(m.month)}</span><div class="track"><div class="fill" style="width:${(m.earnings / maxM) * 100}%;background:var(--accent)"></div></div><strong>${inr(m.earnings)}</strong></div>`).join('') : '<p class="muted">No bookings yet.</p>'}</div>
          </div>
          <p class="hint">Earnings count the rental amount of confirmed, active and completed bookings (service fee and deposit excluded).</p>`;
      } else if (current === 'bookings') {
        const { items } = await api('/bookings/incoming');
        panel.innerHTML = items.length ? `<div class="list">${items.map(bookingItem).join('')}</div>` : '<div class="empty"><h3>No bookings yet</h3><p>They will appear here as soon as someone books your vehicle.</p></div>';
        wireActions();
      } else {
        const { items } = await api('/vehicles/mine');
        panel.innerHTML = items.length
          ? `<div class="list">${items.map((v) => `<div class="card item">
              <div class="thumb">${artOrImg(v)}</div>
              <div><h3 style="margin:0"><a href="/vehicles/${v._id}">${esc(v.make)} ${esc(v.model)}</a> <span class="muted small">${esc(v.registrationNo)}</span></h3>
                <div class="small muted">${esc(v.city)} &middot; ${inr(v.pricePerHour)}/hr &middot; ${inr(v.pricePerDay)}/day</div>
                <div style="margin-top:6px"><span class="chip ${v.available ? 'ok' : 'bad'}">${v.available ? 'Listed' : 'Paused'}</span>
                ${v.reviewCount ? `<span class="chip">&#9733; ${v.rating} (${v.reviewCount})</span>` : ''}</div></div>
              <div class="actions">
                <a class="btn small secondary" href="/dashboard/vehicles/${v._id}/edit">Edit</a>
                <button class="btn small secondary" data-toggle="${v._id}" data-avail="${v.available}">${v.available ? 'Pause' : 'Resume'}</button>
                <button class="btn small danger" data-del="${v._id}">Delete</button></div></div>`).join('')}</div>`
          : '<div class="empty"><h3>No vehicles listed</h3><a class="btn" href="/dashboard/vehicles/new">List your first vehicle</a></div>';
        panel.querySelectorAll('[data-toggle]').forEach((b) => (b.onclick = async () => {
          try { await api(`/vehicles/${b.dataset.toggle}/availability`, { method: 'PATCH', body: { available: b.dataset.avail !== 'true' } }); load(); }
          catch (e) { toast(e.message, 'error'); }
        }));
        panel.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
          if (!confirm('Delete this listing permanently?')) return;
          try { await api('/vehicles/' + b.dataset.del, { method: 'DELETE' }); toast('Listing deleted'); load(); }
          catch (e) { toast(e.message, 'error'); }
        }));
      }
    } catch (e) {
      panel.innerHTML = `<p class="empty">${esc(e.message)}</p>`;
    }
  }
  drawTabs();
  load();
})();
