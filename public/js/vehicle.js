(async function () {
  const { api, renderChrome, esc, inr, fmtDT, toLocalInput, stars, artOrImg, toast } = window.RN;
  const user = await renderChrome('/vehicles');
  const page = document.getElementById('page');
  const id = location.pathname.split('/').filter(Boolean)[1];

  let data;
  try {
    data = await api('/vehicles/' + id);
  } catch (e) {
    page.innerHTML = `<div class="empty"><h2>${esc(e.message)}</h2><a class="btn" href="/vehicles">Browse vehicles</a></div>`;
    return;
  }
  const v = data.vehicle;
  document.title = `${v.make} ${v.model} - RideNest`;
  const isOwner = user && user.id === v.ownerId;
  const { items: reviews } = await api(`/vehicles/${id}/reviews`);

  // completed, not-yet-reviewed trips (so the renter can leave a review)
  let reviewable = null;
  if (user && user.role === 'renter') {
    try {
      const { items } = await api('/bookings/mine');
      reviewable = items.find((b) => b.vehicleId === v._id && b.status === 'completed' && !b.reviewed);
    } catch { /* ignore */ }
  }

  const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const kind = v.type === 'bike' ? 'bike' : 'car';

  // ---- content for the interactive "stage" (tabs -> callout bubbles + side cards) ----
  const TABS = {
    Overview: {
      bubbles: [`${v.make} ${v.model}`, `${v.year} model`, `${v.city} pickup`, v.available ? 'Ready to book' : 'Paused'],
      cards: [
        { dark: true, icon: '✓', title: 'Verified owner', text: `Listed by ${v.ownerName}. Every booking is covered by a signed digital rental agreement.` },
        { dark: true, icon: '∞', title: 'Digital agreement', text: 'Both you and the owner e-sign before the keys change hands. No paperwork at pickup.' },
        { dark: false, icon: '★', title: 'Great for', text: kind === 'bike' ? 'City rides, weekend getaways and commutes. Helmet details are in the features tab.' : 'Family trips, airport runs and weekend drives with a flexible hourly or daily plan.' },
      ],
    },
    Specs: {
      bubbles: [`${cap(v.fuel)} engine`, `${cap(v.transmission)} gearbox`, `${v.seats} seats`, `${v.kmLimitPerDay} km / day`],
      cards: [
        { dark: true, icon: '⛽', title: cap(v.fuel), text: v.fuel === 'electric' ? 'Zero tailpipe emissions. Returned with the same charge level it was picked up with.' : 'Return the vehicle with the same fuel level as at pickup to avoid a refuelling charge.' },
        { dark: true, icon: '⚙', title: cap(v.transmission), text: v.transmission === 'automatic' ? 'Relaxed, clutch-free driving - ideal for traffic.' : 'Full control with a manual gearbox. Licence for manual vehicles required.' },
        { dark: false, icon: '◎', title: 'Registration', text: `${v.registrationNo} - recorded in the rental agreement.` },
      ],
    },
    Features: {
      bubbles: v.features.length ? v.features.slice(0, 4) : ['No extra features listed'],
      cards: [
        { dark: true, icon: '✦', title: 'What is included', text: v.features.length ? v.features.join(', ') + '.' : 'The owner has not listed extra features.' },
        { dark: false, icon: 'ℹ', title: 'About', text: v.description || 'No description provided.' },
      ],
    },
    'Rental terms': {
      bubbles: [`${inr(v.pricePerHour)} / hour`, `${inr(v.pricePerDay)} / day`, `${inr(v.securityDeposit)} deposit`, `${v.kmLimitPerDay} km / day`],
      cards: [
        { dark: true, icon: '₹', title: 'Transparent pricing', text: 'Full days are charged at the daily rate; extra hours at the hourly rate, never more than one extra day.' },
        { dark: true, icon: '↺', title: 'Refundable deposit', text: `${inr(v.securityDeposit)} is returned within 48 hours of a clean return.` },
        { dark: false, icon: '⚑', title: 'Pickup point', text: `${v.pickupLocation}, ${v.city}` },
      ],
    },
  };
  const SLOTS = [{ x: 19, y: 66, side: 'r' }, { x: 40, y: 22, side: 'r' }, { x: 63, y: 18, side: 'r' }, { x: 80, y: 62, side: 'l' }];

  const spec = (icon, label, big, small = '') =>
    `<div class="hl-card"><span class="hl-ico">${icon}</span><small>${label}</small><strong>${big}</strong>${small ? `<em>${small}</em>` : ''}</div>`;
  const people = Array.from({ length: Math.min(v.seats, 9) }, () => '<i></i>').join('');

  page.innerHTML = `
  <section class="stage-wrap">
    <div class="stage-head">
      <div>
        <h1>${esc(v.make)}</h1>
        <p class="stage-sub">${esc(v.model)} &middot; ${esc(v.year)} model</p>
      </div>
      <div class="stage-meta">
        <span class="chip ${v.available ? 'ok' : 'bad'}">${v.available ? 'Available to book' : 'Currently unavailable'}</span>
        <div>${v.reviewCount ? `<span class="stars">${stars(v.rating)}</span> <span class="muted small">${v.rating} &middot; ${v.reviewCount} review${v.reviewCount > 1 ? 's' : ''}</span>` : '<span class="muted small">No reviews yet</span>'}</div>
      </div>
    </div>

    <div class="stage">
      <div class="stage-tabs" id="stageTabs">${Object.keys(TABS).map((t, i) => `<button class="${i === 0 ? 'active' : ''}" data-tab="${t}">${t}</button>`).join('')}</div>
      <div class="stage-photo">
        <div class="stage-img">${artOrImg(v, true)}</div>
        <div id="bubbles"></div>
      </div>
      <div class="stage-cards" id="stageCards"></div>
    </div>

    <div class="hl-head"><h3>Feature highlights</h3>
      <div class="hl-price"><strong>${inr(v.pricePerHour)}</strong><span class="muted">/hr</span> &middot; <strong>${inr(v.pricePerDay)}</strong><span class="muted">/day</span></div></div>
    <div class="hl-row">
      <div class="hl-card"><span class="hl-ico">\u{1F465}</span><small>Passenger capacity</small><strong>${v.seats}</strong><div class="people">${people}</div></div>
      ${spec('⛽', 'Fuel', cap(v.fuel), kind === 'bike' ? 'Engine / motor' : 'Powertrain')}
      ${spec('⚙', 'Transmission', cap(v.transmission))}
      ${spec('\u{1F6E3}', 'Km limit', `${v.kmLimitPerDay} <small style="display:inline">km/day</small>`, 'Extra km by agreement')}
      ${spec('\u{1F4B0}', 'Security deposit', inr(v.securityDeposit), 'Refundable')}
      ${spec('\u{1F4C5}', 'Model year', v.year)}
    </div>
  </section>

  <div class="detail">
    <div>
      <h3>About this ${kind}</h3>
      <p>${esc(v.description) || '<span class="muted">The owner has not added a description.</span>'}</p>
      ${v.features.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${v.features.map((f) => `<span class="chip info">${esc(f)}</span>`).join('')}</div>` : ''}
      <h3>Pickup &amp; drop location</h3>
      <p>&#128205; ${esc(v.pickupLocation)}, ${esc(v.city)}<br><span class="muted small">Listed by ${esc(v.ownerName)}</span></p>
      ${data.bookedSlots.length ? `<h3>Already booked</h3><ul class="small muted">${data.bookedSlots.map((s) => `<li>${fmtDT(s.pickupAt)} &rarr; ${fmtDT(s.dropAt)}</li>`).join('')}</ul>` : ''}
      <h3 style="margin-top:24px">Reviews</h3>
      <div id="reviewForm"></div>
      ${reviews.length ? reviews.map((r) => `<div class="review"><span class="stars">${stars(r.rating)}</span> <strong>${esc(r.renterName)}</strong> <span class="muted small">${new Date(r.createdAt).toLocaleDateString('en-IN')}</span><p style="margin:4px 0 0">${esc(r.comment)}</p></div>`).join('') : '<p class="muted">No reviews yet.</p>'}
    </div>
    <aside class="card card-pad booking-box" id="bookBox"></aside>
  </div>`;

  // ---------- stage tabs ----------
  function drawStage(tab) {
    const t = TABS[tab];
    document.getElementById('bubbles').innerHTML = t.bubbles.slice(0, 4).map((label, i) => {
      const s = SLOTS[i];
      return `<div class="bubble ${s.side}" style="left:${s.x}%;top:${s.y}%"><span class="pt"></span><span class="lb">${esc(label)}</span></div>`;
    }).join('');
    document.getElementById('stageCards').innerHTML = t.cards.map((c) =>
      `<div class="scard ${c.dark ? 'dark' : ''}"><div class="scard-h"><span class="scard-ico">${c.icon}</span><strong>${esc(c.title)}</strong></div><p>${esc(c.text)}</p></div>`
    ).join('');
  }
  document.querySelectorAll('#stageTabs button').forEach((b) => (b.onclick = () => {
    document.querySelectorAll('#stageTabs button').forEach((x) => x.classList.toggle('active', x === b));
    drawStage(b.dataset.tab);
  }));
  drawStage('Overview');

  // ---------- booking box ----------
  const box = document.getElementById('bookBox');
  const priceHead = `<div class="price" style="margin-bottom:10px"><strong style="font-size:1.6rem">${inr(v.pricePerHour)}</strong><span class="muted">/hour</span><span class="muted">&middot; ${inr(v.pricePerDay)}/day</span></div>`;

  if (isOwner) {
    box.innerHTML = `${priceHead}<p class="muted">This is your listing.</p><a class="btn block" href="/dashboard/vehicles/${v._id}/edit">Edit listing</a>`;
  } else if (!user) {
    box.innerHTML = `${priceHead}<p class="muted">Log in as a renter to book this vehicle.</p>
      <a class="btn block" href="/login?next=${encodeURIComponent(location.pathname)}">Log in</a>
      <p class="center small muted" style="margin:10px 0 0">New here? <a href="/register">Create an account</a></p>`;
  } else if (user.role !== 'renter') {
    box.innerHTML = `${priceHead}<p class="muted">Owner accounts can't book vehicles. Sign up with a renter account to rent.</p>`;
  } else if (!v.available) {
    box.innerHTML = `${priceHead}<p class="muted">The owner has paused bookings for this vehicle.</p>`;
  } else {
    const start = new Date(); start.setHours(start.getHours() + 1, 0, 0, 0);
    box.innerHTML = `${priceHead}
      <form id="bookForm" novalidate>
        <div id="bookErr"></div>
        <div class="field"><label for="pickupAt">Pickup time</label><input type="datetime-local" id="pickupAt" required min="${toLocalInput(new Date())}" value="${toLocalInput(start)}"></div>
        <div class="field"><label for="dropAt">Drop time</label><input type="datetime-local" id="dropAt" required value="${toLocalInput(new Date(start.getTime() + 24 * 3600e3))}"></div>
        <div class="field"><label for="licenseNo">Driving licence no.</label><input id="licenseNo" required placeholder="e.g. MH0220190012345" maxlength="30"></div>
        <div class="field"><label for="purpose">Purpose of trip <span class="muted">(optional)</span></label><input id="purpose" maxlength="200" placeholder="Weekend trip to Lonavala"></div>
        <div class="quote" id="quote">Choose pickup and drop times to see the price.</div>
        <button class="btn accent block" id="bookBtn" type="submit">Book &amp; get agreement</button>
        <p class="hint center">You'll review and e-sign the rental agreement next.</p>
      </form>`;
    const $ = (x) => document.getElementById(x);
    let quoteOk = false;

    async function updateQuote() {
      const pickup = $('pickupAt').value, drop = $('dropAt').value;
      if (!pickup || !drop) return;
      try {
        const { pricing: p, available } = await api('/bookings/quote', {
          method: 'POST',
          body: { vehicleId: v._id, pickupAt: new Date(pickup).toISOString(), dropAt: new Date(drop).toISOString() },
        });
        quoteOk = available;
        $('quote').innerHTML = `
          <div><span>Rental (${p.days ? p.days + ' day' + (p.days > 1 ? 's' : '') : ''}${p.days && p.remHours ? ' + ' : ''}${p.remHours ? p.remHours + ' hr' : ''})</span><span>${inr(p.rentAmount)}</span></div>
          <div><span>Service fee (5%)</span><span>${inr(p.serviceFee)}</span></div>
          <div><span>Refundable deposit</span><span>${inr(p.deposit)}</span></div>
          <div class="total"><span>Total payable at pickup</span><span>${inr(p.total)}</span></div>
          ${available ? '' : '<p class="small" style="color:var(--danger);margin:8px 0 0">Already booked for part of this time.</p>'}`;
      } catch (e) {
        quoteOk = false;
        $('quote').innerHTML = `<span style="color:var(--danger)">${esc(e.message)}</span>`;
      }
      $('bookBtn').disabled = !quoteOk;
    }
    $('pickupAt').addEventListener('change', updateQuote);
    $('dropAt').addEventListener('change', updateQuote);
    updateQuote();

    $('bookForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      $('bookErr').innerHTML = '';
      $('bookBtn').disabled = true;
      try {
        const { booking } = await api('/bookings', {
          method: 'POST',
          body: {
            vehicleId: v._id,
            pickupAt: new Date($('pickupAt').value).toISOString(),
            dropAt: new Date($('dropAt').value).toISOString(),
            licenseNo: $('licenseNo').value,
            purpose: $('purpose').value,
          },
        });
        location.href = '/agreement/' + booking._id;
      } catch (err) {
        $('bookErr').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
        $('bookBtn').disabled = false;
      }
    });
  }

  // ---------- review form ----------
  if (reviewable) {
    const rf = document.getElementById('reviewForm');
    rf.innerHTML = `<form class="card card-pad" style="margin-bottom:12px" id="rf">
      <strong>How was your trip on ${fmtDT(reviewable.pickupAt)}?</strong>
      <div class="row" style="margin-top:10px">
        <div class="field"><label for="rating">Rating</label><select id="rating"><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - OK</option><option value="2">2 - Poor</option><option value="1">1 - Bad</option></select></div>
        <div class="field" style="grid-column:span 2"><label for="comment">Comment</label><input id="comment" maxlength="400"></div>
      </div>
      <button class="btn small" type="submit">Submit review</button></form>`;
    document.getElementById('rf').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api(`/vehicles/${id}/reviews`, {
          method: 'POST',
          body: { bookingId: reviewable._id, rating: Number(document.getElementById('rating').value), comment: document.getElementById('comment').value },
        });
        toast('Thanks for your review!');
        setTimeout(() => location.reload(), 700);
      } catch (err) { toast(err.message, 'error'); }
    });
  }
})();
