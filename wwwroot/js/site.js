// ════════════════════════════════════════════════════════
// PADELWEB — site.js
// Utilidades globales compartidas
// IMontanar · Sistemas & Consultoría
// ════════════════════════════════════════════════════════

// ── API URL (configurable desde la página) ────────────
// Las llamadas van al proxy local /api/... que este servidor reenvía al backend.
// Nunca llamamos directamente al backend desde el browser (evita CORS).
window.API_URL = '';

// ── API CLIENT ────────────────────────────────────────
async function apiCall(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${window.API_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensaje || data.title || `Error ${res.status}`);
  return data;
}

window.apiGet  = path        => apiCall('GET',    path);
window.apiPost = (path, body)=> apiCall('POST',   path, body);
window.apiPut  = (path, body)=> apiCall('PUT',    path, body);
window.apiDel  = path        => apiCall('DELETE', path);

// ── TOAST ─────────────────────────────────────────────
let _toastTimer;
window.toast = function(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${tipo} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
};

// ── MODAL HELPERS ─────────────────────────────────────
window.abrirModal  = id => document.getElementById(id)?.classList.add('open');
window.cerrarModal = id => document.getElementById(id)?.classList.remove('open');

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
});

// ── LOADING EN TABLAS ─────────────────────────────────
window.setTableLoading = function(tbodyId, cols) {
  const tb = document.getElementById(tbodyId);
  if (!tb) return;
  tb.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:2rem;color:var(--gris2);">
    <div class="spinner spinner-dark" style="display:inline-block;vertical-align:middle;margin-right:.5rem;"></div>
    Cargando...</td></tr>`;
};

window.setTableError = function(tbodyId, cols, msg) {
  const tb = document.getElementById(tbodyId);
  if (!tb) return;
  tb.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:2rem;color:var(--rojo);">⚠️ ${msg}</td></tr>`;
};

// ── EXPORTAR CSV ──────────────────────────────────────
window.descargarCSV = function(headers, rows, nombre) {
  const csv  = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${nombre}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── CONSTANTES ────────────────────────────────────────
window.DIAS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
window.CATS_LIST = [
  '8va Principiante','8va Avanzada',
  '7ma Principiante','7ma Avanzada',
  '6ta Principiante','6ta Avanzada',
  '5ta Principiante','5ta Avanzada',
  '4ta Principiante','4ta Avanzada'
];
