// ── admin.js ── Interface d'administration

// ── LAYOUT ──
function renderAdminLayout(pageTitle, contentHtml) {
  const isStaff = !!window._isStaff;
  const canSee  = s => !isStaff || (window._staffSections||[]).includes(s);
  const adminDisplayName = (()=>{
    const n = window._adminDisplayName || (api.adminUser?.email||'').split('@')[0];
    return n ? n.charAt(0).toUpperCase()+n.slice(1) : (isStaff ? (api.user?.name||'Collaborateur') : 'Admin');
  })();
  const adminAvatar = adminDisplayName.slice(0,2).toUpperCase();
  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <a class="sidebar-logo" href="#" onclick="Router.navigate('/admin')">
          <img src="/img/logo.png" alt="Intervys">
          <span>${(window._customSiteName||SITE_NAME)}</span>
        </a>
        <nav class="sidebar-nav">
          <div class="sidebar-section">Tableau de bord</div>
          <a class="sidebar-link ${pageTitle==='Dashboard'?'active':''}" onclick="closeSidebar();Router.navigate('/admin')">${ico('grid')} Dashboard</a>
          ${(canSee('interventions') || canSee('archives')) ? `
          <div class="sidebar-section">Interventions</div>
          ${canSee('interventions') ? `
          <a class="sidebar-link ${pageTitle==='Interventions'?'active':''}" onclick="closeSidebar();Router.navigate('/admin/interventions')">${ico('tool')} Toutes les demandes</a>
          <a class="sidebar-link ${pageTitle==='Nouvelle intervention'?'active':''}" onclick="closeSidebar();Router.navigate('/admin/interventions/new')">${ico('plus')} Nouvelle intervention</a>
          ` : ''}
          ${(canSee('interventions') || canSee('archives')) ? `
          <a class="sidebar-link ${pageTitle==='Archives'?'active':''}" onclick="closeSidebar();Router.navigate('/admin/archives')">${ico('archive')} Archives</a>
          ` : ''}
          ` : ''}
          ${(canSee('clients') || canSee('links')) ? `
          <div class="sidebar-section">Clients</div>
          ${canSee('clients') ? `
          <a class="sidebar-link ${pageTitle==='Clients'?'active':''}" onclick="closeSidebar();Router.navigate('/admin/clients')">${ico('users')} Comptes clients</a>
          ` : ''}
          ${(canSee('clients') || canSee('links')) ? `
          <a class="sidebar-link ${pageTitle==='Liens'?'active':''}" onclick="closeSidebar();Router.navigate('/admin/links')">${ico('link')} Liens d'accès</a>
          ` : ''}
          ` : ''}
          ${(canSee('billing') || canSee('quotes')) ? `
          <div class="sidebar-section">Facturation</div>
          ${canSee('billing') ? `
          <a class="sidebar-link ${pageTitle==='Facturation'?'active':''}" onclick="closeSidebar();billingDashboard()">${ico('dollar')} Tableau de bord</a>
          ` : ''}
          <a class="sidebar-link ${pageTitle==='Devis'?'active':''}" onclick="closeSidebar();quotesList()">${ico('doc')} Devis</a>
          ${canSee('billing') ? `
          <a class="sidebar-link ${pageTitle==='Factures'?'active':''}" onclick="closeSidebar();invoicesList()">${ico('receipt')} Factures</a>
          <a class="sidebar-link ${pageTitle==='Catalogue'?'active':''}" onclick="closeSidebar();productsList()">${ico('grid')} Catalogue</a>
          <a class="sidebar-link ${pageTitle==='Paramètres PA'?'active':''}" onclick="closeSidebar();paSettings()">${ico('courthouse')} Plateforme Agréée</a>
          ` : ''}
          ` : ''}
          ${canSee('messages') ? `
          <div class="sidebar-section">Communication</div>
          <a class="sidebar-link ${pageTitle==='Messages'?'active':''}" onclick="closeSidebar();Router.navigate('/admin/messages')">${ico('msg')} Messages</a>
          ` : ''}
          ${(!isStaff || canSee('settings')) ? `
          <div class="sidebar-section">Administration</div>
          <a class="sidebar-link ${pageTitle==='Paramètres'?'active':''}" onclick="closeSidebar();adminSettings()">${ico('settings')} Paramètres</a>
          ` : ''}
        </nav>
        <div class="sidebar-footer">
          <div style="display:flex;align-items:center;gap:.6rem;padding:.5rem .25rem">
            <div class="sidebar-avatar" style="flex-shrink:0">${adminAvatar}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${adminDisplayName}</div>
              <div style="font-size:.7rem;color:var(--muted)">${isStaff ? 'Collaborateur' : 'Administrateur'}</div>
            </div>
            ${(!isStaff || canSee('settings')) ? `<button onclick="closeSidebar();adminSettings()" title="Paramètres"
              style="flex-shrink:0;background:none;border:1px solid var(--border2);border-radius:4px;color:var(--muted2);cursor:pointer;padding:6px 9px;display:flex;align-items:center;transition:color .2s,border-color .2s"
              onmouseover="this.style.color='var(--blue)';this.style.borderColor='var(--blue)'"
              onmouseout="this.style.color='var(--muted2)';this.style.borderColor='var(--border2)'"
            ><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>` : ''}
            <button onclick="doLogout()" title="Déconnexion"
              style="flex-shrink:0;background:none;border:1px solid var(--border2);border-radius:4px;color:var(--muted2);cursor:pointer;padding:6px 9px;display:flex;align-items:center;transition:color .2s,border-color .2s"
              onmouseover="this.style.color='var(--red)';this.style.borderColor='var(--red)'"
              onmouseout="this.style.color='var(--muted2)';this.style.borderColor='var(--border2)'"
            ><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>
          </div>
        </div>
      </aside>
      <div id="sidebar-overlay" class="sidebar-overlay" onclick="toggleMobileMenu()"></div>
      <div class="main-content">
        <header class="topbar">
          <button class="btn-icon" onclick="toggleMobileMenu()" style="flex-shrink:0">☰</button>
          <h1 class="topbar-title">${pageTitle}</h1>
          <div style="flex:1;max-width:360px;margin:0 1rem;position:relative">
            <div style="position:absolute;left:.6rem;top:50%;transform:translateY(-50%);color:var(--muted2);pointer-events:none;display:flex;width:16px;height:16px">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input id="global-search" class="form-control" style="height:32px;font-size:.82rem;padding:0 .75rem 0 2rem"
              placeholder="Rechercher interventions, devis, factures..."
              oninput="globalSearch(this.value)"
              onfocus="if(this.value.length>=2)document.getElementById('global-results').style.display='block'"
              onblur="setTimeout(()=>document.getElementById('global-results').style.display='none',200)">
            <div id="global-results" style="display:none;position:absolute;top:38px;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);z-index:200;max-height:400px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.4)"></div>
          </div>
          <div style="display:flex;gap:.75rem;margin-left:auto;align-items:center;padding-right:.5rem">
            <button onclick="closeSidebar();Router.navigate('/admin/messages')" title="Messages"
              style="background:none;border:none;cursor:pointer;color:var(--muted2);padding:4px;display:flex;align-items:center;position:relative;transition:color .2s"
              onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--muted2)'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span id="topbar-unread" style="display:none;position:absolute;top:0;right:0;width:8px;height:8px;background:var(--red);border-radius:50%"></span>
            </button>
            <button id="notif-btn" title="Notifications" onclick="toggleNotifPanel()"
              style="background:none;border:none;cursor:pointer;color:var(--muted2);padding:4px;display:flex;align-items:center;position:relative;transition:color .2s"
              onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--muted2)'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span id="topbar-notif-badge" style="display:none;position:absolute;top:0;right:0;min-width:16px;height:16px;background:var(--red);border-radius:8px;font-size:10px;color:#fff;font-weight:700;align-items:center;justify-content:center;padding:0 3px">0</span>
            </button>
          </div>

        </header>
        <main class="page-content" id="page-content">${contentHtml}</main>
      </div>
    </div>
    <div id="toast-container"></div>
  `;
  updateUnreadBadge();
  if (window._logoSize) document.querySelectorAll('.sidebar-logo img').forEach(img => img.style.height = window._logoSize + 'px');
  if (window._customLogo) {
    document.querySelectorAll('.sidebar-logo img').forEach(img => img.src = window._customLogo);
  }
  if (window._customSiteName) {
    const n = window._customSiteName;
    document.querySelectorAll('.sidebar-logo > span').forEach(el => {
      const parts = n.match(/^(.*?)(\w+)$/);
      el.innerHTML = parts ? parts[1] + '<span style="color:var(--blue)">' + parts[2] + '</span>' : n;
    });
  }
  // Bannière modifications non sauvegardées
  if (sessionStorage.getItem('hg_unsaved_theme')) {
    applyUnsavedTheme();
    showUnsavedBanner();
  }
}

// ── Filtres rapides depuis les tuiles dashboard ──
function filterByStatus(status) {
  history.replaceState(null, '', '#/admin/interventions');
  adminInterventions(status ? 'status="' + status + '"' : '');
}

async function toggleNotifPanel() {
  // Fermer si déjà ouvert
  const existing = document.getElementById('notif-panel');
  if (existing) { existing.remove(); return; }

  // Créer le panneau
  const panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.style.cssText = 'position:fixed;top:56px;right:12px;width:340px;max-height:480px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden';
  const header = document.createElement('div');
  header.style.cssText = 'padding:.75rem 1rem;border-bottom:1px solid var(--border2);font-family:var(--FM);font-size:.72rem;color:var(--muted2);letter-spacing:.1em;text-transform:uppercase;display:flex;justify-content:space-between;align-items:center';
  header.innerHTML = '<span>Notifications</span>';
  const closeX = document.createElement('span');
  closeX.textContent = '×';
  closeX.style.cssText = 'cursor:pointer;color:var(--muted);font-size:1rem';
  closeX.onclick = () => panel.remove();
  header.appendChild(closeX);
  const listEl = document.createElement('div');
  listEl.id = 'notif-list';
  listEl.style.cssText = 'overflow-y:auto;flex:1';
  listEl.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--muted)">Chargement...</div>';
  const footer = document.createElement('div');
  footer.style.cssText = 'padding:.6rem 1rem;border-top:1px solid var(--border2);display:flex;gap:.5rem';
  const markBtn = document.createElement('button');
  markBtn.className = 'btn btn-ghost btn-sm';
  markBtn.textContent = 'Tout marquer lu';
  markBtn.onclick = () => { localStorage.setItem('hg_notif_seen', Date.now()); updateTopbarBadges(); panel.remove(); };
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-ghost btn-sm';
  closeBtn.textContent = 'Fermer';
  closeBtn.onclick = () => panel.remove();
  footer.appendChild(markBtn);
  footer.appendChild(closeBtn);
  panel.appendChild(header);
  panel.appendChild(listEl);
  panel.appendChild(footer);
  document.body.appendChild(panel);

  // Fermer si clic extérieur
  setTimeout(() => document.addEventListener('click', function handler(e) {
    if (!panel.contains(e.target) && e.target.id !== 'notif-btn') {
      panel.remove(); document.removeEventListener('click', handler);
    }
  }), 100);

  // Charger les nouveautés depuis la dernière consultation
  try {
    const seenAt = parseInt(localStorage.getItem('hg_notif_seen') || '0');
    const seenDate = seenAt ? new Date(seenAt).toISOString().replace('T',' ').slice(0,19) : null;

    const [interventions, messages] = await Promise.all([
      api.req('GET', '/api/collections/interventions/records?filter=' + encodeURIComponent("status='nouveau'" + (seenDate ? " && created>'"+seenDate+"'" : '')) + '&sort=-created&perPage=10'),
      api.req('GET', '/api/collections/messages/records?filter=' + encodeURIComponent("from_admin=false && read=false") + '&sort=-created&perPage=10'),
    ]);

    const list = document.getElementById('notif-list');
    let html = '';

    if (interventions.items.length) {
      html += interventions.items.map(i => `
        <div onclick="document.getElementById('notif-panel').remove();Router.navigate('/admin/intervention/${i.id}')" style="padding:.75rem 1rem;border-bottom:1px solid var(--border2);cursor:pointer;display:flex;gap:.75rem;align-items:flex-start" onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
          <div style="color:var(--blue);margin-top:2px;flex-shrink:0">${ico('tool')}</div>
          <div>
            <div style="font-weight:600;font-size:.88rem">${i.title}</div>
            <div style="font-size:.75rem;color:var(--muted2)">Nouvelle intervention · ${timeAgo(i.created)}</div>
          </div>
        </div>`).join('');
    }

    if (messages.items.length) {
      html += messages.items.map(m => `
        <div onclick="document.getElementById('notif-panel').remove();Router.navigate('/admin/intervention/${m.intervention}')" style="padding:.75rem 1rem;border-bottom:1px solid var(--border2);cursor:pointer;display:flex;gap:.75rem;align-items:flex-start" onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
          <div style="color:var(--green);margin-top:2px;flex-shrink:0">${ico('msg')}</div>
          <div>
            <div style="font-weight:600;font-size:.88rem">${m.sender_name||'Client'}</div>
            <div style="font-size:.75rem;color:var(--muted2)">${(m.content||'').slice(0,60)}${m.content?.length>60?'…':''}</div>
            <div style="font-size:.72rem;color:var(--muted)">${timeAgo(m.created)}</div>
          </div>
        </div>`).join('');
    }

    list.innerHTML = html || '<div style="padding:1.5rem;text-align:center;color:var(--muted);font-size:.88rem">Aucune nouvelle notification</div>';

    // Marquer comme vu
    localStorage.setItem('hg_notif_seen', Date.now());
    const badge = document.getElementById('topbar-notif-badge');
    if (badge) badge.style.display = 'none';

  } catch(e) {
    document.getElementById('notif-list').innerHTML = '<div style="padding:1rem;color:var(--muted)">Erreur chargement</div>';
  }
}

function updateTopbarBadges() {
  const seenAt = parseInt(localStorage.getItem('hg_notif_seen') || '0');
  const seenDate = seenAt ? new Date(seenAt).toISOString().replace('T',' ').slice(0,19) : null;

  // Unread messages
  api.req('GET', '/api/collections/messages/records?filter=' + encodeURIComponent("from_admin=false && read=false") + '&perPage=1')
    .then(r => {
      const el = document.getElementById('topbar-unread');
      if (el) el.style.display = r.totalItems > 0 ? 'block' : 'none';
    }).catch(()=>{});

  // Nouvelles interventions depuis dernière consultation
  const filter = "status='nouveau'" + (seenDate ? " && created>'" + seenDate + "'" : '');
  api.req('GET', '/api/collections/interventions/records?filter=' + encodeURIComponent(filter) + '&perPage=1')
    .then(r => {
      const el = document.getElementById('topbar-notif-badge');
      // Aussi compter les messages non lus
      api.req('GET', '/api/collections/messages/records?filter=' + encodeURIComponent("from_admin=false && read=false") + '&perPage=1')
        .then(rm => {
          const total = (r.totalItems || 0) + (rm.totalItems || 0);
          if (el && total > 0) {
            el.style.display = 'flex';
            el.textContent = total;
          } else if (el) { el.style.display = 'none'; }
        }).catch(()=>{});
    }).catch(()=>{});
}

// ── DASHBOARD ──
const _DASH_TILES = [
  { id:'total',         statusKey:null,            label:'Total',       sub:'interventions', cls:'',       click:"filterByStatus('')",                 icon:'📋' },
  { id:'nouveau',       statusKey:'nouveau',       label:'Nouvelles',   sub:'',              cls:'danger', click:"filterByStatus('nouveau')",           icon:'🔔' },
  { id:'en_cours',      statusKey:'en_cours',      label:'En cours',    sub:'',              cls:'',       click:"filterByStatus('en_cours')",          icon:'⚙️' },
  { id:'attente_piece', statusKey:'attente_piece', label:'Attente',     sub:'',              cls:'warn',   click:"filterByStatus('attente_piece')",     icon:'🔧' },
  { id:'termine',       statusKey:'termine',       label:'Terminées',   sub:'',              cls:'success',click:"filterByStatus('termine')",           icon:'✓'  },
  { id:'ca',            statusKey:null,            label:'CA ce mois',  sub:'',              cls:'success',click:"billingDashboard()",                  icon:'💶' },
  { id:'messages',      statusKey:null,            label:'Messages',    sub:'non lus',       cls:'warn',   click:"Router.navigate('/admin/messages')",  icon:'💬' },
];

function _tileLabel(t) {
  return t.statusKey ? (STATUS_LABELS[t.statusKey]?.label || t.label) : t.label;
}

function _getDashTilePrefs() {
  try { return JSON.parse(localStorage.getItem('hg_dash_tiles') || 'null') || _DASH_TILES.map(t => t.id); }
  catch { return _DASH_TILES.map(t => t.id); }
}

function toggleDashConfig() {
  const el = document.getElementById('dash-config');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function saveDashConfig() {
  const ids = [...document.querySelectorAll('input[name="dash-tile"]:checked')].map(c => c.value);
  localStorage.setItem('hg_dash_tiles', JSON.stringify(ids));
  adminDashboard();
}

async function adminDashboard() {
  if (!requireAdmin()) return;
  renderAdminLayout('Dashboard', '<div class="spinner"></div>');
  try {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01 00:00:00`;
    const [stats, recent, caData, linksData2] = await Promise.all([
      api.getStats(),
      api.getInterventions("status!='archive'", '-updated'),
      api.req('GET', '/api/collections/invoices/records?filter=' + encodeURIComponent(`status='paye'&&created>='${monthStart}'`) + '&perPage=500&fields=total').catch(() => ({items:[]})),
      api.req('GET', '/api/collections/access_links/records?perPage=200&fields=id,client_name,client_email,intervention').catch(() => ({ items: [] })),
    ]);
    window._linksMap = window._linksMap || {};
    linksData2.items.forEach(l => { if(l.intervention) window._linksMap[l.intervention] = l; });

    const ca = caData.items.reduce((s, i) => s + (i.total || 0), 0);
    const tileValues = {
      total: stats.total, nouveau: stats.nouveau, en_cours: stats.en_cours,
      attente_piece: stats.attente_piece, termine: stats.termine,
      ca: (typeof formatEur === 'function' ? formatEur(ca) : ca.toFixed(2) + ' €'),
      messages: stats.unread_msgs,
    };
    const enabledIds = _getDashTilePrefs();
    const visibleTiles = _DASH_TILES.filter(t => enabledIds.includes(t.id));

    document.getElementById('page-content').innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:.6rem">
        <button class="btn btn-ghost btn-sm" onclick="toggleDashConfig()" style="font-size:.78rem;gap:.4rem">
          ${ico('settings')} Tuiles
        </button>
      </div>
      <div id="dash-config" style="display:none;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:1rem;margin-bottom:1rem">
        <div style="font-size:.8rem;font-weight:600;color:var(--muted2);margin-bottom:.65rem">Tuiles affichées sur le dashboard</div>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem">
          ${_DASH_TILES.map(t => `<label style="display:flex;align-items:center;gap:.4rem;font-size:.82rem;cursor:pointer;padding:.35rem .7rem;background:var(--bg2);border:1px solid var(--border2);border-radius:20px">
            <input type="checkbox" name="dash-tile" value="${t.id}" ${enabledIds.includes(t.id)?'checked':''} style="accent-color:var(--blue)"> ${t.icon} ${_tileLabel(t)}
          </label>`).join('')}
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveDashConfig()">Appliquer</button>
      </div>
      <div class="stats-grid">
        ${visibleTiles.map(t => `<div class="stat-card ${t.cls}" style="cursor:pointer" onclick="${t.click}">
          <div class="stat-card-num"${t.id==='ca'?' style="font-size:1.35rem"':''}>${tileValues[t.id]}</div>
          <div class="stat-card-label">${_tileLabel(t)}${t.sub ? ' <span style="color:var(--muted2);font-size:.78em">'+t.sub+'</span>' : ''}</div>
        </div>`).join('')}
      </div>
      <div class="card card-table">
        <div class="card-header">
          <span class="card-title">Interventions récentes</span>
          <a class="btn btn-ghost btn-sm" onclick="closeSidebar();Router.navigate('/admin/interventions')">Tout voir →</a>
        </div>
        ${interventionTable(recent.items.slice(0, 10))}
      </div>`;
    loadDocsCounts(recent.items.slice(0, 10));
    updateTopbarBadges();
  } catch(e) { console.error(e); toast('Erreur dashboard', 'error'); }
}

async function loadDocsCounts(items) {
  for (const inv of items) {
    const qEl = document.getElementById('quotes-count-' + inv.id);
    const fEl = document.getElementById('invoices-count-' + inv.id);
    const aEl = document.getElementById('actions-btns-' + inv.id);
    if (!qEl && !fEl && !aEl) continue;
    try {
      const fp = encodeURIComponent("intervention='" + inv.id + "'");
      const [q, f] = await Promise.all([
        api.req('GET', '/api/collections/quotes/records?filter=' + fp + '&perPage=5&fields=id,number,status'),
        api.req('GET', '/api/collections/invoices/records?filter=' + fp + '&perPage=5&fields=id,number,status'),
      ]);
      const QCOLORS = { brouillon:'var(--muted)', envoye:'var(--blue)', accepte:'var(--green)', refuse:'var(--red)' };
      const FCOLORS = { brouillon:'var(--muted)', envoye:'var(--blue)', paye:'var(--green)', annule:'var(--red)' };
      if (qEl) {
        if (q.items.length) {
          const last = q.items[q.items.length - 1];
          qEl.innerHTML = `<span style="color:${QCOLORS[last.status]||'var(--blue)'};cursor:pointer;display:inline-flex;width:18px;height:18px" title="${last.number} (${last.status})" onclick="event.stopPropagation();viewQuote('${last.id}')">${ico('doc')}</span>`;
        } else qEl.innerHTML = '<span style="color:var(--border2)">—</span>';
      }
      if (fEl) {
        if (f.items.length) {
          const last = f.items[f.items.length - 1];
          fEl.innerHTML = `<span style="color:${FCOLORS[last.status]||'var(--green)'};cursor:pointer;display:inline-flex;width:18px;height:18px" title="${last.number} (${last.status})" onclick="event.stopPropagation();viewInvoice('${last.id}')">${ico('receipt')}</span>`;
        } else fEl.innerHTML = '<span style="color:var(--border2)">—</span>';
      }
      if (aEl) {
        aEl.style.cssText = 'display:inline-flex;gap:6px;align-items:center;justify-content:center';
        const isArchivedItem = inv.status === 'archive';
        aEl.innerHTML = isArchivedItem
          ? `<button class="btn btn-sm" style="color:var(--blue);background:none;border:none;display:inline-flex;padding:4px" title="Désarchiver" onclick="event.stopPropagation();unarchiveIntervention('${inv.id}')">${ico('archive')}</button>`
          : `<button class="btn btn-sm" style="color:var(--blue);background:none;border:none;display:inline-flex;padding:4px" title="Modifier" onclick="event.stopPropagation();editInterventionModal('${inv.id}')">${ico('edit')}</button><button class="btn btn-sm" style="color:var(--red);background:none;border:1px solid transparent;border-radius:4px;opacity:.7;display:inline-flex;padding:4px" title="Supprimer" onmouseover="this.style.opacity=1;this.style.borderColor='var(--red)'" onmouseout="this.style.opacity=.7;this.style.borderColor='transparent'" onclick="event.stopPropagation();deleteIntervention('${inv.id}')">${ico('trash')}</button>`;
      }
    } catch(e) { console.warn('loadDocsCounts', e); }
  }
}


// ── PARAMÈTRES PLATEFORME AGRÉÉE (AFNOR XP Z12-013) ──
// ── Paramètres généraux ──
async function adminSettings() {
  if (!requireAdmin()) return;
  renderAdminLayout('Paramètres', '<div class="spinner"></div>');

  // Recharger les settings depuis PocketBase (garantit que BUSINESS est à jour, même sur nouveau PC)
  await loadCustomSettings();

  const pc = document.getElementById('page-content');

  pc.innerHTML = `
    <div style="max-width:720px">

      <!-- Onglets -->
      <div style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:1.5rem">
        ${['Identité','Services','Email','Facturation','Compte','Mon site 🌐','Mises à jour 🔄'].map((t,i) => `
          <button onclick="showSettingsTab(${i})" id="stab-${i}"
            style="padding:.6rem 1.25rem;background:none;border:none;border-bottom:2px solid ${i===0?'var(--blue)':'transparent'};color:${i===0?'var(--blue)':'var(--muted2)'};cursor:pointer;font-size:.85rem;transition:all .2s;white-space:nowrap"
            onmouseover="if(this.style.borderBottomColor!=='var(--blue)')this.style.color='var(--text)'"
            onmouseout="if(this.style.borderBottomColor!=='var(--blue)')this.style.color='var(--muted2)'">${t}</button>`).join('')}
      </div>

      <!-- Tab 0 : Identité -->
      <div id="stab-content-0">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header"><span class="card-title">Identité</span></div>
          <div style="padding:1.5rem">
            <div class="form-row">
              <div class="form-group">
                <label>Nom du site</label>
                <input class="form-control" id="s-sitename" value="${typeof (window._customSiteName||SITE_NAME) !== 'undefined' ? (window._customSiteName||SITE_NAME) : (window._customSiteName||SITE_NAME)}">
              </div>
              <div class="form-group">
                <label>Nom dans la sidebar</label>
                <div style="display:flex;align-items:center;gap:.75rem;height:38px;margin-top:.15rem">
                  <label style="display:flex;align-items:center;gap:.6rem;cursor:pointer;padding:.5rem .75rem;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);flex:1">
                    <input type="checkbox" id="s-show-title" ${localStorage.getItem('hg_show_title')==='false'?'':'checked'}
                      style="width:16px;height:16px;accent-color:var(--blue);flex-shrink:0" onchange="toggleSidebarTitle(this.checked)">
                    <span style="font-size:.85rem;color:var(--muted2)">Afficher à côté du logo</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Logo</label>
              <div style="display:flex;align-items:center;gap:1.5rem;padding:.75rem;background:var(--bg2);border-radius:var(--r);margin-bottom:.75rem">
                <img id="logo-preview-settings" src="${window._customLogo||'/img/logo.png'}" style="height:56px;object-fit:contain">
                <div style="flex:1">
                  <div style="font-size:.82rem;color:var(--muted2);margin-bottom:.5rem">PNG ou SVG recommandé, fond transparent</div>
                  <label style="cursor:pointer">
                    <input type="file" id="logo-upload-input" accept="image/*" style="display:none" onchange="previewLogoSettings(this)">
                    <span class="btn btn-ghost btn-sm">📁 Choisir un fichier</span>
                  </label>
                </div>
                <button class="btn btn-primary btn-sm" onclick="uploadLogoSettings()">Uploader</button>
              </div>
              <div id="logo-upload-progress" style="display:none">
                <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
                  <div id="logo-upload-bar" style="height:100%;background:var(--blue);width:0%;transition:width .3s"></div>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label style="display:flex;justify-content:space-between">
                Taille du logo dans la sidebar
                <span id="logo-size-val" style="color:var(--blue);font-family:var(--FM);font-size:.8rem">${localStorage.getItem('hg_logo_size')||'36'}px</span>
              </label>
              <input type="range" id="logo-size-slider" min="20" max="64" value="${localStorage.getItem('hg_logo_size')||'36'}"
                style="width:100%;accent-color:var(--blue);cursor:pointer"
                oninput="previewLogoSize(this.value)">
              <div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--muted);margin-top:.25rem">
                <span>Petit (20px)</span><span>Grand (64px)</span>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:.5rem">
              <button class="btn btn-ghost btn-sm" onclick="testIdentitySettings()">Tester</button>
              <button class="btn btn-primary btn-sm" onclick="saveIdentitySettings()">Enregistrer</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Thème & Couleurs</span></div>
          <div style="padding:1.5rem">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
              ${[
                ['--blue',    'Couleur principale', '#1e90ff'],
                ['--blue2',   'Couleur secondaire', '#00cfff'],
                ['--bg',      'Fond général',       '#07090e'],
                ['--bg2',     'Fond alternatif',    '#0b0f18'],
                ['--surface', 'Fond des cartes',    '#0f1520'],
                ['--text',    'Texte principal',    '#dde6f0'],
                ['--muted2',  'Texte secondaire',   '#8fa8c0'],
                ['--green',   'Couleur succès',     '#22c55e'],
                ['--red',     'Couleur danger',     '#ef4444'],
                ['--orange',  'Couleur warning',    '#f97316'],
              ].map(([v, label, def]) => {
                const cur = getComputedStyle(document.documentElement).getPropertyValue(v).trim() || def;
                return `
              <div class="form-group" style="margin:0">
                <label style="display:flex;align-items:center;justify-content:space-between">
                  ${label}
                  <code style="font-size:.65rem;color:var(--muted)">${v}</code>
                </label>
                <div style="display:flex;gap:.5rem;align-items:center">
                  <input type="color" id="theme${v.replace(/--/g,'').replace(/-/g,'_')}_pick" value="${cur}"
                    oninput="syncThemeColor('${v}',this.value)"
                    style="width:38px;height:34px;border-radius:4px;border:1px solid var(--border);background:none;cursor:pointer;padding:2px;flex-shrink:0">
                  <input class="form-control" id="theme${v.replace(/--/g,'').replace(/-/g,'_')}" value="${cur}" style="font-family:var(--FM);font-size:.8rem"
                    oninput="syncThemeColorText('${v}',this.value)">
                </div>
              </div>`;}).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem">
              <button class="btn btn-ghost btn-sm" onclick="resetTheme()">Réinitialiser</button>
              <div style="display:flex;gap:.5rem">
                <button class="btn btn-ghost btn-sm" onclick="testThemeSettings()">Tester</button>
                <button class="btn btn-primary btn-sm" onclick="saveThemeSettings()">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 1 : Identité (Logo) -->
      <div id="stab-content-1" style="display:none">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Types d'interventions</span>
            <button class="btn btn-primary btn-sm" onclick="addServiceModal()">+ Ajouter</button>
          </div>
          <div style="padding:1.5rem" id="services-list">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <!-- Tab 2 : Email / SMTP -->
      <div id="stab-content-2" style="display:none">
        <div class="card">
          <div class="card-header"><span class="card-title">Configuration SMTP</span></div>
          <div style="padding:1.5rem" id="smtp-form-wrap">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <!-- Tab 3 : Facturation -->
      <div id="stab-content-3" style="display:none">
        <div class="card">
          <div class="card-header"><span class="card-title">Informations de facturation</span></div>
          <div style="padding:1.5rem">
            <div class="form-row">
              <div class="form-group">
                <label>Nom commercial</label>
                <input class="form-control" id="b-name" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.name : ''}">
              </div>
              <div class="form-group">
                <label>Dénomination légale</label>
                <input class="form-control" id="b-legal" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.legal : ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Adresse</label>
                <input class="form-control" id="b-address" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.address : ''}">
              </div>
              <div class="form-group">
                <label>Ville</label>
                <input class="form-control" id="b-city" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.city : ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email</label>
                <input class="form-control" id="b-email" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.email : ''}">
              </div>
              <div class="form-group">
                <label>Téléphone</label>
                <input class="form-control" id="b-phone" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.phone : ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>SIRET</label>
                <input class="form-control" id="b-siret" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.siret : ''}">
              </div>
              <div class="form-group">
                <label>N° TVA</label>
                <input class="form-control" id="b-tva-num" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.tva_num : ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>IBAN</label>
                <input class="form-control" id="b-iban" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.iban : ''}">
              </div>
              <div class="form-group">
                <label>BIC</label>
                <input class="form-control" id="b-bic" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.bic : ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>RCS</label>
                <input class="form-control" id="b-rcs" placeholder="ex: RCS Rennes B 123 456 789" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.rcs : ''}">
              </div>
              <div class="form-group">
                <label>Site web</label>
                <input class="form-control" id="b-website" placeholder="ex: www.homegeek.fr" value="${typeof BUSINESS !== 'undefined' ? BUSINESS.website : ''}">
              </div>
            </div>
            <div class="form-group">
              <label>Régime TVA</label>
              <select class="form-control" id="b-tva">
                <option value="franchise" ${typeof BUSINESS !== 'undefined' && BUSINESS.tva==='franchise'?'selected':''}>Franchise en base (Art. 293B)</option>
                <option value="20" ${typeof BUSINESS !== 'undefined' && BUSINESS.tva==='20'?'selected':''}>TVA 20%</option>
                <option value="10" ${typeof BUSINESS !== 'undefined' && BUSINESS.tva==='10'?'selected':''}>TVA 10%</option>
              </select>
            </div>
            <div class="form-group" style="margin-top:.75rem">
              <label>Logo pour les documents (fond blanc)</label>
              <div style="font-size:.78rem;color:var(--muted2);margin-bottom:.4rem">Version sombre du logo, lisible sur fond blanc (devis/factures/PDF)</div>
              <div style="display:flex;align-items:center;gap:1rem">
                <div style="border:1px solid #ccc;border-radius:4px;height:60px;width:160px;display:flex;align-items:center;justify-content:center;background:#fff">
                  <img id="doc-logo-preview" src="${localStorage.getItem('doc_logo_b64')||''}" style="max-height:52px;max-width:148px;object-fit:contain;${localStorage.getItem('doc_logo_b64')?'':'display:none'}">
                  <span id="doc-logo-placeholder" style="${localStorage.getItem('doc_logo_b64')?'display:none':'font-size:.72rem;color:#bbb'}">aucun</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:.4rem">
                  <input type="file" id="doc-logo-file" accept="image/*" style="display:none" onchange="previewDocLogo(this)">
                  <button class="btn btn-ghost btn-sm" onclick="document.getElementById('doc-logo-file').click()">Choisir…</button>
                  <button id="doc-logo-del" class="btn btn-ghost btn-sm" style="color:var(--red);${localStorage.getItem('doc_logo_b64')?'':'display:none'}" onclick="clearDocLogo()">Supprimer</button>
                </div>
              </div>
            </div>
            <div class="form-group" style="margin-top:.75rem">
              <label>Signature (image PNG/JPG)</label>
              <div style="display:flex;align-items:center;gap:1rem;margin-top:.25rem">
                <div style="border:1px solid #ccc;border-radius:4px;height:60px;width:160px;display:flex;align-items:center;justify-content:center;background:#fafafa">
                  <img id="sig-preview" src="${localStorage.getItem('signature_b64')||''}" style="max-height:52px;max-width:148px;object-fit:contain;${localStorage.getItem('signature_b64')?'':'display:none'}">
                  <span id="sig-placeholder" style="${localStorage.getItem('signature_b64')?'display:none':'font-size:.72rem;color:#bbb'}">aucune</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:.4rem">
                  <input type="file" id="sig-file" accept="image/*" style="display:none" onchange="previewSignature(this)">
                  <button class="btn btn-ghost btn-sm" onclick="document.getElementById('sig-file').click()">Choisir…</button>
                  <button id="sig-del" class="btn btn-ghost btn-sm" style="color:var(--red);${localStorage.getItem('signature_b64')?'':'display:none'}" onclick="clearSignature()">Supprimer</button>
                </div>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:1rem">
              <button class="btn btn-primary btn-sm" onclick="saveBillingSettings()">Enregistrer</button>
            </div>
            <div style="margin-top:.75rem;padding:.75rem 1rem;background:rgba(30,144,255,.06);border:1px solid rgba(30,144,255,.15);border-radius:var(--r);font-size:.8rem;color:var(--muted2)">
              💡 Ces modifications s'appliquent aux nouveaux documents. Les devis/factures existants ne sont pas affectés.
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 4 : Compte -->
      <div id="stab-content-4" style="display:none">

        <!-- Profil administrateur -->
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <span class="card-title">👤 Profil administrateur</span>
          </div>
          <div style="padding:1.5rem">
            <div class="form-row">
              <div class="form-group">
                <label>Nom affiché</label>
                <input class="form-control" id="s-admin-name" placeholder="Votre prénom ou nom">
              </div>
              <div class="form-group">
                <label>Email de connexion</label>
                <input class="form-control" id="s-admin-email" type="email" placeholder="admin@example.com">
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:.5rem">
              <button class="btn btn-primary btn-sm" onclick="saveAdminProfile()">Enregistrer le profil</button>
            </div>
            <hr style="border:none;border-top:1px solid var(--border);margin:1.25rem 0">
            <div style="font-size:.82rem;font-weight:600;color:var(--muted2);margin-bottom:.75rem">Changer le mot de passe</div>
            <div class="form-row">
              <div class="form-group">
                <label>Nouveau mot de passe</label>
                <input class="form-control" type="password" id="s-pwd1" placeholder="8 caractères minimum">
              </div>
              <div class="form-group">
                <label>Confirmer</label>
                <input class="form-control" type="password" id="s-pwd2" placeholder="••••••••">
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end">
              <button class="btn btn-ghost btn-sm" onclick="saveAdminPassword()">Changer le mot de passe</button>
            </div>
          </div>
        </div>

        <!-- Équipe -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">👥 Équipe</span>
            <span style="font-size:.75rem;color:var(--muted2)">Collaborateurs avec accès à l'interface admin</span>
          </div>
          <div style="padding:1.5rem">
            <div id="team-list"><div style="color:var(--muted2);font-size:.85rem">Chargement…</div></div>

            <!-- Formulaire ajout -->
            <div id="team-add-form" style="display:none;margin-top:1rem;padding:1rem;background:var(--bg2);border-radius:var(--r);border:1px solid var(--border)">
              <div class="form-row" style="margin-bottom:.75rem">
                <div class="form-group">
                  <label style="font-size:.8rem">Email du collaborateur</label>
                  <input class="form-control" id="team-email" type="email" placeholder="marie@example.com">
                </div>
                <div class="form-group">
                  <label style="font-size:.8rem">Prénom / Nom affiché</label>
                  <input class="form-control" id="team-name" placeholder="Marie Dupont">
                </div>
              </div>
              <div class="form-row" style="margin-bottom:.75rem">
                <div class="form-group">
                  <label style="font-size:.8rem">Mot de passe <span style="color:var(--muted2);font-weight:400">(requis si nouveau compte)</span></label>
                  <input class="form-control" id="team-pwd" type="password" placeholder="8 caractères minimum">
                </div>
                <div class="form-group">
                  <label style="font-size:.8rem">Confirmer le mot de passe</label>
                  <input class="form-control" id="team-pwd2" type="password" placeholder="••••••••">
                </div>
              </div>
              <div style="font-size:.8rem;font-weight:600;color:var(--muted2);margin-bottom:.5rem">Sections accessibles</div>
              <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem">
                ${_TEAM_SECTIONS.map(([v,l])=>`
                  <label style="display:flex;align-items:center;gap:.4rem;font-size:.83rem;cursor:pointer;padding:.35rem .7rem;background:var(--surface);border:1px solid var(--border);border-radius:20px">
                    <input type="checkbox" name="team-perm" value="${v}" style="accent-color:var(--blue)"> ${l}
                  </label>`).join('')}
              </div>
              <div style="display:flex;gap:.5rem">
                <button class="btn btn-primary btn-sm" onclick="addStaffUser()">Ajouter</button>
                <button class="btn btn-ghost btn-sm" onclick="document.getElementById('team-add-form').style.display='none'">Annuler</button>
              </div>
            </div>

            <button class="btn btn-ghost btn-sm" style="margin-top:1rem" onclick="document.getElementById('team-add-form').style.display='block'">+ Ajouter un collaborateur</button>
          </div>
        </div>

      </div>

      <!-- Tab 5 : Mon site -->
      <div id="stab-content-5" style="display:none">

        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <span class="card-title">🎨 Thème de la vitrine</span>
            <span style="font-size:.75rem;color:var(--muted2)">Choisissez l'apparence selon votre métier</span>
          </div>
          <div style="padding:1.5rem">
            <div id="theme-picker" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1rem">
              <div style="color:var(--muted2);font-size:.85rem">Chargement…</div>
            </div>
            <p style="font-size:.78rem;color:var(--muted2);margin-top:1rem;margin-bottom:0">
              Le thème choisi s'applique à votre site public. Cliquez sur « Prévisualiser » pour le voir avant de publier.
            </p>
          </div>
        </div>

        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <span class="card-title">🌐 Vitrine publique</span>
            <span style="font-size:.75rem;color:var(--muted2)">Ces informations s'affichent sur votre site</span>
          </div>
          <div style="padding:1.5rem">
            <div class="form-row">
              <div class="form-group">
                <label>Nom du site / Enseigne</label>
                <input class="form-control" id="ws-name" placeholder="HomeGeek">
              </div>
              <div class="form-group">
                <label>Slogan</label>
                <input class="form-control" id="ws-tagline" placeholder="Informatique · Électronique · Multimédia">
              </div>
            </div>
            <div class="form-group">
              <label>Description (paragraphe hero)</label>
              <textarea class="form-control" id="ws-desc" rows="2" placeholder="Un expert passionné pour tous vos besoins numériques…"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Téléphone</label>
                <input class="form-control" id="ws-phone" placeholder="07 81 73 78 57">
              </div>
              <div class="form-group">
                <label>Email public</label>
                <input class="form-control" id="ws-email" placeholder="contact@homegeek.fr">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Zone d'intervention</label>
                <input class="form-control" id="ws-zone" placeholder="Bretagne &amp; télé-assistance nationale">
              </div>
              <div class="form-group">
                <label>URL de l'API Intervys <span style="color:var(--muted2);font-size:.75rem">(pour le site dynamique)</span></label>
                <input class="form-control" id="ws-api-url" placeholder="https://app.homegeek.fr">
              </div>
            </div>
            <div class="form-group">
              <label>Texte "À propos"</label>
              <textarea class="form-control" id="ws-about" rows="3" placeholder="Présentation, valeurs, approche…"></textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:.5rem">
              <button class="btn btn-ghost btn-sm" onclick="loadMonSiteSettings()">Recharger</button>
              <button class="btn btn-primary btn-sm" onclick="saveMonSiteSettings()">Enregistrer &amp; publier</button>
            </div>
          </div>
        </div>

        <!-- Éditeur de contenu vitrine -->
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <span class="card-title">✏️ Contenu de la vitrine</span>
            <span style="font-size:.75rem;color:var(--muted2)">Personnalisez chaque section de votre site</span>
          </div>
          <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem">

            <!-- Hero -->
            <details open><summary style="font-weight:600;cursor:pointer;padding:.5rem 0;color:var(--text)">🏠 Accroche (hero)</summary>
              <div style="padding:.75rem 0 0;display:flex;flex-direction:column;gap:.6rem">
                <div class="form-row">
                  <div class="form-group">
                    <label>Bandeau eyebrow</label>
                    <input class="form-control" id="vc-eyebrow" placeholder="Ex: Votre expert numérique">
                  </div>
                  <div class="form-group">
                    <label>Titre hero <span style="color:var(--muted2);font-size:.72rem">(HTML ok, &lt;em&gt; pour accent)</span></label>
                    <input class="form-control" id="vc-hero-title" placeholder="La technologie, &lt;em&gt;enfin simple&lt;/em&gt;">
                  </div>
                </div>
                <div class="form-group">
                  <label>Sous-titre hero</label>
                  <textarea class="form-control" id="vc-hero-sub" rows="2" placeholder="Phrase d'accroche principale…"></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Bouton principal</label>
                    <input class="form-control" id="vc-cta" placeholder="Demander un devis">
                  </div>
                  <div class="form-group">
                    <label>Bouton secondaire</label>
                    <input class="form-control" id="vc-cta2" placeholder="Nos services">
                  </div>
                </div>
              </div>
            </details>

            <!-- Stats -->
            <details><summary style="font-weight:600;cursor:pointer;padding:.5rem 0;color:var(--text)">📊 Statistiques (3 chiffres clés)</summary>
              <div style="padding:.75rem 0 0;display:flex;flex-direction:column;gap:.5rem" id="vc-stats-list">
                ${[0,1,2].map(i=>`<div class="form-row" style="align-items:center">
                  <div class="form-group"><label>Valeur ${i+1}</label><input class="form-control vc-stat-val" placeholder="+500"></div>
                  <div class="form-group"><label>Libellé ${i+1}</label><input class="form-control vc-stat-lbl" placeholder="interventions"></div>
                </div>`).join('')}
              </div>
            </details>

            <!-- Services -->
            <details><summary style="font-weight:600;cursor:pointer;padding:.5rem 0;color:var(--text)">🛠️ Prestations / Services</summary>
              <div style="padding:.75rem 0 0;display:flex;flex-direction:column;gap:.5rem" id="vc-services-list"></div>
              <div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap">
                <button class="btn btn-ghost btn-sm" onclick="vcAddService()">+ Ajouter</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--muted)" onclick="vcResetSection('services')">↺ Réinitialiser au thème</button>
              </div>
            </details>

            <!-- Galerie -->
            <details><summary style="font-weight:600;cursor:pointer;padding:.5rem 0;color:var(--text)">🖼️ Galerie (vignettes)</summary>
              <div style="padding:.75rem 0 0;display:flex;flex-direction:column;gap:.5rem" id="vc-gallery-list"></div>
              <div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap">
                <button class="btn btn-ghost btn-sm" onclick="vcAddGallery()">+ Ajouter</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--muted)" onclick="vcResetSection('gallery')">↺ Réinitialiser au thème</button>
              </div>
            </details>

            <!-- À propos -->
            <details><summary style="font-weight:600;cursor:pointer;padding:.5rem 0;color:var(--text)">💬 À propos</summary>
              <div style="padding:.75rem 0 0;display:flex;flex-direction:column;gap:.6rem">
                <div class="form-row">
                  <div class="form-group" style="max-width:100px">
                    <label>Emoji</label>
                    <input class="form-control" id="vc-about-emoji" placeholder="💡">
                  </div>
                  <div class="form-group">
                    <label>Titre</label>
                    <input class="form-control" id="vc-about-title" placeholder="Un partenaire de confiance">
                  </div>
                </div>
                <div class="form-group">
                  <label>Texte de présentation</label>
                  <textarea class="form-control" id="vc-about-text" rows="3" placeholder="Décrivez votre activité, vos valeurs…"></textarea>
                </div>
                <div class="form-group">
                  <label>Atouts (un par ligne, max 4)</label>
                  <textarea class="form-control" id="vc-checks" rows="4" placeholder="Devis gratuit&#10;Intervention rapide&#10;Matériel garanti&#10;Conseils personnalisés"></textarea>
                </div>
              </div>
            </details>

            <!-- Actualités -->
            <details><summary style="font-weight:600;cursor:pointer;padding:.5rem 0;color:var(--text)">📰 Actualités / Articles</summary>
              <div style="padding:.75rem 0 0">
                <div id="vc-articles-list" style="display:flex;flex-direction:column;gap:.75rem"></div>
                <button class="btn btn-ghost btn-sm" style="margin-top:.75rem" onclick="vcAddArticle()">+ Nouvel article</button>
              </div>
            </details>

            <div style="display:flex;justify-content:flex-end;gap:.5rem;padding-top:.5rem;border-top:1px solid var(--border)">
              <button class="btn btn-ghost btn-sm" onclick="loadVitrineContent()">Recharger</button>
              <button class="btn btn-primary btn-sm" onclick="saveVitrineContent()">Enregistrer &amp; publier</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Aperçu du lien</span></div>
          <div style="padding:1rem 1.5rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
            <div style="flex:1;font-size:.85rem;color:var(--muted2)">
              Votre site vitrine est accessible à l'adresse ci-dessous. Partagez-le à vos clients.
            </div>
            <a id="ws-site-link" href="#" target="_blank" class="btn btn-ghost btn-sm" style="white-space:nowrap">
              Ouvrir le site →
            </a>
          </div>
        </div>
      </div>

      <!-- Tab 6 : Mises à jour -->
      <div id="stab-content-6" style="display:none">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">
            <span class="card-title">🔄 Mises à jour</span>
            <span style="font-size:.75rem;color:var(--muted2)">Mettre à jour les fichiers JS et HTML</span>
          </div>
          <div style="padding:1.5rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:.78rem;color:var(--muted2);margin-bottom:.2rem">Version installée</div>
                <div id="upd-current" style="font-weight:700;font-size:1.15rem;color:var(--text)">—</div>
              </div>
              <button class="btn btn-ghost" onclick="checkForUpdates()">🔍 Vérifier les mises à jour</button>
            </div>
            <div id="upd-result" style="margin-bottom:1.25rem"></div>
            <details style="margin-top:.5rem">
              <summary style="font-size:.82rem;color:var(--muted2);cursor:pointer">⚙️ URL du manifeste</summary>
              <div style="margin-top:.75rem;display:flex;gap:.5rem">
                <input class="form-control" id="upd-url" placeholder="https://homegeek.fr/Intervys/latest.json" style="flex:1;font-size:.83rem">
                <button class="btn btn-ghost btn-sm" onclick="saveUpdateUrl()">Enregistrer</button>
              </div>
            </details>
          </div>
        </div>
      </div>

    </div>`;

  // Charger les données depuis PocketBase directement dans les champs
  loadSmtpSettings();
  loadBillingForm();
  loadUiSettingsForm();
}

async function loadBillingForm() {
  try {
    const d = await api.req('GET', '/api/collections/settings/records?perPage=50');
    const items = d.items || [];
    const bsItem = items.find(i => i.key === 'business_settings');
    if (!bsItem || !bsItem.value) return;
    const b = JSON.parse(bsItem.value);
    const map = { name:'b-name', legal:'b-legal', address:'b-address', city:'b-city',
                  email:'b-email', phone:'b-phone', siret:'b-siret', tva_num:'b-tva-num',
                  iban:'b-iban', bic:'b-bic', rcs:'b-rcs', website:'b-website', tva:'b-tva' };
    for (const [key, id] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el && b[key] != null) el.value = b[key];
    }
    // Logo et signature
    const logoItem = items.find(i => i.key === 'doc_logo_b64');
    if (logoItem?.value) {
      const prev = document.getElementById('doc-logo-preview');
      if (prev) { prev.src = logoItem.value; prev.style.display = 'block'; }
    }
    const sigItem = items.find(i => i.key === 'signature_b64');
    if (sigItem?.value) {
      const prev = document.getElementById('sig-preview');
      if (prev) { prev.src = sigItem.value; prev.style.display = 'block'; }
    }
  } catch(e) { console.warn('loadBillingForm error', e); }
}

async function loadUiSettingsForm() {
  try {
    const d = await api.req('GET', '/api/collections/settings/records?perPage=50');
    const items = d.items || [];
    const sizeItem = items.find(i => i.key === 'hg_logo_size');
    if (sizeItem?.value) {
      const slider = document.getElementById('logo-size-slider');
      const val = document.getElementById('logo-size-val');
      if (slider) slider.value = sizeItem.value;
      if (val) val.textContent = sizeItem.value + 'px';
      _applyLogoSize(sizeItem.value);
    }
    const titleItem = items.find(i => i.key === 'hg_show_title');
    if (titleItem?.value) {
      const cb = document.getElementById('s-show-title');
      if (cb) cb.checked = titleItem.value !== 'false';
      const show = titleItem.value !== 'false';
      document.querySelectorAll('.sidebar-logo span:not(span span)').forEach(el => {
        el.style.display = show ? '' : 'none';
      });
    }
  } catch(e) { console.warn('loadUiSettingsForm error', e); }
}

function showSettingsTab(n) {
  for (let i = 0; i < 7; i++) {
    const content = document.getElementById('stab-content-' + i);
    const tab = document.getElementById('stab-' + i);
    if (content) content.style.display = i === n ? 'block' : 'none';
    if (tab) {
      tab.style.borderBottomColor = i === n ? 'var(--blue)' : 'transparent';
      tab.style.color = i === n ? 'var(--blue)' : 'var(--muted2)';
    }
  }
  if (n === 1) loadServicesSettings();
  if (n === 2) loadSmtpSettings();
  if (n === 4) { loadAdminProfile(); loadTeamSettings(); }
  if (n === 5) { loadMonSiteSettings(); loadSiteTheme(); loadVitrineContent(); }
  if (n === 6) loadUpdateTab();
}

// ── Mon site : chargement & sauvegarde des settings vitrine ──
const WS_KEYS = ['site_name','site_tagline','site_desc','site_phone','site_email','site_zone','site_about','vitrine_api_url'];
const WS_IDS  = ['ws-name',  'ws-tagline',  'ws-desc',  'ws-phone',  'ws-email',  'ws-zone',  'ws-about',  'ws-api-url'];

async function loadMonSiteSettings() {
  try {
    const filter = WS_KEYS.map(k => `key='${k}'`).join(' || ');
    const r = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent(filter) + '&perPage=20');
    const map = {};
    for (const item of r.items) map[item.key] = item.value;
    WS_KEYS.forEach((k, i) => {
      const el = document.getElementById(WS_IDS[i]);
      if (el) el.value = map[k] || '';
    });
    // Lien vers le site vitrine thématisé
    const link = document.getElementById('ws-site-link');
    if (link) { link.href = _vitrineBase() + '/site.html'; }
  } catch(e) { toast('Erreur chargement Mon site', 'error'); }
}

async function saveMonSiteSettings() {
  try {
    const filter = WS_KEYS.map(k => `key='${k}'`).join(' || ');
    const existing = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent(filter) + '&perPage=20');
    const byKey = {};
    for (const item of existing.items) byKey[item.key] = item.id;

    for (let i = 0; i < WS_KEYS.length; i++) {
      const key = WS_KEYS[i];
      const val = (document.getElementById(WS_IDS[i])?.value || '').trim();
      if (byKey[key]) {
        await api.req('PATCH', `/api/collections/settings/records/${byKey[key]}`, { value: val });
      } else {
        await api.req('POST', '/api/collections/settings/records', { key, value: val });
      }
    }
    toast('Site vitrine mis à jour', 'success');
  } catch(e) { toast('Erreur sauvegarde', 'error'); }
}

// ── Données par défaut des thèmes (miroir de vitrine/site.html) ──
const THEME_DEFAULTS = {
  default: {
    heroEyebrow:'Votre expert numérique', heroTitle:'La technologie, <em>enfin simple</em>',
    heroSub:'Dépannage informatique, réseau, domotique et multimédia. Un expert passionné à votre service.',
    cta:'Demander un devis', cta2:'Nos services',
    stats:[['+500','interventions'],['24h','délai moyen'],['4.9★','satisfaction']],
    services:[['🛠️','Dépannage','Diagnostic et réparation de vos appareils, à domicile ou en atelier.'],
              ['🌐','Réseau & WiFi','Installation et optimisation de votre réseau domestique.'],
              ['🏠','Domotique','Pilotez votre maison : éclairage, chauffage, sécurité.'],
              ['🎮','Gaming','Montage PC, consoles, optimisation pour le jeu.'],
              ['🖨️','Impression 3D','Prototypage et pièces sur mesure.'],
              ['💾','Sauvegarde','Récupération de données et stratégie de sauvegarde.']],
    gallery:[['🖥️','Setup gaming'],['📡','Réseau maillé'],['🤖','Maison connectée'],['🔧','Atelier']],
    aboutEmoji:'💡', aboutTitle:'Un partenaire de confiance',
    aboutText:'Passionné de technologie, je mets mon expertise au service des particuliers et des professionnels.',
    checks:['Intervention rapide','Devis gratuit','Matériel garanti','Conseils personnalisés'],
  },
  jardinier: {
    heroEyebrow:'Paysagiste · Jardinier', heroTitle:'Votre extérieur,<br><em>notre passion</em>',
    heroSub:'Création de jardins, entretien, élagage. Nous donnons vie à vos espaces verts, en harmonie avec la nature.',
    cta:'Demander un devis', cta2:'Nos prestations',
    stats:[['+200','jardins entretenus'],['10','ans d\'expérience'],['100%','éco-responsable']],
    services:[['🌱','Tonte & Entretien','Entretien régulier de pelouses, massifs et espaces verts.'],
              ['🌸','Création de massifs','Conception et plantation de massifs fleuris sur-mesure.'],
              ['🪚','Élagage & Abattage','Taille en hauteur et abattage sécurisé de vos arbres.'],
              ['🌳','Taille de haies','Tailles nettes et formes maîtrisées pour vos haies.'],
              ['🥕','Potager','Installation et entretien de potagers productifs.'],
              ['💧','Arrosage auto','Systèmes d\'arrosage économes et programmables.']],
    gallery:[['🌻','Massif fleuri'],['🌳','Élagage'],['🪴','Terrasse végétale'],['🥬','Potager bio']],
    aboutEmoji:'🌿', aboutTitle:'Au plus près de la nature',
    aboutText:'Artisans paysagistes passionnés, nous concevons et entretenons vos espaces verts dans le respect du vivant.',
    checks:['Devis gratuit','Matériel professionnel','Approche éco-responsable','Contrats d\'entretien annuels'],
  },
  plomberie: {
    heroEyebrow:'Plombier · Chauffagiste', heroTitle:'Votre plombier,<br><em>disponible 7j/7</em>',
    heroSub:'Fuite, débouchage, chauffe-eau, salle de bain. Intervention rapide chez vous, devis gratuit.',
    cta:'Demander un devis', cta2:'Nos services',
    stats:[['+300','chantiers'],['1h','délai intervention'],['10','ans d\'expérience']],
    services:[['🚿','Salle de bain','Conception, pose et rénovation complète de salles de bain.'],
              ['🔩','Dépannage fuite','Détection et réparation de fuites, intervention d\'urgence.'],
              ['🚽','Sanitaires','Remplacement et installation de WC, lavabos, robinetterie.'],
              ['🔥','Chauffe-eau','Pose et entretien de chauffe-eau, thermodynamiques, solaires.'],
              ['♨️','Chauffage','Installation chaudière, radiateurs, plancher chauffant.'],
              ['🏗️','Débouchage','Débouchage canalisations, regards, évacuations colmatées.']],
    gallery:[['🛁','Salle de bain'],['🔥','Chauffe-eau'],['🚿','Douche italienne'],['🔩','Dépannage']],
    aboutEmoji:'🔧', aboutTitle:'L\'expertise au service de votre confort',
    aboutText:'Artisan plombier qualifié RGE, j\'interviens rapidement pour tous vos travaux de plomberie et chauffage.',
    checks:['Devis gratuit sous 24h','Garantie décennale','Artisan certifié RGE','Urgences 7j/7'],
  },
  menuiserie: {
    heroEyebrow:'Menuisier · Ébéniste', heroTitle:'L\'art du bois,<br><em>sur-mesure</em>',
    heroSub:'Escaliers, cuisines, dressings, fenêtres. Des créations en bois massif taillées selon vos envies.',
    cta:'Demander un devis', cta2:'Nos réalisations',
    stats:[['+150','projets réalisés'],['20','ans d\'expérience'],['100%','sur-mesure']],
    services:[['🚪','Portes & Fenêtres','Pose et fabrication de menuiseries intérieures et extérieures.'],
              ['🛋️','Dressing & Placards','Agencement sur-mesure adapté à vos espaces.'],
              ['🪜','Escaliers','Escaliers droits, hélicoïdaux, en bois massif ou mixte.'],
              ['🍽️','Cuisine','Conception et installation de cuisines en bois massif.'],
              ['🪑','Mobilier','Meubles et tables créés à la main dans notre atelier.'],
              ['🏠','Bardage & Terrasse','Habillage extérieur bois, terrasses et lames de sol.']],
    gallery:[['🚪','Porte d\'entrée'],['🪜','Escalier chêne'],['🛋️','Dressing noyer'],['🍽️','Cuisine bois']],
    aboutEmoji:'🪵', aboutTitle:'L\'amour du bois depuis trois générations',
    aboutText:'Compagnon du tour de France, chaque pièce est travaillée à la main, dans le respect des essences et des traditions.',
    checks:['Atelier propre','Bois certifié PEFC','Fabrication française','Garantie 2 ans pièces & main-d\'œuvre'],
  },
  mecanique: {
    heroEyebrow:'Votre garagiste de confiance', heroTitle:'Votre véhicule,<br><em>entre de bonnes mains</em>',
    heroSub:'Révision, freins, embrayage, carrosserie. Un garage indépendant toutes marques avec des techniciens qualifiés.',
    cta:'Prendre rendez-vous', cta2:'Nos services',
    stats:[['+1000','véhicules réparés'],['15','ans d\'expérience'],['Toutes','marques']],
    services:[['🚗','Révision','Vidange, filtres, bougies. Entretien constructeur toutes marques.'],
              ['🛑','Freinage','Disques, plaquettes, liquide de frein. Sécurité garantie.'],
              ['⚙️','Embrayage & Boîte','Remplacement embrayage, diagnostics boîte de vitesses.'],
              ['🔋','Électronique','Diagnostic OBD, remplacement batterie, alternateur, démarreur.'],
              ['🎨','Carrosserie','Réparation chocs, débosselage, peinture teintée à l\'identique.'],
              ['❄️','Climatisation','Recharge gaz, test d\'étanchéité, remplacement compresseur.']],
    gallery:[['🚗','Révision complète'],['🎨','Peinture'],['⚙️','Moteur'],['🛑','Freinage']],
    aboutEmoji:'🏁', aboutTitle:'La mécanique, notre passion',
    aboutText:'Garage indépendant, diagnostic honnête, pièces d\'origine ou équivalent, tarif juste.',
    checks:['Diagnostic gratuit','Pièces garanties','Toutes marques','Devis avant intervention'],
  },
  electricien: {
    heroEyebrow:'Électricien certifié Qualifelec', heroTitle:'L\'électricité,<br><em>en toute sécurité</em>',
    heroSub:'Installation, mise aux normes, domotique. Un électricien qualifié pour votre maison et vos locaux professionnels.',
    cta:'Demander un devis', cta2:'Nos services',
    stats:[['+400','installations'],['NF C 15-100','conforme'],['RGE','certifié']],
    services:[['🏠','Installation neuf','Tableau électrique, circuits, prises, éclairage. Norme NF C 15-100.'],
              ['⚠️','Mise aux normes','Diagnostic électrique, mise en conformité, rapport Consuel.'],
              ['💡','Éclairage','LED, spots encastrés, éclairage extérieur, variation de lumière.'],
              ['🔌','Prises & câblage','Extension de circuits, câblage réseau, gaines sous-sol.'],
              ['🏠','Domotique','Volets roulants, alarme, interphone, maison connectée.'],
              ['⚡','Borne de recharge','Installation IRVE pour véhicule électrique, certification ADVENIR.']],
    gallery:[['⚡','Tableau neuf'],['💡','Éclairage LED'],['🔌','Borne VE'],['🏠','Rénovation']],
    aboutEmoji:'⚡', aboutTitle:'La sécurité avant tout',
    aboutText:'Électricien indépendant certifié Qualifelec, travaux propres, dans les règles de l\'art.',
    checks:['Certifié Qualifelec','Conformité Consuel','Devis gratuit','Urgences traitées rapidement'],
  },
  decorateur: {
    heroEyebrow:'Décorateur · Organisateur d\'événements', heroTitle:'Des fêtes qui<br><em>resteront gravées</em>',
    heroSub:'Mariage, anniversaire, baptême, fête d\'entreprise. De la décoration à la coordination complète.',
    cta:'Nous contacter', cta2:'Nos réalisations',
    stats:[['+200','événements'],['100%','personnalisés'],['5★','avis clients']],
    services:[['💍','Mariage','Décoration de salle, arche florale, table d\'honneur, mise en scène complète.'],
              ['🎂','Anniversaire','Décoration de gâteau, arche ballons, thème sur-mesure, photobooth.'],
              ['🎀','Baptême & Baby shower','Mise en scène douce et élégante pour accueillir les petits nouveaux.'],
              ['🎆','Fête & Réception','Scénographie lumineuse, mobilier événementiel, animations.'],
              ['💐','Floral & Végétal','Compositions florales fraîches, arches de fleurs, centres de table.'],
              ['🏢','Événement pro','Team building, séminaire, inauguration. Coordination de A à Z.']],
    gallery:[['💍','Mariage bohème'],['🎂','Anniversaire 30 ans'],['💐','Arche florale'],['🎆','Soirée gala']],
    aboutEmoji:'✨', aboutTitle:'Votre vision, notre passion',
    aboutText:'Décoratrice et organisatrice d\'événements depuis 10 ans, je transforme vos rêves en réalité.',
    checks:['Rencontre gratuite','100% sur-mesure','Réseau de prestataires','Coordination le jour J'],
  },
};

// ── Éditeur de contenu vitrine ──
let _vcServices = [];
let _vcGallery  = [];
let _vcArticles = [];

function _vcServiceRow(s, i) {
  return `<div class="form-row vc-svc-row" data-i="${i}" style="align-items:flex-start;gap:.5rem">
    <div class="form-group" style="max-width:70px"><label>Emoji</label><input class="form-control vc-svc-emoji" value="${s[0]||''}"></div>
    <div class="form-group"><label>Titre</label><input class="form-control vc-svc-title" value="${(s[1]||'').replace(/"/g,'&quot;')}"></div>
    <div class="form-group" style="flex:2"><label>Description</label><input class="form-control vc-svc-desc" value="${(s[2]||'').replace(/"/g,'&quot;')}"></div>
    <button onclick="vcRemoveService(${i})" style="background:none;border:none;color:var(--red);cursor:pointer;margin-top:1.6rem;font-size:1.1rem" title="Supprimer">×</button>
  </div>`;
}
function _vcGalleryRow(g, i) {
  return `<div class="form-row vc-gal-row" data-i="${i}" style="align-items:center;gap:.5rem">
    <div class="form-group" style="max-width:80px"><label>Emoji</label><input class="form-control vc-gal-emoji" value="${g[0]||''}"></div>
    <div class="form-group"><label>Légende</label><input class="form-control vc-gal-lbl" value="${(g[1]||'').replace(/"/g,'&quot;')}"></div>
    <button onclick="vcRemoveGallery(${i})" style="background:none;border:none;color:var(--red);cursor:pointer;margin-top:1.6rem;font-size:1.1rem" title="Supprimer">×</button>
  </div>`;
}
function _vcArticleRow(a, i) {
  const date = a.date ? a.date.substring(0,10) : new Date().toISOString().substring(0,10);
  return `<div class="card" style="padding:1rem;background:var(--bg2)" data-ai="${i}">
    <div class="form-row">
      <div class="form-group" style="flex:2"><label>Titre</label><input class="form-control vc-art-title" value="${(a.title||'').replace(/"/g,'&quot;')}"></div>
      <div class="form-group" style="max-width:140px"><label>Date</label><input class="form-control vc-art-date" type="date" value="${date}"></div>
      <button onclick="vcRemoveArticle(${i})" style="background:none;border:none;color:var(--red);cursor:pointer;margin-top:1.6rem;font-size:1.1rem" title="Supprimer">×</button>
    </div>
    <div class="form-group">
      <label>Contenu</label>
      <textarea class="form-control vc-art-content" rows="3">${a.content||''}</textarea>
    </div>
  </div>`;
}

function _vcRenderServices() {
  const el = document.getElementById('vc-services-list');
  if (el) el.innerHTML = _vcServices.map((s,i) => _vcServiceRow(s,i)).join('');
}
function _vcRenderGallery() {
  const el = document.getElementById('vc-gallery-list');
  if (el) el.innerHTML = _vcGallery.map((g,i) => _vcGalleryRow(g,i)).join('');
}
function _vcRenderArticles() {
  const el = document.getElementById('vc-articles-list');
  if (el) el.innerHTML = _vcArticles.map((a,i) => _vcArticleRow(a,i)).join('');
}

async function vcResetSection(section) {
  const themeKey = window._siteTheme || _currentSiteTheme || 'default';
  const def = THEME_DEFAULTS[themeKey] || THEME_DEFAULTS.default;
  if (section === 'services') {
    _vcServices = def.services.map(s => [...s]);
    _vcRenderServices();
    await pbDeleteSetting('site_services').catch(()=>{});
    toast('Prestations réinitialisées au thème ✓', 'success');
  } else if (section === 'gallery') {
    _vcGallery = def.gallery.map(g => [...g]);
    _vcRenderGallery();
    await pbDeleteSetting('site_gallery').catch(()=>{});
    toast('Galerie réinitialisée au thème ✓', 'success');
  }
}

function vcAddService()  { _vcServices.push(['🔧','Nouvelle prestation','Description…']); _vcRenderServices(); }
function vcRemoveService(i){ _vcServices.splice(i,1); _vcRenderServices(); }
function vcAddGallery()  { _vcGallery.push(['📷','Réalisation']); _vcRenderGallery(); }
function vcRemoveGallery(i){ _vcGallery.splice(i,1); _vcRenderGallery(); }
function vcAddArticle()  { _vcArticles.unshift({title:'Nouvel article',content:'',date:new Date().toISOString().substring(0,10)}); _vcRenderArticles(); }
function vcRemoveArticle(i){ _vcArticles.splice(i,1); _vcRenderArticles(); }

function _vcReadFromDOM() {
  // Stats
  const statVals = [...document.querySelectorAll('.vc-stat-val')].map(el=>el.value.trim());
  const statLbls = [...document.querySelectorAll('.vc-stat-lbl')].map(el=>el.value.trim());
  const stats = statVals.map((v,i)=>[v, statLbls[i]||'']).filter(s=>s[0]||s[1]);
  // Services
  const services = [...document.querySelectorAll('.vc-svc-row')].map(row=>[
    row.querySelector('.vc-svc-emoji')?.value||'',
    row.querySelector('.vc-svc-title')?.value||'',
    row.querySelector('.vc-svc-desc')?.value||'',
  ]);
  // Gallery
  const gallery = [...document.querySelectorAll('.vc-gal-row')].map(row=>[
    row.querySelector('.vc-gal-emoji')?.value||'',
    row.querySelector('.vc-gal-lbl')?.value||'',
  ]);
  // Articles
  const articles = [...document.querySelectorAll('[data-ai]')].map(row=>({
    title:   row.querySelector('.vc-art-title')?.value||'',
    date:    row.querySelector('.vc-art-date')?.value||'',
    content: row.querySelector('.vc-art-content')?.value||'',
  })).filter(a=>a.title);
  return { stats, services, gallery, articles };
}

async function loadVitrineContent() {
  const keys = ['site_hero_eyebrow','site_hero_title','site_hero_sub','site_cta','site_cta2',
                 'site_stats','site_services','site_gallery','site_about_emoji','site_about_title',
                 'site_about_text','site_checks','site_articles'];
  const filter = keys.map(k=>`key='${k}'`).join(' || ');
  try {
    const r = await api.req('GET','/api/collections/settings/records?filter='+encodeURIComponent(filter)+'&perPage=30');
    const map = {};
    for (const it of r.items||[]) map[it.key] = it.value;

    // Fallback sur les données du thème actif si pas encore personnalisé
    const themeKey = window._siteTheme || _currentSiteTheme || 'default';
    const def = THEME_DEFAULTS[themeKey] || THEME_DEFAULTS.default;

    const g = id => document.getElementById(id);
    if(g('vc-eyebrow'))     g('vc-eyebrow').value     = map['site_hero_eyebrow'] || def.heroEyebrow || '';
    if(g('vc-hero-title'))  g('vc-hero-title').value  = map['site_hero_title']   || def.heroTitle   || '';
    if(g('vc-hero-sub'))    g('vc-hero-sub').value    = map['site_hero_sub']     || def.heroSub     || '';
    if(g('vc-cta'))         g('vc-cta').value         = map['site_cta']          || def.cta         || '';
    if(g('vc-cta2'))        g('vc-cta2').value        = map['site_cta2']         || def.cta2        || '';
    if(g('vc-about-emoji')) g('vc-about-emoji').value = map['site_about_emoji']  || def.aboutEmoji  || '';
    if(g('vc-about-title')) g('vc-about-title').value = map['site_about_title']  || def.aboutTitle  || '';
    if(g('vc-about-text'))  g('vc-about-text').value  = map['site_about_text'] || map['site_about'] || def.aboutText || '';

    const savedChecks = map['site_checks'] ? JSON.parse(map['site_checks']) : def.checks || [];
    if(g('vc-checks')) g('vc-checks').value = savedChecks.join('\n');

    const savedStats = map['site_stats'] ? JSON.parse(map['site_stats']) : def.stats || [];
    const sVals = [...document.querySelectorAll('.vc-stat-val')];
    const sLbls = [...document.querySelectorAll('.vc-stat-lbl')];
    savedStats.forEach(([v,l],i)=>{ if(sVals[i]) sVals[i].value=v; if(sLbls[i]) sLbls[i].value=l; });

    _vcServices = map['site_services'] ? JSON.parse(map['site_services']) : (def.services || []);
    _vcGallery  = map['site_gallery']  ? JSON.parse(map['site_gallery'])  : (def.gallery  || []);
    _vcArticles = map['site_articles'] ? JSON.parse(map['site_articles']) : [];
    _vcRenderServices(); _vcRenderGallery(); _vcRenderArticles();
  } catch(e) { toast('Erreur chargement contenu vitrine','error'); }
}

async function saveVitrineContent() {
  const { stats, services, gallery, articles } = _vcReadFromDOM();
  const g = id => document.getElementById(id);
  const pairs = [
    ['site_hero_eyebrow', g('vc-eyebrow')?.value.trim()||''],
    ['site_hero_title',   g('vc-hero-title')?.value.trim()||''],
    ['site_hero_sub',     g('vc-hero-sub')?.value.trim()||''],
    ['site_cta',          g('vc-cta')?.value.trim()||''],
    ['site_cta2',         g('vc-cta2')?.value.trim()||''],
    ['site_about_emoji',  g('vc-about-emoji')?.value.trim()||''],
    ['site_about_title',  g('vc-about-title')?.value.trim()||''],
    ['site_about_text',   g('vc-about-text')?.value.trim()||''],
    ['site_about',        g('vc-about-text')?.value.trim()||''], // compatibilité ancienne clé
    ['site_checks',       JSON.stringify((g('vc-checks')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean).slice(0,4))],
    ...(stats.length    ? [['site_stats',    JSON.stringify(stats)]]    : []),
    ...(services.length ? [['site_services', JSON.stringify(services)]] : []),
    ...(gallery.length  ? [['site_gallery',  JSON.stringify(gallery)]]  : []),
    ...(articles.length ? [['site_articles', JSON.stringify(articles)]] : []),
  ];
  try {
    await Promise.all(pairs.map(([k,v]) => pbSetSetting(k,v)));
    toast('Contenu vitrine enregistré ✓','success');
  } catch(e) { toast('Erreur sauvegarde contenu','error'); }
}

// ── Thème de la vitrine (clé settings : hg_site_theme) ──
const SITE_THEMES = [
  { key:'custom',      emoji:'✨',  label:'Mon thème',            desc:'Vos couleurs personnalisées.', mine:true },
  { key:'default',     emoji:'💻',  label:'Tech',                 desc:'Dépannage, réseau, multimédia (HomeGeek).' },
  { key:'jardinier',   emoji:'🌿',  label:'Jardinier',            desc:'Paysagiste, entretien d\'espaces verts.' },
  { key:'plomberie',   emoji:'🔧',  label:'Plombier',             desc:'Plomberie, chauffage, dépannage.' },
  { key:'menuiserie',  emoji:'🪵',  label:'Menuisier',            desc:'Bois, portes, fenêtres, agencement.' },
  { key:'mecanique',   emoji:'🔩',  label:'Garagiste',            desc:'Mécanique auto, carrosserie, entretien.' },
  { key:'electricien', emoji:'⚡',  label:'Électricien',          desc:'Installation, mise aux normes, domotique.' },
  { key:'decorateur',  emoji:'🎉',  label:'Déco / Événements',    desc:'Mariages, anniversaires, fêtes.' },
];
let _currentSiteTheme = 'default';

// URL publique de la vitrine (app.homegeek.fr → homegeek.fr ; sinon même origine)
function _vitrineBase() {
  return location.origin.replace('://app.', '://').replace('://admin.', '://');
}

function renderThemePicker() {
  const box = document.getElementById('theme-picker');
  if (!box) return;
  box.innerHTML = SITE_THEMES.map(t => {
    const sel = t.key === _currentSiteTheme;
    return `<div onclick="selectSiteTheme('${t.key}')" title="Choisir le thème ${t.label}"
        style="cursor:pointer;border:2px solid ${sel ? 'var(--blue)' : 'var(--border)'};border-radius:14px;padding:1.1rem 1.1rem 1rem;
        background:${sel ? 'var(--blue-dim,rgba(30,144,255,.1))' : 'var(--surface)'};transition:.2s;position:relative">
      ${sel ? '<span style="position:absolute;top:.55rem;right:.7rem;color:var(--blue);font-weight:800">✓</span>' : ''}
      <div style="font-size:2rem;line-height:1;margin-bottom:.5rem">${t.emoji}</div>
      <div style="font-weight:700;font-size:1.05rem;margin-bottom:.25rem;color:var(--text)">${t.label}</div>
      <div style="font-size:.8rem;color:var(--muted2);margin-bottom:.8rem;min-height:2.4em">${t.desc}</div>
      ${t.mine
        ? `<a onclick="event.stopPropagation();showSettingsTab(0)" style="font-size:.8rem;color:var(--blue);font-weight:600;cursor:pointer">Modifier mes couleurs ↗</a>`
        : `<a href="${_vitrineBase()}/site.html?theme=${t.key}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="font-size:.8rem;color:var(--blue);font-weight:600">Prévisualiser ↗</a>`}
    </div>`;
  }).join('');
}

async function selectSiteTheme(key) {
  const prev = _currentSiteTheme;
  _currentSiteTheme = key;
  renderThemePicker();
  if (typeof _applyTheme === 'function') _applyTheme(key); // recolore l'admin instantanément (préset ou perso)
  try {
    await pbSetSetting('hg_site_theme', key);
    const label = SITE_THEMES.find(t => t.key === key)?.label || key;
    toast(key === 'custom' ? 'Votre thème a été restauré' : 'Thème « ' + label + ' » appliqué', 'success');
  } catch(e) {
    _currentSiteTheme = prev;
    renderThemePicker();
    if (typeof _applyTheme === 'function') _applyTheme(prev);
    toast('Erreur sauvegarde du thème', 'error');
    console.error('[selectSiteTheme]', e);
  }
}

async function loadSiteTheme() {
  try {
    const r = await api.req('GET', '/api/collections/settings/records?perPage=1&filter=' + encodeURIComponent("key='hg_site_theme'"));
    _currentSiteTheme = r.items?.[0]?.value || 'default';
  } catch(e) { _currentSiteTheme = 'default'; }
  renderThemePicker();
}

// ── Bannière modifications non sauvegardées ──
function showUnsavedBanner() {
  if (document.getElementById('unsaved-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'unsaved-banner';
  banner.style.cssText = 'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);background:#1a1f2e;border:1px solid rgba(245,158,11,.4);border-radius:8px;padding:.65rem 1.25rem;display:flex;align-items:center;gap:1rem;z-index:9999;box-shadow:0 4px 24px rgba(0,0,0,.5);font-size:.85rem;color:#fbbf24;white-space:nowrap';
  banner.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    Modifications non sauvegardées
    <button onclick="saveThemeSettings();saveIdentitySettings()" style="background:var(--blue);color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:.8rem">Enregistrer</button>
    <button onclick="cancelUnsavedTheme()" style="background:none;border:1px solid rgba(255,255,255,.15);color:var(--muted2);border-radius:4px;padding:4px 10px;cursor:pointer;font-size:.8rem">Annuler</button>`;
  document.body.appendChild(banner);
}

