// ── utils.js ── helpers UI

// ── TOAST ──
function toast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'slideOut .3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ── MODAL ──
function openModal(html, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); onClose?.(); } });
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close')?.addEventListener('click', () => { overlay.remove(); onClose?.(); });
  return overlay;
}

function closeModal() {
  document.querySelector('.modal-overlay')?.remove();
}

// ── FORMAT DATE ──
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function fmtDateShort(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

function timeAgo(str) {
  const diff = Date.now() - new Date(str);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'À l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

// ── STATUS BADGE ──
function statusBadge(status) {
  const s = STATUS_LABELS[status] || { label: status, icon: '?' };
  return `<span class="badge badge-${status}">${s.icon} ${s.label}</span>`;
}

// ── SERVICE LABEL ──
function serviceLabel(service) {
  return SERVICE_LABELS[service] || service;
}

// ── PRIORITY ──
function priorityBadge(priority) {
  const p = PRIORITY_LABELS[priority] || { label: priority, color: '#fff' };
  return `<span style="color:${p.color};font-family:var(--FM);font-size:.7rem">▲ ${p.label}</span>`;
}

// ── STATUS TIMELINE ──
function renderStatusTimeline(status) {
  if (status === 'annule') {
    return `<div style="display:flex;align-items:center;gap:.6rem;padding:.5rem .9rem;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:6px">
      <div style="width:10px;height:10px;border-radius:50%;background:var(--red);flex-shrink:0"></div>
      <span style="font-size:.8rem;color:var(--red);font-weight:600">Intervention annulée</span>
    </div>`;
  }

  const steps = [
    { key: 'nouveau',        label: 'Nouveau',        color: '#64748b' },
    { key: 'diagnostic',     label: 'Diagnostic',     color: '#f59e0b' },
    { key: 'en_cours',       label: 'En cours',       color: '#3b82f6' },
    { key: 'attente_piece',  label: 'Attente pièce',  color: '#8b5cf6' },
    { key: 'attente_client', label: 'Attente client', color: '#f97316' },
    { key: 'termine',        label: 'Terminé',        color: '#22c55e' },
    { key: 'archive',        label: 'Archivé',        color: '#475569' },
  ];

  const cur = steps.findIndex(s => s.key === status);

  const rows = steps.map((step, i) => {
    const done   = i < cur;
    const active = i === cur;
    const col    = step.color;
    const dotBg      = done ? col : active ? col : 'transparent';
    const dotBorder  = done ? col : active ? col : 'var(--muted)';
    const lineColor  = done ? col : 'var(--border)';
    const labelColor = done ? col : active ? col : 'var(--muted)';
    const labelStyle = 'font-size:.68rem;color:' + labelColor + ';font-weight:' + (active ? '700' : '400') + ';text-align:center;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px' + (active ? ';background:rgba(255,255,255,.06);padding:1px 5px;border-radius:4px' : '');
    const line = i < steps.length - 1 ? '<div style="flex:1;height:2px;background:' + lineColor + ';margin-top:5px;min-width:6px"></div>' : '';
    return '<div style="display:flex;align-items:flex-start;flex:1;min-width:0">'
      + '<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1;min-width:0">'
      + '<div style="width:10px;height:10px;border-radius:50%;background:' + dotBg + ';border:2px solid ' + dotBorder + ';flex-shrink:0;margin-top:1px"></div>'
      + '<span style="' + labelStyle + '">' + step.label + '</span>'
      + '</div>' + line + '</div>';
  });
  return '<div style="display:flex;align-items:flex-start;overflow-x:auto;padding-bottom:2px">' + rows.join('') + '</div>';
}

// ── GENERATE TOKEN ──
function generateToken(length = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => chars[b % chars.length]).join('');
}

// ── COPY TO CLIPBOARD ──
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copié dans le presse-papier', 'success', 2000);
  } catch {
    toast('Impossible de copier', 'error');
  }
}

// ── CONFIRM DIALOG ──
function confirm(msg) {
  return new Promise(resolve => {
    const overlay = openModal(`
      <div class="modal-header">
        <span class="modal-title">Confirmation</span>
        <button class="modal-close">×</button>
      </div>
      <p style="color:var(--muted2);margin-bottom:1.5rem">${msg}</p>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="conf-no">Annuler</button>
        <button class="btn btn-danger" id="conf-yes">Confirmer</button>
      </div>
    `);
    overlay.querySelector('#conf-yes').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#conf-no').onclick  = () => { overlay.remove(); resolve(false); };
  });
}

// ── LOADING ──
function showLoader(container) {
  container.innerHTML = '<div class="spinner"></div>';
}

// ── ROUTER simple hash-based ──
const Router = {
  routes: {},
  current: null,

  on(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    if (window.location.hash === '#' + path) {
      this._resolve();
    } else {
      window.location.hash = path;
    }
  },

  init() {
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  },

  _resolve() {
    const hash = window.location.hash.slice(1) || '/';
    // Match exact or with params
    for (const [pattern, handler] of Object.entries(this.routes)) {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
      const match = hash.match(regex);
      if (match) {
        const paramNames = (pattern.match(/:[^/]+/g) || []).map(p => p.slice(1));
        const params = {};
        paramNames.forEach((name, i) => params[name] = match[i + 1]);
        this.current = hash;
        handler(params);
        return;
      }
    }
    // 404 — default
    this.routes['/']?.({});
  }
};
