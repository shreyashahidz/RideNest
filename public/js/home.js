(async function () {
  const { api, renderChrome, vehicleCard, toLocalInput, esc } = window.RN;
  await renderChrome('/');

  const $ = (id) => document.getElementById(id);
  const nav = $('nav');
  if (nav) {
    nav.classList.add('nav-transparent');
    const onScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // default pickup = next full hour, drop = +1 day
  const next = new Date();
  next.setHours(next.getHours() + 1, 0, 0, 0);
  $('pickup').value = toLocalInput(next);
  $('drop').value = toLocalInput(new Date(next.getTime() + 24 * 3600e3));
  $('pickup').min = toLocalInput(new Date());

  try {
    const { cities } = await api('/vehicles/cities');
    $('city').insertAdjacentHTML('beforeend', cities.map((c) => `<option>${esc(c)}</option>`).join(''));
  } catch { /* non-critical */ }

  $('search').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if ($('city').value) p.set('city', $('city').value);
    if ($('type').value) p.set('type', $('type').value);
    if ($('pickup').value && $('drop').value) {
      p.set('pickup', new Date($('pickup').value).toISOString());
      p.set('drop', new Date($('drop').value).toISOString());
    }
    location.href = '/vehicles?' + p.toString();
  });

  try {
    const s = await api('/stats/public');
    $('stats').innerHTML = [
      [s.vehicles, 'vehicles listed'],
      [s.byType.car || 0, 'cars'],
      [s.byType.bike || 0, 'bikes'],
      [s.owners, 'trusted owners'],
      [s.trips, 'trips booked'],
    ].map(([n, l]) => `<div class="card stat"><strong>${n}</strong><span class="muted small">${l}</span></div>`).join('');

    const { items } = await api('/vehicles?limit=6&sort=newest');
    $('featured').innerHTML = items.length ? items.map(vehicleCard).join('') : '<p class="empty">No vehicles listed yet.</p>';
  } catch (e) {
    $('featured').innerHTML = `<p class="empty">${esc(e.message)}</p>`;
  }
})();