function hideUnsavedBanner() {
  const b = document.getElementById('unsaved-banner');
  if (b) b.remove();
}

function applyUnsavedTheme() {
  try {
    const data = JSON.parse(sessionStorage.getItem('hg_unsaved_theme') || '{}');
    for (const [k,v] of Object.entries(data)) {
      document.documentElement.style.setProperty(k, v);
    }
  } catch {}
}

function cancelUnsavedTheme() {
  sessionStorage.removeItem('hg_unsaved_theme');
  sessionStorage.removeItem('hg_unsaved_name');
  hideUnsavedBanner();
  adminSettings();
}

// ── Test (DOM uniquement) ──
function testThemeSettings() {
  const vars = ['--blue','--blue2','--bg','--bg2','--surface','--text','--muted2','--green','--red','--orange'];
  const theme = {};
  for (const v of vars) {
    const key = v.replace(/--/g,'').replace(/-/g,'_');
    const el = document.getElementById('theme' + key);
    if (el) {
      theme[v] = el.value;
      document.documentElement.style.setProperty(v, el.value);
    }
  }
  sessionStorage.setItem('hg_unsaved_theme', JSON.stringify(theme));
  showUnsavedBanner();
  toast('Thème appliqué — naviguez pour tester', 'info', 3000);
}

