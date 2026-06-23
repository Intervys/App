
// ── Page login SSO Authelia ──
function renderAdminLoginSSO() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        ${(()=>{const s=localStorage.getItem('hg_logo_size')||'150';return `<div class="login-logo"><img src="${window._customLogo || 'img/logo.png'}" style="height:${s}px;width:auto"></div>`;})()}
        ${localStorage.getItem('hg_show_title') !== 'false' ? `<h2 class="login-title">${window._customSiteName || SITE_NAME}</h2>` : ''}
        <div style="display:inline-flex;align-items:center;gap:.4rem;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:20px;padding:.3rem .9rem;font-size:.78rem;color:#86efac;margin-bottom:1.5rem">
          ✓ Authelia SSO vérifié
        </div>
        <div class="form-group">
          <label>EMAIL ADMIN</label>
          <input class="form-control" type="email" id="a-email" placeholder="admin@Intervys.local" autofocus>
        </div>
        <div class="form-group">
          <label>MOT DE PASSE ADMIN</label>
          <input class="form-control" type="password" id="a-pwd" placeholder="••••••••" onkeydown="if(event.key==='Enter')doAdminLoginSSO()">
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="doAdminLoginSSO()">Accéder au tableau de bord</button>
      </div>
    </div>
    <div id="toast-container"></div>
  `;
}

async function doAdminLoginSSO() {
  const email = document.getElementById('a-email').value.trim();
  const pwd   = document.getElementById('a-pwd').value;
  if (!email || !pwd) return toast('Remplissez tous les champs', 'warn');
  try {
    await api.loginAdmin(email, pwd);
    await loadCustomSettings();
    Router.navigate('/admin');
  } catch { toast('Identifiants incorrects', 'error'); }
}

// ── app.js ── Point d'entrée, login, routeur

// ───────────────────────────────────────────
// PAGE LOGIN / INSCRIPTION
// ───────────────────────────────────────────
function renderLoginPage(tab = 'login') {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        ${(()=>{const s=localStorage.getItem('hg_logo_size')||'150';return `<div class="login-logo"><img src="${window._customLogo || 'img/logo.png'}" style="height:${s}px;width:auto"></div>`;})()}
        ${localStorage.getItem('hg_show_title') !== 'false' ? `<h2 class="login-title">${window._customSiteName || SITE_NAME}</h2>` : ''}
        <p class="login-sub">Espace client &amp; gestion des interventions</p>

        <div class="login-tabs">
          <button class="login-tab ${tab==='login'?'active':''}" onclick="renderLoginPage('login')">Se connecter</button>
          <button class="login-tab ${tab==='register'?'active':''}" onclick="renderLoginPage('register')">Créer un compte</button>
        </div>

        ${tab === 'login' ? `
          <div class="form-group">
            <label>Email</label>
            <input class="form-control" type="email" id="l-email" placeholder="vous@exemple.fr" autofocus onkeydown="if(event.key==='Enter')doLogin()">
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input class="form-control" type="password" id="l-pwd" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()">
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:.25rem" onclick="doLogin()">Se connecter</button>
          <div style="text-align:center;margin-top:.75rem">
            <span onclick="renderAdminLogin()" style="color:var(--muted);font-size:.75rem;cursor:pointer;letter-spacing:.2em" title="Administration">···</span>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
            <div class="form-group">
              <label>Prénom</label>
              <input class="form-control" id="r-firstname" placeholder="Jean" autofocus>
            </div>
            <div class="form-group">
              <label>Nom</label>
              <input class="form-control" id="r-name" placeholder="Dupont">
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input class="form-control" type="email" id="r-email" placeholder="vous@exemple.fr">
          </div>
          <div class="form-group">
            <label>Téléphone</label>
            <input class="form-control" type="tel" id="r-phone" placeholder="06 00 00 00 00">
          </div>
          <div class="form-group" style="position:relative">
            <label>Adresse postale</label>
            <input class="form-control" id="r-address" placeholder="Commencez à taper..." autocomplete="off"
              oninput="searchAddressReg(this.value)">
            <div id="reg-address-results" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);z-index:200;max-height:180px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.4)"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
            <div class="form-group">
              <label>Mot de passe</label>
              <input class="form-control" type="password" id="r-pwd" placeholder="8 caractères min">
            </div>
            <div class="form-group">
              <label>Confirmer</label>
              <input class="form-control" type="password" id="r-pwd2" placeholder="••••••••" onkeydown="if(event.key==='Enter')doRegister()">
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:.25rem" onclick="doRegister()">Créer mon compte</button>
        `}

        <div style="text-align:center;margin-top:1.25rem">
          <a onclick="Router.navigate('/access/votre-token')" style="font-size:.78rem;color:var(--muted);cursor:pointer">
            Accès via lien sécurisé (sans compte)
          </a>
        </div>
      </div>
    </div>
    <div id="toast-container"></div>
  `;
}

function renderAdminLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        ${(()=>{const s=localStorage.getItem('hg_logo_size')||'150';return `<div class="login-logo"><img src="${window._customLogo || 'img/logo.png'}" style="height:${s}px;width:auto"></div>`;})()}
        ${localStorage.getItem('hg_show_title') !== 'false' ? `<h2 class="login-title">${window._customSiteName || SITE_NAME}</h2>` : ''}
        <p class="login-sub" style="color:var(--blue)">⚙️ Espace administrateur</p>
        <div class="form-group">
          <label>Email admin</label>
          <input class="form-control" type="email" id="a-email" placeholder="admin@Intervys.local" autofocus>
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <input class="form-control" type="password" id="a-pwd" placeholder="••••••••" onkeydown="if(event.key==='Enter')doAdminLogin()">
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="doAdminLogin()">Connexion admin</button>
        <div style="text-align:center;margin-top:1rem">
          <a onclick="renderLoginPage()" style="font-size:.82rem;color:var(--muted);cursor:pointer">← Retour connexion client</a>
        </div>
      </div>
    </div>
    <div id="toast-container"></div>
  `;
}

async function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pwd   = document.getElementById('l-pwd').value;
  if (!email || !pwd) return toast('Remplissez tous les champs', 'warn');
  try {
    await api.loginUser(email, pwd);
    toast('Bienvenue !', 'success');
    // Vérifier si cet utilisateur est un collaborateur avec droits admin
    await _checkStaffAndRoute();
  } catch(e) {
    toast(e.message === 'Failed to authenticate.' ? 'Email ou mot de passe incorrect' : 'Erreur de connexion', 'error');
  }
}

async function _checkStaffAndRoute() {
  try {
    const r = await api.req('GET', '/api/collections/settings/records?filter=' + encodeURIComponent("key='staff_perms'") + '&perPage=1');
    const item = (r.items||[])[0];
    const perms = item?.value ? JSON.parse(item.value) : {};
    const uid = api.user?.id;
    if (uid && perms[uid]) {
      window._isStaff = true;
      window._staffSections = perms[uid].sections || [];
      window._cachedStaffPerms = perms;
      api.isAdmin = true;
      localStorage.setItem('hg_admin', '1');
      localStorage.setItem('hg_is_staff', '1');
      localStorage.setItem('hg_staff_sections', JSON.stringify(perms[uid].sections || []));
      Router.navigate('/admin');
      return;
    }
  } catch(e) {}
  window._isStaff = false;
  localStorage.removeItem('hg_is_staff');
  localStorage.removeItem('hg_staff_sections');
  Router.navigate('/dashboard');
}

async function doRegister() {
  const firstname = document.getElementById('r-firstname')?.value.trim() || '';
  const name  = document.getElementById('r-name').value.trim();
  const email = document.getElementById('r-email').value.trim();
  const phone = document.getElementById('r-phone')?.value.trim() || '';
  const address = document.getElementById('r-address')?.value.trim() || '';
  const pwd   = document.getElementById('r-pwd').value;
  const pwd2  = document.getElementById('r-pwd2').value;
  if (!name || !email || !pwd) return toast('Remplissez tous les champs', 'warn');
  if (pwd !== pwd2) return toast('Les mots de passe ne correspondent pas', 'error');
  if (pwd.length < 8) return toast('Mot de passe trop court (8 caractères min)', 'warn');
  try {
    const user = await api.register(email, pwd, pwd2, name, phone);
    if (user.id && (firstname || address)) {
      await api.updateUser(user.id, { firstname, address }).catch(() => {});
    }
    await api.loginUser(email, pwd);
    toast('Compte créé ! Bienvenue 👋', 'success');
    Router.navigate('/dashboard');
  } catch(e) {
    const msg = e.data?.email?.message || 'Erreur création compte';
    toast(msg, 'error');
  }
}

let _addrRegTimer = null;
async function searchAddressReg(q) {
  const box = document.getElementById('reg-address-results');
  if (!box) return;
  if (!q || q.length < 3) { box.style.display = 'none'; return; }
  clearTimeout(_addrRegTimer);
  _addrRegTimer = setTimeout(async () => {
    try {
      const r = await fetch('https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(q) + '&limit=5');
      const d = await r.json();
      if (!d.features?.length) { box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = d.features.map(f => `
        <div onclick="document.getElementById('r-address').value='${f.properties.label.replace(/'/g,"\\'")}';document.getElementById('reg-address-results').style.display='none'"
          style="padding:.6rem 1rem;cursor:pointer;border-bottom:1px solid var(--border2);font-size:.85rem"
          onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
          <div style="font-weight:500">${f.properties.name}</div>
          <div style="font-size:.75rem;color:var(--muted2)">${f.properties.postcode} ${f.properties.city}</div>
        </div>`).join('');
    } catch { box.style.display = 'none'; }
  }, 300);
}

async function doAdminLogin() {
  const email = document.getElementById('a-email').value.trim();
  const pwd   = document.getElementById('a-pwd').value;
  if (!email || !pwd) return toast('Remplissez tous les champs', 'warn');
  try {
    await api.loginAdmin(email, pwd);
    await loadCustomSettings();
    toast('Connexion admin réussie', 'success');
    Router.navigate('/admin');
  } catch {
    toast('Identifiants admin incorrects', 'error');
  }
}

// ───────────────────────────────────────────
// ROUTEUR
// ───────────────────────────────────────────
async function docDownload(collection, id) {
  document.getElementById('app').innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#555"><p>Téléchargement en cours…</p></div>`;
  try {
    const r = await fetch(PB_URL + '/api/collections/' + collection + '/records/' + id + '?fields=number,pdf_b64');
    if (!r.ok) throw new Error('Document non disponible (' + r.status + ')');
    const data = await r.json();
    if (!data.pdf_b64) throw new Error('PDF non disponible pour ce document');
    const bin = atob(data.pdf_b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const blob = new Blob([u8], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (data.number || 'document') + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.getElementById('app').innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#555"><p>✓ Téléchargement terminé — ${data.number || ''}.pdf</p></div>`;
  } catch(e) {
    document.getElementById('app').innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#e74c3c"><p>Erreur : ${e.message}</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Attendre que les settings (thème, logo…) soient chargés avant le premier rendu
  await window._settingsReady;

  // Restaurer l'état collaborateur après un rechargement de page
  if (localStorage.getItem('hg_is_staff') === '1') {
    window._isStaff = true;
    window._staffSections = JSON.parse(localStorage.getItem('hg_staff_sections') || '[]');
  }
  // Routes admin
  Router.on('/admin',                        () => adminDashboard());
  Router.on('/admin/interventions',          () => adminInterventions());
  Router.on('/admin/interventions/new',      () => newInterventionPage());
  Router.on('/admin/intervention/:id',       ({ id }) => adminInterventionDetail(id));
  Router.on('/admin/archives',               () => adminArchives());
  Router.on('/admin/settings',               () => adminSettings());
  Router.on('/admin/links',                  () => adminLinks());
  Router.on('/admin/clients',                () => adminClients());
  Router.on('/admin/messages',               () => adminMessagesOverview());

  // Routes client
  Router.on('/dashboard',                    () => clientDashboard());
  Router.on('/intervention/:id',             ({ id }) => clientInterventionDetail(id));
  Router.on('/new-intervention',             () => clientNewIntervention());
  Router.on('/messages',                     () => clientMessages());

  // Accès sans compte
  Router.on('/access/:token',                ({ token }) => accessLinkPage(token));
  Router.on('/access-dashboard/:id',         ({ id }) => accessDashboard(id));

  // Téléchargement document (lien email client — sans auth requise)
  Router.on('/doc/quotes/:id',   ({ id }) => docDownload('quotes',   id));
  Router.on('/doc/invoices/:id', ({ id }) => docDownload('invoices', id));

  // Login
  Router.on('/login',                        () => renderLoginPage());
  Router.on('/admin-login',                  () => renderAdminLogin());
  Router.on('/',                             () => {
    if (!api.isLoggedIn) { renderLoginPage(); return; }
    if (api.isAdmin)     { Router.navigate('/admin'); return; }
    Router.navigate('/dashboard');
  });

  Router.init();
});

// ───────────────────────────────────────────
// PAGE CLIENTS ADMIN (liste)
// ───────────────────────────────────────────

function editClientModal(id, name, email, phone) {
  api.getUser(id).then(u => {
    openModal(`
      <div class="modal-header">
        <span class="modal-title">Modifier le client</span>
        <div style="display:flex;gap:.5rem;align-items:center">
          <button class="btn btn-danger-soft btn-sm" onclick="closeModal();deleteClient('${id}','${u.name||u.email}')">${ico('trash')} Supprimer</button>
          <button class="btn btn-primary btn-sm" onclick="submitEditClient('${id}')">Enregistrer</button>
          <button class="modal-close">×</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Prénom</label>
          <input class="form-control" id="ec-firstname" value="${u.firstname||''}">
        </div>
        <div class="form-group">
          <label>Nom</label>
          <input class="form-control" id="ec-name" value="${u.name||''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Email</label>
          <input class="form-control" type="email" id="ec-email" value="${u.email||''}">
        </div>
        <div class="form-group">
          <label>Téléphone</label>
          <input class="form-control" id="ec-phone" value="${u.phone||''}">
        </div>
      </div>
      <div class="form-group" style="position:relative">
        <label>Adresse postale</label>
        <input class="form-control" id="ec-address" value="${u.address||''}" placeholder="Commencez à taper votre adresse..." autocomplete="off"
          oninput="searchAddress(this.value)">
        <div id="address-results" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);z-index:200;max-height:200px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.4)"></div>
      </div>
    `);
  }).catch(() => toast('Erreur chargement', 'error'));
}

let _addrTimer = null;
async function searchAddress(q) {
  const box = document.getElementById('address-results');
  if (!box) return;
  if (!q || q.length < 3) { box.style.display = 'none'; return; }
  clearTimeout(_addrTimer);
  _addrTimer = setTimeout(async () => {
    try {
      const r = await fetch('https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(q) + '&limit=5');
      const d = await r.json();
      if (!d.features?.length) { box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = d.features.map(f => `
        <div onclick="selectAddress('${f.properties.label.replace(/'/g,"\\\\'")}');document.getElementById('address-results').style.display='none'"
          style="padding:.6rem 1rem;cursor:pointer;border-bottom:1px solid var(--border2);font-size:.85rem"
          onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">
          <div style="font-weight:500">${f.properties.name}</div>
          <div style="font-size:.75rem;color:var(--muted2)">${f.properties.postcode} ${f.properties.city}</div>
        </div>`).join('');
    } catch { box.style.display = 'none'; }
  }, 300);
}

function selectAddress(addr) {
  const input = document.getElementById('ec-address');
  if (input) input.value = addr;
}

async function submitEditClient(id) {
  const firstname = document.getElementById('ec-firstname').value.trim();
  const name    = document.getElementById('ec-name').value.trim();
  const email   = document.getElementById('ec-email').value.trim();
  const phone   = document.getElementById('ec-phone').value.trim();
  const address = document.getElementById('ec-address').value.trim();
  if (!name || !email) return toast('Nom et email requis', 'warn');
  try {
    await api.updateUser(id, { firstname, name, email, phone, address });
    closeModal();
    toast('Client mis à jour', 'success');
    adminClients();
  } catch { toast('Erreur', 'error'); }
}

async function deleteClient(id, name) {
  if (!await confirm('Supprimer le client ' + name + ' ? Cette action est irréversible.')) return;
  try {
    await api.req('DELETE', '/api/collections/users/records/' + id);
    toast('Client supprimé', 'success');
    adminClients();
  } catch { toast('Erreur suppression', 'error'); }
}

async function adminClients() {
  if (!requireAdmin()) return;
  renderAdminLayout('Clients', '<div class="spinner"></div>');
  try {
    const data = await api.req('GET', '/api/collections/users/records?sort=-created&perPage=200');
    const items = data.items;
    const cards = items.map(u => {
      const fullName = ((u.firstname ? u.firstname + ' ' : '') + (u.name || '')).trim() || u.email;
      const initials = u.firstname && u.name
        ? (u.firstname[0] + u.name[0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase();
      const esc = s => (s||'').replace(/'/g, "\\'");
      return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:1.1rem;display:flex;flex-direction:column;gap:.6rem;transition:border-color .15s" onmouseover="this.style.borderColor='rgba(var(--blue-rgb),.35)'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="display:flex;align-items:flex-start;gap:.75rem">
          <div style="width:42px;height:42px;border-radius:50%;background:rgba(var(--blue-rgb),.15);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.88rem;color:var(--blue);flex-shrink:0">${initials}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${fullName}</div>
            <div style="font-size:.78rem;color:var(--muted2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.email}</div>
            ${u.phone ? `<div style="font-size:.75rem;color:var(--muted);margin-top:.1rem">${u.phone}</div>` : ''}
          </div>
          <div style="font-size:.7rem;color:var(--muted2);flex-shrink:0">${fmtDateShort(u.created)}</div>
        </div>
        <div style="display:flex;gap:.4rem;align-items:center;padding-top:.35rem;border-top:1px solid var(--border);margin-top:auto">
          <button class="btn btn-ghost btn-sm" style="flex:1;font-size:.78rem" onclick="adminInterventions('user=\\'${u.id}\\'')">📋 Dossiers</button>
          <button class="btn btn-sm" style="color:var(--blue);background:none;border:none;display:inline-flex;padding:5px" title="Modifier" onclick="editClientModal('${u.id}','${esc(u.name)}','${esc(u.email)}','${esc(u.phone)}')">${ico('edit')}</button>
          <button class="btn btn-sm" style="color:var(--red);background:none;border:1px solid transparent;border-radius:4px;opacity:.7;display:inline-flex;padding:5px" title="Supprimer" onmouseover="this.style.opacity=1;this.style.borderColor='var(--red)'" onmouseout="this.style.opacity=.7;this.style.borderColor='transparent'" onclick="deleteClient('${u.id}','${esc(fullName)}')">${ico('trash')}</button>
        </div>
      </div>`;
    }).join('');

    document.getElementById('page-content').innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:1rem">
        <button class="btn btn-primary btn-sm" onclick="createClientModal()">${ico('plus')} Nouveau client</button>
      </div>
      ${!items.length
        ? '<div class="empty-state"><h3>Aucun client inscrit</h3></div>'
        : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:.85rem">${cards}</div>`
      }`;
  } catch { toast('Erreur', 'error'); }
}

// ───────────────────────────────────────────
// VUE GLOBALE MESSAGES ADMIN
// ───────────────────────────────────────────
async function adminMessagesOverview() {
  if (!requireAdmin()) return;
  renderAdminLayout('Messages', '<div class="spinner"></div>');
  try {
    // Récupère toutes les interventions avec messages non lus
    const msgs = await api.req('GET', '/api/collections/messages/records?filter=read=false%26%26from_admin=false&sort=-created&perPage=50&expand=intervention');
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header"><span class="card-title">Messages clients non lus (${msgs.totalItems})</span></div>
        ${!msgs.items.length
          ? '<div class="empty-state">' + ico('msg') + '<h3>Aucun message non lu</h3></div>'
          : `<div style="display:flex;flex-direction:column;gap:.75rem">
            ${msgs.items.map(m => `
              <div class="card" style="cursor:pointer" onclick="Router.navigate('/admin/intervention/${m.intervention}')">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem">
                  <div>
                    <div style="font-weight:600;font-size:.9rem;margin-bottom:.25rem">${m.expand?.intervention?.title || m.intervention}</div>
                    <div style="color:var(--muted2);font-size:.88rem">${m.content.slice(0,120)}${m.content.length>120?'…':''}</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0">
                    <div style="font-family:var(--FM);font-size:.68rem;color:var(--muted)">${timeAgo(m.created)}</div>
                    <span class="badge" style="background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3);margin-top:.3rem">Non lu</span>
                  </div>
                </div>
              </div>`).join('')}
          </div>`
        }
      </div>`;
  } catch { toast('Erreur', 'error'); }
}


