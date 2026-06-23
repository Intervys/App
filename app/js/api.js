// ── api.js ── PocketBase client

class API {
  constructor(baseUrl) {
    this.base    = baseUrl;
    this.token   = localStorage.getItem('hg_token') || '';
    this.user    = JSON.parse(localStorage.getItem('hg_user') || 'null');
    this.isAdmin = localStorage.getItem('hg_admin') === '1';
  }

  headers(extra = {}) {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: this.token } : {}),
      ...extra,
    };
  }

  // Vérifie si le token est expiré
  isTokenExpired() {
    if (!this.token) return true;
    try {
      const b64url = this.token.replace('Bearer ', '').split('.')[1];
      const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch { return true; }
  }

  async req(method, path, body = null) {
    // Déconnexion automatique si token expiré
    if (this.token && this.isTokenExpired()) {
      this.logout();
      window.location.hash = this.isAdmin ? '/admin' : '/login';
      throw { message: 'Session expirée, veuillez vous reconnecter.' };
    }
    const opts = { method, headers: this.headers() };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(this.base + path, opts);
    // 204 No Content (DELETE) — pas de body JSON
    if (r.status === 204) return {};
    const data = await r.json();
    if (!r.ok) throw data;
    return data;
  }

  // ── Auth ──
  async loginUser(email, password) {
    const d = await this.req('POST', '/api/collections/users/auth-with-password', { identity: email, password });
    this.token   = d.token;
    this.user    = d.record;
    this.isAdmin = false;
    localStorage.setItem('hg_token', d.token);
    localStorage.setItem('hg_user',  JSON.stringify(d.record));
    localStorage.setItem('hg_admin', '0');
    return d;
  }

  async loginAdmin(email, password) {
    const d = await this.req('POST', '/api/collections/_superusers/auth-with-password', { identity: email, password });
    this.token   = 'Bearer ' + d.token;
    this.user    = d.record || d.admin;
    this.isAdmin = true;
    localStorage.setItem('hg_token', 'Bearer ' + d.token);
    localStorage.setItem('hg_user',  JSON.stringify(d.record || d.admin));
    localStorage.setItem('hg_admin', '1');
    return d;
  }

  async register(email, password, passwordConfirm, name, phone = '') {
    return this.req('POST', '/api/collections/users/records', {
      email, password, passwordConfirm, name, phone,
      emailVisibility: false,
    });
  }

  async verifyOtp(code) {
    return this.req('POST', '/api/verify-otp', { code });
  }

  async resendOtp() {
    return this.req('POST', '/api/resend-otp', {});
  }

  logout() {
    this.token = ''; this.user = null; this.isAdmin = false;
    window._isStaff = false; window._staffSections = [];
    ['hg_token','hg_user','hg_admin','hg_is_staff','hg_staff_sections'].forEach(k => localStorage.removeItem(k));
  }

  get isLoggedIn() { return !!this.token; }
  get adminUser()  { return this.isAdmin ? this.user : null; }

  // ── Interventions ──
  async getInterventions(filter = '', sort = '-created') {
    const q = new URLSearchParams({ sort, perPage: 200 });
    if (filter) q.set('filter', filter);
    return this.req('GET', `/api/collections/interventions/records?${q}`);
  }

  async getIntervention(id) {
    return this.req('GET', `/api/collections/interventions/records/${id}`);
  }

  async createIntervention(data) {
    return this.req('POST', '/api/collections/interventions/records', data);
  }

  async updateIntervention(id, data) {
    return this.req('PATCH', `/api/collections/interventions/records/${id}`, data);
  }

  async deleteIntervention(id) {
    return this.req('DELETE', `/api/collections/interventions/records/${id}`);
  }

  // ── Utilisateurs ──
  async getUsers() {
    return this.req('GET', '/api/collections/users/records?sort=name&perPage=200');
  }

  async getUser(id) {
    return this.req('GET', `/api/collections/users/records/${id}`);
  }

  async updateUser(id, data) {
    return this.req('PATCH', `/api/collections/users/records/${id}`, data);
  }

  // ── Notes ──
  async getNotes(interventionId) {
    const q = new URLSearchParams({ filter: `intervention="${interventionId}"`, sort: 'created' });
    return this.req('GET', `/api/collections/notes/records?${q}`);
  }

  async createNote(data) {
    return this.req('POST', '/api/collections/notes/records', data);
  }

  async deleteNote(id) {
    return this.req('DELETE', `/api/collections/notes/records/${id}`);
  }

  // ── Colis ──
  async getColis(interventionId) {
    const q = new URLSearchParams({ filter: `intervention="${interventionId}"`, sort: 'created' });
    return this.req('GET', `/api/collections/colis/records?${q}`);
  }

  async createColis(data)       { return this.req('POST',   '/api/collections/colis/records', data); }
  async updateColis(id, data)   { return this.req('PATCH',  `/api/collections/colis/records/${id}`, data); }
  async deleteColis(id)         { return this.req('DELETE', `/api/collections/colis/records/${id}`); }

  // ── Messages ──
  async getMessages(interventionId) {
    const q = new URLSearchParams({ filter: `intervention="${interventionId}"`, sort: 'created' });
    return this.req('GET', `/api/collections/messages/records?${q}`);
  }

  async sendMessage(interventionId, content, fromAdmin = false, senderName = '') {
    return this.req('POST', '/api/collections/messages/records', {
      intervention: interventionId, content,
      from_admin: fromAdmin, sender_name: senderName, read: false,
    });
  }

  async markMessagesRead(interventionId) {
    const msgs = await this.getMessages(interventionId);
    const unread = msgs.items.filter(m => !m.read && m.from_admin !== this.isAdmin);
    await Promise.all(unread.map(m =>
      this.req('PATCH', `/api/collections/messages/records/${m.id}`, { read: true })
    ));
  }

  async getUnreadCount() {
    try {
      const filter = encodeURIComponent("read=false && from_admin=false");
      const r = await this.req('GET', `/api/collections/messages/records?filter=${filter}&perPage=1`);
      return r.totalItems || 0;
    } catch { return 0; }
  }

  // ── Access links ──
  async createAccessLink(data)        { return this.req('POST',   '/api/collections/access_links/records', data); }
  async updateAccessLink(id, data)    { return this.req('PATCH',  `/api/collections/access_links/records/${id}`, data); }
  async deleteAccessLink(id)          { return this.req('DELETE', `/api/collections/access_links/records/${id}`); }

  async getAccessLinks() {
    return this.req('GET', '/api/collections/access_links/records?sort=-created&perPage=200');
  }

  async verifyAccessLink(token, password) {
    const q = new URLSearchParams({ filter: `token="${token}" && active=true` });
    const r = await fetch(`${this.base}/api/collections/access_links/records?${q}`);
    const d = await r.json();
    if (!d.items?.length) return null;
    const link = d.items[0];
    const hash = await sha256(password);
    if (hash !== link.password_hash) return null;
    return link;
  }

  // ── Realtime désactivé (incompatible HTTP/2 via NPM) ──
  // Remplacé par polling
  subscribeMessages(interventionId, callback) {
    const t = setInterval(callback, 5000);
    return () => clearInterval(t);
  }
  subscribeIntervention(id, callback) {
    const t = setInterval(callback, 8000);
    return () => clearInterval(t);
  }

  // ── Stats ──
  async getStats() {
    const [all, unread] = await Promise.all([
      this.getInterventions(),
      this.getUnreadCount(),
    ]);
    const items = all.items;
    return {
      total:         items.length,
      nouveau:       items.filter(i => i.status === 'nouveau').length,
      en_cours:      items.filter(i => i.status === 'en_cours').length,
      attente_piece: items.filter(i => i.status === 'attente_piece').length,
      termine:       items.filter(i => i.status === 'termine').length,
      unread_msgs:   unread,
    };
  }
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

const api = new API(PB_URL);

function _applyLogoSize(size) {
  window._logoSize = size;
  let s = document.getElementById('_hg-logo-size');
  if (!s) { s = document.createElement('style'); s.id = '_hg-logo-size'; document.head.appendChild(s); }
  s.textContent = `.sidebar-logo img { height: ${size}px !important; }`;
}

// ── Thème métier appliqué à l'interface admin (palette COMPLÈTE = même ambiance que la vitrine) ──
const ADMIN_THEME_COLORS = {
  default: { // sombre d'origine
    blue:'#1e90ff', blue2:'#00cfff', rgb:'30,144,255',
    bg:'#07090e', bg2:'#0b0f18', bg3:'#0f1520',
    surface:'rgba(11,15,24,.97)', surface2:'rgba(15,21,32,.95)',
    text:'#dde6f0', muted:'#5f7a96', muted2:'#8fa8c0',
    border2:'rgba(255,255,255,.06)', topbar:'rgba(7,9,14,.85)',
  },
  plomberie: { // clair, bleu acier
    blue:'#1a6ea8', blue2:'#3d9bd4', rgb:'26,110,168',
    bg:'#f0f6fd', bg2:'#deeaf8', bg3:'#cddff4',
    surface:'#ffffff', surface2:'#f5f9fe',
    text:'#0e2337', muted:'#5b7a96', muted2:'#3a5978',
    border2:'rgba(14,35,55,.10)', topbar:'rgba(240,246,253,.85)',
  },
  menuiserie: { // clair, bois chaud
    blue:'#7a4f2d', blue2:'#a0703f', rgb:'122,79,45',
    bg:'#fdf8f3', bg2:'#f4ead8', bg3:'#e8d4b8',
    surface:'#ffffff', surface2:'#fdf5ec',
    text:'#2a1a0e', muted:'#8a7260', muted2:'#5e4a38',
    border2:'rgba(42,26,14,.10)', topbar:'rgba(253,248,243,.85)',
  },
  mecanique: { // sombre, orange industriel
    blue:'#e85d04', blue2:'#fb923c', rgb:'232,93,4',
    bg:'#0d0f14', bg2:'#13161f', bg3:'#1a1d27',
    surface:'rgba(26,29,39,.97)', surface2:'rgba(30,34,46,.95)',
    text:'#e8e9ec', muted:'#6a6f80', muted2:'#8a8fa0',
    border2:'rgba(255,255,255,.06)', topbar:'rgba(13,15,20,.85)',
  },
  electricien: { // sombre, ambre/jaune
    blue:'#f59e0b', blue2:'#fbbf24', rgb:'245,158,11',
    bg:'#0a0b08', bg2:'#111209', bg3:'#161710',
    surface:'rgba(22,23,16,.97)', surface2:'rgba(26,28,18,.95)',
    text:'#f0f0e8', muted:'#6a6a55', muted2:'#8a8a70',
    border2:'rgba(255,255,255,.06)', topbar:'rgba(10,11,8,.85)',
  },
  decorateur: { // clair, or champagne
    blue:'#b8902a', blue2:'#d4a843', rgb:'184,144,42',
    bg:'#fdfaf4', bg2:'#f6edd8', bg3:'#eddfc0',
    surface:'#ffffff', surface2:'#fdf7ea',
    text:'#2a1f0a', muted:'#8a7850', muted2:'#5e4e30',
    border2:'rgba(42,31,10,.10)', topbar:'rgba(253,250,244,.85)',
  },
  jardinier: { // clair, vert nature
    blue:'#5a8a3c', blue2:'#86b85f', rgb:'90,138,60',
    bg:'#f5f8f0', bg2:'#e8efde', bg3:'#e0ead2',
    surface:'#ffffff', surface2:'#f3f7ec',
    text:'#23311a', muted:'#8a9a7d', muted2:'#56664a',
    border2:'rgba(35,49,26,.10)', topbar:'rgba(245,248,240,.85)',
  },
};
function _applySiteThemeColors(key) {
  const t = ADMIN_THEME_COLORS[key] || ADMIN_THEME_COLORS.default;
  window._siteTheme = key;
  const r = document.documentElement.style;
  const map = {
    '--blue':t.blue, '--blue2':t.blue2, '--blue-rgb':t.rgb,
    '--bg':t.bg, '--bg2':t.bg2, '--bg3':t.bg3,
    '--surface':t.surface, '--surface2':t.surface2,
    '--text':t.text, '--muted':t.muted, '--muted2':t.muted2,
    '--border2':t.border2, '--topbar-bg':t.topbar,
  };
  for (const [k, v] of Object.entries(map)) if (v) r.setProperty(k, v);
}

function _hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  return m ? (parseInt(m[1],16) + ',' + parseInt(m[2],16) + ',' + parseInt(m[3],16)) : null;
}

