
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
          <div style="text-align:center;margin-top:.75rem;display:flex;justify-content:space-between;align-items:center">
            <a onclick="renderForgotPage()" style="font-size:.8rem;color:var(--muted);cursor:pointer">Mot de passe oublié ?</a>
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
          <div class="form-group">
            <label>Type de compte</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
              <button type="button" id="r-btn-part" class="btn btn-sm btn-primary" onclick="setRegisterAccountType('particulier')">Particulier</button>
              <button type="button" id="r-btn-pro" class="btn btn-sm btn-ghost" onclick="setRegisterAccountType('pro')">Professionnel</button>
            </div>
          </div>
          <div id="r-pro-fields" style="display:none">
            <div class="form-group">
              <label>Raison sociale *</label>
              <input class="form-control" id="r-company" placeholder="SARL Exemple">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
              <div class="form-group">
                <label>SIREN *</label>
                <input class="form-control" id="r-siren" placeholder="123456789" maxlength="9" inputmode="numeric" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
              </div>
              <div class="form-group">
                <label>N° TVA intracom.</label>
                <input class="form-control" id="r-tva" placeholder="FR12345678901">
              </div>
            </div>
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

function setRegisterAccountType(type) {
  const isPro = type === 'pro';
  const proFields = document.getElementById('r-pro-fields');
  const btnPart = document.getElementById('r-btn-part');
  const btnPro = document.getElementById('r-btn-pro');
  if (proFields) proFields.style.display = isPro ? '' : 'none';
  if (btnPart) btnPart.className = 'btn btn-sm ' + (isPro ? 'btn-ghost' : 'btn-primary');
  if (btnPro) btnPro.className = 'btn btn-sm ' + (isPro ? 'btn-primary' : 'btn-ghost');
  if (!isPro) {
    const company = document.getElementById('r-company');
    const siren = document.getElementById('r-siren');
    const tva = document.getElementById('r-tva');
    if (company) company.value = '';
    if (siren) siren.value = '';
    if (tva) tva.value = '';
  }
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
    if (api.user && api.user.email_verified === false) {
      renderOtpPage();
      return;
    }
    toast('Bienvenue !', 'success');
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
  const is_pro = document.getElementById('r-pro-fields')?.style.display !== 'none';
  const company = document.getElementById('r-company')?.value.trim() || '';
  const siren = document.getElementById('r-siren')?.value.replace(/\s/g, '') || '';
  const tva_num = document.getElementById('r-tva')?.value.trim() || '';
  const pwd   = document.getElementById('r-pwd').value;
  const pwd2  = document.getElementById('r-pwd2').value;
  if (!name || !email || !pwd) return toast('Remplissez tous les champs', 'warn');
  if (is_pro && !company) return toast('Renseignez la raison sociale', 'warn');
  if (is_pro && !/^\d{9}$/.test(siren)) return toast('SIREN invalide (9 chiffres)', 'warn');
  if (pwd !== pwd2) return toast('Les mots de passe ne correspondent pas', 'error');
  if (pwd.length < 8) return toast('Mot de passe trop court (8 caractères min)', 'warn');
  try {
    const extra = { firstname, address, is_pro, company, siren, tva_num };
    const user = await api.register(email, pwd, pwd2, name, phone, extra);
    if (user.id && (firstname || address || is_pro)) {
      await api.updateUser(user.id, extra).catch(() => {});
    }
    await api.loginUser(email, pwd);
    if (api.user && api.user.email_verified === false) {
      renderOtpPage();
      return;
    }
    toast('Compte créé ! Bienvenue 👋', 'success');
    Router.navigate('/dashboard');
  } catch(e) {
    const msg = e.data?.email?.message || 'Erreur création compte';
    toast(msg, 'error');
  }
}

