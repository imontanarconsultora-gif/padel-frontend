// ════════════════════════════════════════════════════════
// PADELWEB — admin.js
// Lógica del panel de administración
// IMontanar · Sistemas & Consultoría
// ════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
async function cargarDashboard() {
  ['stat-alumnas','stat-turnos','stat-cupos','stat-ocup'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '…';
  });
  setTableLoading('dashboard-tabla', 6);

  const hoy = new Date().toISOString().slice(0,10);

  // Llamadas separadas para que un 404 no mate todo el dashboard
  const [resAlumnas, resTurnos] = await Promise.allSettled([
    apiGet('/api/alumnos'),
    apiGet(`/api/turnos?fecha=${hoy}`)
  ]);

  // Stat alumnas
  if (resAlumnas.status === 'fulfilled') {
    const activas = resAlumnas.value.filter(a => a.activa).length;
    document.getElementById('stat-alumnas').textContent = activas;
  } else {
    document.getElementById('stat-alumnas').textContent = '—';
    console.warn('alumnas:', resAlumnas.reason?.message);
  }

  // Stats y tabla de turnos
  if (resTurnos.status === 'fulfilled') {
    const activos  = resTurnos.value.filter(t => t.activo);
    const libres   = activos.reduce((s, t) => s + t.cuposLibres, 0);
    const total    = activos.reduce((s, t) => s + t.maxAlumnos, 0);
    const ocupados = total - libres;

    document.getElementById('stat-turnos').textContent = activos.length;
    document.getElementById('stat-cupos').textContent  = libres;
    document.getElementById('stat-ocup').textContent   = total > 0
      ? Math.round(ocupados / total * 100) + '%' : '—';

    const tbody = document.getElementById('dashboard-tabla');
    if (!activos.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gris2);padding:2rem;">No hay turnos configurados</td></tr>';
      return;
    }

    tbody.innerHTML = activos.map(t => {
      const ocup = t.maxAlumnos - t.cuposLibres;
      const dots = Array.from({length: t.maxAlumnos}, (_,i) =>
        `<span class="dot ${i < ocup ? 'ocupado' : ''}"></span>`).join('');
      const esA = t.categoria.includes('Avanzada');
      return `<tr>
        <td style="font-weight:500">${t.nombre}</td>
        <td><span class="badge ${esA?'badge-a':'badge-p'}">${t.categoria}</span></td>
        <td>${DIAS_FULL[t.diaSemana]}</td>
        <td><span style="font-family:'DM Mono',monospace">${t.hora?.slice(0,5)}</span></td>
        <td><div class="cupos-bar"><div class="cupos-dots">${dots}</div>
            <span style="font-size:.75rem;color:var(--gris)">${t.cuposLibres} libre${t.cuposLibres!==1?'s':''}</span></div></td>
        <td><span class="badge ${t.cuposLibres>0?'badge-ok':'badge-no'}">${t.cuposLibres>0?'Con cupo':'Completo'}</span></td>
      </tr>`;
    }).join('');
  } else {
    ['stat-turnos','stat-cupos','stat-ocup'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
    setTableError('dashboard-tabla', 6, resTurnos.reason?.message ?? 'Error al cargar turnos');
    console.warn('turnos:', resTurnos.reason?.message);
  }
}

// ══════════════════════════════════════════════════════
// TURNOS
// ══════════════════════════════════════════════════════
let _turnosBuscados = [];

async function cargarTurnos() {
  setTableLoading('turnos-tabla', 7);
  try {
    const hoy = new Date().toISOString().slice(0,10);
    _turnosBuscados = await apiGet(`/api/turnos?fecha=${hoy}`);
    pintarTurnos('');
  } catch(e) { setTableError('turnos-tabla', 7, e.message); }
}

