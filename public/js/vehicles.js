(async function () {
  const { api, renderChrome, vehicleCard, esc, toLocalInput } = window.RN;
  renderChrome('/vehicles');
  const $ = (id) => document.getElementById(id);
  const FIELDS = ['q', 'city', 'type', 'transmission', 'fuel', 'minPrice', 'maxPrice', 'sort'];
  let page = 1;

  try {
    const { cities } = await api('/vehicles/cities');
    $('city').insertAdjacentHTML('beforeend', cities.map((c) => `<option>${esc(c)}</option>`).join(''));
  } catch { /* ignore */ }

  // restore state from the URL query string
  const params = new URLSearchParams(location.search);
  FIELDS.forEach((f) => { if (params.get(f)) $(f).value = params.get(f); });
  if (params.get('pickup')) $('pickup').value = toLocalInput(params.get('pickup'));
  if (params.get('drop')) $('drop').value = toLocalInput(params.get('drop'));
  page = parseInt(params.get('page'), 10) || 1;

  function buildQuery() {
    const p = new URLSearchParams();
    FIELDS.forEach((f) => { if ($(f).value) p.set(f, $(f).value); });
    if ($('pickup').value && $('drop').value) {
      p.set('pickup', new Date($('pickup').value).toISOString());
      p.set('drop', new Date($('drop').value).toISOString());
    }
    if (page > 1) p.set('page', page);
    return p;
  }

  async function load() {
    const p = buildQuery();
    history.replaceState(null, '', '/vehicles' + (p.toString() ? '?' + p : ''));
    $('results').innerHTML = '<div class="spinner"></div>';
    try {
      const data = await api('/vehicles?' + p);
      $('count').textContent = `${data.total} vehicle${data.total === 1 ? '' : 's'} found`;
      $('results').innerHTML = data.items.length
        ? data.items.map(vehicleCard).join('')
        : '<div class="empty" style="grid-column:1/-1"><h3>No vehicles match</h3><p>Try a different city, remove a filter or change your time window.</p></div>';
      $('pager').innerHTML = data.pages > 1
        ? `<button class="btn secondary small" ${data.page <= 1 ? 'disabled' : ''} id="prev">&larr; Prev</button>
           <span class="muted small" style="align-self:center">Page ${data.page} of ${data.pages}</span>
           <button class="btn secondary small" ${data.page >= data.pages ? 'disabled' : ''} id="next">Next &rarr;</button>`
        : '';
      if ($('prev')) $('prev').onclick = () => { page--; load(); window.scrollTo(0, 0); };
      if ($('next')) $('next').onclick = () => { page++; load(); window.scrollTo(0, 0); };
    } catch (e) {
      $('results').innerHTML = `<p class="empty" style="grid-column:1/-1">${esc(e.message)}</p>`;
    }
  }

  const priceRange = $('priceRange');
  const priceRangeVal = $('priceRangeVal');
  if (priceRange && $('maxPrice')) {
    const updateSliderVal = (val) => {
      priceRangeVal.textContent = '₹' + Number(val || 10000).toLocaleString('en-IN');
    };
    priceRange.addEventListener('input', () => {
      $('maxPrice').value = priceRange.value;
      updateSliderVal(priceRange.value);
    });
    $('maxPrice').addEventListener('input', () => {
      if ($('maxPrice').value) {
        priceRange.value = $('maxPrice').value;
        updateSliderVal($('maxPrice').value);
      }
    });
    if ($('maxPrice').value) {
      priceRange.value = $('maxPrice').value;
      updateSliderVal($('maxPrice').value);
    }
  }

  $('filters').addEventListener('submit', (e) => { e.preventDefault(); page = 1; load(); });
  $('sort').addEventListener('change', () => { page = 1; load(); });
  $('reset').addEventListener('click', () => {
    $('filters').reset();
    if (priceRange && priceRangeVal) {
      priceRange.value = 10000;
      priceRangeVal.textContent = '₹10,000';
    }
    $('sort').value = 'newest';
    page = 1;
    load();
  });
  load();
})();
