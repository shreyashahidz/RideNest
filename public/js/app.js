// Shared front-end helpers: API client, nav, formatting, vehicle cards
(function () {
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function api(path, { method = 'GET', body } = {}) {
    const res = await fetch('/api' + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
    let data = {};
    try { data = await res.json(); } catch { /* empty body */ }
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  let userPromise;
  const getUser = () => (userPromise ||= api('/auth/me').then((d) => d.user).catch(() => null));

  const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const fmtDT = (d) =>
    new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtD = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  // value for <input type="datetime-local">
  const toLocalInput = (d) => {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 16);
  };
  const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

  function toast(msg, type = '') {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  // Simple generated illustration so listings without a photo still look good
  function vehicleArt(type, seed = '') {
    let h = 0;
    for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) % 360;
    const body = `hsl(${h} 55% 42%)`;
    const sky = `hsl(${h} 35% 90%)`;
    const car = `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="car"><rect width="400" height="250" fill="${sky}"/><rect y="190" width="400" height="60" fill="hsl(${h} 15% 78%)"/><path d="M50 170 L75 118 Q82 105 98 104 L220 104 Q240 104 252 120 L282 150 L340 158 Q356 160 356 176 L356 188 L50 188 Z" fill="${body}"/><path d="M92 118 L104 112 L172 112 L172 148 L72 148 Z" fill="#d9eef5" opacity=".9"/><path d="M182 112 L226 112 Q236 112 244 124 L262 148 L182 148 Z" fill="#d9eef5" opacity=".9"/><circle cx="110" cy="188" r="27" fill="#1d252b"/><circle cx="110" cy="188" r="12" fill="#c9d1d6"/><circle cx="300" cy="188" r="27" fill="#1d252b"/><circle cx="300" cy="188" r="12" fill="#c9d1d6"/><rect x="340" y="164" width="16" height="9" rx="3" fill="#ffd166"/></svg>`;
    const bike = `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="bike"><rect width="400" height="250" fill="${sky}"/><rect y="200" width="400" height="50" fill="hsl(${h} 15% 78%)"/><circle cx="105" cy="178" r="42" fill="none" stroke="#1d252b" stroke-width="12"/><circle cx="105" cy="178" r="8" fill="#c9d1d6"/><circle cx="300" cy="178" r="42" fill="none" stroke="#1d252b" stroke-width="12"/><circle cx="300" cy="178" r="8" fill="#c9d1d6"/><path d="M105 178 L160 120 L235 120 L300 178" fill="none" stroke="#2c363d" stroke-width="7" stroke-linejoin="round"/><path d="M150 108 Q190 82 232 112 L238 128 L168 132 Z" fill="${body}"/><path d="M150 110 L120 112 Q112 112 110 120 L150 128 Z" fill="#1d252b"/><path d="M232 118 L262 92 L282 94" fill="none" stroke="#2c363d" stroke-width="7" stroke-linecap="round"/><circle cx="196" cy="150" r="20" fill="#59656d"/><rect x="288" y="96" width="14" height="10" rx="3" fill="#ffd166"/></svg>`;
    return type === 'bike' ? bike : car;
  }

  const artOrImg = (v, eager = false) => {
    if (!v.imageUrl) return vehicleArt(v.type, v._id);
    const src = v.imageUrl + (v.imageUrl.includes('?') ? '' : '?v=5');
    return `<img src="${esc(src)}" alt="${esc(v.make + ' ' + v.model)}" loading="${eager ? "eager" : "lazy"}" onerror="this.outerHTML=window.RN.vehicleArt('${esc(v.type)}','${esc(v._id)}')">`;
  };

  function getVehicleMpg(v) {
    const m = (v.model || '').toLowerCase();
    if (m.includes('swift')) return '54 MPG';
    if (m.includes('creta')) return '45 MPG';
    if (m.includes('nexon')) return '110 MPGe';
    if (m.includes('innova')) return '35 MPG';
    if (m.includes('city')) return '42 MPG';
    if (m.includes('thar')) return '30 MPG';
    if (m.includes('seltos')) return '40 MPG';
    if (m.includes('fortuner')) return '28 MPG';
    if (m.includes('baleno')) return '52 MPG';
    if (m.includes('xuv')) return '36 MPG';
    if (m.includes('model 3') || m.includes('tesla')) return '132 MPGe';
    if (m.includes('scorpio')) return '33 MPG';
    if (m.includes('ertiga')) return '48 MPG';
    if (m.includes('i20')) return '46 MPG';
    if (m.includes('classic')) return '85 MPG';
    if (m.includes('activa')) return '115 MPG';
    if (m.includes('duke')) return '70 MPG';
    if (m.includes('s1')) return '140 MPGe';
    if (m.includes('pulsar')) return '82 MPG';
    if (m.includes('himalayan')) return '75 MPG';
    if (m.includes('r15')) return '105 MPG';
    if (m.includes('apache')) return '85 MPG';
    if (m.includes('splendor')) return '155 MPG';
    if (m.includes('bullet')) return '85 MPG';
    if (m.includes('dominar')) return '65 MPG';
    if (m.includes('access')) return '110 MPG';
    if (v.type === 'bike') return '85 MPG';
    if (v.fuel === 'electric') return '120 MPGe';
    return '38 MPG';
  }

  function getTransLabel(v) {
    const m = (v.model || '').toLowerCase();
    if (m.includes('activa') || m.includes('access') || m.includes('s1')) return 'Auto';
    if (v.transmission === 'automatic' || v.transmission === 'auto') return 'Auto';
    return 'Manual';
  }

  function vehicleCard(v) {
    const transLabel = getTransLabel(v);
    const seatsLabel = `${v.seats || (v.type === 'bike' ? 2 : 5)} Seats`;
    const mpgLabel = getVehicleMpg(v);

    return `<a class="card vcard" href="/vehicles/${esc(v._id)}" data-type="${esc(v.type)}">
      <div class="vcard-top">
        <h3 class="vcard-title">${esc(v.make)} ${esc(v.model)}</h3>
        <div class="vcard-price-row">
          <span class="vcard-currency">₹</span><span class="vcard-price-val">${Number(v.pricePerDay || 0).toLocaleString('en-IN')}</span><span class="vcard-period">/day</span>
        </div>
      </div>
      <div class="art vcard-art">
        ${artOrImg(v)}
      </div>
      <div class="vcard-specs-row">
        <div class="vcard-spec-item" title="Transmission">
          <div class="vcard-spec-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9.5"/>
              <circle cx="12" cy="12" r="2.8"/>
              <path d="M12 14.8V21.5M9.2 12H2.5M14.8 12H21.5"/>
            </svg>
          </div>
          <span class="vcard-spec-label">${transLabel}</span>
        </div>
        <div class="vcard-spec-item" title="Seating Capacity">
          <div class="vcard-spec-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 4a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v7H7z"/>
              <path d="M7 11v4a4 4 0 0 0 4 4h7a2 2 0 0 0 2-2v-1"/>
              <path d="M5 21h14"/>
            </svg>
          </div>
          <span class="vcard-spec-label">${seatsLabel}</span>
        </div>
        <div class="vcard-spec-item" title="Mileage">
          <div class="vcard-spec-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 21h10V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16z"/>
              <path d="M7 7h4v4H7z"/>
              <path d="M14 9h2a2 2 0 0 1 2 2v6a1 1 0 0 0 1 1 1 1 0 0 0 1-1V8.5L18.5 7"/>
            </svg>
          </div>
          <span class="vcard-spec-label">${mpgLabel}</span>
        </div>
      </div>
      <div class="vcard-hover-action">
        <span>Rent Now</span>
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
      </div>
    </a>`;
  }

  async function renderChrome(active) {
    const user = await getUser();
    const links = [
      ['/vehicles', 'Browse'],
      ['/how-it-works', 'How it works'],
    ];
    if (user) links.push(['/dashboard', user.role === 'owner' ? 'My listings' : 'My trips']);
    const nav = document.getElementById('nav');
    if (nav) {
      nav.className = 'nav';
      nav.innerHTML = `<div class="container">
        <a class="logo" href="/">RIDE<span>NEST</span></a>
        <button class="nav-toggle" aria-label="Menu">&#9776;</button>
        <div class="nav-links">${links.map(([h, t]) => `<a href="${h}" class="${active === h ? 'active' : ''}">${t}</a>`).join('')}</div>
        <div class="nav-right">${
          user
            ? `<span class="small">${esc(user.name)} <span class="badge-role">${esc(user.role)}</span></span>
               <button class="btn secondary small" id="logout">Log out</button>`
            : `<a href="/login">Log in</a><a class="btn small" href="/register">Sign up</a>`
        }</div></div>`;
      nav.querySelector('.nav-toggle').onclick = () => nav.classList.toggle('open');
      const lo = nav.querySelector('#logout');
      if (lo) lo.onclick = async () => { await api('/auth/logout', { method: 'POST' }); location.href = '/'; };
    }
    const footer = document.getElementById('footer');
    if (footer) {
      footer.className = 'footer';
      footer.innerHTML = `<div class="container cols">
        <div><strong style="color:#fff">RideNest</strong><br>Peer-to-peer car &amp; bike rentals with digital agreements.</div>
        <div><a href="/vehicles?type=car">Cars</a> &middot; <a href="/vehicles?type=bike">Bikes</a> &middot; <a href="/how-it-works">How it works</a><br>
        <span class="small">Built with Node.js, Express &amp; MongoDB</span></div></div>`;
    }
    return user;
  }

  // Redirect unauthenticated users (used by API-driven pages)
  async function requireLogin() {
    const u = await getUser();
    if (!u) location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search);
    return u;
  }

  window.RN = { esc, api, getUser, inr, fmtDT, fmtD, toLocalInput, stars, toast, vehicleArt, artOrImg, vehicleCard, renderChrome, requireLogin };
})();