async function previewLogoSize(val) {
  document.getElementById('logo-size-val').textContent = val + 'px';
  _applyLogoSize(val);
  try {
    await pbSetSetting('hg_logo_size', val);
  } catch(e) {
    console.error('Erreur save hg_logo_size', e);
  }
}

function testIdentitySettings() {
  const name = document.getElementById('s-sitename').value.trim();
  if (!name) return toast('Nom requis', 'warn');
  // Appliquer dans le DOM
  document.querySelectorAll('.sidebar-logo > span').forEach(el => {
    const parts = name.match(/^(.*?)(\w+)$/);
    el.innerHTML = parts ? parts[1] + '<span style="color:var(--blue)">' + parts[2] + '</span>' : name;
  });
  document.title = name;
  sessionStorage.setItem('hg_unsaved_name', name);
  showUnsavedBanner();
  toast('Nom appliqué — naviguez pour tester', 'info', 3000);
}

function updateColorPreview(color) {
  document.documentElement.style.setProperty('--blue', color);
}

async function toggleSidebarTitle(show) {
  const val = show ? 'true' : 'false';
  document.querySelectorAll('.sidebar-logo span:not(span span)').forEach(el => {
    el.style.display = show ? '' : 'none';
  });
  try {
    await pbSetSetting('hg_show_title', val);
  } catch(e) {
    console.error('Erreur save hg_show_title', e);
    toast('Erreur enregistrement préférence titre', 'error', 4000);
  }
}

