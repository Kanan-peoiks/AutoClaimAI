/**
 * AutoClaim Frontend — vanilla JS, ES6+
 * Gateway base URL; change here if backend runs elsewhere.
 */
const API_BASE = 'http://localhost:8080';

const STORAGE_TOKEN = 'ac_token';
const STORAGE_USER = 'ac_user';
const STORAGE_FULL_NAME = 'ac_fullName';
const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5 MB
const TARGET_SIZE_AFTER_RESIZE = 500 * 1024; // ~500 KB
const UPLOAD_RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s
const MAX_UPLOAD_RETRIES = 3;

// --- DOM references (set on init) ---
let $overlay, $overlayText, $viewLogin, $viewRegister, $viewProfile;
let $formLogin, $formRegister, $formUpload;
let $loginUsername, $loginPassword, $regUsername, $regFullName, $regPassword;
let $loginMessage, $registerMessage, $uploadMessage;
let $profileUsername, $uploadFile, $previewContainer, $previewImg;
let $uploadResult, $historyList, $historyLoading, $historyEmpty;
let $navLogin, $navRegister, $navProfile, $navLogout;

/**
 * Initialize DOM refs and event listeners.
 */
function init() {
  $overlay = document.getElementById('overlay');
  $overlayText = document.getElementById('overlay-text');
  $viewLogin = document.getElementById('view-login');
  $viewRegister = document.getElementById('view-register');
  $viewProfile = document.getElementById('view-profile');

  $formLogin = document.getElementById('form-login');
  $formRegister = document.getElementById('form-register');
  $formUpload = document.getElementById('form-upload');

  $loginUsername = document.getElementById('login-username');
  $loginPassword = document.getElementById('login-password');
  $regUsername = document.getElementById('reg-username');
  $regFullName = document.getElementById('reg-fullName');
  $regPassword = document.getElementById('reg-password');

  $loginMessage = document.getElementById('login-message');
  $registerMessage = document.getElementById('register-message');
  $uploadMessage = document.getElementById('upload-message');

  $profileUsername = document.getElementById('profile-username');
  $uploadFile = document.getElementById('upload-file');
  $previewContainer = document.getElementById('preview-container');
  $previewImg = document.getElementById('preview-img');
  $uploadResult = document.getElementById('upload-result');
  $historyList = document.getElementById('history-list');
  $historyLoading = document.getElementById('history-loading');
  $historyEmpty = document.getElementById('history-empty');

  $navLogin = document.getElementById('nav-login');
  $navRegister = document.getElementById('nav-register');
  $navProfile = document.getElementById('nav-profile');
  $navLogout = document.getElementById('nav-logout');

  $formLogin.addEventListener('submit', handleLogin);
  $formRegister.addEventListener('submit', handleRegister);
  $formUpload.addEventListener('submit', handleUpload);
  $uploadFile.addEventListener('change', handleFileSelect);

  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showView(el.getAttribute('data-view'));
    });
  });
  document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  if (getToken()) {
    showView('profile');
    updateNav(true);
    loadHistory();
  } else {
    showView('login');
    updateNav(false);
  }
}

/**
 * Show a view and hide others.
 */
function showView(name) {
  [$viewLogin, $viewRegister, $viewProfile].forEach(v => { v.classList.add('d-none'); });
  if (name === 'login') $viewLogin.classList.remove('d-none');
  else if (name === 'register') $viewRegister.classList.remove('d-none');
  else if (name === 'profile') {
    $viewProfile.classList.remove('d-none');
    const user = localStorage.getItem(STORAGE_USER);
    const fullName = localStorage.getItem(STORAGE_FULL_NAME);
    $profileUsername.textContent = fullName || user || 'İstifadəçi';
    loadHistory();
  }
}

/**
 * Update nav: show Login/Register or Profile + Logout.
 */
function updateNav(loggedIn) {
  if (loggedIn) {
    $navLogin.classList.add('d-none');
    $navRegister.classList.add('d-none');
    $navProfile.classList.remove('d-none');
    $navLogout.classList.remove('d-none');
  } else {
    $navLogin.classList.remove('d-none');
    $navRegister.classList.remove('d-none');
    $navProfile.classList.add('d-none');
    $navLogout.classList.add('d-none');
  }
}

function getToken() {
  return localStorage.getItem(STORAGE_TOKEN);
}

function getUsername() {
  return localStorage.getItem(STORAGE_USER);
}

/**
 * Show/hide global loading overlay.
 */
function setOverlay(show, text = 'Yüklənir...') {
  $overlayText.textContent = text;
  if (show) $overlay.classList.remove('d-none');
  else $overlay.classList.add('d-none');
}

/**
 * POST JSON and return response. Throws on non-ok with status.
 */
async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

/**
 * Handle register: POST /api/auth/register, plain text response.
 */