function renderOtpPage() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        ${(()=>{const s=localStorage.getItem('hg_logo_size')||'150';return `<div class="login-logo"><img src="${window._customLogo || 'img/logo.png'}" style="height:${s}px;width:auto"></div>`;})()}
        ${localStorage.getItem('hg_show_title') !== 'false' ? `<h2 class="login-title">${window._customSiteName || SITE_NAME}</h2>` : ''}
        <p class="login-sub">Vérification de votre adresse email</p>
        <p style="font-size:.85rem;color:var(--muted);text-align:center;margin-bottom:1.25rem">
          Un code à 6 chiffres a été envoyé à votre adresse email.<br>Saisissez-le ci-dessous pour continuer.
        </p>
        <div class="form-group">
          <label>Code de vérification</label>
          <input class="form-control" type="text" id="otp-code" placeholder="000000" maxlength="6"
            style="letter-spacing:.25em;font-size:1.4rem;text-align:center"
            oninput="this.value=this.value.replace(/[^0-9]/g,'')"
            onkeydown="if(event.key==='Enter')doSubmitOtp()">
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:.25rem" onclick="doSubmitOtp()">Vérifier</button>
        <div style="text-align:center;margin-top:1rem">
          <a id="otp-resend-link" onclick="doResendOtp()" style="font-size:.82rem;color:var(--muted);cursor:pointer">Renvoyer le code</a>
        </div>
      </div>
    </div>
    <div id="toast-container"></div>
  `;
  setTimeout(() => document.getElementById('otp-code')?.focus(), 100);
  // Auto-envoyer le code si aucun n'est en attente (ex : compte ancien sans OTP)
  if (!api.user?.otp_code) {
    api.resendOtp().catch(() => {});
  }
}

async function doSubmitOtp() {
  const code = (document.getElementById('otp-code')?.value || '').trim();
  if (!code) return toast('Entrez le code reçu par email', 'warn');
  try {
    await api.verifyOtp(code);
    toast('Email vérifié !', 'success');
    await _checkStaffAndRoute();
  } catch(e) {
    toast(e.message || 'Code incorrect ou expiré', 'error');
  }
}

async function doResendOtp() {
  const link = document.getElementById('otp-resend-link');
  if (link) { link.style.pointerEvents = 'none'; link.textContent = 'Envoi…'; }
  try {
    await api.resendOtp();
    toast('Nouveau code envoyé', 'success');
  } catch(e) {
    toast('Erreur lors de l\'envoi', 'error');
  }
  if (link) {
    setTimeout(() => { link.style.pointerEvents = ''; link.textContent = 'Renvoyer le code'; }, 30000);
  }
}

// ───────────────────────────────────────────
// MOT DE PASSE OUBLIÉ
// ───────────────────────────────────────────
function renderForgotPage() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        ${(()=>{const s=localStorage.getItem('hg_logo_size')||'150';return `<div class="login-logo"><img src="${window._customLogo || 'img/logo.png'}" style="height:${s}px;width:auto"></div>`;})()}
        <p class="login-sub">Réinitialisation du mot de passe</p>
        <p style="font-size:.85rem;color:var(--muted);text-align:center;margin-bottom:1.25rem">
          Entrez votre adresse email. Vous recevrez un lien pour choisir un nouveau mot de passe.
        </p>
        <div class="form-group">
          <label>Email</label>
          <input class="form-control" type="email" id="forgot-email" placeholder="vous@exemple.fr" autofocus
            onkeydown="if(event.key==='Enter')doForgotPassword()">
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:.25rem" onclick="doForgotPassword()">Envoyer le lien</button>
        <div style="text-align:center;margin-top:1rem">
          <a onclick="renderLoginPage()" style="font-size:.82rem;color:var(--muted);cursor:pointer">← Retour connexion</a>
        </div>
      </div>
    </div>
    <div id="toast-container"></div>
  `;
  setTimeout(() => document.getElementById('forgot-email')?.focus(), 100);
}

