// ── client.js ── Interface espace client

// ───────────────────────────────────────────
// LAYOUT CLIENT
// ───────────────────────────────────────────
function renderClientLayout(pageTitle, contentHtml) {
  const user = api.user;
  const initials = user?.name ? user.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <a class="sidebar-logo" href="#/dashboard">
          <img src="/img/logo.png" alt="Intervys">
          <span>Home<span style="color:var(--blue)">Geek</span></span>
        </a>
        <nav class="sidebar-nav">
          <div class="sidebar-section">Mon espace</div>
          <a class="sidebar-link ${pageTitle==='Mes interventions'?'active':''}" onclick="Router.navigate('/dashboard')">
            ${ico('tool')} Mes interventions
          </a>
          <a class="sidebar-link ${pageTitle==='Nouvelle demande'?'active':''}" onclick="Router.navigate('/new-intervention')">
            ${ico('plus')} Nouvelle demande
          </a>
          <a class="sidebar-link ${pageTitle==='Messages'?'active':''}" onclick="Router.navigate('/messages')">
            ${ico('msg')} Mes messages <span class="sidebar-badge" id="client-unread" style="display:none">!</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-avatar">${initials}</div>
            <div>
              <div style="font-weight:600;font-size:.85rem">${user?.name || user?.email}</div>
              <div style="font-size:.72rem;color:var(--muted)">Client</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:.75rem" onclick="doLogout()">
            ${ico('logout')} Déconnexion
          </button>
        </div>
      </aside>
      <div class="main-content">
        <header class="topbar">
          <button class="btn-icon" id="menu-toggle" onclick="toggleMobileMenu()" style="flex-shrink:0">☰</button>
          <h1 class="topbar-title">${pageTitle}</h1>
        </header>
        <main class="page-content" id="page-content">
          ${contentHtml}
        </main>
      </div>
    </div>
    <div id="toast-container"></div>
  `;
}

// ───────────────────────────────────────────
// DASHBOARD CLIENT
// ───────────────────────────────────────────
async function clientDashboard() {
  if (!requireClient()) return;
  renderClientLayout('Mes interventions', '<div class="spinner"></div>');
  try {
    const data = await api.getInterventions(`user="${api.user.id}"`);
    const items = data.items;

    const stats = {
      total:    items.length,
      actives:  items.filter(i => !['termine','annule'].includes(i.status)).length,
      termines: items.filter(i => i.status === 'termine').length,
    };

    document.getElementById('page-content').innerHTML = `
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);max-width:500px">
        <div class="stat-card"><div class="stat-card-num">${stats.total}</div><div class="stat-card-label">Total</div></div>
        <div class="stat-card"><div class="stat-card-num">${stats.actives}</div><div class="stat-card-label">En cours</div></div>
        <div class="stat-card success"><div class="stat-card-num">${stats.termines}</div><div class="stat-card-label">Terminées</div></div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Mes demandes d'intervention</span>
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('/new-intervention')">${ico('plus')} Nouvelle demande</button>
        </div>
        ${items.length === 0
          ? `<div class="empty-state">${ico('tool')}<h3>Aucune intervention</h3><p>Soumettez votre première demande !</p><button class="btn btn-primary" style="margin-top:1rem" onclick="Router.navigate('/new-intervention')">Créer une demande</button></div>`
          : `<div style="display:flex;flex-direction:column;gap:1rem">${items.map(renderClientCard).join('')}</div>`
        }
      </div>`;
  } catch(e) { toast('Erreur chargement', 'error'); }
}

function renderClientCard(inv) {
  return `
    <div class="card" style="cursor:pointer;transition:border-color .2s" onclick="Router.navigate('/intervention/${inv.id}')" onmouseenter="this.style.borderColor='rgba(30,144,255,.4)'" onmouseleave="this.style.borderColor=''">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.4rem;flex-wrap:wrap">
            <h3 style="font-size:1rem">${inv.title}</h3>
            ${statusBadge(inv.status)}
            ${priorityBadge(inv.priority||'normale')}
          </div>
          <div style="font-size:.82rem;color:var(--muted);display:flex;gap:1rem;flex-wrap:wrap">
            <span>${SERVICE_LABELS[inv.service]||inv.service}</span>
            <span>·</span>
            <span>Créé ${timeAgo(inv.created)}</span>
            <span>·</span>
            <span>Mis à jour ${timeAgo(inv.updated)}</span>
          </div>
        </div>
        <span style="color:var(--blue);font-size:.85rem;white-space:nowrap">Voir →</span>
      </div>
    </div>`;
}

// ───────────────────────────────────────────
// DETAIL INTERVENTION CLIENT
// ───────────────────────────────────────────
async function clientInterventionDetail(id) {
  if (!requireClient()) return;
  renderClientLayout('Suivi intervention', '<div class="spinner"></div>');
  try {
    const [inv, notes, colis, msgs] = await Promise.all([
      api.getIntervention(id),
      api.getNotes(id),
      api.getColis(id),
      api.getMessages(id),
    ]);
    await api.markMessagesRead(id);

    // Filtrer notes publiques seulement
    const publicNotes = notes.items.filter(n => n.is_public);

    document.getElementById('page-content').innerHTML = `
      <div style="margin-bottom:1.25rem">
        <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/dashboard')">← Retour</button>
      </div>

      <!-- Statut visuel -->
      <div class="card" style="margin-bottom:1.5rem">
        <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:.5rem">Votre réparation</div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1.5rem">
          <h2 style="font-size:1.2rem;margin:0">${inv.title}${inv.device_info ? `<span style="font-weight:400;font-size:.9rem;color:var(--muted)"> · ${inv.device_info}</span>` : ''}</h2>
          ${statusBadge(inv.status)}
        </div>
        <div id="client-status-timeline">${renderStatusTimeline(inv.status)}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 340px;gap:1.5rem">
        <div style="display:flex;flex-direction:column;gap:1.5rem">

          <!-- Messagerie -->
          <div class="card">
            <div class="card-header"><span class="card-title">💬 Messages avec ${SITE_NAME}</span></div>
            <div class="chat-wrap">
              <div class="chat-messages" id="chat-messages">
                ${renderMessages(msgs.items, false)}
              </div>
              <div class="chat-input">
                <textarea id="msg-input" placeholder="Écrire un message..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendClientMsg('${id}')}"></textarea>
                <button class="btn btn-primary btn-sm" onclick="sendClientMsg('${id}')">${ico('send')}</button>
              </div>
            </div>
          </div>

          <!-- Notes publiques -->
          ${publicNotes.length ? `
          <div class="card">
            <div class="card-header"><span class="card-title">📋 Informations de suivi</span></div>
            <div class="timeline">${publicNotes.map(n => `
              <div class="timeline-item">
                <div class="timeline-dot">📌</div>
                <div class="timeline-content">
                  <div class="timeline-date">${fmtDate(n.created)}</div>
                  <div style="font-size:.9rem;line-height:1.7">${n.content}</div>
                </div>
              </div>`).join('')}
            </div>
          </div>` : ''}
        </div>

        <!-- Colonne droite -->
        <div style="display:flex;flex-direction:column;gap:1.5rem">

          <!-- Description -->
          <div class="card">
            <div class="card-header"><span class="card-title">📝 Votre demande</span></div>
            <div style="font-size:.9rem;line-height:1.75;color:var(--muted2)">${inv.description}</div>
            <div style="margin-top:1rem;padding-top:.75rem;border-top:1px solid var(--border2);font-family:var(--FM);font-size:.68rem;color:var(--muted)">
              Créé le ${fmtDateShort(inv.created)}<br>
              Dernière mise à jour ${timeAgo(inv.updated)}
            </div>
          </div>

          <!-- Colis -->
          ${colis.items.length ? `
          <div class="card">
            <div class="card-header"><span class="card-title">📦 Colis & Expédition</span></div>
            ${colis.items.map(c => `
              <div style="background:var(--bg3);border-radius:var(--r2);padding:.9rem;margin-bottom:.75rem">
                <div style="font-weight:600;margin-bottom:.3rem">${CARRIER_LABELS[c.carrier]||c.carrier}</div>
                <div style="font-family:var(--FM);font-size:.8rem;color:var(--blue);margin-bottom:.3rem">${c.tracking_number}</div>
                <div style="font-size:.78rem;color:var(--muted)">${c.direction==='envoi_client'?'📤 Envoi vers vous':'📥 Retour'}</div>
                ${c.tracking_url ? `<a href="${c.tracking_url}" target="_blank" class="btn btn-ghost btn-sm" style="margin-top:.6rem;display:inline-flex">🔗 Suivre mon colis</a>` : ''}
              </div>`).join('')}
          </div>` : ''}

        </div>
      </div>`;

    const chat = document.getElementById('chat-messages');
    if (chat) chat.scrollTop = chat.scrollHeight;

    // Nettoyer les anciens intervals avant d'en créer de nouveaux
    if (window._invMsgPoll)    clearInterval(window._invMsgPoll);
    if (window._invStatusPoll) clearInterval(window._invStatusPoll);
    if (window._adminMsgPoll)  clearInterval(window._adminMsgPoll);

    window._invMsgPoll = setInterval(() => refreshClientMessages(id), 5000);

    // Rafraîchit uniquement le statut, pas toute la page
    window._invStatusPoll = setInterval(async () => {
      const el = document.getElementById('client-status-timeline');
      if (!el) { clearInterval(window._invStatusPoll); return; }
      try {
        const updated = await api.getIntervention(id);
        el.innerHTML = renderStatusTimeline(updated.status);
      } catch {}
    }, 10000);

  } catch(e) { console.error(e); toast('Erreur chargement', 'error'); }
}

function renderStatusTimeline(status) {
  const steps = [
    { label: 'Reçue',    keys: ['nouveau', 'diagnostic'] },
    { label: 'En cours', keys: ['en_cours', 'attente_piece', 'attente_client'] },
    { label: 'Prête',    keys: ['termine'] },
    { label: 'Rendue',   keys: ['archive', 'rendu_client'] },
  ];
  let cur = 0;
  steps.forEach((s, i) => { if (s.keys.includes(status)) cur = i; });

  return `<div style="display:flex;align-items:flex-start">
    ${steps.map((step, i) => {
      const done   = i < cur;
      const active = i === cur;
      const lineColor = done ? 'var(--green)' : 'var(--border)';
      const dotBg     = done ? 'var(--green)' : active ? 'var(--blue)' : 'transparent';
      const dotBorder = done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--muted)';
      const labelColor = done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--muted)';
      return `<div style="display:flex;align-items:flex-start;flex:1">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1">
          <div style="width:12px;height:12px;border-radius:50%;background:${dotBg};border:2px solid ${dotBorder};flex-shrink:0;margin-top:1px"></div>
          <span style="font-size:.72rem;color:${labelColor};font-weight:${active?'700':'400'};text-align:center;white-space:nowrap${active?';background:rgba(30,144,255,.08);padding:2px 8px;border-radius:4px':''}">${step.label}</span>
        </div>
        ${i < steps.length - 1 ? `<div style="flex:1;height:2px;background:${lineColor};margin-top:6px;min-width:12px"></div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

async function sendClientMsg(id) {
  const input = document.getElementById('msg-input');
  const content = input.value.trim();
  if (!content) return;
  input.value = '';
  const name = api.user?.name || api.user?.email || 'Client';
  try {
    await api.sendMessage(id, content, false, name);
    await refreshClientMessages(id);
  } catch { toast('Erreur envoi', 'error'); }
}

async function refreshClientMessages(id) {
  const msgs = await api.getMessages(id);
  const chat = document.getElementById('chat-messages');
  if (!chat) return;
  chat.innerHTML = renderMessages(msgs.items, false);
  chat.scrollTop = chat.scrollHeight;
}

// ───────────────────────────────────────────
// NOUVELLE DEMANDE CLIENT
// ───────────────────────────────────────────
function clientNewIntervention() {
  if (!requireClient()) return;
  renderClientLayout('Nouvelle demande', `
    <div class="card" style="max-width:620px">
      <div class="card-header"><span class="card-title">${ico('tool')} Soumettre une demande</span></div>
      <div class="form-group">
        <label>Titre de la demande *</label>
        <input class="form-control" id="f-title" placeholder="Ex: Mon PC ne démarre plus">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Type de service *</label>
          <select class="form-control" id="f-service">
            ${Object.entries(SERVICE_LABELS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Urgence</label>
          <select class="form-control" id="f-priority">
            <option value="basse">🟢 Pas urgent</option>
            <option value="normale" selected>🔵 Normal</option>
            <option value="haute">🟠 Assez urgent</option>
            <option value="urgente">🔴 Urgent</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Appareil / Modèle</label>
        <input class="form-control" id="f-device" placeholder="Ex: MacBook Pro 2019, iPhone 13...">
      </div>
      <div class="form-group">
        <label>Description du problème *</label>
        <textarea class="form-control" id="f-desc" rows="6" placeholder="Décrivez le problème aussi précisément que possible : quand est-ce apparu, que s'est-il passé, avez-vous essayé de corriger..."></textarea>
      </div>
      <div class="modal-footer" style="border:none;padding:1rem 0 0">
        <button class="btn btn-ghost" onclick="Router.navigate('/dashboard')">Annuler</button>
        <button class="btn btn-primary" onclick="submitClientIntervention()">${ico('send')} Envoyer la demande</button>
      </div>
    </div>
  `);
}

async function submitClientIntervention() {
  const data = {
    title:       document.getElementById('f-title').value.trim(),
    service:     document.getElementById('f-service').value,
    priority:    document.getElementById('f-priority').value,
    device_info: document.getElementById('f-device').value.trim(),
    description: document.getElementById('f-desc').value.trim(),
    status:      'nouveau',
    user:        api.user.id,
  };
  if (!data.title || !data.description) return toast('Titre et description requis', 'warn');
  try {
    await api.createIntervention(data);
    toast('Demande envoyée ! Votre technicien vous contactera rapidement.', 'success', 4000);
    Router.navigate('/dashboard');
  } catch { toast('Erreur envoi', 'error'); }
}

// ───────────────────────────────────────────
// ACCÈS SANS COMPTE (lien + mot de passe)
// ───────────────────────────────────────────
async function accessLinkPage(token) {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo"><img src="/img/logo.png" alt="Intervys"></div>
        <h2 class="login-title">Accès sécurisé</h2>
        <p class="login-sub">Entrez le mot de passe fourni par votre technicien pour accéder à votre suivi.</p>
        <div class="form-group">
          <label>Mot de passe</label>
          <input class="form-control" type="password" id="access-pwd" placeholder="••••••••••" onkeydown="if(event.key==='Enter')verifyAccess('${token}')">
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="verifyAccess('${token}')">Accéder au suivi</button>
        <div style="text-align:center;margin-top:1.25rem">
          <a onclick="Router.navigate('/login')" style="font-size:.85rem;color:var(--muted);cursor:pointer">Vous avez un compte ? Se connecter</a>
        </div>
      </div>
    </div>
    <div id="toast-container"></div>
  `;
}

async function verifyAccess(token) {
  const pwd = document.getElementById('access-pwd').value;
  if (!pwd) return toast('Entrez le mot de passe', 'warn');
  try {
    const link = await api.verifyAccessLink(token, pwd);
    if (!link) return toast('Mot de passe incorrect', 'error');
    // Stocker le lien en session
    sessionStorage.setItem('hg_access_link', JSON.stringify(link));
    Router.navigate(`/access-dashboard/${link.id}`);
  } catch { toast('Erreur vérification', 'error'); }
}

async function accessDashboard(linkId) {
  const linkData = JSON.parse(sessionStorage.getItem('hg_access_link') || 'null');
  if (!linkData || linkData.id !== linkId) { Router.navigate('/login'); return; }

  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;padding:2rem 1rem;position:relative;z-index:1">
      <div style="max-width:700px;margin:0 auto">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem">
          <img src="/img/logo.png" style="height:44px;filter:drop-shadow(0 0 8px rgba(30,144,255,.4))">
          <div>
            <div style="font-family:var(--FD);font-size:1.3rem;color:var(--blue);font-weight:700`">${SITE_NAME}</div>
            <div style="font-size:.8rem;color:var(--muted)">Suivi d'intervention · ${linkData.client_name||'Client'}</div>
          </div>
        </div>
        <div id="access-content"><div class="spinner"></div></div>
      </div>
    </div>
    <div id="toast-container"></div>
  `;

  try {
    const data = await api.getInterventions(`access_link="${linkId}"`);
    const container = document.getElementById('access-content');
    if (!data.items.length) {
      container.innerHTML = `<div class="empty-state">${ico('tool')}<h3>Aucune intervention associée</h3><p>Contactez votre technicien si vous pensez que c'est une erreur.</p></div>`;
      return;
    }
    container.innerHTML = `<div style="display:flex;flex-direction:column;gap:1rem">
      ${data.items.map(i => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1rem">
            <div>
              <h3>${i.title}</h3>
              <div style="font-size:.82rem;color:var(--muted);margin-top:.2rem">${SERVICE_LABELS[i.service]||i.service}</div>
            </div>
            ${statusBadge(i.status)}
          </div>
          ${renderStatusTimeline(i.status)}
          <div style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border2);font-size:.82rem;color:var(--muted)">
            Créé le ${fmtDateShort(i.created)} · Mis à jour ${timeAgo(i.updated)}
          </div>
        </div>`).join('')}
    </div>`;
  } catch { toast('Erreur chargement', 'error'); }
}

// ───────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────
function requireClient() {
  if (!api.isLoggedIn) { Router.navigate('/login'); return false; }
  if (api.isAdmin)     { Router.navigate('/admin'); return false; }
  return true;
}

// Réutiliser renderMessages et ico depuis admin.js

// ── Messagerie client ──
async function clientMessages() {
  renderClientLayout('Messages', '<div class="spinner"></div>');
  try {
    // Charger toutes les interventions du client
    const filter = encodeURIComponent("user='" + api.user.id + "'");
    const interventions = await api.req('GET', '/api/collections/interventions/records?filter=' + filter + '&sort=-updated&perPage=50');

    if (!interventions.items.length) {
      document.getElementById('page-content').innerHTML = '<div class="empty-state"><h3>Aucune conversation</h3></div>';
      return;
    }

    // Charger le dernier message de chaque intervention
    const msgPromises = interventions.items.map(i =>
      api.req('GET', '/api/collections/messages/records?filter=' + encodeURIComponent("intervention='" + i.id + "'") + '&sort=-created&perPage=1')
        .then(r => ({ invId: i.id, last: r.items[0] || null }))
        .catch(() => ({ invId: i.id, last: null }))
    );
    const lastMsgs = await Promise.all(msgPromises);
    const lastMsgMap = {};
    lastMsgs.forEach(({ invId, last }) => { if (last) lastMsgMap[invId] = last; });

    // Trier par dernier message
    const withMsgs = interventions.items
      .filter(i => lastMsgMap[i.id])
      .sort((a,b) => new Date(lastMsgMap[b.id].created) - new Date(lastMsgMap[a.id].created));

    if (!withMsgs.length) {
      document.getElementById('page-content').innerHTML = '<div class="empty-state"><h3>Aucun message</h3></div>';
      return;
    }

    const firstId = withMsgs[0].id;

    document.getElementById('page-content').innerHTML = `
      <div style="display:grid;grid-template-columns:280px 1fr;gap:0;height:calc(100vh - 120px);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;background:var(--surface)">
        <div id="conv-list" style="border-right:1px solid var(--border);overflow-y:auto;background:var(--bg2)">
          ${withMsgs.map(i => {
            const last = lastMsgMap[i.id];
            return `<div id="cconv-${i.id}" onclick="openClientConv('${i.id}')"
              style="padding:.9rem 1rem;cursor:pointer;border-bottom:1px solid var(--border2);transition:background .15s${i.id===firstId?';background:var(--surface)':''}"
              onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background='${i.id===firstId?'var(--surface)':''}'">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem">
                <div style="font-weight:600;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${i.title}</div>
                <span style="font-size:.65rem;color:var(--muted);flex-shrink:0">${timeAgo(last.created)}</span>
              </div>
              <div style="font-size:.78rem;color:var(--muted2);margin-top:.2rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${last.from_admin ? '<span style="color:var(--blue)">Intervys : </span>' : 'Vous : '}${last.content.slice(0,60)}
              </div>
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex;flex-direction:column;overflow:hidden">
          <div style="padding:1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <span id="cchat-title" style="font-weight:700">Chargement...</span>
            <button class="btn btn-ghost btn-sm" id="cchat-goto">Voir l'intervention →</button>
          </div>
          <div id="cchat-messages" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.75rem;background:var(--bg2)">
            <div class="spinner"></div>
          </div>
          <div style="padding:.75rem;border-top:1px solid var(--border);display:flex;gap:.5rem;background:var(--surface)">
            <input id="cchat-input" class="form-control" style="flex:1" placeholder="Écrire un message..."
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendClientChatMsg()}">
            <button class="btn btn-primary btn-sm" onclick="sendClientChatMsg()">Envoyer</button>
          </div>
        </div>
      </div>`;

    window._clientActiveChatId = null;
    window._clientChatPoll = null;
    openClientConv(firstId);

  } catch(e) { console.error(e); toast('Erreur chargement', 'error'); }
}

async function openClientConv(invId) {
  if (window._clientChatPoll) clearInterval(window._clientChatPoll);
  window._clientActiveChatId = invId;

  document.querySelectorAll('[id^="cconv-"]').forEach(el => el.style.background = '');
  const convEl = document.getElementById('cconv-' + invId);
  if (convEl) convEl.style.background = 'var(--surface)';

  const inv = await api.req('GET', '/api/collections/interventions/records/' + invId);
  const titleEl = document.getElementById('cchat-title');
  const gotoBtn = document.getElementById('cchat-goto');
  if (titleEl) titleEl.textContent = inv.title;
  if (gotoBtn) gotoBtn.onclick = () => Router.navigate('/intervention/' + invId);

  await loadClientChatMessages(invId);
  window._clientChatPoll = setInterval(() => {
    if (window._clientActiveChatId === invId) loadClientChatMessages(invId);
  }, 5000);
}

async function loadClientChatMessages(invId) {
  const box = document.getElementById('cchat-messages');
  if (!box) return;
  const msgs = await api.req('GET', '/api/collections/messages/records?filter=' + encodeURIComponent("intervention='" + invId + "'") + '&sort=created&perPage=200');
  const wasAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  box.innerHTML = msgs.items.map(m => `
    <div style="display:flex;flex-direction:column;align-items:${m.from_admin?'flex-start':'flex-end'}">
      <div style="max-width:75%;background:${m.from_admin?'var(--bg3)':'var(--blue)'};color:${m.from_admin?'var(--text)':'#fff'};padding:.6rem .9rem;border-radius:12px;font-size:.88rem;line-height:1.5">
        ${m.content}
      </div>
      <div style="font-size:.68rem;color:var(--muted);margin-top:.2rem;padding:0 .3rem">
        ${m.from_admin ? SITE_NAME : 'Vous'} · ${timeAgo(m.created)}
      </div>
    </div>`).join('') || '<div style="text-align:center;color:var(--muted);padding:2rem">Aucun message</div>';
  if (wasAtBottom) box.scrollTop = box.scrollHeight;
}

async function sendClientChatMsg() {
  const input = document.getElementById('cchat-input');
  const content = input?.value.trim();
  if (!content || !window._clientActiveChatId) return;
  input.value = '';
  const name = api.user?.name || 'Client';
  try {
    await api.sendMessage(window._clientActiveChatId, content, false, name);
    await loadClientChatMessages(window._clientActiveChatId);
  } catch { toast('Erreur envoi', 'error'); }
}

