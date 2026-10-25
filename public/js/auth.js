(async function () {
  const { api, renderChrome, esc, getUser } = window.RN;
  const user = await renderChrome('');
  const next = new URLSearchParams(location.search).get('next');
  // only allow same-site relative redirects
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  if (user) { location.replace(safeNext); return; }

  const $ = (id) => document.getElementById(id);
  const isRegister = location.pathname === '/register';

  if (!isRegister && location.search) {
    document.querySelectorAll('a[href="/register"]').forEach((a) => {
      a.href = '/register' + location.search;
    });
  }

  if (isRegister) {
    const preRole = new URLSearchParams(location.search).get('role');
    if (preRole) {
      const el = document.querySelector(`input[name=role][value="${preRole}"]`);
      if (el) el.checked = true;
    }
  }

  document.querySelectorAll('[data-demo]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      $('email').value = a.dataset.demo;
      $('password').value = 'Demo@1234';
    })
  );

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('err').innerHTML = '';
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const body = { email: $('email').value, password: $('password').value };
      if (isRegister) {
        Object.assign(body, {
          name: $('name').value,
          phone: $('phone').value,
          city: $('city').value,
          role: document.querySelector('input[name=role]:checked').value,
        });
      }
      const { user } = await api(isRegister ? '/auth/register' : '/auth/login', { method: 'POST', body });
      const dest = next ? safeNext : user.role === 'owner' && isRegister ? '/dashboard/vehicles/new' : '/dashboard';
      location.href = dest;
    } catch (err) {
      $('err').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
      btn.disabled = false;
    }
  });
})();