// Applique le thème PERSO de l'utilisateur (clé settings `theme`, défini dans l'éditeur Couleurs)
function _applyCustomTheme(vars) {
  window._siteTheme = 'custom';
  window._customThemeVars = vars || {};
  const r = document.documentElement.style;
  for (const [k, v] of Object.entries(vars || {})) r.setProperty(k, v);
  // dériver --blue-rgb depuis le --blue perso pour que tout l'accent suive
  if (vars && vars['--blue']) { const rgb = _hexToRgb(vars['--blue']); if (rgb) r.setProperty('--blue-rgb', rgb); }
}

// Décide quel thème appliquer (un seul) selon le sélecteur hg_site_theme + thème perso éventuel
function _applyTheme(sel) {
  if (sel === 'custom' && window._customThemeVars) {
    _applySiteThemeColors('default');           // repart de la base sombre propre…
    _applyCustomTheme(window._customThemeVars);  // …puis applique les couleurs perso par-dessus
    return;
  }
  if (sel && sel !== 'custom' && ADMIN_THEME_COLORS[sel]) return _applySiteThemeColors(sel);
  // pas de préset sélectionné : restaurer le thème perso s'il existe, sinon défaut
  if (window._customThemeVars) {
    _applySiteThemeColors('default');
    _applyCustomTheme(window._customThemeVars);
    return;
  }
  _applySiteThemeColors('default');
}