async function handleRegister(e) {
  e.preventDefault();
  $registerMessage.textContent = '';
  const username = $regUsername.value.trim();
  const fullName = $regFullName.value.trim();
  const password = $regPassword.value;

  setOverlay(true, 'Qeydiyyat...');
  try {
    const res = await postJson(`${API_BASE}/api/auth/register`, { username, fullName, password });
    const message = await res.text();
    if (res.ok) {
      localStorage.setItem(STORAGE_FULL_NAME, fullName);
      $registerMessage.textContent = message || 'Qeydiyyat uğurla tamamlandı!';
      $registerMessage.classList.remove('text-danger');
      $registerMessage.classList.add('text-success');
      $formRegister.reset();
    } else {
      $registerMessage.textContent = message || 'Qeydiyyat xətası.';
      $registerMessage.classList.add('text-danger');
      $registerMessage.classList.remove('text-success');
    }
  } catch (err) {
    $registerMessage.textContent = formatNetworkError(err);
    $registerMessage.classList.add('text-danger');
  } finally {
    setOverlay(false);
  }
}

/**
 * Handle login: POST /api/auth/login, response is plain text JWT.
 */
async function handleLogin(e) {
  e.preventDefault();
  $loginMessage.textContent = '';
  const username = $loginUsername.value.trim();
  const password = $loginPassword.value;

  setOverlay(true, 'Daxil olunur...');
  try {
    const res = await postJson(`${API_BASE}/api/auth/login`, { username, password });
    if (res.ok) {
      const token = await res.text();
      localStorage.setItem(STORAGE_TOKEN, token);
      localStorage.setItem(STORAGE_USER, username);
      updateNav(true);
      showView('profile');
      $formLogin.reset();
    } else if (res.status === 401) {
      $loginMessage.textContent = 'Giriş icazəsi yoxdur. Yenidən daxil olun.';
      $loginMessage.classList.add('text-danger');
    } else {
      const text = await res.text();
      $loginMessage.textContent = text || 'Giriş xətası.';
      $loginMessage.classList.add('text-danger');
    }
  } catch (err) {
    $loginMessage.textContent = formatNetworkError(err);
    $loginMessage.classList.add('text-danger');
  } finally {
    setOverlay(false);
  }
}

function logout() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
  updateNav(false);
  showView('login');
}

/**
 * Format network/CORS errors for user.
 */