async function doForgotPassword() {
  const email = (document.getElementById('forgot-email')?.value || '').trim();
  if (!email) return toast('Entrez votre adresse email', 'warn');
  const btn = document.querySelector('#app .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }
  try {
    await api.requestPasswordReset(email);
    document.getElementById('app').querySelector('.login-card').innerHTML = `
      <div style="text-align:center;padding:1rem 0">
        <div style="font-size:2.5rem;margin-bottom:1rem">📧</div>
        <h3 style="margin-bottom:.75rem">Email envoyé !</h3>
        <p style="color:var(--muted);font-size:.88rem;line-height:1.7">
          Si un compte existe pour <strong>${email}</strong>,<br>vous recevrez un lien de réinitialisation.
        </p>
        <button class="btn btn-ghost" style="margin-top:1.5rem" onclick="renderLoginPage()">← Retour connexion</button>
      </div>`;
  } catch(e) {
    toast('Erreur lors de l\'envoi', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer le lien'; }
  }
}

function renderResetPage(token) {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        ${(()=>{const s=localStorage.getItem('hg_logo_size')||'150';return `<div class="login-logo"><img src="${window._customLogo || 'img/logo.png'}" style="height:${s}px;width:auto"></div>`;})()}
        <p class="login-sub">Nouveau mot de passe</p>
        <div class="form-group">
          <label>Nouveau mot de passe</label>
          <input class="form-control" type="password" id="reset-pwd" placeholder="8 caractères min" autofocus>
        </div>
        <div class="form-group">
          <label>Confirmer</label>
          <input class="form-control" type="password" id="reset-pwd2" placeholder="••••••••"
            onkeydown="if(event.key==='Enter')doResetPassword('${token}')">
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:.25rem" onclick="doResetPassword('${token}')">Changer le mot de passe</button>
      </div>
    </div>
    <div id="toast-container"></div>
  `;
}

async function doResetPassword(token) {
  const pwd  = document.getElementById('reset-pwd')?.value  || '';
  const pwd2 = document.getElementById('reset-pwd2')?.value || '';
  if (pwd.length < 8)   return toast('Mot de passe trop court (8 caractères min)', 'warn');
  if (pwd !== pwd2)     return toast('Les mots de passe ne correspondent pas', 'error');
  try {
    await api.confirmPasswordReset(token, pwd);
    toast('Mot de passe modifié ! Vous pouvez vous connecter.', 'success', 5000);
    setTimeout(() => renderLoginPage(), 1500);
  } catch(e) {
    toast(e.message || 'Lien expiré ou invalide', 'error');
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

  // Login / password reset
  Router.on('/login',                        () => renderLoginPage());
  Router.on('/reset-password/:token',        ({ token }) => renderResetPage(token));
  Router.on('/documents',                    () => clientDocuments());
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
      <div style="border-top:1px solid var(--border);margin-top:1rem;padding-top:1rem">
        <label style="display:flex;align-items:center;gap:.6rem;cursor:pointer;font-weight:600;margin-bottom:.75rem">
          <input type="checkbox" id="ec-is-pro" ${u.is_pro ? 'checked' : ''} onchange="document.getElementById('ec-pro-fields').style.display=this.checked?'':'none'">
          Compte professionnel
        </label>
        <div id="ec-pro-fields" style="display:${u.is_pro ? '' : 'none'}">
          <div class="form-row">
            <div class="form-group">
              <label>Raison sociale</label>
              <input class="form-control" id="ec-company" value="${u.company||''}" placeholder="SARL Exemple">
            </div>
            <div class="form-group">
              <label>SIREN</label>
              <input class="form-control" id="ec-siren" value="${u.siren||''}" placeholder="123456789" maxlength="9">
            </div>
          </div>
          <div class="form-group">
            <label>N° TVA intracom <span style="color:var(--muted2);font-weight:400">(optionnel)</span></label>
            <input class="form-control" id="ec-tva" value="${u.tva_num||''}" placeholder="FR12345678901">
          </div>
        </div>
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
  const is_pro  = document.getElementById('ec-is-pro').checked;
  const company = document.getElementById('ec-company')?.value.trim() || '';
  const siren   = document.getElementById('ec-siren')?.value.replace(/\s/g,'') || '';
  const tva_num = document.getElementById('ec-tva')?.value.trim() || '';
  if (!name || !email) return toast('Nom et email requis', 'warn');
  if (is_pro && siren && !/^\d{9}$/.test(siren)) return toast('SIREN invalide (9 chiffres)', 'warn');
  try {
    await api.updateUser(id, { firstname, name, email, phone, address, is_pro, company, siren, tva_num });
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
  renderAdminLayout('Messages', '');

  // Split-pane pleine hauteur — annule le padding de page-content
  document.getElementById('page-content').style.cssText = 'padding:0;display:flex;flex-direction:column;height:calc(100vh - 61px);overflow:hidden';
  document.getElementById('page-content').innerHTML = `
    <div style="display:flex;flex:1;overflow:hidden">
      <!-- COLONNE GAUCHE : liste des conversations -->
      <div style="width:300px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden">
        <div id="conv-search-wrap" style="padding:.75rem;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center">
          <input class="form-control" id="conv-search" placeholder="🔍 Rechercher..." oninput="_filterConvs(this.value)" style="font-size:.82rem">
        </div>
        <div id="conv-list" style="overflow-y:auto;flex:1"><div class="spinner" style="margin:2rem auto"></div></div>
      </div>
      <!-- COLONNE DROITE : messages -->
      <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
        <div id="chat-panel-header" style="padding:.75rem 1.25rem;border-bottom:1px solid var(--border);flex-shrink:0;display:none;align-items:center;justify-content:space-between">
          <div id="chat-panel-title"></div>
          <a id="chat-panel-link" style="font-size:.78rem;color:var(--blue);cursor:pointer">Voir l'intervention →</a>
        </div>
        <div id="chat-panel-msgs" style="flex:1;min-height:0;overflow-y:auto;padding:1.25rem;display:flex;flex-direction:column;gap:.75rem;background:var(--bg2)">
          <div style="text-align:center;color:var(--muted);margin-top:4rem;font-size:.9rem">← Sélectionnez une conversation</div>
        </div>
        <div id="chat-panel-input" style="display:none;border-top:1px solid var(--border);padding:.75rem;flex-shrink:0;background:var(--surface)">
          <div style="display:flex;gap:.5rem">
            <textarea id="chat-panel-textarea" class="form-control" rows="2" placeholder="Écrire un message..." style="resize:none;font-size:.88rem"
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();_sendAdminChatMsg()}"></textarea>
            <button class="btn btn-primary" onclick="_sendAdminChatMsg()" style="align-self:flex-end">${ico('send')}</button>
          </div>
        </div>
      </div>
    </div>`;

  try {
    const [allMsgs, unreadMsgs] = await Promise.all([
      api.req('GET', '/api/collections/messages/records?sort=-created&perPage=500'),
      api.req('GET', '/api/collections/messages/records?filter=read%3Dfalse%26%26from_admin%3Dfalse&perPage=500'),
    ]);
    window._adminConvMap = new Map();
    for (const m of allMsgs.items) {
      if (!window._adminConvMap.has(m.intervention))
        window._adminConvMap.set(m.intervention, { msg: m, unread: 0, inv: null });
    }
    for (const m of unreadMsgs.items) {
      if (window._adminConvMap.has(m.intervention)) window._adminConvMap.get(m.intervention).unread++;
    }
    // Charger les interventions + access_links pour avoir titre + nom client
    const ids = Array.from(window._adminConvMap.keys());
    if (ids.length) {
      const f = encodeURIComponent('(' + ids.map(id => `id="${id}"`).join('||') + ')');
      const fl = encodeURIComponent('(' + ids.map(id => `intervention="${id}"`).join('||') + ')');
      const [invsData, linksData] = await Promise.all([
        api.req('GET', `/api/collections/interventions/records?filter=${f}&perPage=500`),
        api.req('GET', `/api/collections/access_links/records?filter=${fl}&perPage=500&fields=intervention,client_name,client_email`).catch(() => ({ items: [] })),
      ]);
      // Charger les users par leurs IDs
      const userIds = [...new Set(invsData.items.map(i => i.user).filter(Boolean))];
      let usersMap = new Map();
      if (userIds.length) {
        const fu = encodeURIComponent('(' + userIds.map(id => `id="${id}"`).join('||') + ')');
        const usersData = await api.req('GET', `/api/collections/users/records?filter=${fu}&perPage=500&fields=id,name,firstname,email`).catch(() => ({ items: [] }));
        usersMap = new Map(usersData.items.map(u => [u.id, u]));
      }
      const linksMap = new Map();
      for (const lk of linksData.items) {
        if (!linksMap.has(lk.intervention)) linksMap.set(lk.intervention, lk);
      }
      for (const inv of invsData.items) {
        const u  = usersMap.get(inv.user);
        const lk = linksMap.get(inv.id);
        const fullName = [u?.firstname, u?.name].filter(Boolean).join(' ');
        inv._clientName = (fullName || u?.email || lk?.client_name || lk?.client_email || '');
      }
      const invLookup = new Map(invsData.items.map(i => [i.id, i]));
      for (const [id, conv] of window._adminConvMap) conv.inv = invLookup.get(id) || null;
    }
    _renderConvList();
  } catch(e) { console.error(e); toast('Erreur chargement', 'error'); }
}

function _renderConvList(filter = '') {
  const el = document.getElementById('conv-list');
  if (!el || !window._adminConvMap) return;
  const convs = Array.from(window._adminConvMap.values()).filter(({msg: m, inv}) => {
    if (!filter) return true;
    const t = (inv?.title || '') + ' ' + (inv?.client_name || '');
    return t.toLowerCase().includes(filter.toLowerCase());
  });
  if (!convs.length) { el.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--muted);font-size:.85rem">Aucune conversation</div>`; return; }
  el.innerHTML = convs.map(({msg: m, unread, inv}) => {
    const clientName = inv?._clientName || '(inconnu)';
    const invTitle   = inv?.title || '';
    const hasUnread  = unread > 0;
    return `<div class="_conv-item" data-inv="${m.intervention}" style="padding:.7rem 1rem;cursor:pointer;border-bottom:1px solid var(--border2);transition:background .12s;position:relative"
      onmouseover="this.querySelector('._conv-actions').style.opacity='1'" onmouseout="this.querySelector('._conv-actions').style.opacity='0'"
      onclick="_openAdminChat('${m.intervention}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.1rem">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;flex-shrink:0;background:${hasUnread?'var(--blue)':'transparent'}"></span>
            <span style="font-weight:${hasUnread?700:500};font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${clientName}</span>
          </div>
          ${invTitle ? `<div style="font-size:.72rem;color:var(--muted);padding-left:1.1rem;margin-bottom:.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${invTitle}</div>` : ''}
          <div style="font-size:.77rem;color:var(--muted2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:1.1rem">
            ${m.from_admin ? '<span style="color:var(--muted)">Vous · </span>' : ''}${m.content.slice(0,70)}${m.content.length>70?'…':''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;flex-shrink:0">
          <span style="font-size:.65rem;color:var(--muted)">${timeAgo(m.created)}</span>
          ${hasUnread ? `<span style="background:var(--blue);color:#fff;font-size:.63rem;font-weight:700;padding:1px 6px;border-radius:20px;min-width:16px;text-align:center">${unread}</span>` : ''}
        </div>
      </div>
      <!-- Actions au survol -->
      <div class="_conv-actions" style="opacity:0;transition:opacity .15s;position:absolute;bottom:.5rem;right:.75rem;display:flex;gap:.25rem" onclick="event.stopPropagation()">
        <button title="Archiver l'intervention" onclick="_archiveConv('${m.intervention}')"
          style="background:var(--bg3);border:1px solid var(--border2);border-radius:4px;padding:3px 6px;cursor:pointer;color:var(--muted2);font-size:.75rem;transition:color .15s"
          onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--muted2)'">🗄</button>
        <button title="Supprimer les messages" onclick="_deleteConvMsgs('${m.intervention}')"
          style="background:var(--bg3);border:1px solid var(--border2);border-radius:4px;padding:3px 6px;cursor:pointer;color:var(--muted2);font-size:.75rem;transition:color .15s"
          onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted2)'">🗑</button>
      </div>
    </div>`;
  }).join('');
  // Recolorer l'item actif
  if (window._adminActiveConv) _highlightConvItem(window._adminActiveConv);
}

function _filterConvs(q) { _renderConvList(q); }

function _highlightConvItem(invId) {
  document.querySelectorAll('._conv-item').forEach(el => {
    el.style.background = el.dataset.inv === invId ? 'var(--bg3)' : '';
  });
}

window._adminActiveConv = null;

async function _openAdminChat(invId) {
  if (window._adminChatPoll) clearInterval(window._adminChatPoll);
  window._adminActiveConv = invId;
  _highlightConvItem(invId);

  const conv = window._adminConvMap?.get(invId);
  const inv  = conv?.inv;
  const invTitle   = inv?.title || 'Intervention';
  const clientName = inv?._clientName || '';

  // Header
  const hdr = document.getElementById('chat-panel-header');
  if (hdr) {
    hdr.style.display = 'flex';
    const sw = document.getElementById('conv-search-wrap');
    if (sw) hdr.style.minHeight = sw.offsetHeight + 'px';
    document.getElementById('chat-panel-title').innerHTML =
      `<div style="font-weight:600;font-size:.95rem">${invTitle}</div>${clientName ? `<div style="font-size:.75rem;color:var(--muted)">${clientName}</div>` : ''}`;
    document.getElementById('chat-panel-link').onclick = () => adminInterventionDetail(invId);
  }

  // Input
  const inp = document.getElementById('chat-panel-input');
  if (inp) inp.style.display = 'block';

  // Charger messages
  await _refreshAdminChatPanel(invId, true);
  window._adminChatPoll = setInterval(() => _refreshAdminChatPanel(invId, false), 5000);
}

async function _refreshAdminChatPanel(invId, scrollToBottom) {
  if (window._adminActiveConv !== invId) { clearInterval(window._adminChatPoll); return; }
  try {
    const f = encodeURIComponent(`intervention="${invId}"`);
    const msgs = await api.req('GET', `/api/collections/messages/records?filter=${f}&sort=created&perPage=200`);
    const el = document.getElementById('chat-panel-msgs');
    if (!el) { clearInterval(window._adminChatPoll); return; }
    const wasBottom = scrollToBottom || (el.scrollHeight - el.scrollTop - el.clientHeight < 80);
    el.innerHTML = renderMessages(msgs.items, true);
    if (wasBottom) el.scrollTop = el.scrollHeight;
    await api.markMessagesRead(invId).catch(() => {});
    // Effacer badge unread dans la liste
    if (window._adminConvMap?.has(invId)) {
      window._adminConvMap.get(invId).unread = 0;
      const item = document.querySelector(`._conv-item[data-inv="${invId}"]`);
      if (item) {
        item.querySelector('span[style*="border-radius:50%"]')?.remove?.();
        const badge = item.querySelector('span[style*="background:var(--blue)"]');
        if (badge && badge.textContent.match(/^\d+$/)) badge.remove();
        const nameSpan = item.querySelector('span[style*="font-weight"]');
        if (nameSpan) nameSpan.style.fontWeight = '500';
      }
    }
  } catch {}
}

async function _sendAdminChatMsg() {
  const invId = window._adminActiveConv;
  if (!invId) return;
  const ta = document.getElementById('chat-panel-textarea');
  const content = ta?.value?.trim();
  if (!content) return;
  ta.value = '';
  try {
    await api.req('POST', '/api/collections/messages/records', { intervention: invId, content, from_admin: true, read: false });
    await _refreshAdminChatPanel(invId, true);
    // Mettre à jour dernier msg dans la liste
    if (window._adminConvMap?.has(invId)) {
      window._adminConvMap.get(invId).msg = { intervention: invId, content, from_admin: true, created: new Date().toISOString() };
      _renderConvList(document.getElementById('conv-search')?.value || '');
    }
  } catch(e) { console.error(e); toast('Erreur envoi', 'error'); ta.value = content; }
}

async function _archiveConv(invId) {
  if (!await confirm('Archiver cette intervention ?')) return;
  try {
    await api.req('PATCH', `/api/collections/interventions/records/${invId}`, { status: 'archive' });
    window._adminConvMap?.delete(invId);
    if (window._adminActiveConv === invId) {
      window._adminActiveConv = null;
      const p = document.getElementById('chat-panel-msgs');
      if (p) p.innerHTML = '<div style="text-align:center;color:var(--muted);margin-top:4rem;font-size:.9rem">← Sélectionnez une conversation</div>';
      document.getElementById('chat-panel-header')?.style && (document.getElementById('chat-panel-header').style.display = 'none');
      document.getElementById('chat-panel-input')?.style && (document.getElementById('chat-panel-input').style.display = 'none');
    }
    _renderConvList(document.getElementById('conv-search')?.value || '');
    toast('Intervention archivée', 'success');
  } catch(e) { toast('Erreur archivage', 'error'); }
}

async function _deleteConvMsgs(invId) {
  if (!await confirm('Supprimer tous les messages de cette conversation ?')) return;
  try {
    const f = encodeURIComponent(`intervention="${invId}"`);
    const msgs = await api.req('GET', `/api/collections/messages/records?filter=${f}&perPage=500&fields=id`);
    await Promise.all(msgs.items.map(m => api.req('DELETE', `/api/collections/messages/records/${m.id}`)));
    window._adminConvMap?.delete(invId);
    if (window._adminActiveConv === invId) {
      window._adminActiveConv = null;
      const p = document.getElementById('chat-panel-msgs');
      if (p) p.innerHTML = '<div style="text-align:center;color:var(--muted);margin-top:4rem;font-size:.9rem">← Sélectionnez une conversation</div>';
      document.getElementById('chat-panel-header')?.style && (document.getElementById('chat-panel-header').style.display = 'none');
      document.getElementById('chat-panel-input')?.style && (document.getElementById('chat-panel-input').style.display = 'none');
    }
    _renderConvList(document.getElementById('conv-search')?.value || '');
    toast('Messages supprimés', 'success');
  } catch(e) { toast('Erreur suppression', 'error'); }
}