function pintarTurnos(filtro) {
  const tbody = document.getElementById('turnos-tabla');
  const empty = document.getElementById('turnos-empty');
  const txt   = (filtro || '').toLowerCase();
  const lista = _turnosBuscados.filter(t =>
    !txt || t.nombre.toLowerCase().includes(txt) || t.categoria.toLowerCase().includes(txt)
  );

  if (!_turnosBuscados.length) {
    if (tbody) tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  const GENERO_LABEL = { 1: 'Damas', 2: 'Caballeros' };
  const GENERO_BADGE = { 1: 'badge-genero-d', 2: 'badge-genero-c' };

  tbody.innerHTML = lista.map(t => {
    const esA    = t.categoria.includes('Avanzada');
    const genLbl = GENERO_LABEL[t.genero] ?? '—';
    const genBdg = GENERO_BADGE[t.genero] ?? '';
    return `<tr>
      <td style="font-weight:500">${t.nombre}</td>
      <td><span class="badge ${esA?'badge-a':'badge-p'}">${t.categoria}</span></td>
      <td><span class="badge ${genBdg}">${genLbl}</span></td>
      <td>${DIAS_FULL[t.diaSemana]}</td>
      <td><span style="font-family:'DM Mono',monospace">${t.hora?.slice(0,5)}</span></td>
      <td style="text-align:center">${t.maxAlumnos}</td>
      <td><span class="badge ${t.activo?'badge-ok':'badge-no'}">${t.activo?'Activo':'Inactivo'}</span></td>
      <td>
        <div style="display:flex;gap:.4rem;">
          <button class="btn btn-ghost btn-sm" onclick="editarTurno('${t.id}')">✏ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarTurno('${t.id}')">✕</button>
        </div>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="8" style="text-align:center;color:var(--gris2);padding:1.5rem;">Sin resultados</td></tr>`;
}

function editarTurno(id) {
  const t = _turnosBuscados.find(x => x.id === id || x.id === +id);
  if (!t) return;
  document.getElementById('modal-turno-titulo').textContent = 'Editar turno';
  document.getElementById('turno-edit-id').value   = t.id;
  document.getElementById('turno-nombre').value    = t.nombre;
  document.getElementById('turno-dia').value       = t.diaSemana;
  document.getElementById('turno-hora').value      = t.hora?.slice(0,5);
  document.getElementById('turno-categoria').value = t.categoria;
  const generoEl = document.getElementById('turno-genero');
  if (generoEl) generoEl.value = t.genero ?? 1;
  document.getElementById('turno-max').value       = t.maxAlumnos;
  document.getElementById('turno-activo').checked  = t.activo;
  abrirModal('modal-turno');
}

function nuevoTurno() {
  document.getElementById('modal-turno-titulo').textContent = 'Nuevo turno';
  document.getElementById('turno-edit-id').value   = '';
  document.getElementById('turno-nombre').value    = '';
  document.getElementById('turno-dia').value       = 1;
  document.getElementById('turno-hora').value      = '09:00';
  document.getElementById('turno-genero').value    = 1;
  document.getElementById('turno-max').value       = 4;
  document.getElementById('turno-activo').checked  = true;
  abrirModal('modal-turno');
}

async function guardarTurno() {
  const nombre = document.getElementById('turno-nombre').value.trim();
  const dia    = parseInt(document.getElementById('turno-dia').value);
  const hora   = document.getElementById('turno-hora').value + ':00';
  const cat    = document.getElementById('turno-categoria').value;
  const max    = parseInt(document.getElementById('turno-max').value);
  const activo = document.getElementById('turno-activo').checked;
  const editId = document.getElementById('turno-edit-id').value;

  if (!nombre) { toast('Ingresá un nombre para el turno', 'err'); return; }

  const btn = document.getElementById('btn-guardar-turno');
  btn.disabled = true; btn.textContent = 'Guardando...';

  try {
    const genero = parseInt(document.getElementById('turno-genero').value);
    const body = { nombre, diaSemana: dia, hora, categoria: cat, genero, maxAlumnos: max, activo };
    if (editId) await apiPut(`/api/turnos/${editId}`, body);
    else        await apiPost('/api/turnos', body);
    cerrarModal('modal-turno');
    toast(editId ? 'Turno actualizado' : 'Turno creado', 'ok');
    cargarTurnos();
  } catch(e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; btn.textContent = 'Guardar turno'; }
}

async function eliminarTurno(id) {
  const result = await Swal.fire({
    title: '¿Eliminar turno?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#c0392b',
    cancelButtonColor: '#6b6760',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });
  if (!result.isConfirmed) return;
  try {
    await apiDel(`/api/turnos/${id}`);
    toast('Turno eliminado', 'ok');
    cargarTurnos();
  } catch(e) { toast(e.message, 'err'); }
}

// ══════════════════════════════════════════════════════
// ALUMNAS
// ══════════════════════════════════════════════════════
let _alumnasBuscadas = [];

async function cargarAlumnas() {
  setTableLoading('alumnas-tabla', 5);
  try {
    _alumnasBuscadas = await apiGet('/api/alumnos');
    pintarAlumnas('', '');
  } catch(e) { setTableError('alumnas-tabla', 5, e.message); }
}

function pintarAlumnas(txt, cat) {
  const tbody = document.getElementById('alumnas-tabla');
  const empty = document.getElementById('alumnas-empty');
  const tl = (txt || '').toLowerCase();
  const lista = _alumnasBuscadas.filter(a =>
    (!cat || a.categoria === cat) &&
    (!tl  || a.nombre.toLowerCase().includes(tl) || a.telefono.includes(tl))
  );

  if (!_alumnasBuscadas.length) {
    if (tbody) tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = lista.map(a => {
    const esA = a.categoria.includes('Avanzada');
    return `<tr>
      <td style="font-weight:500">${a.nombre}</td>
      <td><span style="font-family:'DM Mono',monospace;font-size:.82rem">${a.telefono}</span></td>
      <td><span class="badge ${esA?'badge-a':'badge-p'}">${a.categoria}</span></td>
      <td><span class="badge ${a.activa?'badge-ok':'badge-no'}">${a.activa?'Activa':'Inactiva'}</span></td>
      <td>
        <div style="display:flex;gap:.4rem;">
          <button class="btn btn-ghost btn-sm" onclick="editarAlumna('${a.id}')">✏ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarAlumna('${a.id}')">✕</button>
        </div>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--gris2);padding:1.5rem;">Sin resultados</td></tr>`;
}

function editarAlumna(id) {
  const a = _alumnasBuscadas.find(x => x.id === id);
  if (!a) return;
  document.getElementById('modal-alumna-titulo').textContent = 'Editar alumna';
  document.getElementById('alumna-edit-id').value   = a.id;
  document.getElementById('alumna-nombre').value    = a.nombre;
  document.getElementById('alumna-tel').value       = a.telefono;
  document.getElementById('alumna-categoria').value = a.categoria;
  document.getElementById('alumna-activa').checked  = a.activa;
  abrirModal('modal-alumna');
}

function nuevaAlumna() {
  document.getElementById('modal-alumna-titulo').textContent = 'Nueva alumna';
  document.getElementById('alumna-edit-id').value   = '';
  document.getElementById('alumna-nombre').value    = '';
  document.getElementById('alumna-tel').value       = '';
  document.getElementById('alumna-activa').checked  = true;
  abrirModal('modal-alumna');
}

async function guardarAlumna() {
  const nombre = document.getElementById('alumna-nombre').value.trim();
  const tel    = document.getElementById('alumna-tel').value.trim();
  const cat    = document.getElementById('alumna-categoria').value;
  const activa = document.getElementById('alumna-activa').checked;
  const editId = document.getElementById('alumna-edit-id').value;

  if (!nombre || !tel) { toast('Completá nombre y teléfono', 'err'); return; }

  const btn = document.getElementById('btn-guardar-alumna');
  btn.disabled = true; btn.textContent = 'Guardando...';

  try {
    const body = { nombre, telefono: tel, categoria: cat, activa };
    if (editId) await apiPut(`/api/alumnos/${editId}`, body);
    else        await apiPost('/api/alumnos', body);
    cerrarModal('modal-alumna');
    toast(editId ? 'Alumna actualizada' : 'Alumna registrada', 'ok');
    cargarAlumnas();
  } catch(e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; btn.textContent = 'Guardar alumna'; }
}

async function eliminarAlumna(id) {
  const result = await Swal.fire({
    title: '¿Eliminar alumna?',
    text: 'Se borrarán también sus reservas asociadas.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#c0392b',
    cancelButtonColor: '#6b6760',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });
  if (!result.isConfirmed) return;
  try {
    await apiDel(`/api/alumnos/${id}`);
    toast('Alumna eliminada', 'ok');
    cargarAlumnas();
  } catch(e) { toast(e.message, 'err'); }
}

// ══════════════════════════════════════════════════════
// RESERVAS
// ══════════════════════════════════════════════════════
async function cargarReservas(fecha) {
  setTableLoading('reservas-tabla', 6);
  try {
    const lista = await apiGet(`/api/reservas?fecha=${fecha}`);
    const tbody = document.getElementById('reservas-tabla');
    const empty = document.getElementById('reservas-empty');

    if (!lista.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = lista.map(r => `<tr>
      <td style="font-weight:500">${r.alumnaNombre}</td>
      <td>${r.turnoNombre}</td>
      <td>${r.fechaClase}</td>
      <td><span class="badge ${r.estado==='Confirmada'?'badge-ok':'badge-no'}">${r.estado}</span></td>
      <td><span class="badge ${r.recordatorioEnviado?'badge-ok':''}"
          style="${!r.recordatorioEnviado?'background:var(--bg3);color:var(--gris)':''}">
          ${r.recordatorioEnviado?'Enviado':'Pendiente'}</span></td>
      <td>
        ${r.estado==='Confirmada'
          ? `<button class="btn btn-danger btn-sm" onclick="cancelarReserva('${r.id}')">Cancelar</button>`
          : '—'}
      </td>
    </tr>`).join('');
  } catch(e) { setTableError('reservas-tabla', 6, e.message); }
}

async function cancelarReserva(id) {
  const result = await Swal.fire({
    title: '¿Cancelar reserva?',
    text: 'La alumna será notificada por WhatsApp.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#c0392b',
    cancelButtonColor: '#6b6760',
    confirmButtonText: 'Sí, cancelar',
    cancelButtonText: 'No'
  });
  if (!result.isConfirmed) return;
  try {
    await apiPost('/api/reservas/cancelar-admin', { reservaId: id });
    toast('Reserva cancelada', 'ok');
    const fecha = document.getElementById('filtro-fecha')?.value;
    if (fecha) cargarReservas(fecha);
  } catch(e) { toast(e.message, 'err'); }
}