function formatNetworkError(err) {
  if (err.message && (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
    return 'Şəbəkə xətası və ya CORS: Gateway-də CORS aktiv olmalıdır (məs. allowedOrigins). Brauzerdə konsolu yoxlayın.';
  }
  return err.message || 'Xəta baş verdi.';
}

/**
 * File input change: show image preview and validate type.
 */
function handleFileSelect() {
  const file = $uploadFile.files[0];
  $previewContainer.style.display = 'none';
  $uploadMessage.textContent = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    $uploadMessage.textContent = 'Zəhmət olmasa yalnız şəkil faylı seçin (image/*).';
    $uploadMessage.classList.add('text-danger');
    $uploadFile.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    $previewImg.src = e.target.result;
    $previewContainer.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

/**
 * Resize image via canvas to reduce size toward ~500KB. Returns Blob.
 */
function resizeImageToTarget(file) {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const maxDim = 1200;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        0.82
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Get file for upload: if over 1.5MB, try resize; if still over, return null and set message.
 */
async function prepareUploadFile() {
  let file = $uploadFile.files[0];
  if (!file) return null;
  if (file.size <= MAX_FILE_SIZE) return file;

  setOverlay(true, 'Şəkil sıxılır...');
  try {
    const blob = await resizeImageToTarget(file);
    const resized = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg') || 'image.jpg', { type: 'image/jpeg' });
    if (resized.size > MAX_FILE_SIZE) {
      $uploadMessage.textContent = 'Şəkil 1.5 MB-dan böyükdür. Daha kiçik fayl seçin.';
      $uploadMessage.classList.add('text-danger');
      return null;
    }
    return resized;
  } finally {
    setOverlay(false);
  }
}

/**
 * Upload with retry on 429: exponential backoff 1s, 2s, 4s, up to 3 tries.
 */
async function uploadWithRetry(formData) {
  let lastError;
  for (let attempt = 0; attempt < MAX_UPLOAD_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = UPLOAD_RETRY_DELAYS[attempt - 1];
      $overlayText.textContent = `Cəhd ${attempt + 1}/${MAX_UPLOAD_RETRIES} — ${delay / 1000} saniyə sonra təkrar...`;
      await new Promise(r => setTimeout(r, delay));
    }
    try {
      const token = getToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/claims/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (res.status === 429) {
        lastError = 'AI servisi müvəqqəti məşğuldur. Bir neçə saniyə sonra cəhd edin.';
        continue;
      }
      if (res.status === 401) {
        return { error: 'Giriş icazəsi yoxdur. Yenidən daxil olun.' };
      }
      if (!res.ok) {
        const text = await res.text();
        return { error: text || `Xəta: ${res.status}` };
      }
      const data = await res.json();
      return { data };
    } catch (err) {
      lastError = formatNetworkError(err);
    }
  }
  return { error: lastError || 'AI servisi müvəqqəti məşğuldur. Bir neçə saniyə sonra cəhd edin.' };
}

/**
 * Handle upload form: validate, prepare file, send multipart with file + username, show result, append to history.
 */
async function handleUpload(e) {
  e.preventDefault();
  $uploadMessage.textContent = '';
  const username = getUsername();
  if (!username) {
    $uploadMessage.textContent = 'Daxil olun.';
    $uploadMessage.classList.add('text-danger');
    return;
  }

  const file = await prepareUploadFile();
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('username', username);

  setOverlay(true, 'Yüklənir və AI analiz edir...');
  try {
    const result = await uploadWithRetry(formData);
    if (result.error) {
      $uploadMessage.textContent = result.error;
      $uploadMessage.classList.add('text-danger');
      return;
    }
    const claim = result.data;
    $uploadMessage.textContent = 'Uğurla yükləndi.';
    $uploadMessage.classList.remove('text-danger');

    // Show result in "Son nəticə" block
    let html = '';
    if (claim.aiAssessment) {
      html += `<div class="result-assessment mb-2">${escapeHtml(claim.aiAssessment)}</div>`;
    }
    if (claim.estimatedCost != null) {
      html += `<div class="result-cost">Təxmini məbləğ: ${Number(claim.estimatedCost).toLocaleString()} AZN</div>`;
    } else if (claim.aiAssessment) {
      html += '<div class="result-cost text-muted">Təxmini məbləğ göstərilmədi</div>';
    }
    $uploadResult.innerHTML = html || '<div class="text-muted">Nəticə yoxdur.</div>';

    // Append to local history view
    prependClaimToHistory(claim);
    $uploadFile.value = '';
    $previewContainer.style.display = 'none';
  } finally {
    setOverlay(false);
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

/**
 * Prepend one claim to the history list (card).
 */
function prependClaimToHistory(claim) {
  $historyEmpty.classList.add('d-none');
  const card = document.createElement('div');
  card.className = 'col-12 col-md-6 col-lg-4';
  const thumb = claim.imageUrl
    ? `<img src="${API_BASE}/${claim.imageUrl}" alt="" class="thumb">`
    : '<div class="thumb-placeholder">Şəkil</div>';
  const cost = claim.estimatedCost != null
    ? `${Number(claim.estimatedCost).toLocaleString()} AZN`
    : '—';
  card.innerHTML = `
    <div class="history-card p-3 d-flex gap-3">
      <div>${thumb}</div>
      <div class="flex-grow-1 min-w-0">
        <div class="small text-muted">ID: ${escapeHtml(String(claim.id))}</div>
        <div class="small result-assessment">${escapeHtml((claim.aiAssessment || '').slice(0, 120))}${(claim.aiAssessment && claim.aiAssessment.length > 120) ? '…' : ''}</div>
        <div class="result-cost small">${escapeHtml(cost)}</div>
      </div>
    </div>`;
  $historyList.insertBefore(card, $historyList.firstChild);
}

/**
 * Fetch GET /api/claims?username=... and render history. On 404/empty show "Tarixçə tapılmadı".
 */
async function loadHistory() {
  const username = getUsername();
  $historyList.innerHTML = '';
  $historyLoading.classList.remove('d-none');
  $historyEmpty.classList.add('d-none');

  if (!username) {
    $historyLoading.classList.add('d-none');
    $historyEmpty.classList.remove('d-none');
    $historyEmpty.textContent = 'Tarixçə tapılmadı';
    return;
  }

  try {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/claims?username=${encodeURIComponent(username)}`, { headers });
    $historyLoading.classList.add('d-none');
    if (res.status === 404 || res.status >= 500) {
      $historyEmpty.classList.remove('d-none');
      $historyEmpty.textContent = 'Tarixçə tapılmadı';
      return;
    }
    if (!res.ok) {
      $historyEmpty.classList.remove('d-none');
      $historyEmpty.textContent = 'Tarixçə yüklənə bilmədi.';
      return;
    }
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) {
      $historyEmpty.classList.remove('d-none');
      $historyEmpty.textContent = 'Tarixçə tapılmadı';
      return;
    }
    list.forEach((claim) => prependClaimToHistory(claim));
  } catch (err) {
    $historyLoading.classList.add('d-none');
    $historyEmpty.classList.remove('d-none');
    $historyEmpty.textContent = 'Tarixçə tapılmadı';
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