function syncThemeColor(varName, value) {
  const key = varName.replace(/--/g,'').replace(/-/g,'_');
  const textInput = document.getElementById('theme' + key);
  if (textInput) textInput.value = value;
  document.documentElement.style.setProperty(varName, value);
}

function syncThemeColorText(varName, value) {
  const key = varName.replace(/--/g,'').replace(/-/g,'_');
  const pickInput = document.getElementById('theme' + key + '_pick');
  if (pickInput && /^#[0-9a-f]{6}$/i.test(value)) pickInput.value = value;
  document.documentElement.style.setProperty(varName, value);
}

function resetTheme() {
  const defaults = {
    '--blue':'#1e90ff','--blue2':'#00cfff','--bg':'#07090e','--bg2':'#0b0f18',
    '--surface':'#0f1520','--text':'#dde6f0','--muted2':'#8fa8c0',
    '--green':'#22c55e','--red':'#ef4444','--orange':'#f97316',
  };
  for (const [k,v] of Object.entries(defaults)) {
    document.documentElement.style.setProperty(k, v);
    const key = k.replace(/--/g,'').replace(/-/g,'_');
    const t = document.getElementById('theme' + key);
    const p = document.getElementById('theme' + key + '_pick');
    if (t) t.value = v;
    if (p) p.value = v;
  }
  toast('Thème réinitialisé', 'success');
}

async function saveThemeSettings() {
  const vars = ['--blue','--blue2','--bg','--bg2','--surface','--text','--muted2','--green','--red','--orange'];
  const theme = {};
  for (const v of vars) {
    const key = v.replace(/--/g,'').replace(/-/g,'_');
    const el = document.getElementById('theme' + key);
    if (el) theme[v] = el.value;
  }
  try {
    const val = JSON.stringify(theme);
    const r = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent("key='theme'") + '&perPage=1');
    if (r.items.length) {
      await api.req('PATCH', '/api/collections/settings/records/' + r.items[0].id, { value: val });
    } else {
      await api.req('POST', '/api/collections/settings/records', { key: 'theme', value: val });
    }
    window._customThemeVars = theme;
    try { await pbSetSetting('hg_site_theme', 'custom'); } catch(_) {}
    _currentSiteTheme = 'custom';
    if (typeof renderThemePicker === 'function') renderThemePicker();
    sessionStorage.removeItem('hg_unsaved_theme');
    hideUnsavedBanner();
    toast('Thème sauvegardé — c\'est maintenant « Mon thème »', 'success');
  } catch { toast('Erreur sauvegarde thème', 'error'); }
}

async function saveIdentitySettings() {
  const name = document.getElementById('s-sitename').value.trim();
  if (!name) return toast('Nom requis', 'warn');
  try {
    // Sauvegarder dans PocketBase settings
    const r = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent("key='site_name'") + '&perPage=1');
    if (r.items.length) {
      await api.req('PATCH', '/api/collections/settings/records/' + r.items[0].id, { value: name });
    } else {
      await api.req('POST', '/api/collections/settings/records', { key: 'site_name', value: name });
    }
    sessionStorage.removeItem('hg_unsaved_name');
    hideUnsavedBanner();
    // Mettre à jour le DOM immédiatement
    document.querySelectorAll('.sidebar-logo > span').forEach(el => {
      const parts = name.match(/^(.*?)(\w+)$/);
      el.innerHTML = parts ? parts[1] + '<span style="color:var(--blue)">' + parts[2] + '</span>' : name;
    });
    document.title = name;
    toast('Nom sauvegardé', 'success');
  } catch { toast('Erreur sauvegarde', 'error'); }
}

