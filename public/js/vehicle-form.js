(async function () {
  const { api, renderChrome, esc, toast, vehicleArt } = window.RN;
  const user = await renderChrome('/dashboard');
  const page = document.getElementById('page');
  if (!user) return (location.href = '/login?next=/dashboard/vehicles/new');

  const m = location.pathname.match(/\/vehicles\/([0-9a-f]{24})\/edit/);
  const editId = m && m[1];
  let v = { type: 'car', fuel: 'petrol', transmission: 'manual', seats: 5, kmLimitPerDay: 200, securityDeposit: 0, city: user.city || '', features: [], year: new Date().getFullYear() };
  if (editId) {
    try { v = (await api('/vehicles/' + editId)).vehicle; }
    catch (e) { page.innerHTML = `<div class="empty"><h2>${esc(e.message)}</h2></div>`; return; }
  }

  const opt = (list, sel) => list.map((o) => `<option ${o === sel ? 'selected' : ''}>${o}</option>`).join('');
  page.innerHTML = `
  <div class="page-head">
    <h1 style="font-size:1.8rem;margin:0">${editId ? 'Edit listing' : 'List your vehicle'}</h1>
    <a href="/dashboard#vehicles">&larr; Back to listings</a>
  </div>
  
  <div class="vehicle-form-layout">
    <div class="form-main-col">
      <form class="card card-pad" id="form" style="margin:0;" novalidate>
        <div id="err"></div>
        <div class="row">
          <div class="field"><label for="type">Type</label><select id="type">${opt(['car', 'bike'], v.type)}</select></div>
          <div class="field"><label for="make">Make</label><input id="make" maxlength="40" value="${esc(v.make)}" placeholder="Hyundai"></div>
          <div class="field"><label for="model">Model</label><input id="model" maxlength="40" value="${esc(v.model)}" placeholder="Creta"></div>
          <div class="field"><label for="year">Year</label><input id="year" type="number" value="${esc(v.year)}"></div>
        </div>
        <div class="row">
          <div class="field"><label for="fuel">Fuel</label><select id="fuel">${opt(['petrol', 'diesel', 'electric', 'cng', 'hybrid'], v.fuel)}</select></div>
          <div class="field"><label for="transmission">Transmission</label><select id="transmission">${opt(['manual', 'automatic'], v.transmission)}</select></div>
          <div class="field"><label for="seats">Seats</label><input id="seats" type="number" min="1" max="9" value="${esc(v.seats)}"></div>
          <div class="field"><label for="registrationNo">Registration no.</label><input id="registrationNo" maxlength="20" value="${esc(v.registrationNo || '')}" placeholder="MH02AB1234"></div>
        </div>
        <div class="row">
          <div class="field"><label for="city">City</label><input id="city" maxlength="60" value="${esc(v.city)}"></div>
          <div class="field" style="grid-column:span 2"><label for="pickupLocation">Pickup &amp; drop address</label><input id="pickupLocation" maxlength="150" value="${esc(v.pickupLocation || '')}" placeholder="Landmark / parking spot"></div>
        </div>
        <div class="row">
          <div class="field"><label for="pricePerHour">Price per hour (&#8377;)</label><input id="pricePerHour" type="number" min="1" value="${esc(v.pricePerHour || '')}"></div>
          <div class="field"><label for="pricePerDay">Price per day (&#8377;)</label><input id="pricePerDay" type="number" min="1" value="${esc(v.pricePerDay || '')}"></div>
          <div class="field"><label for="securityDeposit">Security deposit (&#8377;)</label><input id="securityDeposit" type="number" min="0" value="${esc(v.securityDeposit)}"></div>
          <div class="field"><label for="kmLimitPerDay">Km limit / day</label><input id="kmLimitPerDay" type="number" min="10" value="${esc(v.kmLimitPerDay)}"></div>
        </div>
        <div class="field"><label for="description">Description</label><textarea id="description" maxlength="800" placeholder="Tell renters about your vehicle features, cleanliness, rules...">${esc(v.description || '')}</textarea></div>
        <div class="field"><label for="features">Features <span class="muted">(comma separated)</span></label><input id="features" value="${esc((v.features || []).join(', '))}" placeholder="AC, Bluetooth, 2 helmets"></div>
        <div class="field" style="margin:20px 0;">
          <label style="font-weight:700;font-size:1rem;color:#0f172a;margin-bottom:8px;display:block;">
            Vehicle Image <span class="muted" style="font-weight:400;font-size:0.85rem;">(Optional)</span>
          </label>
          <div class="vehicle-img-upload-box" style="border:2px dashed #cbd5e1;border-radius:14px;padding:22px;text-align:center;background:#f8fafc;transition:all 0.2s ease;">
            <div id="imgPreviewWrap" style="${v.imageUrl ? '' : 'display:none;'}margin-bottom:14px;">
              <img id="imgPreview" src="${esc(v.imageUrl || '')}" alt="Vehicle preview" style="max-height:170px;max-width:100%;object-fit:contain;border-radius:10px;background:#fff;padding:8px;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <div style="margin-top:10px;">
                <button type="button" class="btn secondary small" id="removeImgBtn">Remove image</button>
              </div>
            </div>
            <div id="uploadPrompt" style="${v.imageUrl ? 'display:none;' : ''}">
              <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" width="40" height="40" style="margin:0 auto 10px;display:block;"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <div style="font-weight:600;font-size:0.95rem;color:#1e293b;margin-bottom:4px;">Upload vehicle photo</div>
              <div class="small muted" style="margin-bottom:12px;">Choose a PNG, JPG, or WebP photo from your device (optional)</div>
              <label class="btn secondary small" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                <span>Choose photo...</span>
                <input type="file" id="imageFileInput" accept="image/png,image/jpeg,image/webp,image/jpg" style="display:none;">
              </label>
              <div style="margin:14px auto 10px;display:flex;align-items:center;max-width:280px;color:#94a3b8;font-size:0.8rem;">
                <div style="flex:1;height:1px;background:#e2e8f0;"></div>
                <span style="padding:0 8px;">or paste photo URL</span>
                <div style="flex:1;height:1px;background:#e2e8f0;"></div>
              </div>
            </div>
            <input id="imageUrl" type="text" value="${esc(v.imageUrl || '')}" placeholder="https://... or /img/vehicles/..." style="max-width:440px;margin:0 auto;display:${v.imageUrl ? 'none' : 'block'};font-size:0.88rem;">
          </div>
          <div class="hint" style="margin-top:6px;">Leave blank if you do not have a photo right now. A generated illustration will be used automatically.</div>
        </div>
        <button class="btn" type="submit" style="min-width:180px;">${editId ? 'Save changes' : 'Publish listing'}</button>
      </form>
    </div>

    <!-- Right Column: Live Card Preview & Owner Tips -->
    <div class="form-preview-col">
      <div class="card card-pad" style="background:#ffffff; border-radius:22px; box-shadow:0 4px 18px rgba(18, 35, 46, 0.04);">
        <div class="preview-box-header">
          <strong style="font-size:1rem;color:#0f172a;">Live Listing Preview</strong>
          <span class="preview-badge">Renters see this</span>
        </div>
        
        <!-- Live Vehicle Card Preview -->
        <div class="card vcard" id="liveCard" style="pointer-events:none; border-color:#e2e8f0; margin:0;">
          <div class="vcard-top">
            <h3 class="vcard-title" id="previewTitle">${esc((v.make && v.model) ? (v.make + ' ' + v.model) : (v.make || v.model || 'New Vehicle'))}</h3>
            <div class="vcard-price-row">
              <span class="vcard-currency">₹</span><span class="vcard-price-val" id="previewPrice">${Number(v.pricePerDay || 0).toLocaleString('en-IN')}</span><span class="vcard-period">/day</span>
            </div>
          </div>
          <div class="art vcard-art" id="previewArt">
            ${v.imageUrl ? `<img id="previewImg" src="${esc(v.imageUrl)}" alt="Preview" style="max-height:160px;width:100%;object-fit:contain;object-position:center bottom;">` : vehicleArt(v.type || 'car', v._id || 'new')}
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
              <span class="vcard-spec-label" id="previewTrans">${v.transmission === 'automatic' ? 'Auto' : 'Manual'}</span>
            </div>
            <div class="vcard-spec-item" title="Seating Capacity">
              <div class="vcard-spec-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 4a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v7H7z"/>
                  <path d="M7 11v4a4 4 0 0 0 4 4h7a2 2 0 0 0 2-2v-1"/>
                  <path d="M5 21h14"/>
                </svg>
              </div>
              <span class="vcard-spec-label" id="previewSeats">${v.seats || 5} Seats</span>
            </div>
            <div class="vcard-spec-item" title="Mileage">
              <div class="vcard-spec-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 21h10V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16z"/>
                  <path d="M7 7h4v4H7z"/>
                  <path d="M14 9h2a2 2 0 0 1 2 2v6a1 1 0 0 0 1 1 1 1 0 0 0 1-1V8.5L18.5 7"/>
                </svg>
              </div>
              <span class="vcard-spec-label" id="previewMpg">${v.type === 'bike' ? '85 MPG' : '45 MPG'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Owner Tips Card -->
      <div class="form-tips-card">
        <h4>Owner Tips for More Bookings</h4>
        <ul class="form-tips-list">
          <li>
            <span class="tip-icon">📸</span>
            <div><strong>Upload a side-view photo:</strong> Clean profile photos get 3x more renter inquiries than random angles.</div>
          </li>
          <li>
            <span class="tip-icon">🛡️</span>
            <div><strong>Verified digital agreements:</strong> Both you and the renter sign an agreement before keys change hands.</div>
          </li>
          <li>
            <span class="tip-icon">💰</span>
            <div><strong>Competitive daily pricing:</strong> Setting competitive rates keeps your calendar booked year-round.</div>
          </li>
        </ul>
      </div>
    </div>
  </div>`;

  const $ = (id) => document.getElementById(id);

  let pendingImageBase64 = null;
  const imageFileInput = $('imageFileInput');
  const imgPreviewWrap = $('imgPreviewWrap');
  const imgPreview = $('imgPreview');
  const uploadPrompt = $('uploadPrompt');
  const removeImgBtn = $('removeImgBtn');
  const imageUrlInput = $('imageUrl');

  // Real-time Live Preview synchronizer
  const updateLivePreview = () => {
    const make = ($('make')?.value || '').trim();
    const model = ($('model')?.value || '').trim();
    const title = (make && model) ? `${make} ${model}` : (make || model || 'New Vehicle');
    if ($('previewTitle')) $('previewTitle').textContent = title;
    
    const price = Number($('pricePerDay')?.value) || 0;
    if ($('previewPrice')) $('previewPrice').textContent = price ? price.toLocaleString('en-IN') : '0';
    
    if ($('previewTrans')) $('previewTrans').textContent = $('transmission')?.value === 'automatic' ? 'Auto' : 'Manual';
    if ($('previewSeats')) $('previewSeats').textContent = `${$('seats')?.value || 5} Seats`;
    
    const type = $('type')?.value || 'car';
    const mpg = type === 'bike' ? '85 MPG' : '45 MPG';
    if ($('previewMpg')) $('previewMpg').textContent = mpg;
    
    const currentImg = pendingImageBase64 || (imageUrlInput ? imageUrlInput.value.trim() : '');
    const previewArt = $('previewArt');
    if (previewArt) {
      if (currentImg) {
        previewArt.innerHTML = `<img id="previewImg" src="${esc(currentImg)}" alt="Preview" style="max-height:160px;width:100%;object-fit:contain;object-position:center bottom;">`;
      } else {
        previewArt.innerHTML = vehicleArt(type, make + model);
      }
    }
  };

  ['make', 'model', 'pricePerDay', 'transmission', 'seats', 'type'].forEach((id) => {
    if ($(id)) {
      $(id).addEventListener('input', updateLivePreview);
      $(id).addEventListener('change', updateLivePreview);
    }
  });

  if (imageFileInput) {
    imageFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        alert('File size exceeds 8MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        pendingImageBase64 = evt.target.result;
        imgPreview.src = pendingImageBase64;
        imgPreviewWrap.style.display = 'block';
        uploadPrompt.style.display = 'none';
        imageUrlInput.style.display = 'none';
        updateLivePreview();
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeImgBtn) {
    removeImgBtn.addEventListener('click', () => {
      pendingImageBase64 = null;
      if (imageFileInput) imageFileInput.value = '';
      if (imageUrlInput) imageUrlInput.value = '';
      imgPreview.src = '';
      imgPreviewWrap.style.display = 'none';
      uploadPrompt.style.display = 'block';
      imageUrlInput.style.display = 'block';
      updateLivePreview();
    });
  }

  if (imageUrlInput) {
    imageUrlInput.addEventListener('input', () => {
      const val = imageUrlInput.value.trim();
      if (val && (val.startsWith('http') || val.startsWith('/'))) {
        imgPreview.src = val;
        imgPreviewWrap.style.display = 'block';
      } else if (!val) {
        imgPreviewWrap.style.display = 'none';
      }
      updateLivePreview();
    });
  }

  // Initialize live preview
  updateLivePreview();

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('err').innerHTML = '';
    const body = {};
    ['type', 'make', 'model', 'year', 'fuel', 'transmission', 'seats', 'registrationNo', 'city', 'pickupLocation',
      'pricePerHour', 'pricePerDay', 'securityDeposit', 'kmLimitPerDay', 'description'].forEach((k) => (body[k] = $(k).value));
    body.features = $('features').value.split(',').map((s) => s.trim()).filter(Boolean);

    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;

    try {
      if (pendingImageBase64) {
        btn.textContent = 'Uploading photo...';
        const uploadRes = await api('/vehicles/upload-image', {
          method: 'POST',
          body: { image: pendingImageBase64 }
        });
        body.imageUrl = uploadRes.imageUrl;
      } else {
        body.imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';
      }

      btn.textContent = editId ? 'Saving changes...' : 'Publishing listing...';
      const res = editId
        ? await api('/vehicles/' + editId, { method: 'PUT', body })
        : await api('/vehicles', { method: 'POST', body });
      toast(editId ? 'Listing updated!' : 'Listing published!');
      setTimeout(() => (location.href = '/vehicles/' + res.vehicle._id), 600);
    } catch (err) {
      $('err').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
      window.scrollTo(0, 0);
      btn.disabled = false;
      btn.textContent = editId ? 'Save changes' : 'Publish listing';
    }
  });
})();
