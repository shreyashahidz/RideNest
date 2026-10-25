(async function () {
  const { api, renderChrome, esc, inr, fmtDT, toast } = window.RN;
  const user = await renderChrome('/dashboard');
  const page = document.getElementById('page');
  if (!user) return (location.href = '/login');
  const bookingId = location.pathname.split('/').filter(Boolean)[1];

  async function render() {
    let res;
    try { res = await api('/agreements/' + bookingId); }
    catch (e) { page.innerHTML = `<div class="empty"><h2>${esc(e.message)}</h2><a class="btn" href="/dashboard">Back to dashboard</a></div>`; return; }
    const { agreement: a, you, bookingStatus, integrityOk } = res;
    const r = a.rental;
    const row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`;
    const sigBox = (party, label, person) => {
      const s = a.signatures[party];
      return s
        ? `<div class="sig"><strong>${label}</strong><div class="name">${esc(s.name)}</div>
            <div class="small muted">Signed ${fmtDT(s.signedAt)}</div><div class="hash">Fingerprint ${esc(s.contentHash.slice(0, 24))}&hellip;</div></div>`
        : `<div class="sig pending"><strong>${label}</strong><p class="muted small" style="margin-top:8px">${esc(person.name)} has not signed yet.</p></div>`;
    };
    const mySigned = !!a.signatures[you];
    const cancelled = bookingStatus === 'cancelled';

    page.innerHTML = `
      <div class="status-bar no-print">
        ${cancelled ? '<div class="form-error">This booking was cancelled. The agreement is void.</div>' : ''}
        ${!integrityOk ? '<div class="form-error">Warning: the agreement content does not match its fingerprint.</div>' : ''}
        <div class="toolbar">
          <span class="chip ${a.status === 'fully_signed' ? 'ok' : 'warn'}">${a.status === 'fully_signed' ? 'Fully signed by both parties' : 'Awaiting signatures'}</span>
          <div style="display:flex;gap:8px">
            <button class="btn secondary small" onclick="window.print()">Print / Save PDF</button>
            <a class="btn secondary small" href="/api/agreements/${bookingId}/download">Download JSON</a>
            <a class="btn secondary small" href="/dashboard">Dashboard</a>
          </div>
        </div>
      </div>
      <article class="paper">
        <h1>${esc(a.title)}</h1>
        <div class="ag-no">Agreement No. ${esc(a.agreementNo)} &middot; Terms v${esc(a.termsVersion)}</div>

        <h3>Parties</h3>
        <table>
          ${row('Owner', `${esc(a.owner.name)} &middot; ${esc(a.owner.phone)} &middot; ${esc(a.owner.email)}`)}
          ${row('Renter', `${esc(a.renter.name)} &middot; ${esc(a.renter.phone)} &middot; ${esc(a.renter.email)}`)}
          ${row('Renter driving licence', esc(a.renter.licenseNo))}
        </table>

        <h3>Vehicle</h3>
        <table>
          ${row('Vehicle', `${esc(a.vehicle.make)} ${esc(a.vehicle.model)} (${esc(a.vehicle.year)}, ${esc(a.vehicle.type)})`)}
          ${row('Registration no.', esc(a.vehicle.registrationNo))}
          ${row('Fuel', esc(a.vehicle.fuel))}
          ${row('Daily km limit', esc(a.vehicle.kmLimitPerDay) + ' km')}
          ${row('Pickup / return location', `${esc(a.vehicle.pickupLocation)}, ${esc(a.vehicle.city)}`)}
        </table>

        <h3>Rental period &amp; charges</h3>
        <table>
          ${row('Pickup', fmtDT(r.pickupAt))}
          ${row('Drop-off', fmtDT(r.dropAt))}
          ${row('Duration', `${r.hours} hour${r.hours > 1 ? 's' : ''}`)}
          ${row('Rates', `${inr(r.pricePerHour)}/hour &middot; ${inr(r.pricePerDay)}/day`)}
          ${row('Rental amount', inr(r.rentAmount))}
          ${row('Service fee', inr(r.serviceFee))}
          ${row('Refundable security deposit', inr(r.deposit))}
          ${row('<strong>Total</strong>', `<strong>${inr(r.total)}</strong>`)}
        </table>

        <h3>Terms &amp; conditions</h3>
        <ol>${a.clauses.map((c) => `<li><strong>${esc(c.heading)}.</strong> ${esc(c.text)}</li>`).join('')}</ol>

        <h3>Signatures</h3>
        <div class="sigs">${sigBox('owner', 'Owner', a.owner)}${sigBox('renter', 'Renter', a.renter)}</div>
        <p class="hash" style="margin-top:18px">Document fingerprint (SHA-256): ${esc(a.contentHash)}</p>
      </article>

      ${!mySigned && !cancelled ? `
      <form class="card card-pad no-print" id="signForm" style="max-width:820px;margin:0 auto 40px">
        <h3>Sign as ${you === 'owner' ? 'Owner' : 'Renter'}</h3>
        <div id="err"></div>
        <div class="field"><label for="sigName">Type your full name: <em>${esc(a[you].name)}</em></label><input id="sigName" autocomplete="off"></div>
        <label style="font-weight:400;display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="agree" style="width:auto;margin-top:5px">I have read the agreement above and agree to be legally bound by it. I understand that typing my name is my electronic signature.</label>
        <button class="btn accent" style="margin-top:14px" type="submit">Sign agreement</button>
      </form>` : ''}
      ${mySigned && a.status !== 'fully_signed' ? '<p class="center muted no-print" style="margin-bottom:40px">You have signed. Waiting for the other party.</p>' : ''}
      ${a.status === 'fully_signed' ? '<p class="center muted no-print" style="margin-bottom:40px">All set &mdash; the owner can now hand over the vehicle at the pickup time.</p>' : ''}`;

    const f = document.getElementById('signForm');
    if (f) f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api(`/agreements/${bookingId}/sign`, {
          method: 'POST',
          body: { signatureName: document.getElementById('sigName').value, agree: document.getElementById('agree').checked },
        });
        toast('Agreement signed');
        render();
        window.scrollTo(0, 0);
      } catch (err) {
        document.getElementById('err').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
      }
    });
  }
  render();
})();