async function loadSmtpSettings() {
  const wrap = document.getElementById('smtp-form-wrap');
  if (!wrap) return;
  try {
    const r = await api.req('GET', '/api/settings');
    const smtp = r.smtp || {};
    wrap.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Serveur SMTP</label>
          <input class="form-control" id="smtp-host" value="${smtp.host||''}">
        </div>
        <div class="form-group">
          <label>Port</label>
          <input class="form-control" id="smtp-port" value="${smtp.port||587}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Utilisateur</label>
          <input class="form-control" id="smtp-user" value="${smtp.username||''}">
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <input class="form-control" type="password" id="smtp-pass" placeholder="(inchangé si vide)">
        </div>
      </div>
      <div class="form-group">
        <label>Email expéditeur</label>
        <input class="form-control" id="smtp-from" value="${r.meta?.senderAddress||r.senderAddress||''}">
      </div>
      <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
        <button class="btn btn-ghost btn-sm" onclick="testSmtp()">Tester</button>
        <button class="btn btn-primary btn-sm" onclick="saveSmtpSettings()">Enregistrer</button>
      </div>`;
  } catch(e) {
    wrap.innerHTML = '<div style="color:var(--muted)">Impossible de charger la config SMTP</div>';
  }
}

async function saveSmtpSettings() {
  const host = document.getElementById('smtp-host').value.trim();
  const port = parseInt(document.getElementById('smtp-port').value) || 587;
  const user = document.getElementById('smtp-user').value.trim();
  const pass = document.getElementById('smtp-pass').value;
  const from = document.getElementById('smtp-from').value.trim();
  if (!pass) return toast('Mot de passe requis — PocketBase efface le mot de passe si ce champ est vide', 'warn', 5000);
  try {
    const body = { smtp: { enabled: !!host, host, port, username: user, password: pass, tls: port === 465 }, meta: { senderAddress: from } };
    await api.req('PATCH', '/api/settings', body);
    toast('SMTP enregistré', 'success');
  } catch { toast('Erreur SMTP', 'error'); }
}

async function testSmtp() {
  const from = document.getElementById('smtp-from').value.trim();
  if (!from) return toast('Email expéditeur requis', 'warn');
  try {
    await api.req('POST', '/api/settings/test/email', { email: from });
    toast('Email de test envoyé à ' + from, 'success', 4000);
  } catch { toast('Erreur envoi test', 'error'); }
}

async function pbSetSetting(key, value) {
  console.log('[pbSetSetting] key=' + key + ' token=' + (api.token ? 'ok' : 'MISSING'));
  const existing = await api.req('GET', `/api/collections/settings/records?filter=${encodeURIComponent("key='"+key+"'")}&perPage=1`).catch(e => { console.error('[pbSetSetting] GET error', e); return { items: [] }; });
  console.log('[pbSetSetting] existing=' + existing.items.length);
  if (existing.items.length) {
    await api.req('PATCH', `/api/collections/settings/records/${existing.items[0].id}`, { value });
    console.log('[pbSetSetting] PATCH ok');
  } else {
    await api.req('POST', '/api/collections/settings/records', { key, value });
    console.log('[pbSetSetting] POST ok');
  }
  localStorage.setItem(key, value);
}

async function pbDeleteSetting(key) {
  const existing = await api.req('GET', `/api/collections/settings/records?filter=${encodeURIComponent("key='"+key+"'")}&perPage=1`).catch(() => ({ items: [] }));
  if (existing.items.length) await api.req('DELETE', `/api/collections/settings/records/${existing.items[0].id}`).catch(() => {});
  localStorage.removeItem(key);
}

function previewDocLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    const b64 = ev.target.result;
    document.getElementById('doc-logo-preview').src = b64;
    document.getElementById('doc-logo-preview').style.display = '';
    document.getElementById('doc-logo-placeholder').style.display = 'none';
    const del = document.getElementById('doc-logo-del'); if (del) del.style.display = '';
    await pbSetSetting('doc_logo_b64', b64);
    toast('Logo documents enregistré', 'success', 2000);
  };
  reader.readAsDataURL(file);
}

async function clearDocLogo() {
  document.getElementById('doc-logo-preview').src = '';
  document.getElementById('doc-logo-preview').style.display = 'none';
  document.getElementById('doc-logo-placeholder').style.display = '';
  const del = document.getElementById('doc-logo-del'); if (del) del.style.display = 'none';
  await pbDeleteSetting('doc_logo_b64');
  toast('Logo documents supprimé', 'success', 2000);
}

function previewSignature(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    const b64 = ev.target.result;
    document.getElementById('sig-preview').src = b64;
    document.getElementById('sig-preview').style.display = '';
    document.getElementById('sig-placeholder').style.display = 'none';
    if (typeof SIGNATURE_B64 !== 'undefined') window.SIGNATURE_B64 = b64;
    const del = document.getElementById('sig-del'); if (del) del.style.display = '';
    try {
      await pbSetSetting('signature_b64', b64);
      toast('Signature enregistrée', 'success', 2000);
    } catch(e) {
      console.error('Erreur save signature', e);
      toast('Erreur enregistrement signature : ' + (e?.message || JSON.stringify(e)), 'error', 6000);
    }
  };
  reader.readAsDataURL(file);
}

async function clearSignature() {
  if (typeof SIGNATURE_B64 !== 'undefined') window.SIGNATURE_B64 = '';
  document.getElementById('sig-preview').src = '';
  document.getElementById('sig-preview').style.display = 'none';
  document.getElementById('sig-placeholder').style.display = '';
  const del = document.getElementById('sig-del'); if (del) del.style.display = 'none';
  await pbDeleteSetting('signature_b64');
  toast('Signature supprimée', 'success', 2000);
}

async function saveBillingSettings() {
  const vals = {
    name:    document.getElementById('b-name').value.trim(),
    legal:   document.getElementById('b-legal').value.trim(),
    address: document.getElementById('b-address').value.trim(),
    city:    document.getElementById('b-city').value.trim(),
    email:   document.getElementById('b-email').value.trim(),
    phone:   document.getElementById('b-phone').value.trim(),
    siret:   document.getElementById('b-siret').value.trim(),
    tva_num: document.getElementById('b-tva-num').value.trim(),
    iban:    document.getElementById('b-iban').value.trim(),
    bic:     document.getElementById('b-bic').value.trim(),
    rcs:     document.getElementById('b-rcs').value.trim(),
    website: document.getElementById('b-website').value.trim(),
    tva:     document.getElementById('b-tva').value,
  };
  if (typeof BUSINESS !== 'undefined') Object.assign(BUSINESS, vals);
  await pbSetSetting('business_settings', JSON.stringify(vals));
  toast('Facturation mise à jour', 'success', 3000);
}

async function saveAdminPassword() {
  const pwd1 = document.getElementById('s-pwd1').value;
  const pwd2 = document.getElementById('s-pwd2').value;
  if (!pwd1) return toast('Mot de passe requis', 'warn');
  if (pwd1 !== pwd2) return toast('Les mots de passe ne correspondent pas', 'error');
  if (pwd1.length < 8) return toast('8 caractères minimum', 'warn');
  try {
    const u = api.adminUser;
    await api.req('PATCH', `/api/collections/_superusers/records/${u.id}`, { password: pwd1, passwordConfirm: pwd2, oldPassword: pwd1 });
    toast('Mot de passe changé — reconnectez-vous', 'success', 5000);
    setTimeout(() => { api.logout(); location.reload(); }, 3000);
  } catch { toast('Erreur changement mot de passe', 'error'); }
}

// ── Logo upload via PocketBase settings collection ──
function previewLogoSettings(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('logo-preview-settings').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function uploadLogoSettings() {
  const input = document.getElementById('logo-upload-input');
  const file  = input.files[0];
  if (!file) return toast('Choisissez un fichier', 'warn');

  const progress = document.getElementById('logo-upload-progress');
  const bar      = document.getElementById('logo-upload-bar');
  progress.style.display = 'block';
  bar.style.width = '20%';

  try {
    // Stocker le logo en base64 dans la collection settings
    const reader = new FileReader();
    reader.onload = async (e) => {
      bar.style.width = '60%';
      const b64 = e.target.result; // data:image/png;base64,...

      // Vérifier si la clé existe déjà
      const existing = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent("key='logo_b64'") + '&perPage=1').catch(() => ({ items: [] }));

      if (existing.items.length) {
        await api.req('PATCH', '/api/collections/settings/records/' + existing.items[0].id, { value: b64 });
      } else {
        await api.req('POST', '/api/collections/settings/records', { key: 'logo_b64', value: b64 });
      }

      bar.style.width = '100%';
      // Mettre à jour tous les logos de la page
      document.querySelectorAll('img[src="/img/logo.png"], img[alt="Intervys"]').forEach(img => img.src = b64);
      toast('Logo mis à jour — rechargez pour appliquer partout', 'success', 4000);
      setTimeout(() => { progress.style.display = 'none'; bar.style.width = '0%'; }, 1000);
    };
    reader.readAsDataURL(file);
  } catch(e) {
    toast('Erreur upload : ' + e.message, 'error');
    progress.style.display = 'none';
  }
}

// ── Services : chargés et sauvegardés via PocketBase ──
async function loadServicesSettings() {
  const list = document.getElementById('services-list');
  if (!list) return;

  // Charger les overrides depuis PocketBase settings
  try {
    const r = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent("key='services_labels'") + '&perPage=1');
    if (r.items.length) {
      const overrides = JSON.parse(r.items[0].value);
      Object.assign(SERVICE_LABELS, overrides);
    }
  } catch {}

  list.innerHTML = Object.entries(SERVICE_LABELS).map(([k,v]) => `
    <div style="display:flex;align-items:center;gap:.75rem;padding:.6rem 0;border-bottom:1px solid var(--border2)">
      <div style="flex:1">
        <div style="font-weight:600;font-size:.88rem">${v}</div>
        <div style="font-size:.72rem;color:var(--muted);font-family:var(--FM)">${k}</div>
      </div>
      <span style="color:var(--blue);cursor:pointer;display:inline-flex;width:16px;height:16px" onclick="editServiceModal('${k}','${v.replace(/'/g,"\\'")}')" title="Modifier">${ico('edit')}</span>
      <span style="color:var(--red);cursor:pointer;display:inline-flex;width:16px;height:16px" onclick="deleteService('${k}')" title="Supprimer">${ico('trash')}</span>
    </div>`).join('');
}

async function saveServicesLabels() {
  try {
    const val = JSON.stringify(SERVICE_LABELS);
    const r = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent("key='services_labels'") + '&perPage=1');
    if (r.items.length) {
      await api.req('PATCH', '/api/collections/settings/records/' + r.items[0].id, { value: val });
    } else {
      await api.req('POST', '/api/collections/settings/records', { key: 'services_labels', value: val });
    }
  } catch(e) { throw e; }
}

function addServiceModal() {
  openModal(`
    <div class="modal-header">
      <span class="modal-title">Ajouter un service</span>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn btn-primary btn-sm" onclick="submitAddService()">Ajouter</button>
        <button class="modal-close">×</button>
      </div>
    </div>
    <div class="form-group">
      <label>Clé (identifiant interne, sans espace)</label>
      <input class="form-control" id="svc-key" placeholder="ex: soudure">
    </div>
    <div class="form-group">
      <label>Label affiché</label>
      <input class="form-control" id="svc-label" placeholder="ex: Soudure électronique">
    </div>
  `);
}

async function submitAddService() {
  const key   = document.getElementById('svc-key').value.trim().toLowerCase().replace(/\s+/g,'_');
  const label = document.getElementById('svc-label').value.trim();
  if (!key || !label) return toast('Clé et label requis', 'warn');
  SERVICE_LABELS[key] = label;
  await saveServicesLabels();
  closeModal();
  toast('Service ajouté', 'success');
  loadServicesSettings();
}

function editServiceModal(key, label) {
  openModal(`
    <div class="modal-header">
      <span class="modal-title">Modifier le service</span>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn btn-primary btn-sm" onclick="submitEditService('${key}')">Enregistrer</button>
        <button class="modal-close">×</button>
      </div>
    </div>
    <div class="form-group">
      <label>Clé</label>
      <input class="form-control" value="${key}" disabled style="opacity:.5">
    </div>
    <div class="form-group">
      <label>Label affiché</label>
      <input class="form-control" id="svc-edit-label" value="${label}">
    </div>
  `);
}

async function submitEditService(key) {
  const label = document.getElementById('svc-edit-label').value.trim();
  if (!label) return toast('Label requis', 'warn');
  SERVICE_LABELS[key] = label;
  await saveServicesLabels();
  closeModal();
  toast('Service mis à jour', 'success');
  loadServicesSettings();
}

async function deleteService(key) {
  if (!await confirm('Supprimer le service "' + SERVICE_LABELS[key] + '" ?')) return;
  delete SERVICE_LABELS[key];
  await saveServicesLabels();
  toast('Service supprimé', 'success');
  loadServicesSettings();
}

async function paSettings() {
  if (!requireAdmin()) return;
  renderAdminLayout("Paramètres PA", '<div class="spinner"></div>');

  let paUrl = '', clientId = '', clientSecret = '', paStatus = '';
  try {
    const recs = await api.req('GET',
      '/api/collections/settings/records?filter=' + encodeURIComponent("key~'pa_'") + '&perPage=10'
    ).catch(()=>({items:[]}));
    for (const r of (recs.items||[])) {
      if (r.key === 'pa_url')           paUrl         = r.value||'';
      if (r.key === 'pa_client_id')     clientId      = r.value||'';
      if (r.key === 'pa_client_secret') clientSecret  = r.value||'';
    }
    if (paUrl && clientId) paStatus = '✅ PA configurée';
  } catch(e) {}

  document.getElementById('page-content').innerHTML = `
    <div class="card card-table">
      <div class="card-header"><span class="card-title">Plateforme Agréée — AFNOR XP Z12-013</span></div>
      <p style="color:var(--muted);font-size:.84rem;margin-bottom:1.5rem;line-height:1.7">
        Intervys implémente la norme <strong style="color:var(--text)">AFNOR XP Z12-013</strong> —
        le standard universel OD ↔ PA. Compatible avec toute PA immatriculée
        qui respecte ce standard (Abby, Tiime, Pennylane, Chorus Pro…).
        <br><br>
        <span style="color:var(--blue)">📌 Septembre 2026 :</span> obligation de réception.<br>
        <span style="color:var(--blue)">📌 Septembre 2027 :</span> obligation d'émission pour les TPE/micro.
      </p>

      <div class="form-group">
        <label>URL de base de votre PA</label>
        <input class="form-control" id="pa-url" placeholder="https://api.votre-pa.fr/v1"
          value="${paUrl}">
        <div style="font-size:.74rem;color:var(--muted);margin-top:4px">
          Fournie par votre PA lors de l'inscription. Ex : https://api.votre-pa.fr/v1/e-invoice
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        <div class="form-group">
          <label>Client ID (OAuth2)</label>
          <input class="form-control" id="pa-client-id" placeholder="client_id…" value="${clientId}">
        </div>
        <div class="form-group">
          <label>Client Secret (OAuth2)</label>
          <input class="form-control" id="pa-client-secret" type="password"
            placeholder="client_secret…" value="${clientSecret}">
        </div>
      </div>

      ${paStatus ? `<div style="color:var(--green);font-size:.85rem;margin-bottom:1rem">${paStatus}</div>` : ''}

      <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1.5rem">
        <button class="btn btn-primary" onclick="savePaSettings()">Enregistrer</button>
        <button class="btn btn-ghost"   onclick="testPaConnection()">Tester la connexion</button>
      </div>

      <div style="padding:1rem;background:var(--bg3);border-radius:var(--r2);font-size:.8rem;color:var(--muted);line-height:2">
        <strong style="color:var(--text)">Workflow automatique lors d'une transmission :</strong><br>
        1. Clic "📤 Transmettre PA" sur une facture<br>
        2. Intervys génère le <strong>PDF Factur-X</strong> (EN 16931) en base64<br>
        3. <strong>OAuth2</strong> → token d'accès auprès de votre PA<br>
        4. <strong>POST /flows</strong> → envoi du Factur-X à la PA (norme Z12-013)<br>
        5. La PA route vers la PA du client · <strong>flowId</strong> stocké sur la facture
      </div>

      <div style="margin-top:1rem;padding:.75rem;background:rgba(30,144,255,.07);border-radius:var(--r2);border-left:3px solid var(--blue);font-size:.79rem;color:var(--muted)">
        <strong style="color:var(--blue)">PA sans clé API pour l'instant ?</strong>
        Pas de problème — utilisez le bouton <strong>⬇️ Factur-X PDF</strong> sur la facture
        pour télécharger le PDF au bon format, puis uploadez-le manuellement sur Abby/Tiime.
        Le standard est déjà prêt pour le jour où vous activez une PA.
      </div>
    </div>
  `;
}

async function savePaSettings() {
  const vals = {
    pa_url:           document.getElementById('pa-url')?.value?.trim(),
    pa_client_id:     document.getElementById('pa-client-id')?.value?.trim(),
    pa_client_secret: document.getElementById('pa-client-secret')?.value?.trim(),
  };
  if (!vals.pa_url) return toast("Entrez l'URL de la PA", "warn");
  try {
    const existing = await api.req('GET',
      '/api/collections/settings/records?filter=' + encodeURIComponent("key~'pa_'") + '&perPage=10'
    ).catch(()=>({items:[]}));
    const existMap = {};
    (existing.items||[]).forEach(r => existMap[r.key] = r.id);

    for (const [key, value] of Object.entries(vals)) {
      if (!value) continue;
      if (existMap[key]) {
        await api.req('PATCH', `/api/collections/settings/records/${existMap[key]}`, { value });
      } else {
        await api.req('POST', '/api/collections/settings/records', { key, value });
      }
    }
    toast('Configuration PA enregistrée', 'success');
    paSettings();
  } catch(e) { toast('Erreur : ' + (e.message||''), 'error'); }
}

async function testPaConnection() {
  const paUrl = document.getElementById('pa-url')?.value?.trim();
  if (!paUrl) return toast("Entrez l'URL de la PA d'abord", 'warn');
  toast('Test healthcheck...', 'info', 4000);
  try {
    const r = await fetch(paUrl.replace(/\/$/, '') + '/healthcheck', {
      method: 'GET', headers: { 'Accept': 'application/json' }
    });
    if (r.ok) toast('PA accessible (healthcheck OK)', 'success');
    else      toast('PA répond mais avec erreur ' + r.status, 'warn');
  } catch(e) {
    toast("PA inaccessible — vérifiez l'URL", "error");
  }
}


// ── LISTE INTERVENTIONS ──
async function adminInterventions(filter = '') {
  if (!requireAdmin()) return;
  renderAdminLayout('Interventions', '<div class="spinner"></div>');
  // Exclure toujours les archives des listes normales
  const baseFilter = filter
    ? `(${filter}) && status!='archive'`
    : "status!='archive'";
  try {
    const [data, usersData, linksData] = await Promise.all([
      api.getInterventions(baseFilter, '-updated'),
      api.getUsers().catch(() => ({ items: [] })),
      api.req('GET', '/api/collections/access_links/records?perPage=200&fields=id,client_name,client_email,intervention').catch(() => ({ items: [] })),
    ]);
    const usersMap = {};
    usersData.items.forEach(u => usersMap[u.id] = u);
    window._usersMap = usersMap; // cache pour interventionTable
    window._linksMap = {};
    linksData.items.forEach(l => { if(l.intervention) window._linksMap[l.intervention] = l; });
    document.getElementById('page-content').innerHTML = `
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1.5rem;align-items:center">
        <div style="position:relative;max-width:300px;flex:1">
          <div style="position:absolute;left:.6rem;top:50%;transform:translateY(-50%);color:var(--muted2);pointer-events:none;display:flex;width:16px;height:16px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input class="form-control" style="padding-left:2rem" placeholder="Rechercher par titre, appareil, client..." id="search-input"
            oninput="searchInterventions(this.value)" value="${filter.includes('~') ? '' : ''}">
        </div>
        <select class="form-control" style="max-width:200px"
          onchange="adminInterventions(this.value ? 'status=\\''+this.value+'\\'' : '')">
          <option value="">Tous les statuts</option>
          ${Object.entries(STATUS_LABELS).map(([k,v]) =>
            `<option value="${k}" ${filter.includes(k)?'selected':''}>${v.icon} ${v.label}</option>`
          ).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="closeSidebar();Router.navigate('/admin/interventions/new')">${ico('plus')} Nouvelle</button>
      </div>
      <div class="card">
        <div id="interventions-table">${interventionTable(data.items)}</div>
      </div>`;
    loadDocsCounts(data.items);
    updateTopbarBadges();
  } catch(e) { console.error(e); toast('Erreur chargement', 'error'); }
}


let _gsTimer = null;
async function globalSearch(q) {
  const box = document.getElementById('global-results');
  if (!q || q.length < 2) { box.innerHTML = ''; box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = '<div style="padding:.75rem 1rem;color:var(--muted);font-size:.82rem">Recherche...</div>';
  clearTimeout(_gsTimer);
  _gsTimer = setTimeout(async () => {
    try {
      const fi = encodeURIComponent(`title~'${q}' || device_info~'${q}' || description~'${q}' || admin_notes~'${q}'`);
      const fu = encodeURIComponent("name~'" + q + "' || email~'" + q + "'");
      const fq = encodeURIComponent(`number~'${q}' || client_name~'${q}' || client_email~'${q}'`);
      const [interventions, quotes, invoices, users] = await Promise.all([
        api.req('GET', `/api/collections/interventions/records?filter=${fi}&perPage=5&sort=-updated`),
        api.req('GET', `/api/collections/quotes/records?filter=${fq}&perPage=3&sort=-updated`),
        api.req('GET', `/api/collections/invoices/records?filter=${fq}&perPage=3&sort=-updated`),
        api.req('GET', `/api/collections/users/records?filter=${fu}&perPage=3&sort=name`),
      ]);

      let html = '';

      if (interventions.items.length) {
        html += `<div style="padding:.4rem 1rem;font-family:var(--FM);font-size:.65rem;color:var(--muted2);letter-spacing:.1em;text-transform:uppercase;border-bottom:1px solid var(--border2)">Interventions</div>`;
        html += interventions.items.map(i => `
          <div onclick="Router.navigate('/admin/intervention/${i.id}');document.getElementById('global-search').value='';document.getElementById('global-results').style.display='none'"
            style="padding:.6rem 1rem;cursor:pointer;border-bottom:1px solid var(--border2);display:flex;justify-content:space-between;align-items:center;gap:.5rem"
            onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
            <div>
              <div style="font-weight:600;font-size:.85rem">${i.title}</div>
              ${i.device_info ? `<div style="font-size:.75rem;color:var(--muted)">${i.device_info}</div>` : ''}
            </div>
            <span style="font-size:.7rem;color:${STATUS_LABELS[i.status]?.color||'var(--muted)'};white-space:nowrap">${STATUS_LABELS[i.status]?.label||i.status}</span>
          </div>`).join('');
      }

      if (quotes.items.length) {
        html += `<div style="padding:.4rem 1rem;font-family:var(--FM);font-size:.65rem;color:var(--muted2);letter-spacing:.1em;text-transform:uppercase;border-bottom:1px solid var(--border2)">Devis</div>`;
        html += quotes.items.map(d => `
          <div onclick="viewQuote('${d.id}');document.getElementById('global-search').value='';document.getElementById('global-results').style.display='none'"
            style="padding:.6rem 1rem;cursor:pointer;border-bottom:1px solid var(--border2);display:flex;justify-content:space-between;align-items:center"
            onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
            <div style="font-weight:600;font-size:.85rem">${d.number}</div>
            <div style="font-size:.78rem;color:var(--muted2)">${d.client_name} · ${formatEur(d.total)}</div>
          </div>`).join('');
      }

      if (users.items.length) {
        html += `<div style="padding:.4rem 1rem;font-family:var(--FM);font-size:.65rem;color:var(--muted2);letter-spacing:.1em;text-transform:uppercase;border-bottom:1px solid var(--border2)">Clients</div>`;
        html += users.items.map(u => `
          <div onclick="adminInterventions('user=\'${u.id}\'');document.getElementById('global-search').value='';document.getElementById('global-results').style.display='none'"
            style="padding:.6rem 1rem;cursor:pointer;border-bottom:1px solid var(--border2);display:flex;justify-content:space-between;align-items:center"
            onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
            <div style="font-weight:600;font-size:.85rem">${u.name||u.email}</div>
            <div style="font-size:.78rem;color:var(--muted2)">${u.email}</div>
          </div>`).join('');
      }

      if (invoices.items.length) {
        html += `<div style="padding:.4rem 1rem;font-family:var(--FM);font-size:.65rem;color:var(--muted2);letter-spacing:.1em;text-transform:uppercase;border-bottom:1px solid var(--border2)">Factures</div>`;
        html += invoices.items.map(d => `
          <div onclick="viewInvoice('${d.id}');document.getElementById('global-search').value='';document.getElementById('global-results').style.display='none'"
            style="padding:.6rem 1rem;cursor:pointer;border-bottom:1px solid var(--border2);display:flex;justify-content:space-between;align-items:center"
            onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
            <div style="font-weight:600;font-size:.85rem">${d.number}</div>
            <div style="font-size:.78rem;color:var(--muted2)">${d.client_name} · ${formatEur(d.total)}</div>
          </div>`).join('');
      }

      box.innerHTML = html || '<div style="padding:.75rem 1rem;color:var(--muted);font-size:.85rem">Aucun résultat</div>';
    } catch(e) { box.innerHTML = '<div style="padding:.75rem 1rem;color:var(--muted);font-size:.85rem">Erreur recherche</div>'; }
  }, 250);
}

async function searchInterventions(q) {
  const table = document.getElementById('interventions-table');
  if (!table) return;
  if (!q) {
    const [d, ud] = await Promise.all([api.getInterventions('','-updated'), api.getUsers().catch(()=>({items:[]}))]);
    ud.items.forEach(u => (window._usersMap||{})[u.id] = u);
    table.innerHTML = interventionTable(d.items);
    loadDocsCounts(d.items);
    return;
  }
  try {
    // Chercher les users correspondants au terme
    const usersMatch = await api.req('GET',
      `/api/collections/users/records?filter=name~"${q}"||email~"${q}"&perPage=50`
    ).catch(() => ({items:[]}));
    
    let filter = `title~"${q}" || device_info~"${q}"`;
    if (usersMatch.items.length) {
      const userFilters = usersMatch.items.map(u => `user="${u.id}"`).join(' || ');
      filter += ` || ${userFilters}`;
      // Mettre à jour le cache
      usersMatch.items.forEach(u => { if(window._usersMap) window._usersMap[u.id] = u; });
    }
    const d = await api.getInterventions(filter, '-updated');
    table.innerHTML = interventionTable(d.items);
    loadDocsCounts(d.items);
  } catch(e) {
    const d = await api.getInterventions(`title~"${q}" || device_info~"${q}"`, '-updated');
    table.innerHTML = interventionTable(d.items);
    loadDocsCounts(d.items);
  }
}

function interventionTable(items, isArchive = false) {
  if (!items.length) return `<div class="empty-state"><h3>Aucune intervention</h3></div>`;
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    // Vue cartes pour mobile
    return `<div style="display:flex;flex-direction:column;gap:.75rem">
      ${items.map(i => {
        const _u = (window._usersMap||{})[i.user];
        const _lk = (window._linksMap||{})[i.id];
        const clientName = i.expand?.user?.name || (_u ? (_u.name||_u.email) : '') || (_lk ? _lk.client_name||_lk.client_email : '') || '<em style="color:var(--muted)">Lien accès</em>';
        return `<div class="inv-card" onclick="Router.navigate('/admin/intervention/${i.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem">
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:.95rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.title}</div>
              ${i.device_info ? `<div style="font-size:.72rem;color:var(--muted);margin-top:2px">${i.device_info}</div>` : ''}
            </div>
            ${statusBadge(i.status)}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.6rem;flex-wrap:wrap;gap:.4rem">
            <div style="font-size:.78rem;color:var(--muted2)">${clientName} · ${SERVICE_LABELS[i.service]||i.service}</div>
            <div style="font-size:.72rem;color:var(--muted)">${timeAgo(i.updated)}</div>
          </div>
          <div style="margin-top:.6rem;display:flex;gap:4px;align-items:center;justify-content:flex-end" onclick="event.stopPropagation()">
            ${isArchive
              ? `<button class="btn btn-sm" style="color:var(--blue);background:none;border:none;display:inline-flex;padding:4px" title="Désarchiver" onclick="event.stopPropagation();unarchiveIntervention('${i.id}')">${ico('archive')}</button>`
              : `<button class="btn btn-sm" style="color:var(--blue);background:none;border:none;display:inline-flex;padding:4px" title="Modifier" onclick="event.stopPropagation();editInterventionModal('${i.id}')">${ico('edit')}</button>
                 <button class="btn btn-sm" style="color:var(--red);background:none;border:1px solid transparent;border-radius:4px;opacity:.7;display:inline-flex;padding:4px" title="Supprimer" onmouseover="this.style.opacity=1;this.style.borderColor='var(--red)'" onmouseout="this.style.opacity=.7;this.style.borderColor='transparent'" onclick="event.stopPropagation();deleteIntervention('${i.id}')">${ico('trash')}</button>`
            }
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // Vue tableau pour desktop
  return `<div class="table-wrap"><table>
    <thead><tr><th>Titre</th><th>Client</th><th>Service</th><th>Statut</th><th>Priorité</th><th style="text-align:center;font-size:.75rem">Devis</th><th style="text-align:center;font-size:.75rem">Factures</th><th>Mise à jour</th><th style="text-align:center;font-size:.75rem">Actions</th></tr></thead>
    <tbody>
    ${items.map(i => {
      const _u = (window._usersMap||{})[i.user];
      const _lk2 = (window._linksMap||{})[i.id];
      const clientName = i.expand?.user?.name || i.expand?.user?.email || (_u ? (_u.name||_u.email) : '') || (_lk2 ? _lk2.client_name||_lk2.client_email : '') || '<em style="color:var(--muted)">Lien accès</em>';
      return `<tr style="cursor:pointer" onclick="Router.navigate('/admin/intervention/${i.id}')">
        <td style="font-weight:600;max-width:220px">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.title}</div>
          ${i.device_info ? `<div style="font-size:.72rem;color:var(--muted);margin-top:2px">${i.device_info}</div>` : ''}
        </td>
        <td style="color:var(--muted2);font-size:.88rem">${clientName}</td>
        <td style="font-size:.8rem">${SERVICE_LABELS[i.service]||i.service}</td>
        <td>${statusBadge(i.status)}</td>
        <td>${priorityBadge(i.priority||'normale')}</td>
        <td style="text-align:center;font-size:.8rem" onclick="event.stopPropagation()">
          <span id="quotes-count-${i.id}" style="color:var(--muted)">—</span>
        </td>
        <td style="text-align:center;font-size:.8rem" onclick="event.stopPropagation()">
          <span id="invoices-count-${i.id}" style="color:var(--muted)">—</span>
        </td>
        <td style="color:var(--muted);font-size:.8rem;white-space:nowrap">${timeAgo(i.updated)}</td>
        <td style="text-align:center;font-size:.8rem" onclick="event.stopPropagation()">
          <span id="actions-btns-${i.id}"></span>
        </td>
      </tr>`;
    }).join('')}
    </tbody>
  </table></div>`;
}

// ── DETAIL INTERVENTION ──
async function adminInterventionDetail(id) {
  if (!requireAdmin()) return;
  if (window._invMsgPoll)    clearInterval(window._invMsgPoll);
  if (window._invStatusPoll) clearInterval(window._invStatusPoll);
  renderAdminLayout('Intervention', '<div class="spinner"></div>');
  try {
    const [inv, notes, colis, msgs] = await Promise.all([
      api.getIntervention(id),
      api.getNotes(id),
      api.getColis(id),
      api.getMessages(id),
    ]);
    await api.markMessagesRead(id);

    // Fetcher le user séparément si champ texte (non-relation)
    let userInfo = inv.expand?.user || null;
    if (!userInfo && inv.user) {
      try { userInfo = await api.getUser(inv.user); } catch {}
    }

    // Chercher le lien d'accès associé
    const linksData = inv.access_link
      ? await api.req('GET', `/api/collections/access_links/records?filter=id="${inv.access_link}"&perPage=1`).catch(() => null)
      : null;
    const accessLink = linksData?.items?.[0] || null;

    document.getElementById('page-content').innerHTML = `
      <div style="display:flex;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center">
        <button class="btn btn-ghost btn-sm" onclick="closeSidebar();Router.navigate('/admin/interventions')">← Retour</button>
        <code style="font-family:var(--FM);font-size:.7rem;color:var(--muted);background:var(--bg3);padding:4px 10px;border-radius:4px">${id}</code>
        <div style="flex:1"></div>
        <button class="btn btn-ghost btn-sm" onclick="editInterventionModal('${id}')" title="Modifier">${ico('edit')}</button>
        <div style="width:1px;height:20px;background:var(--border)"></div>
        <button class="btn btn-sm" style="color:var(--red);background:none;border:1px solid transparent;border-radius:4px;opacity:.7;display:inline-flex;padding:4px" title="Supprimer" onmouseover="this.style.opacity=1;this.style.borderColor='var(--red)'" onmouseout="this.style.opacity=.7;this.style.borderColor='transparent'" onclick="deleteIntervention('${id}')">${ico('trash')}</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 360px;gap:1.5rem">
        <!-- Colonne principale -->
        <div style="display:flex;flex-direction:column;gap:1.5rem">

          <!-- Infos principales -->
          <div class="card">
            <!-- En-tête : titre + statut + priorité -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.25rem;flex-wrap:wrap">
              <h2 style="font-size:1.15rem;margin:0;line-height:1.3">${inv.title}</h2>
              <div style="display:flex;gap:.5rem;align-items:center;flex-shrink:0">
                <select class="form-control" style="width:auto;padding:.25rem .7rem;font-size:.78rem;height:30px" onchange="quickUpdateStatus('${id}', this.value)">
                  ${Object.entries(STATUS_LABELS).map(([k,v]) => `<option value="${k}" ${inv.status===k?'selected':''}>${v.label}</option>`).join('')}
                </select>
                <select class="form-control" style="width:auto;padding:.25rem .7rem;font-size:.78rem;height:30px" onchange="quickUpdatePriority('${id}', this.value)">
                  ${Object.entries(PRIORITY_LABELS).map(([k,v]) => `<option value="${k}" ${(inv.priority||'normale')===k?'selected':''}>${v.label}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Tracker de progression -->
            <div id="admin-status-timeline" style="margin-bottom:1.5rem">
              ${renderStatusTimeline(inv.status)}
            </div>

            <!-- Champs structurés -->
            <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:1.25rem">
              ${inv.device_info ? `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem .9rem;background:var(--bg3);border-radius:6px 6px 0 0">
                <span style="font-size:.78rem;color:var(--muted)">Appareil</span>
                <span style="font-size:.85rem;font-weight:600">${inv.device_info}</span>
              </div>` : ''}
              <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:.6rem .9rem;background:var(--bg3);border-radius:${inv.device_info?'0':'6px 6px 0 0'}">
                <span style="font-size:.78rem;color:var(--muted);flex-shrink:0;margin-top:2px">Problème</span>
                <span style="font-size:.85rem;text-align:right;max-width:65%">${inv.description}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem .9rem;background:var(--bg3)">
                <span style="font-size:.78rem;color:var(--muted)">Client</span>
                <span style="font-size:.85rem;font-weight:600">
                  ${userInfo ? `${userInfo.name||'—'}${userInfo.phone?` <span style="color:var(--blue);font-weight:400;font-size:.8rem">· ${userInfo.phone}</span>`:''}` : accessLink ? `${accessLink.client_name||'—'} <span style="color:var(--muted);font-size:.75rem">🔗</span>` : '—'}
                </span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem .9rem;background:var(--bg3)">
                <span style="font-size:.78rem;color:var(--muted)">Service</span>
                <span style="font-size:.85rem">${SERVICE_LABELS[inv.service]||inv.service}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem .9rem;background:var(--bg3)">
                <span style="font-size:.78rem;color:var(--muted)">Prise en charge</span>
                <span style="font-size:.85rem">${fmtDateShort(inv.created)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem .9rem;background:var(--bg3);border-radius:0 0 6px 6px">
                <span style="font-size:.78rem;color:var(--muted)">Mise à jour</span>
                <span style="font-size:.85rem;color:var(--muted2)">${timeAgo(inv.updated)}</span>
              </div>
            </div>

            <!-- Actions client -->
            ${userInfo ? `<div style="display:flex;gap:.5rem">
              <button class="btn btn-ghost btn-sm" onclick="editClientModal('${userInfo.id}','${(userInfo.name||'').replace(/'/g,"\\'")}','${userInfo.email||''}','${userInfo.phone||''}')">Modifier client</button>
              ${userInfo.email ? `<a href="mailto:${userInfo.email}" class="btn btn-ghost btn-sm">📧 Email</a>` : ''}
            </div>` : ''}
          </div>

          <!-- Messagerie -->
          <div class="card">
            <div class="card-header"><span class="card-title">Messagerie</span></div>
            <div class="chat-wrap">
              <div class="chat-messages" id="chat-messages">${renderMessages(msgs.items, true)}</div>
              <div class="chat-input">
                <textarea id="msg-input" placeholder="Répondre au client..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAdminMsg('${id}')}"></textarea>
                <button class="btn btn-primary btn-sm" onclick="sendAdminMsg('${id}')" style="padding:.4rem .7rem;display:flex;align-items:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
              </div>
            </div>
          </div>

        </div>

        <!-- Colonne droite -->
        <div style="display:flex;flex-direction:column;gap:1.5rem">

          <!-- Facturation -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Facturation</span>
              <div style="display:flex;gap:.4rem">
                <button class="btn btn-ghost btn-sm" onclick="createDocFromIntervention('quote','${id}')">${ico('plus')} Devis</button>
                <button class="btn btn-ghost btn-sm" onclick="createDocFromIntervention('invoice','${id}')">${ico('plus')} Facture</button>
              </div>
            </div>
            <div id="inv-docs-list"><div class="spinner"></div></div>
          </div>



          <!-- Colis -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Colis</span>
              <button class="btn btn-ghost btn-sm" onclick="addColisModal('${id}')">${ico('plus')} Ajouter</button>
            </div>
            <div id="colis-list">${renderColis(colis.items)}</div>
          </div>

          <!-- Notes -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Notes</span>
              <div style="display:flex;gap:.5rem">
                <button class="btn btn-ghost btn-sm" onclick="addNoteModal('${id}', true)">${ico('plus')} Publique</button>
                <button class="btn btn-ghost btn-sm" onclick="addNoteModal('${id}', false)">${ico('plus')} Interne</button>
              </div>
            </div>
            <div id="notes-list">${renderNotes(notes.items)}</div>
          </div>

          <!-- Lien d'accès -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Lien d'accès</span>
              <button class="btn btn-ghost btn-sm" onclick="createLinkForIntervention('${id}')">${ico('plus')} Créer</button>
            </div>
            <div id="access-link-block">
              ${accessLink ? renderAccessLinkBlock(accessLink, id) : `<p style="color:var(--muted);font-size:.85rem">Aucun lien associé.<br>Créez un lien pour les clients sans compte.</p>`}
            </div>
          </div>


        </div>
      </div>`;

    // Charger les docs liés
    loadLinkedDocs(id);

    const chat = document.getElementById('chat-messages');
    if (chat) chat.scrollTop = chat.scrollHeight;

    if (window._adminMsgPoll) clearInterval(window._adminMsgPoll);
    window._adminMsgPoll = setInterval(() => {
      if (!document.getElementById('chat-messages')) { clearInterval(window._adminMsgPoll); return; }
      refreshMessages(id);
    }, 5000);
  } catch(e) { console.error(e); toast('Erreur chargement', 'error'); }
}

async function loadLinkedDocs(invId) {
  const container = document.getElementById('inv-docs-list');
  if (!container) return;
  try {
    // Essayer les deux formats de filtre PocketBase
    const f = encodeURIComponent("intervention='" + invId + "'");
    console.log('[loadLinkedDocs] invId=', invId, 'filter=', decodeURIComponent(f));
    const [quotes, invoices] = await Promise.all([
      api.req('GET', '/api/collections/quotes/records?filter=' + f + '&sort=-created&perPage=10'),
      api.req('GET', '/api/collections/invoices/records?filter=' + f + '&sort=-created&perPage=10'),
    ]);
    console.log('[loadLinkedDocs] quotes:', quotes.totalItems, 'invoices:', invoices.totalItems);
    const all = [
      ...quotes.items.map(d => ({...d, _type: 'quote'})),
      ...invoices.items.map(d => ({...d, _type: 'invoice'})),
    ].sort((a,b) => new Date(b.created) - new Date(a.created));

    if (!all.length) {
      container.innerHTML = '<p style="color:var(--muted);font-size:.82rem">Aucun document lié.</p>';
      return;
    }
    const totalHT = all.reduce((s, d) => s + (parseFloat(d.total) || 0), 0);
    container.innerHTML = all.map(d => {
      const icon   = d._type === 'quote' ? '📄' : '🧾';
      const colors = d._type === 'invoice'
        ? { brouillon:'var(--muted)', envoye:'var(--blue)', paye:'var(--green)', annule:'var(--red)' }
        : { brouillon:'var(--muted)', envoye:'var(--blue)', accepte:'var(--green)', refuse:'var(--red)', expire:'var(--orange)' };
      const statuses = d._type === 'invoice'
        ? { brouillon:'Brouillon', envoye:'Envoyé', paye:'Payé', annule:'Annulé' }
        : { brouillon:'Brouillon', envoye:'Envoyé', accepte:'Accepté', refuse:'Refusé', expire:'Expiré' };
      const canSend = d.client_email && d.status !== 'annule' && d.status !== 'refuse';
      return `<div style="padding:.55rem 0;border-bottom:1px solid var(--border2)">
        <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer"
          onclick="${d._type === 'quote' ? 'viewQuote' : 'viewInvoice'}('${d.id}')">
          <div>
            <div style="font-size:.82rem;font-weight:600">${icon} ${d.number}</div>
            <div style="font-size:.7rem;color:var(--muted)">${fmtDateShort(d.created)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;color:var(--blue);font-size:.88rem">${formatEur ? formatEur(d.total) : d.total + ' €'}</div>
            <div style="font-size:.7rem;color:${colors[d.status]||'var(--muted)'}">${statuses[d.status]||d.status}</div>
          </div>
        </div>
        ${canSend ? `<div style="margin-top:.35rem">
          <button class="btn btn-ghost btn-sm" style="font-size:.72rem;padding:.2rem .6rem;height:auto"
            onclick="event.stopPropagation();sendDocByEmail('${d.id}','${d._type}')">
            ✉️ Envoyer par email
          </button>
        </div>` : ''}
      </div>`;
    }).join('') + (all.length > 1 ? `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;margin-top:.25rem">
        <span style="font-size:.75rem;color:var(--muted)">Total ${all.length} documents</span>
        <span style="font-weight:800;font-size:.92rem;color:var(--blue)">${formatEur ? formatEur(totalHT) : totalHT.toFixed(2) + ' €'}</span>
      </div>` : '');
  } catch(e) {
    container.innerHTML = '<p style="color:var(--muted);font-size:.82rem">Erreur chargement.</p>';
  }
}

async function createDocFromIntervention(type, invId) {
  // Récupérer infos intervention + client pour pré-remplir
  try {
    const inv = await api.getIntervention(invId);
    let clientName = '', clientEmail = '', clientPhone = '';
    if (inv.user) {
      try {
        const u = await api.getUser(inv.user);
        clientName  = u.name  || '';
        clientEmail = u.email || '';
        clientPhone = u.phone || '';
      } catch {}
    } else if (inv.access_link) {
      try {
        const lk = await api.req('GET', `/api/collections/access_links/records/${inv.access_link}`);
        clientName  = lk.client_name  || '';
        clientEmail = lk.client_email || '';
      } catch {}
    }
    // Appeler newDocPage avec pré-remplissage
    const prefill = {
      intervention:   invId,
      client_name:    clientName,
      client_email:   clientEmail,
      client_phone:   clientPhone,
      notes:          'Intervention : ' + inv.title + (inv.device_info ? ' (' + inv.device_info + ')' : ''),
    };
    newDocPage(type, prefill);
  } catch(e) {
    toast('Erreur chargement intervention', 'error');
  }
}

function renderAccessLinkBlock(link, invId) {
  const url = `${window.location.origin}${window.location.pathname}#/access/${link.token}`;
  return `
    <div style="background:var(--bg3);border-radius:var(--r2);padding:.9rem">
      <div style="font-size:.82rem;font-weight:600;margin-bottom:.5rem">${link.client_name||'Client sans compte'}</div>
      ${link.client_email ? `<div style="font-size:.78rem;color:var(--muted2);margin-bottom:.5rem">✉️ ${link.client_email}</div>` : ''}
      <div style="font-family:var(--FM);font-size:.68rem;color:var(--muted);margin-bottom:.75rem">
        ${link.active ? '🟢 Actif' : '🔴 Inactif'}
        ${link.expires_at ? ' · Expire ' + fmtDateShort(link.expires_at) : ' · Pas d\'expiration'}
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="copyText('${url}')" style="flex:1">📋 Copier le lien</button>
        <button class="btn btn-ghost btn-sm" onclick="editAccessLinkModal('${link.id}','${invId}')" style="flex:1">${ico('edit')} Modifier</button>
      </div>
    </div>`;
}

// ── Render helpers ──
function renderMessages(items, isAdmin) {
  if (!items.length) return '<div style="text-align:center;color:var(--muted);font-size:.85rem;padding:2rem">Aucun message pour l\'instant</div>';
  return items.map(m => {
    const fromMe = isAdmin ? m.from_admin : !m.from_admin;
    return `<div class="msg ${fromMe?'from-me':'from-other'} ${m.from_admin?'from-admin':''}">
      <div class="msg-content">${m.content.replace(/\n/g,'<br>').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/&lt;br&gt;/g,'<br>')}</div>
      <div class="msg-meta">${m.from_admin ? `🔧 ${(window._customSiteName||SITE_NAME)}` : (m.sender_name||'Client')} · ${timeAgo(m.created)}</div>
    </div>`;
  }).join('');
}

function renderNotes(items) {
  if (!items.length) return '<p style="color:var(--muted);font-size:.85rem">Aucune note</p>';
  return `<div class="timeline">${items.map(n => `
    <div class="timeline-item">
      <div class="timeline-dot">${n.is_public ? '👁' : '🔒'}</div>
      <div class="timeline-content">
        <div class="timeline-date">
          ${n.is_public ? '<span style="color:var(--green);font-size:.65rem">PUBLIC</span>' : '<span style="color:var(--muted);font-size:.65rem">INTERNE</span>'}
          · ${fmtDate(n.created)} · ${n.author}
        </div>
        <div style="font-size:.88rem;line-height:1.7">${n.content}</div>
      </div>
      <button class="btn-icon" style="flex-shrink:0;color:var(--red)" onclick="deleteNote('${n.id}','${n.intervention}')">${ico('trash')}</button>
    </div>`).join('')}
  </div>`;
}

function renderColis(items) {
  if (!items.length) return '<p style="color:var(--muted);font-size:.85rem">Aucun colis</p>';
  return items.map(c => `
    <div style="background:var(--bg3);border-radius:var(--r2);padding:.9rem;margin-bottom:.75rem;border:1px solid var(--border2)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">
        <span style="font-weight:600;font-size:.88rem">${CARRIER_LABELS[c.carrier]||c.carrier}</span>
        <button class="btn-icon" onclick="deleteColis('${c.id}','${c.intervention}')" style="color:var(--red)">${ico('trash')}</button>
      </div>
      <div style="font-family:var(--FM);font-size:.78rem;color:var(--blue);margin-bottom:.3rem">${c.tracking_number}</div>
      <div style="font-size:.75rem;color:var(--muted)">${c.direction==='envoi_client'?'📤 Envoi au client':'📥 Retour client'}</div>
      ${c.tracking_url ? `<a href="${c.tracking_url}" target="_blank" class="btn btn-ghost btn-sm" style="margin-top:.5rem;display:inline-flex">🔗 Suivre</a>` : ''}
    </div>`).join('');
}

// ── Actions rapides ──
async function quickUpdateStatus(id, status) {
  try { await api.updateIntervention(id, { status }); toast(`Statut → ${STATUS_LABELS[status]?.label}`, 'success'); }
  catch { toast('Erreur', 'error'); }
}

async function quickUpdatePriority(id, priority) {
  try { await api.updateIntervention(id, { priority }); toast('Priorité mise à jour', 'success'); }
  catch { toast('Erreur', 'error'); }
}

async function saveAdminNotes(id) {
  try {
    await api.updateIntervention(id, { admin_notes: document.getElementById('admin-notes').value });
    toast('Notes sauvegardées', 'success');
  } catch { toast('Erreur', 'error'); }
}

async function sendAdminMsg(id) {
  const input = document.getElementById('msg-input');
  const content = input.value.trim();
  if (!content) return;
  input.value = '';
  try {
    await api.sendMessage(id, content, true, (window._customSiteName||SITE_NAME));
    await api.updateIntervention(id, { updated: new Date().toISOString() });
    await refreshMessages(id);
  } catch { toast('Erreur envoi', 'error'); }
}

async function refreshMessages(id) {
  const msgs = await api.getMessages(id);
  const chat = document.getElementById('chat-messages');
  if (!chat) return;
  chat.innerHTML = renderMessages(msgs.items, true);
  chat.scrollTop = chat.scrollHeight;
}

// ── Notes ──
function addNoteModal(invId, isPublic) {
  openModal(`
    <div class="modal-header">
      <span class="modal-title">${isPublic ? '👁 Note publique' : '🔒 Note interne'}</span>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn btn-primary btn-sm" onclick="submitNote('${invId}', ${isPublic})">Enregistrer</button>
        <button class="modal-close">×</button>
      </div>
    </div>
    <p style="font-size:.82rem;color:var(--muted);margin-bottom:1rem">${isPublic ? 'Visible par le client dans son suivi.' : 'Non visible par le client.'}</p>
    <div class="form-group">
      <label>Contenu</label>
      <textarea class="form-control" id="note-content" rows="5" placeholder="Contenu de la note..."></textarea>
    </div>

  `);
}

async function submitNote(invId, isPublic) {
  const content = document.getElementById('note-content').value.trim();
  if (!content) return toast('Contenu requis', 'warn');
  try {
    await api.createNote({ intervention: invId, content, is_public: isPublic, author: (window._customSiteName||SITE_NAME) });
    await api.updateIntervention(invId, { updated: new Date().toISOString() });
    closeModal();
    const notes = await api.getNotes(invId);
    document.getElementById('notes-list').innerHTML = renderNotes(notes.items);
    toast('Note ajoutée', 'success');
  } catch { toast('Erreur', 'error'); }
}

async function deleteNote(noteId, invId) {
  if (!await confirm('Supprimer cette note ?')) return;
  try {
    await api.deleteNote(noteId);
    await api.updateIntervention(invId, { updated: new Date().toISOString() });
    const notes = await api.getNotes(invId);
    document.getElementById('notes-list').innerHTML = renderNotes(notes.items);
    toast('Note supprimée', 'success');
  } catch { toast('Erreur', 'error'); }
}

// ── Colis ──
function addColisModal(invId) {
  openModal(`
    <div class="modal-header">
      <span class="modal-title">📦 Ajouter un colis</span>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn btn-primary btn-sm" onclick="submitColis('${invId}')">Enregistrer</button>
        <button class="modal-close">×</button>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Transporteur</label>
        <select class="form-control" id="c-carrier">
          ${Object.entries(CARRIER_LABELS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Direction</label>
        <select class="form-control" id="c-direction">
          <option value="envoi_client">📤 Envoi au client</option>
          <option value="retour_client">📥 Retour client</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Numéro de suivi *</label>
      <input class="form-control" id="c-number" placeholder="Ex: 1Z999AA10123456784">
    </div>
    <div class="form-group">
      <label>Lien de suivi</label>
      <input class="form-control" id="c-url" placeholder="https://...">
    </div>
    <div class="form-group">
      <label>Note</label>
      <input class="form-control" id="c-notes" placeholder="Contenu, remarques...">
    </div>

  `);
}

async function submitColis(invId) {
  const data = {
    intervention:    invId,
    carrier:         document.getElementById('c-carrier').value,
    direction:       document.getElementById('c-direction').value,
    tracking_number: document.getElementById('c-number').value.trim(),
    tracking_url:    document.getElementById('c-url').value.trim(),
    notes:           document.getElementById('c-notes').value.trim(),
  };
  if (!data.tracking_number) return toast('Numéro requis', 'warn');
  try {
    await api.createColis(data);
    await api.updateIntervention(invId, { updated: new Date().toISOString() });
    closeModal();
    const colis = await api.getColis(invId);
    document.getElementById('colis-list').innerHTML = renderColis(colis.items);
    toast('Colis enregistré', 'success');
  } catch { toast('Erreur', 'error'); }
}

async function deleteColis(colisId, invId) {
  if (!await confirm('Supprimer ce colis ?')) return;
  try {
    await api.deleteColis(colisId);
    await api.updateIntervention(invId, { updated: new Date().toISOString() });
    const colis = await api.getColis(invId);
    document.getElementById('colis-list').innerHTML = renderColis(colis.items);
    toast('Supprimé', 'success');
  } catch { toast('Erreur', 'error'); }
}

// ── Lien d'accès depuis intervention ──
async function createLinkForIntervention(invId) {
  const token = generateToken();
  const pwd   = generateToken(10).toUpperCase();
  // Pré-remplir avec les infos du client si dispo
  let clientName = '', clientEmail = '';
  try {
    const inv = await api.getIntervention(invId);
    clientName  = inv.expand?.user?.name  || '';
    clientEmail = inv.expand?.user?.email || '';
  } catch {}

  openModal(`
    <div class="modal-header">
      <span class="modal-title">🔗 Créer un lien d'accès</span>
      <button class="modal-close">×</button>
    </div>
    <p style="font-size:.82rem;color:var(--muted2);margin-bottom:1rem">Ce lien sera associé à cette intervention et permettra un accès sans compte.</p>
    <div class="form-row">
      <div class="form-group">
        <label>Nom du client</label>
        <input class="form-control" id="l-name" value="${clientName}" placeholder="Jean Dupont">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input class="form-control" id="l-email" value="${clientEmail}" placeholder="jean@exemple.fr">
      </div>
    </div>
    <div class="form-group">
      <label>Mot de passe (auto-généré)</label>
      <input class="form-control" id="l-password" value="${pwd}">
    </div>
    <div class="form-group">
      <label>Expiration (optionnel)</label>
      <input class="form-control" id="l-expires" type="date">
    </div>
    <div style="background:var(--bg3);border-radius:var(--r2);padding:1rem;margin-bottom:1rem;font-size:.82rem">
      <strong>Lien :</strong><br>
      <code style="color:var(--blue);word-break:break-all;font-size:.75rem">${window.location.origin}${window.location.pathname}#/access/${token}</code><br><br>
      <strong>Mot de passe :</strong> <code style="color:var(--c2)">${pwd}</code>
      <button class="btn btn-ghost btn-sm" style="margin-left:.5rem" onclick="copyText('${window.location.origin}${window.location.pathname}#/access/${token}\\nMot de passe : ${pwd}')">📋 Copier tout</button>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="submitLinkForIntervention('${token}','${invId}')">Créer le lien</button>
    </div>
  `);
}

async function submitLinkForIntervention(token, invId) {
  const password = document.getElementById('l-password').value.trim();
  const expires  = document.getElementById('l-expires').value;
  const hash     = await sha256(password);
  try {
    const link = await api.createAccessLink({
      token, password_hash: hash,
      client_name:  document.getElementById('l-name').value.trim(),
      client_email: document.getElementById('l-email').value.trim(),
      expires_at:   expires ? new Date(expires).toISOString() : '',
      active: true,
    });
    // Associer le lien à l'intervention
    await api.updateIntervention(invId, { access_link: link.id });
    closeModal();
    toast('Lien créé et associé à l\'intervention', 'success');
    // Rafraîchir le bloc lien d'accès
    const block = document.getElementById('access-link-block');
    if (block) block.innerHTML = renderAccessLinkBlock(link, invId);
  } catch(e) { console.error(e); toast('Erreur création lien', 'error'); }
}

// ── Edit lien d'accès ──
async function editAccessLinkModal(linkId, invId) {
  try {
    const link = await api.req('GET', `/api/collections/access_links/records/${linkId}`);
    const interventions = await api.getInterventions();
    openModal(`
      <div class="modal-header">
        <span class="modal-title">${ico('edit')} Modifier le lien d'accès</span>
        <div style="display:flex;gap:.5rem;align-items:center">
          <button class="btn btn-primary btn-sm" onclick="submitEditLink('${l.id}')">Enregistrer</button>
          <button class="modal-close">×</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Nom du client</label>
          <input class="form-control" id="el-name" value="${link.client_name||''}">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input class="form-control" id="el-email" value="${link.client_email||''}">
        </div>
      </div>
      <div class="form-group">
        <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
        <input class="form-control" id="el-password" placeholder="Nouveau mot de passe...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Expiration</label>
          <input class="form-control" id="el-expires" type="date" value="${link.expires_at ? link.expires_at.slice(0,10) : ''}">
        </div>
        <div class="form-group">
          <label>Statut</label>
          <select class="form-control" id="el-active">
            <option value="true" ${link.active?'selected':''}>✅ Actif</option>
            <option value="false" ${!link.active?'selected':''}>❌ Inactif</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Attribuer à une intervention</label>
        <select class="form-control" id="el-intervention">
          <option value="">— Non attribuée —</option>
          ${interventions.items.map(i => `<option value="${i.id}" ${invId===i.id?'selected':''}>${i.title.slice(0,50)}</option>`).join('')}
        </select>
      </div>
      <div style="background:var(--bg3);border-radius:var(--r2);padding:.75rem;margin-bottom:1rem">
        <span style="font-size:.75rem;color:var(--muted)">Lien actuel :</span><br>
        <code style="font-size:.72rem;color:var(--blue);word-break:break-all">${window.location.origin}${window.location.pathname}#/access/${link.token}</code>
        <button class="btn btn-ghost btn-sm" style="margin-top:.5rem;display:block" onclick="copyText('${window.location.origin}${window.location.pathname}#/access/${link.token}')">📋 Copier</button>
      </div>
      <div class="modal-footer">
        <button class="btn btn-danger btn-sm" onclick="deleteLink('${linkId}','${invId}')">Supprimer</button>
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="submitEditLink('${linkId}','${invId}')">Enregistrer</button>
      </div>
    `);
  } catch(e) { toast('Erreur chargement', 'error'); }
}

async function submitEditLink(linkId, invId) {
  const pwd      = document.getElementById('el-password').value.trim();
  const expires  = document.getElementById('el-expires').value;
  const newInvId = document.getElementById('el-intervention').value;
  const data = {
    client_name:  document.getElementById('el-name').value.trim(),
    client_email: document.getElementById('el-email').value.trim(),
    active:       document.getElementById('el-active').value === 'true',
    expires_at:   expires ? new Date(expires).toISOString() : '',
  };
  if (pwd) data.password_hash = await sha256(pwd);
  try {
    await api.updateAccessLink(linkId, data);
    // Mettre à jour l'attribution à l'intervention
    if (newInvId && newInvId !== invId) {
      if (invId) await api.updateIntervention(invId, { access_link: '' });
      await api.updateIntervention(newInvId, { access_link: linkId });
    }
    closeModal();
    toast('Lien mis à jour', 'success');
    if (invId) adminInterventionDetail(invId);
    else adminLinks();
  } catch { toast('Erreur', 'error'); }
}

async function deleteLink(linkId, invId) {
  if (!await confirm('Supprimer ce lien d\'accès ?')) return;
  try {
    await api.deleteAccessLink(linkId);
    if (invId) await api.updateIntervention(invId, { access_link: '' });
    closeModal();
    toast('Lien supprimé', 'success');
    if (invId) adminInterventionDetail(invId);
    else adminLinks();
  } catch { toast('Erreur', 'error'); }
}

// ── LISTE LIENS D'ACCÈS ──
async function adminLinks() {
  if (!requireAdmin()) return;
  renderAdminLayout('Liens', '<div class="spinner"></div>');
  try {
    const links = await api.getAccessLinks();
    document.getElementById('page-content').innerHTML = `
      <div style="margin-bottom:1.5rem">
        <button class="btn btn-primary btn-sm" onclick="createLinkStandalone()">${ico('plus')} Créer un lien d'accès</button>
      </div>
      <div class="card">
        ${!links.items.length
          ? '<div class="empty-state"><h3>Aucun lien créé</h3></div>'
          : window.innerWidth < 768
          ? `<div style="display:flex;flex-direction:column;gap:.6rem">
            ${links.items.map(l => `<div class="inv-card">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <div style="font-weight:700">${l.client_name||'—'}</div>
                  <div style="font-size:.78rem;color:var(--muted2)">${l.client_email||'—'}</div>
                </div>
                ${l.active ? '<span class="badge badge-termine">Actif</span>' : '<span class="badge badge-annule">Inactif</span>'}
              </div>
              <div style="font-size:.75rem;color:var(--muted);margin-top:.4rem">${l.expires_at ? fmtDateShort(l.expires_at) : '♾ Illimité'}</div>
              <div style="margin-top:.6rem;display:inline-flex;gap:8px;align-items:center">
                <span style="color:var(--muted2);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Copier le lien" onclick="copyLinkUrl('${l.token}')">${ico('link')}</span>
                <span style="color:var(--blue);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Modifier" onclick="editAccessLinkModal('${l.id}','${l.intervention||''}')">${ico('edit')}</span>
              </div>
            </div>`).join('')}
          </div>`
          : `<div class="table-wrap"><table>
            <thead><tr><th>Client</th><th>Email</th><th>Statut</th><th>Expiration</th><th>Intervention</th><th>Actions</th></tr></thead>
            <tbody>${links.items.map(l => `<tr>
              <td style="font-weight:600">${l.client_name||'—'}</td>
              <td style="color:var(--muted2)">${l.client_email||'—'}</td>
              <td>${l.active ? '<span class="badge badge-termine">Actif</span>' : '<span class="badge badge-annule">Inactif</span>'}</td>
              <td style="color:var(--muted);font-size:.82rem">${l.expires_at ? fmtDateShort(l.expires_at) : '♾ Illimité'}</td>
              <td style="font-size:.82rem">${l.intervention ? `<a onclick="Router.navigate('/admin/intervention/${l.intervention}')" style="cursor:pointer;color:var(--blue)">${l.intervention.slice(0,8)}…</a>` : '<span style="color:var(--muted)">Non attribuée</span>'}</td>
              <td onclick="event.stopPropagation()">
                <div style="display:flex;align-items:center;justify-content:center;gap:8px">
                  <span style="color:var(--muted2);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Copier le lien" onclick="copyLinkUrl('${l.token}')">${ico('link')}</span>
                  <span style="color:var(--blue);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Modifier" onclick="editAccessLinkModal('${l.id}','${l.intervention||''}')">${ico('edit')}</span>
                </div>
              </td>
            </tr>`).join('')}</tbody>
          </table></div>`
        }
      </div>`;
  } catch { toast('Erreur', 'error'); }
}

function copyLinkUrl(token) {
  const base = window.location.origin + window.location.pathname;
  copyText(`${base}#/access/${token}`);
}

async function createLinkStandalone() {
  const token = generateToken();
  const pwd   = generateToken(10).toUpperCase();
  openModal(`
    <div class="modal-header">
      <span class="modal-title">🔗 Nouveau lien d'accès</span>
      <button class="modal-close">×</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Nom du client</label>
        <input class="form-control" id="l-name" placeholder="Jean Dupont">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input class="form-control" id="l-email" placeholder="jean@exemple.fr">
      </div>
    </div>
    <div class="form-group">
      <label>Mot de passe (auto-généré)</label>
      <input class="form-control" id="l-password" value="${pwd}">
    </div>
    <div class="form-group">
      <label>Expiration (optionnel)</label>
      <input class="form-control" id="l-expires" type="date">
    </div>
    <div style="background:var(--bg3);border-radius:var(--r2);padding:.9rem;font-size:.82rem;margin-bottom:1rem">
      <strong>Lien :</strong><br>
      <code style="color:var(--blue);font-size:.75rem;word-break:break-all">${window.location.origin}${window.location.pathname}#/access/${token}</code><br>
      <strong style="margin-top:.5rem;display:block">Mot de passe :</strong> <code style="color:var(--c2)">${pwd}</code>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="submitCreateLinkStandalone('${token}')">Créer</button>
    </div>
  `);
}

async function submitCreateLinkStandalone(token) {
  const pwd = document.getElementById('l-password').value.trim();
  const exp = document.getElementById('l-expires').value;
  try {
    await api.createAccessLink({
      token, password_hash: await sha256(pwd),
      client_name:  document.getElementById('l-name').value.trim(),
      client_email: document.getElementById('l-email').value.trim(),
      expires_at:   exp ? new Date(exp).toISOString() : '',
      active: true,
    });
    closeModal();
    toast('Lien créé', 'success');
    adminLinks();
  } catch(e) { console.error(e); toast('Erreur', 'error'); }
}

// ── Nouvelle intervention ──
async function newInterventionPage() {
  if (!requireAdmin()) return;
  const usersHtml = await loadUsersOptions('');
  renderAdminLayout('Nouvelle intervention', `
    <div class="card card-table">
      <div class="card-header"><span class="card-title">Créer une intervention</span></div>
      ${interventionForm({}, usersHtml)}
      <div class="modal-footer" style="border:none;padding-top:1rem">
        <button class="btn btn-ghost" onclick="history.back()">Annuler</button>
        <button class="btn btn-primary" onclick="submitNewIntervention()">Créer l'intervention</button>
      </div>
    </div>
  `);
}

function interventionForm(inv = {}, usersHtml = '') {
  return `
    <div class="form-group">
      <label>Titre *</label>
      <input class="form-control" id="f-title" value="${inv.title||''}" placeholder="Ex: Réparation PC portable HP Pavilion">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Service *</label>
        <select class="form-control" id="f-service">
          ${Object.entries(SERVICE_LABELS).map(([k,v]) => `<option value="${k}" ${inv.service===k?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Priorité</label>
        <select class="form-control" id="f-priority">
          ${Object.entries(PRIORITY_LABELS).map(([k,v]) => `<option value="${k}" ${(inv.priority||'normale')===k?'selected':''}>${v.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Appareil / Modèle</label>
      <input class="form-control" id="f-device" value="${inv.device_info||''}" placeholder="Ex: HP Pavilion 15, Windows 11">
    </div>
    <div class="form-group">
      <label>Description *</label>
      <textarea class="form-control" id="f-desc" rows="5" placeholder="Décrivez le problème ou la demande...">${inv.description||''}</textarea>
    </div>
    <div class="form-group">
      <label>Client (optionnel)</label>
      <div style="display:flex;gap:.5rem;align-items:flex-start">
        <select class="form-control" id="f-user" style="flex:1">
          <option value="">— Aucun client associé —</option>
          ${usersHtml}
        </select>
        <button type="button" class="btn btn-ghost btn-sm" style="flex-shrink:0;white-space:nowrap" onclick="quickCreateClientForForm()">${ico('plus')} Nouveau</button>
      </div>
    </div>
  `;
}

function quickCreateClientForForm() {
  openModal(`
    <div class="modal-header">
      <span class="modal-title">Nouveau client</span>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn btn-primary btn-sm" onclick="submitQuickClient()">Créer</button>
        <button class="modal-close">×</button>
      </div>
    </div>
    <div class="form-group">
      <label>Nom *</label>
      <input class="form-control" id="qc-name" placeholder="Jean Dupont" autofocus>
    </div>
    <div class="form-group">
      <label>Email *</label>
      <input class="form-control" type="email" id="qc-email" placeholder="jean@exemple.fr">
    </div>
    <div class="form-group">
      <label>Téléphone</label>
      <input class="form-control" type="tel" id="qc-phone" placeholder="06 00 00 00 00">
    </div>
    <div class="form-group">
      <label>Adresse postale</label>
      <input class="form-control" id="qc-address" placeholder="12 rue de la Paix, 75001 Paris">
    </div>

  `);
}

async function submitQuickClient() {
  const name    = document.getElementById('qc-name').value.trim();
  const email   = document.getElementById('qc-email').value.trim();
  const phone   = document.getElementById('qc-phone').value.trim();
  const address = document.getElementById('qc-address').value.trim();
  if (!name || !email) return toast('Nom et email requis', 'warn');
  try {
    const pwd = Math.random().toString(36).slice(2) + 'Hg1!';
    const user = await api.register(email, pwd, pwd, name, phone);
    // Sauvegarder l'adresse si fournie
    if (address && user.id) {
      await api.updateUser(user.id, { address });
    }
    closeModal();
    toast('Client créé', 'success');
    const select = document.getElementById('f-user');
    if (select) {
      const opt = document.createElement('option');
      opt.value = user.id;
      opt.textContent = name + ' (' + email + ')';
      opt.selected = true;
      select.appendChild(opt);
    }
  } catch(e) {
    const msg = e.data?.email?.message || 'Erreur création client';
    toast(msg, 'error');
  }
}

async function loadUsersOptions(selectedId = '') {
  try {
    const users = await api.getUsers();
    return users.items.map(u =>
      `<option value="${u.id}" ${u.id === selectedId ? 'selected' : ''}>${u.name || u.email}</option>`
    ).join('');
  } catch { return ''; }
}

async function submitNewIntervention() {
  const data = {
    title:       document.getElementById('f-title').value.trim(),
    service:     document.getElementById('f-service').value,
    priority:    document.getElementById('f-priority').value,
    device_info: document.getElementById('f-device').value.trim(),
    description: document.getElementById('f-desc').value.trim(),
    status:      'nouveau',
    user:        document.getElementById('f-user')?.value || '',
  };
  if (!data.title || !data.description) return toast('Titre et description requis', 'warn');
  try {
    const inv = await api.createIntervention(data);
    toast('Intervention créée', 'success');
    Router.navigate(`/admin/intervention/${inv.id}`);
  } catch { toast('Erreur création', 'error'); }
}

async function editInterventionModal(id) {
  const inv = await api.getIntervention(id);
  const usersHtml = await loadUsersOptions(inv.user || '');
  openModal(`
    <div class="modal-header">
      <span class="modal-title">${ico('edit')} Modifier</span>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn btn-primary btn-sm" onclick="submitEditIntervention('${id}')">Enregistrer</button>
        <button class="modal-close">×</button>
      </div>
    </div>
    ${interventionForm(inv, usersHtml)}

  `);
}

async function submitEditIntervention(id) {
  const data = {
    title:       document.getElementById('f-title').value.trim(),
    service:     document.getElementById('f-service').value,
    priority:    document.getElementById('f-priority').value,
    device_info: document.getElementById('f-device').value.trim(),
    description: document.getElementById('f-desc').value.trim(),
    user:        document.getElementById('f-user')?.value || '',
  };
  try {
    await api.updateIntervention(id, data);
    closeModal();
    toast('Mis à jour', 'success');
    adminInterventionDetail(id);
  } catch { toast('Erreur', 'error'); }
}

async function deleteIntervention(id) {
  // Vérifier si des factures existent pour cette intervention
  const fp = encodeURIComponent(`intervention='${id}'`);
  const invoices = await api.req('GET', `/api/collections/invoices/records?filter=${fp}&perPage=1&fields=id`);
  if (invoices.totalItems > 0) {
    openModal(`
      <div class="modal-header">
        <span class="modal-title">Suppression impossible</span>
        <button class="modal-close">×</button>
      </div>
      <p style="color:var(--muted2);margin-bottom:.75rem">Cette intervention a des <strong>factures associées</strong> et ne peut pas être supprimée.</p>
      <p style="color:var(--muted2);margin-bottom:1.5rem">Vous pouvez l'<strong>archiver</strong> pour la masquer des listes actives.</p>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="closeModal();archiveIntervention('${id}')">Archiver</button>
      </div>
    `);
    return;
  }
  if (!await confirm('Supprimer définitivement cette intervention et ses devis liés ?')) return;
  try {
    // Supprimer les devis liés
    const quotes = await api.req('GET', `/api/collections/quotes/records?filter=${fp}&perPage=50&fields=id`);
    await Promise.all(quotes.items.map(q => api.req('DELETE', `/api/collections/quotes/records/${q.id}`)));
    await api.deleteIntervention(id);
    toast('Intervention et devis supprimés', 'success');
    Router.navigate('/admin/interventions');
  } catch { toast('Erreur suppression', 'error'); }
}

async function archiveIntervention(id) {
  try {
    await api.updateIntervention(id, { status: 'archive' });
    toast('Intervention archivée', 'success');
    Router.navigate('/admin/interventions');
  } catch { toast('Erreur archivage', 'error'); }
}

async function unarchiveIntervention(id) {
  try {
    await api.updateIntervention(id, { status: 'annule' });
    toast('Intervention désarchivée', 'success');
    Router.navigate('/admin/archives');
  } catch { toast('Erreur', 'error'); }
}

async function adminArchives() {
  if (!requireAdmin()) return;
  renderAdminLayout('Archives', '<div class="spinner"></div>');
  try {
    const [data, usersData, linksData3] = await Promise.all([
      api.getInterventions("status='archive'", '-updated'),
      api.getUsers().catch(() => ({ items: [] })),
      api.req('GET', '/api/collections/access_links/records?perPage=200&fields=id,client_name,client_email,intervention').catch(() => ({ items: [] })),
    ]);
    const usersMap = {};
    usersData.items.forEach(u => usersMap[u.id] = u);
    window._usersMap = usersMap;
    window._linksMap = window._linksMap || {};
    linksData3.items.forEach(l => { if(l.intervention) window._linksMap[l.intervention] = l; });
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Interventions archivées (${data.totalItems})</span>
        </div>
        ${!data.items.length
          ? '<div class="empty-state"><h3>Aucune intervention archivée</h3></div>'
          : interventionTable(data.items, true)
        }
      </div>`;
    if (data.items.length) loadDocsCounts(data.items);
  } catch { toast('Erreur', 'error'); }
}

// ── Helpers ──
function createClientModal() {
  openModal(`
    <div class="modal-header">
      <span class="modal-title">${ico('plus')} Créer un compte client</span>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn btn-primary btn-sm" onclick="submitCreateClient()">Créer</button>
        <button class="modal-close">×</button>
      </div>
    </div>
    <div class="form-group">
      <label>Nom complet *</label>
      <input class="form-control" id="cc-name" placeholder="Jean Dupont">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Email *</label>
        <input class="form-control" type="email" id="cc-email" placeholder="jean@exemple.fr">
      </div>
      <div class="form-group">
        <label>Téléphone</label>
        <input class="form-control" type="tel" id="cc-phone" placeholder="06 00 00 00 00">
      </div>
    </div>
    <div class="form-group">
      <label>Mot de passe provisoire *</label>
      <div style="display:flex;gap:.5rem">
        <input class="form-control" id="cc-pwd" placeholder="8 caractères minimum">
        <button class="btn btn-ghost btn-sm" style="white-space:nowrap" onclick="document.getElementById('cc-pwd').value=generateToken(10).toUpperCase()">Générer</button>
      </div>
    </div>

  `);
}

async function submitCreateClient() {
  const name  = document.getElementById('cc-name').value.trim();
  const email = document.getElementById('cc-email').value.trim();
  const phone = document.getElementById('cc-phone').value.trim();
  const pwd   = document.getElementById('cc-pwd').value.trim();
  if (!name || !email || !pwd) return toast('Nom, email et mot de passe requis', 'warn');
  if (pwd.length < 8) return toast('Mot de passe trop court (8 min)', 'warn');
  try {
    await api.req('POST', '/api/collections/users/records', {
      name, email, phone,
      password: pwd, passwordConfirm: pwd,
      emailVisibility: false,
    });
    closeModal();
    toast('Compte client créé', 'success');
    adminClients();
  } catch(e) {
    const msg = e.data?.email?.message || 'Email déjà utilisé ou erreur';
    toast(msg, 'error');
  }
}

function requireAdmin() {
  if (!api.isLoggedIn || !api.isAdmin) { Router.navigate('/admin-login'); return false; }
  return true;
}

function doLogout() {
  api.logout();
  Router.navigate('/admin-login');
}

async function updateUnreadBadge() {
  const count = await api.getUnreadCount();
  const badge = document.getElementById('unread-badge');
  if (badge && count > 0) { badge.textContent = count; badge.style.display = 'inline'; }
}

function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const isOpen  = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  if (overlay) overlay.classList.toggle('visible', !isOpen);
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
}

function ico(name) {
  const icons = {
    grid:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    tool:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    plus:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    users:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    link:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    msg:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    logout:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    dollar:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    bell:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    courthouse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><rect x="2" y="8" width="20" height="14"/><path d="M12 2L2 8h20L12 2z"/><line x1="7" y1="22" x2="7" y2="12"/><line x1="12" y1="22" x2="12" y2="12"/><line x1="17" y1="22" x2="17" y2="12"/></svg>',
    doc:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    receipt:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2V4a2 2 0 0 0-2-2z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    edit:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    archive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
    send:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    eye:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  };
  return icons[name] || '';
}

// ════════════════════════════════════════
// MISES À JOUR
// ════════════════════════════════════════

async function loadUpdateTab() {
  try {
    const r = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent("key='app_version' || key='app_update_url'") + '&perPage=5');
    const map = {};
    for (const item of (r.items || [])) map[item.key] = item.value;
    const verEl = document.getElementById('upd-current');
    if (verEl) verEl.textContent = map.app_version || '1.0.0';
    const urlEl = document.getElementById('upd-url');
    if (urlEl) urlEl.value = map.app_update_url || 'https://homegeek.fr/Intervys/latest.json';
  } catch(e) { console.warn('loadUpdateTab', e); }
}

async function checkForUpdates() {
  const result = document.getElementById('upd-result');
  if (!result) return;
  result.innerHTML = '<div style="color:var(--muted2);font-size:.85rem">⏳ Vérification en cours…</div>';
  try {
    const data = await api.req('GET', '/api/iv-check');
    if (!data.needs_update) {
      result.innerHTML = `<div style="padding:.75rem 1rem;background:var(--bg2);border-radius:var(--r);font-size:.85rem;color:var(--muted2)">✅ Vous êtes à jour (v${data.current})</div>`;
      return;
    }
    const notes = (data.notes || []).map(n => `<li>${n}</li>`).join('');
    result.innerHTML = `
      <div style="padding:.75rem 1rem;background:rgba(var(--blue-rgb),.07);border:1px solid rgba(var(--blue-rgb),.18);border-radius:var(--r);margin-bottom:.75rem">
        <div style="font-weight:700;margin-bottom:.3rem">Nouvelle version disponible : v${data.latest} <span style="font-size:.78rem;font-weight:400;color:var(--muted2)">${data.date}</span></div>
        ${notes ? `<ul style="font-size:.83rem;color:var(--muted2);margin:.4rem 0 .4rem 1.2rem;padding:0">${notes}</ul>` : ''}
        <div style="font-size:.78rem;color:var(--muted2)">${data.files_count} fichier(s) à mettre à jour</div>
      </div>
      <button class="btn btn-primary" onclick="applyUpdate()" id="upd-apply-btn">⬇️ Mettre à jour</button>
    `;
  } catch(e) {
    result.innerHTML = `<div style="color:#f87171;font-size:.85rem;padding:.5rem">Erreur : ${e.message || e}</div>`;
  }
}

async function applyUpdate() {
  const btn = document.getElementById('upd-apply-btn');
  const result = document.getElementById('upd-result');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Mise à jour en cours…'; }
  try {
    const data = await api.req('POST', '/api/iv-update', {});
    const verEl = document.getElementById('upd-current');
    if (verEl) verEl.textContent = data.version;
    const upd = (data.updated || []).map(f => `<li>✅ ${f}</li>`).join('');
    const err = (data.errors || []).map(e => `<li style="color:#f87171">⚠️ ${e}</li>`).join('');
    result.innerHTML = `
      <div style="padding:.75rem 1rem;background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.2);border-radius:var(--r)">
        <div style="font-weight:700;margin-bottom:.5rem">🎉 Mise à jour v${data.version} appliquée</div>
        <ul style="font-size:.82rem;color:var(--muted2);margin:0 0 0 1rem;padding:0">${upd}${err}</ul>
        <div style="font-size:.78rem;margin-top:.75rem;color:var(--muted2)">Rechargez la page (Ctrl+Shift+R) pour activer les changements.</div>
      </div>
    `;
  } catch(e) {
    result.innerHTML = `<div style="color:#f87171;font-size:.85rem;padding:.5rem">Erreur : ${e.message || e}</div>`;
    if (btn) { btn.disabled = false; btn.textContent = '⬇️ Mettre à jour'; }
  }
}

async function saveUpdateUrl() {
  const url = document.getElementById('upd-url')?.value?.trim();
  if (!url) return;
  await pbSetSetting('app_update_url', url);
  showToast('URL de mise à jour enregistrée');
}

// ════════════════════════════════════════
// PROFIL ADMIN
// ════════════════════════════════════════

async function loadAdminProfile() {
  const u = api.adminUser;
  if (!u) return;
  const emailEl = document.getElementById('s-admin-email');
  if (emailEl) emailEl.value = u.email || '';
  try {
    const r = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent("key='admin_display_name'") + '&perPage=1');
    const item = (r.items || [])[0];
    const nameEl = document.getElementById('s-admin-name');
    if (nameEl) nameEl.value = item?.value || u.name || '';
  } catch(e) {}
}

async function saveAdminProfile() {
  const name  = document.getElementById('s-admin-name')?.value?.trim();
  const email = document.getElementById('s-admin-email')?.value?.trim();
  const u = api.adminUser;
  if (!u) return;
  try {
    if (email && email !== u.email) {
      await api.req('PATCH', `/api/collections/_superusers/records/${u.id}`, { email });
      api.user.email = email;
      localStorage.setItem('hg_user', JSON.stringify(api.user));
    }
    if (name) {
      await pbSetSetting('admin_display_name', name);
      window._adminDisplayName = name;
    }
    showToast('Profil mis à jour');
  } catch(e) { showToast('Erreur : ' + (e.message || e), 'error'); }
}

// ════════════════════════════════════════
// ÉQUIPE — GESTION DES COLLABORATEURS
// ════════════════════════════════════════

const _TEAM_SECTIONS = [
  ['interventions','🔧 Interventions'],
  ['archives','🗂 Archives'],
  ['clients','👤 Clients'],
  ['links','🔗 Liens d\'accès'],
  ['billing','💶 Facturation complète'],
  ['quotes','📄 Devis seuls'],
  ['messages','💬 Messages'],
  ['settings','⚙️ Paramètres'],
];

async function _loadStaffPerms() {
  try {
    const r = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent("key='staff_perms'") + '&perPage=1');
    const item = (r.items || [])[0];
    return item?.value ? JSON.parse(item.value) : {};
  } catch(e) { return {}; }
}

async function _saveStaffPerms(perms) {
  await pbSetSetting('staff_perms', JSON.stringify(perms));
}

async function loadTeamSettings() {
  const perms = await _loadStaffPerms();
  _renderTeamList(perms);
}

function _renderTeamList(perms) {
  const container = document.getElementById('team-list');
  if (!container) return;
  const entries = Object.entries(perms);
  if (!entries.length) {
    container.innerHTML = '<div style="color:var(--muted2);font-size:.85rem;padding:.5rem 0">Aucun collaborateur pour l\'instant.</div>';
    return;
  }
  container.innerHTML = entries.map(([uid, info]) => `
    <div style="background:var(--bg2);border-radius:var(--r);margin-bottom:.5rem;overflow:hidden">
      <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;flex-wrap:wrap">
        <div style="width:34px;height:34px;border-radius:50%;background:rgba(var(--blue-rgb),.15);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0;color:var(--blue)">
          ${(info.name||info.email||'?').slice(0,2).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.88rem">${info.name||''} <span style="font-size:.78rem;color:var(--muted2)">${info.email||uid}</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.35rem">
            ${_TEAM_SECTIONS.map(([v,l]) => {
              const has = (info.sections||[]).includes(v);
              return `<label style="display:flex;align-items:center;gap:.3rem;font-size:.75rem;cursor:pointer;padding:.2rem .5rem;border-radius:20px;border:1px solid ${has?'var(--blue)':'var(--border)'};background:${has?'rgba(var(--blue-rgb),.08)':'transparent'}">
                <input type="checkbox" ${has?'checked':''} data-uid="${uid}" data-sec="${v}" onchange="updateStaffSection(this)" style="accent-color:var(--blue);width:12px;height:12px"> ${l}
              </label>`;
            }).join('')}
          </div>
        </div>
        <div style="display:flex;gap:.4rem;flex-shrink:0">
          <button class="btn btn-ghost btn-sm" onclick="toggleStaffPwdForm('${uid}')" title="Changer le mot de passe">🔑</button>
          <button class="btn btn-ghost btn-sm" style="color:#f87171;border-color:#f87171" onclick="removeStaffAccess('${uid}')">✕ Retirer</button>
        </div>
      </div>
      <div id="staff-pwd-${uid}" style="display:none;padding:.75rem 1rem;border-top:1px solid var(--border);background:var(--surface)">
        <div style="font-size:.8rem;font-weight:600;margin-bottom:.5rem;color:var(--muted2)">Nouveau mot de passe pour ${info.name||info.email}</div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:flex-end">
          <input type="password" id="staff-pwd1-${uid}" class="form-control" placeholder="8 caractères minimum" style="max-width:200px">
          <input type="password" id="staff-pwd2-${uid}" class="form-control" placeholder="Confirmer" style="max-width:200px">
          <button class="btn btn-primary btn-sm" onclick="changeStaffPassword('${uid}')">Enregistrer</button>
          <button class="btn btn-ghost btn-sm" onclick="toggleStaffPwdForm('${uid}')">Annuler</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function addStaffUser() {
  const email = document.getElementById('team-email')?.value?.trim();
  const name  = document.getElementById('team-name')?.value?.trim();
  const pwd   = document.getElementById('team-pwd')?.value || '';
  const pwd2  = document.getElementById('team-pwd2')?.value || '';
  if (!email) return showToast('Email requis', 'warn');
  if (pwd && pwd !== pwd2) return showToast('Les mots de passe ne correspondent pas', 'error');
  if (pwd && pwd.length < 8) return showToast('Mot de passe : 8 caractères minimum', 'warn');
  const checked = [...document.querySelectorAll('input[name="team-perm"]:checked')].map(c => c.value);
  try {
    const r = await api.req('GET', '/api/collections/users/records?filter=' + encodeURIComponent(`email='${email}'`) + '&perPage=1');
    let user = (r.items || [])[0];
    if (!user) {
      if (!pwd) return showToast('Compte inexistant — saisissez un mot de passe pour le créer', 'warn');
      user = await api.req('POST', '/api/collections/users/records', {
        email, password: pwd, passwordConfirm: pwd,
        name: name || email.split('@')[0],
        emailVisibility: false, verified: true
      });
      showToast('Compte créé');
    } else if (pwd) {
      await api.req('PATCH', '/api/collections/users/records/' + user.id, { password: pwd, passwordConfirm: pwd });
      showToast('Mot de passe mis à jour');
    }
    const perms = await _loadStaffPerms();
    perms[user.id] = { email: user.email, name: name || user.name || email.split('@')[0], sections: checked };
    await _saveStaffPerms(perms);
    window._cachedStaffPerms = perms;
    document.getElementById('team-add-form').style.display = 'none';
    ['team-email','team-name','team-pwd','team-pwd2'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    _renderTeamList(perms);
    showToast('Collaborateur ajouté');
  } catch(e) { showToast('Erreur : ' + (e.message || e), 'error'); }
}

async function updateStaffSection(checkbox) {
  const uid = checkbox.dataset.uid;
  const sec = checkbox.dataset.sec;
  const perms = await _loadStaffPerms();
  if (!perms[uid]) return;
  const sections = perms[uid].sections || [];
  if (checkbox.checked) { if (!sections.includes(sec)) sections.push(sec); }
  else { const i = sections.indexOf(sec); if (i !== -1) sections.splice(i, 1); }
  perms[uid].sections = sections;
  await _saveStaffPerms(perms);
  window._cachedStaffPerms = perms;
  _renderTeamList(perms);
  showToast('Droits mis à jour');
}

async function removeStaffAccess(uid) {
  if (!confirm('Retirer l\'accès admin à ce collaborateur ?')) return;
  const perms = await _loadStaffPerms();
  delete perms[uid];
  await _saveStaffPerms(perms);
  window._cachedStaffPerms = perms;
  _renderTeamList(perms);
  showToast('Accès retiré');
}

function toggleStaffPwdForm(uid) {
  const el = document.getElementById('staff-pwd-' + uid);
  if (!el) return;
  const visible = el.style.display !== 'none';
  el.style.display = visible ? 'none' : 'block';
  if (!visible) { const p = document.getElementById('staff-pwd1-' + uid); if(p) p.focus(); }
}

async function changeStaffPassword(uid) {
  const pwd  = document.getElementById('staff-pwd1-' + uid)?.value || '';
  const pwd2 = document.getElementById('staff-pwd2-' + uid)?.value || '';
  if (!pwd) return showToast('Saisissez un nouveau mot de passe', 'warn');
  if (pwd.length < 8) return showToast('8 caractères minimum', 'warn');
  if (pwd !== pwd2) return showToast('Les mots de passe ne correspondent pas', 'error');
  try {
    await api.req('PATCH', '/api/collections/users/records/' + uid, { password: pwd, passwordConfirm: pwd });
    toggleStaffPwdForm(uid);
    showToast('Mot de passe mis à jour');
  } catch(e) { showToast('Erreur : ' + (e.message || e), 'error'); }
}