// ── Charger logo et services personnalisés depuis PocketBase ──
async function loadCustomSettings() {
  try {
    // Utilise api.req (avec token) si connecté, sinon fetch anonyme
    let d;
    if (api.token) {
      d = await api.req('GET', '/api/collections/settings/records?perPage=50');
    } else {
      const r = await fetch(PB_URL + '/api/collections/settings/records?perPage=50');
      if (!r.ok) return;
      d = await r.json();
    }
    let _siteThemeSel = null;
    for (const item of d.items || []) {
      if (item.key === 'logo_b64' && item.value) {
        window._customLogo = item.value;
        document.querySelectorAll('img[src="/img/logo.png"]').forEach(img => img.src = item.value);
      }
      if (item.key === 'site_name' && item.value) {
        window._customSiteName = item.value;
        document.title = item.value;
      }
      if (item.key === 'theme' && item.value) {
        // Mémorise le thème PERSO sans l'appliquer tout de suite (décision après la boucle)
        try { window._customThemeVars = JSON.parse(item.value); } catch {}
      }
      if (item.key === 'services_labels' && item.value) {
        try {
          const overrides = JSON.parse(item.value);
          if (typeof SERVICE_LABELS !== 'undefined') Object.assign(SERVICE_LABELS, overrides);
        } catch {}
      }
      if (item.key === 'business_settings' && item.value) {
        localStorage.setItem('business_settings', item.value);
        try {
          if (typeof BUSINESS !== 'undefined') Object.assign(BUSINESS, JSON.parse(item.value));
        } catch {}
      }
      if (item.key === 'doc_logo_b64' && item.value) {
        localStorage.setItem('doc_logo_b64', item.value);
      }
      if (item.key === 'signature_b64' && item.value) {
        localStorage.setItem('signature_b64', item.value);
        if (typeof SIGNATURE_B64 !== 'undefined') window.SIGNATURE_B64 = item.value;
      }
      if (item.key === 'hg_logo_size' && item.value) {
        _applyLogoSize(item.value);
      }
      if (item.key === 'hg_site_theme' && item.value) {
        _siteThemeSel = item.value; // appliqué après la boucle
      }
      if (item.key === 'admin_display_name' && item.value) {
        window._adminDisplayName = item.value;
      }
      if (item.key === 'hg_show_title' && item.value) {
        const show = item.value !== 'false';
        document.querySelectorAll('.sidebar-logo span:not(span span)').forEach(el => {
          el.style.display = show ? '' : 'none';
        });
      }
    }
    // Applique UN SEUL thème (préset, perso, ou défaut) — le thème perso reste toujours conservé
    _applyTheme(_siteThemeSel);
    if (typeof applyMetierStatusLabels === 'function') applyMetierStatusLabels(_siteThemeSel);
  } catch {}
}
// Appel initial — promesse exposée pour que adminSettings() puisse l'attendre
window._settingsReady = loadCustomSettings();
