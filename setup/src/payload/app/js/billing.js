// ── billing.js ── Module Devis & Facturation Intervys

// ═══════════════════════════════════════════
// CONFIG (à adapter dans admin Settings)
// ═══════════════════════════════════════════
const BUSINESS = {
  name:    "",
  brand:   typeof SITE_NAME !== "undefined" ? SITE_NAME : "Intervys",
  legal:   "",
  address: "",
  city:    "",
  email:   "",
  phone:   "",
  website: "",
  siret:   "",
  rcs:     "",
  tva_num: "",
  iban:    "",
  bic:     "",
  tva:     "franchise",
};

// Charge les réglages métier persistés dans localStorage
(function() {
  try {
    const s = localStorage.getItem('business_settings');
    if (s) Object.assign(BUSINESS, JSON.parse(s));
  } catch(_) {}
})();

let SIGNATURE_B64 = localStorage.getItem('signature_b64') || '';

const QUOTE_STATUS   = { brouillon:"Brouillon", envoye:"Envoyé", accepte:"Accepté", refuse:"Refusé", expire:"Expiré", archive:"Archivé" };
const INVOICE_STATUS = { brouillon:"Brouillon", envoye:"Envoyé", paye:"Payé", annule:"Annulé" };
const QUOTE_COLORS   = { brouillon:"var(--muted)", envoye:"var(--blue)", accepte:"var(--green)", refuse:"var(--red)", expire:"var(--orange)", archive:"var(--muted)" };
const INVOICE_COLORS = { brouillon:"var(--muted)", envoye:"var(--blue)", paye:"var(--green)", annule:"var(--red)" };

// ═══════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════
async function getNextNumber(type) {
  const col  = type === 'quote' ? 'quotes' : 'invoices';
  const pfx  = type === 'quote' ? 'DEV' : 'FAC';
  const year = new Date().getFullYear();
  try {
    const data = await api.req('GET', `/api/collections/${col}/records?sort=-number&perPage=1`);
    if (!data.items.length) return `${pfx}-${year}-001`;
    const last = data.items[0].number;
    const num  = parseInt(last.split('-').pop() || '0') + 1;
    return `${pfx}-${year}-${String(num).padStart(3,'0')}`;
  } catch { return `${pfx}-${year}-001`; }
}

async function saveDoc(type, data) {
  const col = type === 'quote' ? 'quotes' : 'invoices';
  return api.req('POST', `/api/collections/${col}/records`, data);
}

async function updateDoc(type, id, data) {
  const col = type === 'quote' ? 'quotes' : 'invoices';
  return api.req('PATCH', `/api/collections/${col}/records/${id}`, data);
}

async function deleteDoc(type, id) {
  const col = type === 'quote' ? 'quotes' : 'invoices';
  return api.req('DELETE', `/api/collections/${col}/records/${id}`);
}

async function getDocs(type, filter = '') {
  const col = type === 'quote' ? 'quotes' : 'invoices';
  const q   = new URLSearchParams({ sort: '-created', perPage: 200 });
  if (filter) q.set('filter', filter);
  return api.req('GET', `/api/collections/${col}/records?${q}`);
}

// ═══════════════════════════════════════════
// CALCULS
// ═══════════════════════════════════════════
function calcTotals(items, taxRate = 0) {
  const subtotal  = items.reduce((s, i) => s + (parseFloat(i.qty||1) * parseFloat(i.price||0)), 0);
  const taxAmount = BUSINESS.tva === 'franchise' ? 0 : subtotal * (taxRate / 100);
  const total     = subtotal + taxAmount;
  return { subtotal: round2(subtotal), tax_amount: round2(taxAmount), total: round2(total) };
}

function round2(n) { return Math.round(n * 100) / 100; }

function formatEur(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

// ═══════════════════════════════════════════
// DASHBOARD FACTURATION
// ═══════════════════════════════════════════
async function billingDashboard() {
  if (!requireAdmin()) return;
  renderAdminLayout('Facturation', '<div class="spinner"></div>');
  try {
    const [quotes, invoices] = await Promise.all([
      getDocs('quote'),
      getDocs('invoice'),
    ]);
    const q = quotes.items;
    const f = invoices.items;
    const totalPaid    = f.filter(i => i.status==='paye').reduce((s,i) => s + i.total, 0);
    const totalPending = f.filter(i => i.status==='envoye').reduce((s,i) => s + i.total, 0);

    document.getElementById('page-content').innerHTML = `
      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom:2rem">
        <div class="stat-card success" style="cursor:pointer" onclick="invoicesList('paye')">
          <div class="stat-card-num" style="font-size:1.4rem">${formatEur(totalPaid)}</div>
          <div class="stat-card-label">Encaissé</div>
        </div>
        <div class="stat-card" style="cursor:pointer" onclick="invoicesList('envoye')">
          <div class="stat-card-num" style="font-size:1.4rem">${formatEur(totalPending)}</div>
          <div class="stat-card-label">En attente</div>
        </div>
        <div class="stat-card" style="cursor:pointer" onclick="quotesList()">
          <div class="stat-card-num">${q.filter(i=>i.status==='envoye').length}</div>
          <div class="stat-card-label">Devis envoyés</div>
        </div>
        <div class="stat-card success" style="cursor:pointer" onclick="quotesList('accepte')">
          <div class="stat-card-num">${q.filter(i=>i.status==='accepte').length}</div>
          <div class="stat-card-label">Devis acceptés</div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div style="display:flex;gap:.75rem;margin-bottom:2rem;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="newDocPage('quote')">${ico('plus')} Nouveau devis</button>
        <button class="btn btn-primary btn-sm" onclick="newDocPage('invoice')">${ico('plus')} Nouvelle facture</button>
        <button class="btn btn-ghost" onclick="quotesList()">Tous les devis →</button>
        <button class="btn btn-ghost" onclick="invoicesList()">Toutes les factures →</button>
      </div>

      <!-- Factures récentes -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Factures récentes</span>
          <button class="btn btn-ghost btn-sm" onclick="invoicesList()">Tout voir →</button>
        </div>
        ${docTable(f.slice(0,8), 'invoice')}
      </div>

      <!-- Devis récents -->
      <div class="card" style="margin-top:1.5rem">
        <div class="card-header">
          <span class="card-title">Devis récents</span>
          <button class="btn btn-ghost btn-sm" onclick="quotesList()">Tout voir →</button>
        </div>
        ${docTable(q.slice(0,6), 'quote')}
      </div>
    `;
  } catch(e) { console.error(e); toast('Erreur chargement facturation', 'error'); }
}

// ── Liste devis ──
async function quotesList(statusFilter = '') {
  if (!requireAdmin()) return;
  renderAdminLayout('Devis', '<div class="spinner"></div>');
  try {
    const filter = statusFilter ? `status="${statusFilter}"` : '';
    const data   = await getDocs('quote', filter);
    document.getElementById('page-content').innerHTML = `
      <div style="display:flex;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center">
        <select class="form-control" style="max-width:200px" onchange="quotesList(this.value)">
          <option value="">Tous les statuts</option>
          ${Object.entries(QUOTE_STATUS).map(([k,v]) => `<option value="${k}" ${statusFilter===k?'selected':''}>${v}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="newDocPage('quote')">${ico('plus')} Nouveau devis</button>
      </div>
      <div class="card">${docTable(data.items, 'quote')}</div>
      <div style="margin-top:.75rem;padding:.6rem 1rem;background:var(--bg2);border-radius:var(--r);border-left:3px solid var(--muted);font-size:.75rem;color:var(--muted2)">
        ℹ️ Les devis sont automatiquement <b>archivés après 3 mois</b> (sauf ceux acceptés). Les devis archivés dont le client n'a plus de compte sont <b>supprimés définitivement</b>.
      </div>
    `;
  } catch(e) { toast('Erreur', 'error'); }
}

// ── Liste factures ──
async function invoicesList(statusFilter = '') {
  if (!requireAdmin()) return;
  renderAdminLayout('Factures', '<div class="spinner"></div>');
  try {
    const filter = statusFilter ? `status="${statusFilter}"` : '';
    const data   = await getDocs('invoice', filter);
    document.getElementById('page-content').innerHTML = `
      <div style="display:flex;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center">
        <select class="form-control" style="max-width:200px" onchange="invoicesList(this.value)">
          <option value="">Tous les statuts</option>
          ${Object.entries(INVOICE_STATUS).map(([k,v]) => `<option value="${k}" ${statusFilter===k?'selected':''}>${v}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="newDocPage('invoice')">${ico('plus')} Nouvelle facture</button>
      </div>
      <div class="card">${docTable(data.items, 'invoice')}</div>
    `;
  } catch(e) { toast('Erreur', 'error'); }
}

// ── Table générique ──
function docTable(items, type) {
  const isInv    = type === 'invoice';
  const statuses = isInv ? INVOICE_STATUS : QUOTE_STATUS;
  const colors   = isInv ? INVOICE_COLORS : QUOTE_COLORS;
  if (!items.length) return `<div class="empty-state"><h3>Aucun ${isInv?'facture':'devis'}</h3></div>`;

  if (window.innerWidth < 768) {
    return `<div style="display:flex;flex-direction:column;gap:.6rem">
      ${items.map(d => `
        <div class="inv-card" onclick="${isInv?'viewInvoice':'viewQuote'}('${d.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-family:var(--FM);font-size:.75rem;color:var(--blue)">${d.number}</div>
              <div style="font-weight:700">${d.client_name}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;color:var(--blue)">${formatEur(d.total)}</div>
              <span style="font-size:.7rem;color:${colors[d.status]||'var(--muted)'}">${statuses[d.status]||d.status}</span>
            </div>
          </div>
          <div style="font-size:.75rem;color:var(--muted);margin-top:.4rem">${fmtDateShort(d.created)}</div>
          <div style="margin-top:.6rem;display:inline-flex;gap:8px" onclick="event.stopPropagation()">
            <span style="color:var(--blue);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Modifier" onclick="event.stopPropagation();${isInv?'editInvoice':'editQuote'}('${d.id}')">${ico('edit')}</span>
            <span style="color:var(--red);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Supprimer" onclick="event.stopPropagation();deleteDocConfirm('${type}','${d.id}')">${ico('trash')}</span>
          </div>
        </div>`).join('')}
    </div>`;
  }

  return `<div class="table-wrap"><table>
    <thead><tr><th>N°</th><th>Client</th><th>Total</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>
    ${items.map(d => `<tr style="cursor:pointer" onclick="${isInv?'viewInvoice':'viewQuote'}('${d.id}')">
      <td><code style="font-size:.75rem;color:var(--blue)">${d.number}</code></td>
      <td style="font-weight:600">${d.client_name}</td>
      <td style="font-weight:700;color:var(--blue)">${formatEur(d.total)}</td>
      <td><span style="font-size:.75rem;color:${colors[d.status]||'var(--muted)'};background:rgba(255,255,255,.05);padding:3px 10px;border-radius:100px">${statuses[d.status]||d.status}</span></td>
      <td style="color:var(--muted);font-size:.82rem">${fmtDateShort(d.created)}</td>
      <td onclick="event.stopPropagation()">
        <div style="display:flex;align-items:center;justify-content:center;gap:8px">
          <span style="color:var(--blue);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Modifier" onclick="${isInv?'editInvoice':'editQuote'}('${d.id}')">${ico('edit')}</span>
          <span style="color:var(--red);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Supprimer" onclick="deleteDocConfirm('${type}','${d.id}')">${ico('trash')}</span>
        </div>
      </td>
    </tr>`).join('')}
    </tbody>
  </table></div>`;
}

// ═══════════════════════════════════════════
// FORMULAIRE CRÉATION / ÉDITION
// ═══════════════════════════════════════════
async function newDocPage(type, prefill = {}) {
  if (!requireAdmin()) return;
  const number  = await getNextNumber(type);
  const isInv   = type === 'invoice';
  const today   = new Date().toISOString().slice(0,10);
  const due     = new Date(Date.now() + 30*86400000).toISOString().slice(0,10);

  renderAdminLayout(isInv ? 'Nouvelle facture' : 'Nouveau devis', `
    <div>
      ${docForm(type, { number, issued_at: today, due_date: due, valid_until: due, status: 'brouillon', items: [], ...prefill })}
    </div>
  `);
  initItemsTable(prefill.items || []);
}

async function editQuote(id) {
  if (!requireAdmin()) return;
  try {
    const doc = await api.req('GET', `/api/collections/quotes/records/${id}`);
    renderAdminLayout('Modifier devis', `<div>${docForm('quote', doc)}</div>`);
    initItemsTable(doc.items);
  } catch { toast('Erreur chargement', 'error'); }
}

async function editInvoice(id) {
  if (!requireAdmin()) return;
  try {
    const doc = await api.req('GET', `/api/collections/invoices/records/${id}`);
    renderAdminLayout('Modifier facture', `<div>${docForm('invoice', doc)}</div>`);
    initItemsTable(doc.items);
  } catch { toast('Erreur chargement', 'error'); }
}

function docForm(type, doc = {}) {
  const isInv = type === 'invoice';
  const statuses = isInv ? INVOICE_STATUS : QUOTE_STATUS;
  return `
  <div style="display:flex;gap:.75rem;margin-bottom:1.5rem;align-items:center;flex-wrap:wrap">
    <button class="btn btn-ghost btn-sm" onclick="history.back()">← Retour</button>
    <code style="font-family:var(--FM);color:var(--blue);background:var(--bg3);padding:4px 10px;border-radius:4px">${doc.number||''}</code>
    <div style="flex:1"></div>
    <button class="btn btn-ghost btn-sm" onclick="previewDoc('${type}')">Aperçu</button>
    ${type==='quote' && doc.id ? `<button class="btn btn-success btn-sm" onclick="convertToInvoice('${doc.id}')">Convertir</button>` : ''}
    <button class="btn btn-primary" onclick="submitDoc('${type}','${doc.id||''}')">Enregistrer</button>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">

    <!-- Infos client -->
    <div class="card">
      <div class="card-header"><span class="card-title">👤 Client</span>
        <button class="btn btn-ghost btn-sm" onclick="pickClientForDoc()">Choisir client</button>
      </div>
      <div class="form-group"><label>Nom *</label><input class="form-control" id="doc-client-name" value="${doc.client_name||''}"></div>
      <div class="form-group"><label>Email</label><input class="form-control" id="doc-client-email" value="${doc.client_email||''}"></div>
      <div class="form-group"><label>Téléphone</label><input class="form-control" id="doc-client-phone" value="${doc.client_phone||''}"></div>
      <div class="form-group"><label>Adresse</label><textarea class="form-control" id="doc-client-address" rows="3">${doc.client_address||''}</textarea></div>
    </div>

    <!-- Paramètres doc -->
    <div class="card">
      <div class="card-header"><span class="card-title">${isInv ? 'Facture' : 'Devis'}</span></div>
      <div class="form-row">
        <div class="form-group"><label>Numéro</label><input class="form-control" id="doc-number" value="${doc.number||''}"></div>
        <div class="form-group"><label>Statut</label>
          <select class="form-control" id="doc-status">
            ${Object.entries(statuses).map(([k,v]) => `<option value="${k}" ${doc.status===k?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Date d'émission</label><input class="form-control" type="date" id="doc-issued" value="${doc.issued_at?.slice(0,10)||''}"></div>
        <div class="form-group"><label>${isInv ? 'Date d\'échéance' : 'Valable jusqu\'au'}</label>
          <input class="form-control" type="date" id="doc-due" value="${(isInv ? doc.due_date : doc.valid_until)?.slice(0,10)||''}">
        </div>
      </div>
      ${isInv ? `
      <div class="form-group"><label>Lien de paiement Revolut</label>
        <input class="form-control" id="doc-payment-link" value="${doc.payment_link||''}" placeholder="https://revolut.me/...">
      </div>
      <div class="form-group"><label>Payé le</label>
        <input class="form-control" type="date" id="doc-paid-at" value="${doc.paid_at?.slice(0,10)||''}">
      </div>` : ''}
      <div class="form-group"><label>Intervention liée</label>
        <input class="form-control" id="doc-intervention" value="${doc.intervention||''}" placeholder="ID de l'intervention (optionnel)">
      </div>
    </div>
  </div>

  <!-- Lignes de prestation -->
  <div class="card" style="margin-top:1.5rem">
    <div class="card-header">
      <span class="card-title">📋 Prestations</span>
      <button class="btn btn-ghost btn-sm" onclick="addItemRow()">+ Ligne vide</button>
      <button class="btn btn-primary btn-sm" onclick="openProductPicker()">📋 Depuis le catalogue</button>
    </div>
    <div id="items-table">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--bg3)">
          <th style="padding:.6rem;text-align:left;font-family:var(--FM);font-size:.68rem;color:var(--muted2)">DESCRIPTION</th>
          <th style="padding:.6rem;text-align:center;font-family:var(--FM);font-size:.68rem;color:var(--muted2);width:80px">QTÉ</th>
          <th style="padding:.6rem;text-align:right;font-family:var(--FM);font-size:.68rem;color:var(--muted2);width:110px">P.U. HT (€)</th>
          <th style="padding:.6rem;text-align:right;font-family:var(--FM);font-size:.68rem;color:var(--muted2);width:110px">TOTAL HT</th>
          <th style="width:40px"></th>
        </tr></thead>
        <tbody id="items-body"></tbody>
      </table>
    </div>
    <!-- Totaux -->
    <div style="display:flex;justify-content:flex-end;margin-top:1rem">
      <div style="min-width:280px;background:var(--bg3);border-radius:var(--r2);padding:1rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:.4rem;font-size:.9rem">
          <span style="color:var(--muted)">Sous-total HT</span>
          <span id="tot-subtotal" style="font-weight:600">0,00 €</span>
        </div>
        ${BUSINESS.tva === 'franchise' ? `
        <div style="font-size:.78rem;color:var(--muted);margin-bottom:.4rem">TVA non applicable, art. 293 B du CGI</div>
        ` : `
        <div style="display:flex;justify-content:space-between;margin-bottom:.4rem;font-size:.9rem">
          <span style="color:var(--muted)">TVA (${BUSINESS.tva}%)</span>
          <span id="tot-tax" style="font-weight:600">0,00 €</span>
        </div>`}
        <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:.6rem;margin-top:.4rem">
          <span style="font-weight:700;font-size:1rem">Total TTC</span>
          <span id="tot-total" style="font-weight:700;font-size:1.1rem;color:var(--blue)">0,00 €</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Notes -->
  <div class="card" style="margin-top:1.5rem">
    <div class="card-header"><span class="card-title">📝 Notes / Conditions</span></div>
    <textarea class="form-control" id="doc-notes" rows="3" placeholder="Conditions de paiement, délais d'intervention, garanties...">${doc.notes||''}</textarea>
  </div>

  <!-- Boutons bas -->
  <div style="display:flex;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap">
    <button class="btn btn-ghost" onclick="history.back()">Annuler</button>
    <button class="btn btn-primary" onclick="submitDoc('${type}','${doc.id||''}')">Enregistrer</button>
    <button class="btn btn-ghost" onclick="previewDoc('${type}')">Aperçu</button>
    ${doc.id ? `<button class="btn btn-primary" onclick="sendDocByEmail('${doc.id}','${type}')">Envoyer par email</button>` : ''}
    ${type==='quote' && doc.id ? `<button class="btn btn-success" onclick="convertToInvoice('${doc.id}')">Convertir en facture</button>` : ''}
  </div>

  <input type="hidden" id="doc-type" value="${type}">
  `;
}

// ── Gestion des lignes ──
let _items = [];

function initItemsTable(items = []) {
  _items = items.length ? [...items] : [{ desc: '', qty: 1, price: 0 }];
  renderItemsTable();
}

function renderItemsTable() {
  const tbody = document.getElementById('items-body');
  if (!tbody) return;
  tbody.innerHTML = _items.map((item, i) => `
    <tr>
      <td style="padding:.4rem"><input class="form-control" style="font-size:.88rem" value="${item.desc||''}"
        oninput="_items[${i}].desc=this.value" placeholder="Description de la prestation"></td>
      <td style="padding:.4rem"><input class="form-control" type="number" min="0.5" step="0.5" style="text-align:center;font-size:.88rem" value="${item.qty||1}"
        oninput="_items[${i}].qty=parseFloat(this.value)||1;updateTotals()"></td>
      <td style="padding:.4rem"><input class="form-control" type="number" min="0" step="0.01" style="text-align:right;font-size:.88rem" value="${item.price||''}"
        oninput="_items[${i}].price=parseFloat(this.value)||0;updateTotals()" placeholder="0.00"></td>
      <td style="padding:.4rem;text-align:right;font-weight:600;color:var(--blue);font-size:.88rem">
        ${formatEur((parseFloat(item.qty)||1) * (parseFloat(item.price)||0))}
      </td>
      <td style="padding:.4rem;text-align:center">
        <button class="action-btn delete-btn" onclick="_items.splice(${i},1);renderItemsTable();updateTotals()" style="width:24px;height:24px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </td>
    </tr>
  `).join('');
  updateTotals();
}

function addItemRow() {
  _items.push({ desc: '', qty: 1, price: 0 });
  renderItemsTable();
  // Focus dernière ligne
  setTimeout(() => {
    const inputs = document.querySelectorAll('#items-body input');
    if (inputs.length) inputs[inputs.length - 3].focus();
  }, 50);
}

function updateTotals() {
  const t = calcTotals(_items, parseFloat(BUSINESS.tva) || 0);
  const sub = document.getElementById('tot-subtotal');
  const tax = document.getElementById('tot-tax');
  const tot = document.getElementById('tot-total');
  if (sub) sub.textContent = formatEur(t.subtotal);
  if (tax) tax.textContent = formatEur(t.tax_amount);
  if (tot) tot.textContent = formatEur(t.total);
  // Mettre à jour le total de chaque ligne sans re-render le tableau
  document.querySelectorAll('#items-body tr').forEach((tr, i) => {
    const tds = tr.querySelectorAll('td');
    if (tds[3] && _items[i]) {
      tds[3].textContent = formatEur((parseFloat(_items[i].qty)||1) * (parseFloat(_items[i].price)||0));
    }
  });
}

// ── Choisir un client existant ──
async function pickClientForDoc() {
  const users = await api.getUsers().catch(() => ({items:[]}));
  openModal(`
    <div class="modal-header"><span class="modal-title">👤 Choisir un client</span><button class="modal-close">×</button></div>
    <div style="display:flex;flex-direction:column;gap:.5rem;max-height:400px;overflow-y:auto">
      ${users.items.map(u => `
        <div class="inv-card" style="cursor:pointer" onclick="fillClientFromUser('${u.id}','${(u.name||'').replace(/'/g,"\\'")}','${u.email||''}','${u.phone||''}');closeModal()">
          <div style="font-weight:700">${u.name||u.email}</div>
          <div style="font-size:.8rem;color:var(--muted2)">${u.email}</div>
          ${u.phone ? `<div style="font-size:.78rem;color:var(--muted)">📞 ${u.phone}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `);
}

function fillClientFromUser(id, name, email, phone) {
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
  set('doc-client-name', name);
  set('doc-client-email', email);
  set('doc-client-phone', phone);
}

// ── Sauvegarder ──
async function submitDoc(type, existingId = '') {
  const get = (id) => document.getElementById(id)?.value || '';
  const isInv = type === 'invoice';

  const totals = calcTotals(_items, BUSINESS.tva === 'franchise' ? 0 : parseFloat(BUSINESS.tva));

  const data = {
    number:          get('doc-number'),
    status:          get('doc-status'),
    client_name:     get('doc-client-name'),
    client_email:    get('doc-client-email'),
    client_phone:    get('doc-client-phone'),
    client_address:  get('doc-client-address'),
    items:           _items,
    subtotal:        totals.subtotal,
    tax_rate:        BUSINESS.tva === 'franchise' ? 0 : parseFloat(BUSINESS.tva),
    tax_amount:      totals.tax_amount,
    total:           totals.total,
    notes:           get('doc-notes'),
    issued_at:       get('doc-issued') || new Date().toISOString().slice(0,10),
    intervention:    get('doc-intervention'),
  };

  if (isInv) {
    data.payment_link = get('doc-payment-link');
    data.due_date     = get('doc-due');
    data.paid_at      = get('doc-paid-at');
    if (data.status === 'paye' && !data.paid_at) data.paid_at = new Date().toISOString().slice(0,10);
  } else {
    data.valid_until  = get('doc-due');
  }

  if (!data.client_name) return toast('Nom du client requis', 'warn');
  if (!_items.length || !_items.some(i => i.desc)) return toast('Ajoutez au moins une prestation', 'warn');

  try {
    let doc;
    if (existingId) {
      doc = await updateDoc(type, existingId, data);
      toast('Enregistré', 'success');
    } else {
      doc = await saveDoc(type, data);
      toast(`${isInv ? 'Facture' : 'Devis'} créé`, 'success');
    }
    // Email auto si statut = envoyé
    if (data.status === 'envoye' && data.client_email) {
      await sendDocEmail(doc, type);
    }
    isInv ? invoicesList() : quotesList();
  } catch(e) { console.error(e); toast('Erreur enregistrement', 'error'); }
}

// ── Supprimer ──
async function deleteDocConfirm(type, id) {
  if (!await confirm(`Supprimer définitivement ce ${type === 'quote' ? 'devis' : 'cette facture'} ?`)) return;
  try {
    await deleteDoc(type, id);
    toast('Supprimé', 'success');
    type === 'quote' ? quotesList() : invoicesList();
  } catch { toast('Erreur', 'error'); }
}

// ── Convertir devis → facture ──
async function convertToInvoice(quoteId) {
  try {
    const quote  = await api.req('GET', `/api/collections/quotes/records/${quoteId}`);
    const number = await getNextNumber('invoice');
    const today  = new Date().toISOString().slice(0,10);
    const due    = new Date(Date.now() + 30*86400000).toISOString().slice(0,10);

    // Mettre à jour le statut du devis (non-bloquant)
    updateDoc('quote', quoteId, { status: 'accepte' }).catch(e => console.warn('Mise à jour statut devis échouée', e));

    // Pré-remplir le formulaire facture avec uniquement les champs pertinents
    await newDocPage('invoice', {
      client_name:    quote.client_name,
      client_email:   quote.client_email,
      client_phone:   quote.client_phone,
      client_address: quote.client_address,
      items:          quote.items || [],
      notes:          quote.notes,
      number,
      status:         'brouillon',
      quote_id:       quoteId,
      issued_at:      today,
      due_date:       due,
    });
    toast('Devis converti en facture — vérifiez et enregistrez', 'success', 4000);
  } catch(e) { console.error(e); toast('Erreur conversion : ' + (e?.message || JSON.stringify(e)), 'error', 5000); }
}

// ═══════════════════════════════════════════
// VUE DÉTAIL + PDF
// ═══════════════════════════════════════════
async function viewQuote(id)   { await viewDoc('quote', id); }
async function viewInvoice(id) { await viewDoc('invoice', id); }

async function viewDoc(type, id) {
  if (!requireAdmin()) return;
  try {
    const col = type === 'quote' ? 'quotes' : 'invoices';
    const doc = await api.req('GET', `/api/collections/${col}/records/${id}`);
    const isInv = type === 'invoice';
    const statuses = isInv ? INVOICE_STATUS : QUOTE_STATUS;
    const colors   = isInv ? INVOICE_COLORS : QUOTE_COLORS;

    window._currentDoc = doc;
    renderAdminLayout(doc.number, `
      <div style="display:flex;gap:.5rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center">
        <button class="btn btn-ghost btn-sm" onclick="history.back()">← Retour</button>
        <code style="font-family:var(--FM);color:var(--blue);background:var(--bg3);padding:4px 12px;border-radius:4px">${doc.number}</code>
        <span style="color:${colors[doc.status]};font-size:.82rem;font-weight:600">${statuses[doc.status]||doc.status}</span>
        <div style="flex:1"></div>

        <!-- Actions secondaires -->
        <button class="btn btn-ghost btn-sm" onclick="${isInv ? `downloadFacturXPdf(_currentDoc,'invoice')` : `downloadDocPdf('${id}','${type}')`}" style="display:inline-flex;align-items:center;gap:5px">${ico('doc')} ${isInv ? 'Factur-X PDF' : 'PDF'}</button>
        <button class="btn btn-ghost btn-sm" onclick="sendDocByEmail('${id}','${type}')" style="display:inline-flex;align-items:center;gap:5px">${ico('send')} Envoyer par email</button>
        ${isInv && doc.payment_link ? `<button class="btn btn-ghost btn-sm" onclick="copyText('${doc.payment_link}')" style="display:inline-flex;align-items:center;gap:5px">${ico('link')} Lien Revolut</button>` : ''}

        <!-- Action principale -->
        ${!isInv && doc.status !== 'refuse' && doc.status !== 'expire'
          ? `<button class="btn btn-primary btn-sm" onclick="convertToInvoice('${id}')">Convertir en facture →</button>`
          : ''}
        ${isInv && doc.status !== 'paye'
          ? `<button class="btn btn-primary btn-sm" onclick="markPaid('${id}')">Marquer payé</button>`
          : ''}

        <!-- Modifier + Supprimer groupés à droite -->
        <div style="width:1px;height:20px;background:var(--border);margin:0 .25rem"></div>
        <button class="btn btn-ghost btn-sm" onclick="${isInv?'editInvoice':'editQuote'}('${id}')" title="Modifier">${ico('edit')}</button>
        <button class="btn btn-sm" style="color:var(--red);background:none;border:1px solid transparent;border-radius:4px;opacity:.7" onmouseover="this.style.opacity=1;this.style.borderColor='var(--red)'" onmouseout="this.style.opacity=.7;this.style.borderColor='transparent'" onclick="deleteDocConfirm('${type}','${id}')">${ico('trash')}</button>
      </div>

      ${doc.intervention ? `
      <div id="inv-link-banner" style="margin-bottom:1rem;padding:.6rem 1rem;background:var(--bg3);border-radius:var(--r2);border-left:3px solid var(--blue);display:flex;align-items:center;gap:.75rem;cursor:pointer" onclick="adminInterventionDetail('${doc.intervention}')">
        <span style="font-size:.8rem;color:var(--muted)">🔗 Intervention liée</span>
        <span id="inv-link-title" style="font-size:.88rem;font-weight:600;color:var(--blue)">${doc.intervention}</span>
        <span style="font-size:.75rem;color:var(--muted);margin-left:auto">Voir le dossier →</span>
      </div>` : ''}
      <div style="display:flex;justify-content:center">
        <div id="doc-preview-area">${docPreviewHTML(doc, type)}</div>
      </div>
    `);

  // Charger le titre de l'intervention si liée
  if (doc.intervention) {
    api.req('GET', '/api/collections/interventions/records/' + doc.intervention)
      .then(inv => {
        const el = document.getElementById('inv-link-title');
        if (el) el.textContent = inv.title + (inv.device_info ? ' — ' + inv.device_info : '');
      }).catch(() => {});
  }
  } catch(e) { console.error(e); toast('Erreur', 'error'); }
}

async function transmitToPA(id) {
  const ok = await confirm('Transmettre cette facture à votre Plateforme Agréée (norme AFNOR XP Z12-013) ?\nLa facture sera routée vers la PA de votre client.');
  if (!ok) return;
  try {
    toast('Transmission en cours...', 'info', 8000);
    await api.req('PATCH', `/api/collections/invoices/records/${id}`, { status: 'transmis_pa' });
    // Attendre que le hook traite (2-3 secondes)
    await new Promise(r => setTimeout(r, 3000));
    const inv = await api.req('GET', `/api/collections/invoices/records/${id}`);
    if (inv.pa_invoice_id) {
      toast('Facture transmise à la PA ! ID : ' + inv.pa_invoice_id, 'success', 6000);
    } else if (inv.status === 'transmis') {
      toast('Facture transmise avec succès', 'success', 5000);
    } else {
      toast('Vérifiez les logs PocketBase — la configuration PA est peut-être incomplète', 'warn', 6000);
    }
    viewInvoice(id);
  } catch(e) { toast('Erreur : ' + (e.message||''), 'error'); }
}

async function downloadDocPdf(id, type) {
  const col = type === 'quote' ? 'quotes' : 'invoices';
  try {
    const doc   = await api.req('GET', `/api/collections/${col}/records/${id}`);
    const title = doc.number || (type === 'invoice' ? 'Facture' : 'Devis');

    // Utiliser l'élément déjà rendu sur la page (garantit un rendu correct)
    const previewEl = document.getElementById('doc-preview-area');
    await loadHtml2Pdf();

    const source = previewEl && previewEl.children.length
      ? previewEl
      : (() => {
          const div = document.createElement('div');
          div.style.cssText = 'position:fixed;top:-2000px;left:0;width:800px;background:#fff';
          div.innerHTML = docPreviewHTML(doc, type);
          document.body.appendChild(div);
          return div;
        })();

    const needsRemove = source !== previewEl;

    toast('Generation PDF...', 'info', 5000);
    await new Promise(r => setTimeout(r, needsRemove ? 300 : 50));

    html2pdf().set({
      margin:      [10, 10, 10, 10],
      filename:    title + '.pdf',
      image:       { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(source).save().then(() => {
      if (needsRemove) document.body.removeChild(source);
      toast('PDF telecharge', 'success', 3000);
    }).catch(err => {
      if (needsRemove) try { document.body.removeChild(source); } catch(e) {}
      toast('Erreur PDF', 'error');
      console.error(err);
    });
  } catch(e) { toast('Erreur', 'error'); console.error(e); }
}

// Attend que toutes les <img> d'un conteneur soient chargées (logo en data-URI ou /img/logo.png),
// avec un plafond de sécurité. html2canvas rend du blanc si les images ne sont pas prêtes.
function _waitForImages(container, capMs = 4000) {
  const imgs = Array.from(container.querySelectorAll('img'));
  if (!imgs.length) return Promise.resolve();
  const loaded = Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(res => { img.onload = res; img.onerror = res; });
  }));
  return Promise.race([loaded, new Promise(res => setTimeout(res, capMs))]);
}

async function sendDocByEmail(id, type) {
  const col   = type === 'quote' ? 'quotes' : 'invoices';
  const isInv = type === 'invoice';
  const doc   = await api.req('GET', `/api/collections/${col}/records/${id}`);
  const email = doc.client_email || '';

  if (!email) {
    toast('Aucun email client renseigné sur ce document', 'warn');
    return;
  }

  const ok = await confirm(`Envoyer ${isInv ? 'la facture' : 'le devis'} ${doc.number} à ${email} ?`);
  if (!ok) return;

  try {
    toast('Génération du PDF...', 'info', 8000);

    await loadHtml2Pdf();

    // Capturer en priorité l'élément VISIBLE déjà rendu (#doc-preview-area) — c'est ce que
    // fait downloadDocPdf qui fonctionne. Sinon (depuis le formulaire d'édition), créer un
    // div off-screen PLEINEMENT VISIBLE (left:-10000px, jamais opacity ni visibility:hidden)
    // et ATTENDRE le chargement des images (logo) avant la capture.
    const previewEl = document.getElementById('doc-preview-area');
    let source, needsRemove;
    if (previewEl && previewEl.children.length) {
      source = previewEl;
      needsRemove = false;
    } else {
      source = document.createElement('div');
      source.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:#fff';
      source.innerHTML = docPreviewHTML(doc, type);
      document.body.appendChild(source);
      needsRemove = true;
    }
    await _waitForImages(source);
    await new Promise(r => setTimeout(r, needsRemove ? 150 : 60)); // laisser le layout se stabiliser

    let pdfB64 = '';
    try {
      const buf = await html2pdf().set({
        margin:      [10, 10, 10, 10],
        image:       { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(source).outputPdf('arraybuffer');
      const bytes = new Uint8Array(buf);
      let binary = '';
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      pdfB64 = btoa(binary);
    } finally {
      if (needsRemove) try { document.body.removeChild(source); } catch(_) {}
    }
    if (pdfB64.length < 5000) throw new Error('PDF vide (génération échouée)');

    toast('Envoi en cours...', 'info', 4000);
    const res = await fetch('/send-doc', {
      method: 'POST',
      headers: {
        'Authorization': api.token,
        'X-Doc-Collection': col,
        'X-Doc-Id': id,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfB64 }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || ('HTTP ' + res.status));
    }

    await api.req('PATCH', `/api/collections/${col}/records/${id}`, { status: 'envoye' });
    isInv ? viewInvoice(id) : viewQuote(id);
    setTimeout(() => toast(`${isInv ? 'Facture' : 'Devis'} envoyé à ${email}`, 'success', 4000), 400);
  } catch(e) {
    console.error(e);
    toast('Erreur envoi : ' + (e.message || ''), 'error');
  }
}

async function generateDocPdfB64(doc, type) {
  try {
    await loadHtml2Pdf();
    const { bytes } = await generateFacturXPdf(doc, type);
    // Convertir Uint8Array en base64
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  } catch(e) {
    console.error('[generateDocPdfB64]', e);
    return '';
  }
}

async function markPaid(id) {
  try {
    await updateDoc('invoice', id, { status: 'paye', paid_at: new Date().toISOString().slice(0,10) });
    toast('Facture marquée comme payée', 'success');
    viewInvoice(id);
  } catch { toast('Erreur', 'error'); }
}

const UNIT_LABELS = {
  h:          'Heure',
  forfait:    'Forfait',
  piece:      'Pièce',
  jour:       'Jour',
  mois:       'Mois',
  licence:    'Licence',
  deplacement:'Déplacement',
  autre:      'Autre',
};

const CAT_LABELS = {
  depannage:   '💻 Dépannage',
  reseau:      '📶 Réseau',
  domotique:   '🏠 Domotique',
  gaming:      '🎮 Gaming',
  multimedia:  '🎬 Multimédia',
  electronique:'⚡ Électronique',
  impression3d:'🖨️ Impression 3D',
  gravure:     '✨ Gravure laser',
  flocage:     '👕 Flocage',
  deplacement: '🚗 Déplacement',
  autre:       '📦 Autre',
};

async function getProducts(activeOnly = true) {
  const q = new URLSearchParams({ sort: 'category,name', perPage: 200 });
  if (activeOnly) q.set('filter', 'active=true');
  return api.req('GET', `/api/collections/products/records?${q}`);
}

// ── Page catalogue ──
async function submitProduct(id = '') {
  const data = {
    name:        document.getElementById('p-name').value.trim(),
    description: document.getElementById('p-desc').value.trim(),
    price:       parseFloat(document.getElementById('p-price').value) || 0,
    unit:        document.getElementById('p-unit').value,
    category:    document.getElementById('p-cat').value,
    active:      document.getElementById('p-active').value === 'true',
  };
  if (!data.name) return toast('Nom requis', 'warn');
  if (!data.price) return toast('Prix requis', 'warn');
  try {
    if (id) {
      await api.req('PATCH', `/api/collections/products/records/${id}`, data);
    } else {
      await api.req('POST', '/api/collections/products/records', data);
    }
    closeModal();
    toast('Prestation enregistrée', 'success');
    productsList();
  } catch { toast('Erreur', 'error'); }
}

async function deleteProductConfirm(id) {
  if (!await confirm('Supprimer cette prestation du catalogue ?')) return;
  try {
    await api.req('DELETE', `/api/collections/products/records/${id}`);
    toast('Supprimée', 'success');
    productsList();
  } catch { toast('Erreur', 'error'); }
}

// ═══════════════════════════════════════════
// SÉLECTION RAPIDE DEPUIS LE CATALOGUE
// ═══════════════════════════════════════════
function docPreviewHTML(doc, type) {
  const isInv = type === 'invoice';
  const items = Array.isArray(doc.items) ? doc.items : (typeof doc.items === 'string' ? JSON.parse(doc.items||'[]') : []);
  const totals = calcTotals(items, doc.tax_rate||0);
  const issued = doc.issued_at ? new Date(doc.issued_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  const due    = isInv
    ? (doc.due_date    ? new Date(doc.due_date).toLocaleDateString('fr-FR')    : '—')
    : (doc.valid_until ? new Date(doc.valid_until).toLocaleDateString('fr-FR') : '—');

  const logoUrl = localStorage.getItem('doc_logo_b64') || (typeof window !== 'undefined' && window._customLogo) || '/img/logo.png';

  return `<div style="background:#fff;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;max-width:800px;font-size:10pt;line-height:1.5">

    <!-- EN-TÊTE -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:2rem 2.5rem 1.5rem;border-bottom:3px solid var(--blue)">
      <div style="display:flex;flex-direction:column;align-items:flex-start;gap:.4rem">
        <img src="${logoUrl}" alt="" style="max-height:110px;max-width:220px;object-fit:contain"
          onerror="this.style.display='none'">
        <div style="font-size:.78rem;color:#777">${BUSINESS.email}${BUSINESS.phone ? ' · ' + BUSINESS.phone : ''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:1.5rem;font-weight:800;color:#1a1a2e;text-transform:uppercase;letter-spacing:.04em">${isInv ? 'Facture' : 'Devis'}</div>
        <div style="font-size:1rem;font-weight:700;color:var(--blue);margin:.2rem 0">${doc.number||''}</div>
        <div style="font-size:.8rem;color:#666;line-height:1.8">
          Émis le : <strong>${issued}</strong><br>
          ${isInv ? `Échéance : <strong>${due}</strong>` : `Valide jusqu'au : <strong>${due}</strong>`}
        </div>
        ${isInv && doc.paid_at ? `<div style="background:#dcfce7;color:#16a34a;font-size:.75rem;font-weight:700;padding:3px 10px;border-radius:100px;margin-top:.4rem;display:inline-block">✓ Payé le ${new Date(doc.paid_at).toLocaleDateString('fr-FR')}</div>` : ''}
      </div>
    </div>

    <!-- CLIENT -->
    <div style="padding:1.25rem 2.5rem;background:rgba(var(--blue-rgb),0.05);border-bottom:1px solid rgba(var(--blue-rgb),0.15)">
      <div style="font-size:.65rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.12em;margin-bottom:.4rem">Facturer à</div>
      <div style="font-weight:700;font-size:.95rem">${doc.client_name||''}</div>
      ${doc.client_address ? `<div style="font-size:.82rem;color:#555;white-space:pre-line;margin-top:.1rem">${doc.client_address}</div>` : ''}
      ${doc.client_email   ? `<div style="font-size:.8rem;color:#555">${doc.client_email}</div>` : ''}
      ${doc.client_phone   ? `<div style="font-size:.8rem;color:#555">${doc.client_phone}</div>` : ''}
    </div>

    <!-- TABLEAU -->
    <div style="padding:0 2.5rem">
      <table style="width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:.88rem">
        <thead>
          <tr style="background:var(--blue)">
            <th style="padding:.6rem 1rem;text-align:left;color:#fff;font-weight:600;border-radius:4px 0 0 4px">Désignation</th>
            <th style="padding:.6rem .5rem;text-align:center;color:#fff;font-weight:600;width:55px">Qté</th>
            <th style="padding:.6rem .5rem;text-align:center;color:#fff;font-weight:600;width:70px">Unité</th>
            <th style="padding:.6rem .75rem;text-align:right;color:#fff;font-weight:600;width:90px">P.U. HT</th>
            <th style="padding:.6rem .5rem;text-align:center;color:#fff;font-weight:600;width:50px">TVA</th>
            <th style="padding:.6rem 1rem;text-align:right;color:#fff;font-weight:600;width:90px;border-radius:0 4px 4px 0">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, i) => `
            <tr style="border-bottom:1px solid rgba(var(--blue-rgb),0.08);${i%2===1?'background:rgba(var(--blue-rgb),0.02)':''}">
              <td style="padding:.55rem 1rem">${item.desc||''}</td>
              <td style="padding:.55rem .5rem;text-align:center;color:#666">${item.qty||1}</td>
              <td style="padding:.55rem .5rem;text-align:center;color:#888;font-size:.78rem">${UNIT_LABELS[item.unit]||'unité'}</td>
              <td style="padding:.55rem .75rem;text-align:right;color:#444">${formatEur(parseFloat(item.price)||0)}</td>
              <td style="padding:.55rem .5rem;text-align:center;color:#888">${BUSINESS.tva === 'franchise' ? '0%' : (doc.tax_rate||BUSINESS.tva||0) + '%'}</td>
              <td style="padding:.55rem 1rem;text-align:right;font-weight:700;color:var(--blue)">${formatEur((parseFloat(item.qty)||1)*(parseFloat(item.price)||0))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- TOTAUX -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:1.5rem">
        <div style="min-width:260px;border:1px solid rgba(var(--blue-rgb),0.15);border-radius:8px;overflow:hidden">
          <div style="display:flex;justify-content:space-between;padding:.5rem 1rem;border-bottom:1px solid rgba(var(--blue-rgb),0.15)">
            <span style="color:#555">Total HT</span><strong>${formatEur(totals.subtotal)}</strong>
          </div>
          ${BUSINESS.tva !== 'franchise' ? `<div style="display:flex;justify-content:space-between;padding:.5rem 1rem;border-bottom:1px solid rgba(var(--blue-rgb),0.15)">
            <span style="color:#555">TVA (${doc.tax_rate||BUSINESS.tva||0}%)</span><strong>${formatEur(totals.tax_amount)}</strong>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:.6rem 1rem;background:rgba(var(--blue-rgb),0.08)">
            <strong style="font-size:1rem">Total TTC</strong>
            <strong style="font-size:1.1rem;color:var(--blue)">${formatEur(totals.total)}</strong>
          </div>
        </div>
      </div>
    </div>

    ${BUSINESS.tva === 'franchise' ? `<div style="padding:0 2.5rem;font-size:.75rem;color:#888;font-style:italic;margin-bottom:1rem">TVA non applicable, art. 293 B du CGI</div>` : ''}

    ${!isInv ? `
    <div style="padding:0 2.5rem;margin-bottom:1.5rem">
      <div style="font-size:.78rem;color:#555;font-style:italic;margin-bottom:1.25rem">
        Pour être accepté, ce devis doit être daté, signé et accompagné de la mention manuscrite « Bon pour accord ».
      </div>
      <div style="display:flex;justify-content:space-between;gap:2rem">
        <div style="flex:1">
          <div style="font-size:.72rem;color:#888;margin-bottom:.4rem">Signature ${BUSINESS.name || BUSINESS.brand || ''}</div>
          <div style="border:1px solid #ccc;border-radius:4px;height:65px;display:flex;align-items:center;justify-content:center;padding:4px">
            ${(window.SIGNATURE_B64||SIGNATURE_B64||localStorage.getItem('signature_b64')||'') ? `<img src="${window.SIGNATURE_B64||SIGNATURE_B64||localStorage.getItem('signature_b64')}" style="max-height:55px;max-width:160px;object-fit:contain">` : '<span style="font-size:.7rem;color:#bbb">aucune signature</span>'}
          </div>
        </div>
        <div style="flex:1;text-align:right">
          <div style="font-size:.72rem;color:#888;margin-bottom:.4rem">Signature client + « Bon pour accord »</div>
          <div style="border:1px solid #ccc;border-radius:4px;height:65px"></div>
        </div>
      </div>
    </div>` : `
    <div style="margin:0 2.5rem 1.5rem;background:rgba(var(--blue-rgb),0.08);border-radius:8px;padding:1rem 1.25rem;border-left:4px solid var(--blue);font-size:.82rem;color:#444;line-height:1.8">
      <strong>Règlement par virement bancaire</strong><br>
      Bénéficiaire : ${BUSINESS.name} · IBAN : <strong style="font-family:monospace">${BUSINESS.iban}</strong><br>
      BIC : ${BUSINESS.bic} · Référence : <strong>${doc.number||''}</strong>
      ${doc.payment_link ? `<br>💳 Paiement en ligne : <a href="${doc.payment_link}" style="color:var(--blue)">${doc.payment_link}</a>` : ''}
    </div>`}

    ${doc.notes ? `<div style="margin:0 2.5rem 1.5rem;font-size:.8rem;color:#555;padding:.75rem;background:#f9f9f9;border-radius:4px;border:1px solid #eee">${doc.notes}</div>` : ''}

    <!-- PIED -->
    <div style="padding:1rem 2.5rem;border-top:1px solid rgba(var(--blue-rgb),0.15);text-align:center;font-size:.7rem;color:#999;background:rgba(var(--blue-rgb),0.03)">
      ${BUSINESS.legal} · ${BUSINESS.address}, ${BUSINESS.city} · SIREN ${BUSINESS.siret}${BUSINESS.rcs ? ' · ' + BUSINESS.rcs : ''}${BUSINESS.tva_num ? ' · N° TVA ' + BUSINESS.tva_num : ''}${BUSINESS.website ? ' · ' + BUSINESS.website : ''}
    </div>
  </div>`;
}


function previewDoc(type) {
  const get = (id) => document.getElementById(id)?.value || '';
  const totals = calcTotals(_items, BUSINESS.tva === 'franchise' ? 0 : parseFloat(BUSINESS.tva));
  const doc = {
    number:         get('doc-number'),
    status:         get('doc-status'),
    client_name:    get('doc-client-name'),
    client_email:   get('doc-client-email'),
    client_phone:   get('doc-client-phone'),
    client_address: get('doc-client-address'),
    items:          _items,
    subtotal:       totals.subtotal,
    tax_amount:     totals.tax_amount,
    total:          totals.total,
    tax_rate:       BUSINESS.tva === 'franchise' ? 0 : parseFloat(BUSINESS.tva),
    notes:          get('doc-notes'),
    issued_at:      get('doc-issued'),
    due_date:       type === 'invoice' ? get('doc-due') : '',
    valid_until:    type === 'quote'   ? get('doc-due') : '',
    payment_link:   type === 'invoice' ? get('doc-payment-link') : '',
    paid_at:        type === 'invoice' ? get('doc-paid-at') : '',
  };
  // Stocker le HTML pour l'impression
  window._docPreview = docPreviewHTML(doc, type);
  window._docType    = type;

  openModal(
    '<div class="modal-header">'
    + '<span class="modal-title">Aperçu ' + (type === 'invoice' ? 'facture' : 'devis') + '</span>'
    + '<button class="modal-close">×</button>'
    + '</div>'
    + '<div id="doc-modal-preview" style="max-height:68vh;overflow-y:auto;border-radius:8px;border:1px solid var(--border2)">'
    + window._docPreview
    + '</div>'
    + '<div class="modal-footer">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Fermer</button>'
    + '<button class="btn btn-primary" onclick="closeModal();printDocFromPreview()">Imprimer / PDF</button>'
    + '</div>'
  );
}

function printDocFromPreview() {
  printDocHTML(null, window._docType, window._docPreview);
}

function printDoc(id, type) {
  // Extraire le HTML de preview déjà affiché
  const preview = document.getElementById('doc-preview-area');
  if (!preview) return;
  printDocHTML(null, type, preview.innerHTML);
}

function printDocHTML(doc, type, existingHtml = '') {
  const html  = existingHtml || docPreviewHTML(doc, type);
  const title = doc?.number || (type === 'invoice' ? 'Facture' : 'Devis');

  // Créer un container temporaire invisible
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:0;top:0;width:800px;background:white;font-family:Arial,sans-serif;visibility:hidden';
  container.innerHTML = html;
  document.body.appendChild(container);


  // Charger html2pdf si pas encore chargé
  const generate = () => {
    const opt = {
      margin:      [10, 10, 10, 10],
      filename:    title + '.pdf',
      image:       { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:   { mode: ['avoid-all', 'css'] },
    };
    toast('Génération du PDF...', 'info', 3000);
    html2pdf().set(opt).from(container).save().then(() => {
      document.body.removeChild(container);
      toast('PDF téléchargé', 'success', 3000);
    }).catch(err => {
      document.body.removeChild(container);
      toast('Erreur PDF : ' + err, 'error');
    });
  };

  if (typeof html2pdf !== 'undefined') {
    setTimeout(generate, 150); // laisser le DOM se rendre
  } else {
    const script = document.createElement('script');
    script.src = '/js/html2pdf.bundle.min.js';
    script.onload = generate;
    script.onerror = () => {
      // Fallback: nouvelle fenêtre avec impression
      document.body.removeChild(container);
      const win = window.open('', '_blank');
      win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title>'
        + '<style>body{margin:1cm;font-family:Arial}</style></head><body>' + html
        + '<script>window.onload=function(){window.print()}<\/script></body></html>');
      win.document.close();
    };
    document.head.appendChild(script);
  }
}

// ═══════════════════════════════════════════
// EMAIL AUTO
// ═══════════════════════════════════════════
async function sendDocEmail(doc, type) {
  // L'email est envoyé via un hook PocketBase dédié
  // Pour l'instant on notifie juste l'admin
  const isInv = type === 'invoice';
  toast(`${isInv ? 'Facture' : 'Devis'} envoyé à ${doc.client_email}`, 'success', 4000);
}


// ═══════════════════════════════════════════
// CATALOGUE DE PRESTATIONS
// ═══════════════════════════════════════════


function filterProductPicker(q) {
  const items = document.querySelectorAll('.picker-item');
  const groups = document.querySelectorAll('.picker-group');
  q = q.toLowerCase();
  items.forEach(el => {
    const name = el.dataset.name.toLowerCase();
    const desc = el.dataset.desc.toLowerCase();
    el.style.display = (!q || name.includes(q) || desc.includes(q)) ? '' : 'none';
  });
  groups.forEach(g => {
    const visible = [...g.querySelectorAll('.picker-item')].some(el => el.style.display !== 'none');
    g.style.display = visible ? '' : 'none';
  });
}


// ═══════════════════════════════════════════
// CATALOGUE PRODUITS / PRESTATIONS
// ═══════════════════════════════════════════


// ── Liste des produits ──
async function productsList() {
  if (!requireAdmin()) return;
  renderAdminLayout('Catalogue', '<div class="spinner"></div>');
  try {
    const data = await api.req('GET', '/api/collections/products/records?sort=category,name&perPage=200');
    const items = data.items;

    // Grouper par catégorie
    const groups = {};
    items.forEach(p => {
      const cat = p.category || 'autre';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    document.getElementById('page-content').innerHTML = `
      <div style="display:flex;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary" onclick="newProductModal()">+ Ajouter une prestation</button>
        <span style="color:var(--muted);font-size:.82rem">${items.length} prestation${items.length>1?'s':''} enregistrée${items.length>1?'s':''}</span>
      </div>

      ${Object.keys(CAT_LABELS).map(cat => {
        const catItems = groups[cat];
        if (!catItems?.length) return '';
        return `
        <div class="card" style="margin-bottom:1.5rem">
          <div class="card-header">
            <span class="card-title">${CAT_LABELS[cat]}</span>
          </div>
          <div class="table-wrap"><table>
            <thead><tr><th>Prestation</th><th>Description</th><th>Prix HT</th><th>Unité</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              ${catItems.map(p => `<tr>
                <td style="font-weight:600">${p.name}</td>
                <td style="color:var(--muted);font-size:.82rem;max-width:250px">${p.description||'—'}</td>
                <td style="font-weight:700;color:var(--blue)">${formatEur(p.price)}</td>
                <td style="font-size:.8rem;color:var(--muted2)">${UNIT_LABELS[p.unit]||''}</td>
                <td>${p.active ? '<span style="color:var(--green);font-size:.78rem">● Actif</span>' : '<span style="color:var(--muted);font-size:.78rem">● Inactif</span>'}</td>
                <td onclick="event.stopPropagation()">
                  <div style="display:flex;align-items:center;justify-content:center;gap:8px">
                    <span style="color:var(--blue);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Modifier" onclick="editProductModal('${p.id}')">${ico('edit')}</span>
                    <span style="color:var(--red);cursor:pointer;display:inline-flex;width:18px;height:18px" title="Supprimer" onclick="deleteProduct('${p.id}')">${ico('trash')}</span>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>`;
      }).join('')}

      ${!items.length ? `
        <div class="empty-state">
          <h3>Aucune prestation enregistrée</h3>
          <p style="color:var(--muted);margin-bottom:1rem">Ajoutez vos prestations habituelles pour les sélectionner rapidement lors de la création de devis et factures.</p>
          <button class="btn btn-primary" onclick="newProductModal()">+ Créer ma première prestation</button>
        </div>` : ''}
    `;
  } catch(e) { console.error(e); toast('Erreur chargement catalogue', 'error'); }
}

// ── Modal nouveau produit ──
function newProductModal() {
  openModal(`
    <div class="modal-header">
      <span class="modal-title">+ Nouvelle prestation</span>
      <div style="display:flex;gap:.5rem;align-items:center">
        <button class="btn btn-primary btn-sm" onclick="submitProduct()">Enregistrer</button>
        <button class="modal-close">×</button>
      </div>
    </div>
    ${productForm()}

  `);
}

async function editProductModal(id) {
  try {
    const p = await api.req('GET', `/api/collections/products/records/${id}`);
    openModal(`
      <div class="modal-header">
        <span class="modal-title">Modifier la prestation</span>
        <div style="display:flex;gap:.5rem;align-items:center">
          <button class="btn btn-primary btn-sm" onclick="submitProduct('${p.id}')">Enregistrer</button>
          <button class="modal-close">×</button>
        </div>
      </div>
      ${productForm(p)}

    `);
  } catch { toast('Erreur', 'error'); }
}

function productForm(p = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Nom de la prestation *</label>
        <input class="form-control" id="p-name" value="${p.name||''}" placeholder="Ex: Diagnostic informatique">
      </div>
      <div class="form-group">
        <label>Catégorie</label>
        <select class="form-control" id="p-category">
          ${Object.entries(CAT_LABELS).map(([k,v]) => `<option value="${k}" ${p.category===k?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Description</label>
      <input class="form-control" id="p-desc" value="${p.description||''}" placeholder="Détails de la prestation...">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Prix HT (€) *</label>
        <input class="form-control" type="number" id="p-price" value="${p.price||''}" placeholder="0.00" step="0.01" min="0">
      </div>
      <div class="form-group">
        <label>Unité</label>
        <select class="form-control" id="p-unit">
          ${Object.entries(UNIT_LABELS).map(([k,v]) => `<option value="${k}" ${p.unit===k?'selected':''}>${v||k}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Statut</label>
        <select class="form-control" id="p-active">
          <option value="true" ${p.active!==false?'selected':''}>✅ Actif</option>
          <option value="false" ${p.active===false?'selected':''}>⏸ Inactif</option>
        </select>
      </div>
    </div>
  `;
}

async function submitProduct(id = '') {
  const data = {
    name:        document.getElementById('p-name').value.trim(),
    description: document.getElementById('p-desc').value.trim(),
    price:       parseFloat(document.getElementById('p-price').value) || 0,
    unit:        document.getElementById('p-unit').value,
    category:    document.getElementById('p-category').value,
    active:      document.getElementById('p-active').value === 'true',
  };
  if (!data.name) return toast('Nom requis', 'warn');
  if (!data.price) return toast('Prix requis', 'warn');
  try {
    if (id) {
      await api.req('PATCH', `/api/collections/products/records/${id}`, data);
    } else {
      await api.req('POST', '/api/collections/products/records', data);
    }
    closeModal();
    toast('Prestation enregistrée', 'success');
    productsList();
  } catch(e) { toast('Erreur', 'error'); }
}

async function deleteProduct(id) {
  if (!await confirm('Supprimer cette prestation ?')) return;
  try {
    await api.req('DELETE', `/api/collections/products/records/${id}`);
    toast('Supprimée', 'success');
    productsList();
  } catch { toast('Erreur', 'error'); }
}

// ── Sélection rapide depuis le formulaire devis/facture ──
async function openProductPicker() {
  try {
    const data = await api.req('GET', '/api/collections/products/records?filter=active=true&sort=category,name&perPage=200');
    const products = data.items;

    // Grouper par catégorie
    const groups = {};
    products.forEach(p => {
      const cat = p.category || 'autre';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    openModal(`
      <div class="modal-header">
        <span class="modal-title">📋 Choisir une prestation</span>
        <button class="modal-close">×</button>
      </div>
      <input class="form-control" id="product-search" placeholder="🔍 Rechercher..." oninput="filterProducts(this.value)" style="margin-bottom:1rem">
      <div id="product-list" style="display:flex;flex-direction:column;gap:.5rem;max-height:450px;overflow-y:auto">
        ${Object.keys(CAT_LABELS).map(cat => {
          const catItems = groups[cat];
          if (!catItems?.length) return '';
          return `
            <div class="product-group" data-cat="${cat}">
              <div style="font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);padding:.5rem 0 .3rem">${CAT_LABELS[cat]}</div>
              ${catItems.map(p => `
                <div class="product-item" data-name="${p.name}" data-price="${p.price}" data-desc="${p.description||''}" data-unit="${p.unit||'forfait'}"
                  style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.75rem;cursor:pointer;transition:border-color .2s"
                  onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor='var(--border)'"
                  onclick="addProductToForm('${p.name.replace(/'/g,"\\'")}','${p.description?.replace(/'/g,"\\'")||''}',${p.price},'${p.unit||'forfait'}');closeModal()">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <div style="font-weight:600;font-size:.92rem">${p.name}</div>
                    <div style="font-weight:700;color:var(--blue)">${formatEur(p.price)}<span style="font-size:.72rem;color:var(--muted);margin-left:3px">${UNIT_LABELS[p.unit]||''}</span></div>
                  </div>
                  ${p.description ? `<div style="font-size:.78rem;color:var(--muted);margin-top:.2rem">${p.description}</div>` : ''}
                </div>
              `).join('')}
            </div>`;
        }).join('')}
        ${!products.length ? '<p style="color:var(--muted);text-align:center;padding:2rem">Aucune prestation active.<br><button class="btn btn-ghost btn-sm" onclick="closeModal();productsList()">Gérer le catalogue →</button></p>' : ''}
      </div>
    `);
  } catch(e) { toast('Erreur chargement catalogue', 'error'); }
}

function filterProducts(q) {
  const items = document.querySelectorAll('.product-item');
  const groups = document.querySelectorAll('.product-group');
  const search = q.toLowerCase();
  items.forEach(el => {
    const match = el.dataset.name.toLowerCase().includes(search) || el.dataset.desc.toLowerCase().includes(search);
    el.style.display = match ? '' : 'none';
  });
  groups.forEach(g => {
    const visible = Array.from(g.querySelectorAll('.product-item')).some(i => i.style.display !== 'none');
    g.style.display = visible ? '' : 'none';
  });
}

function addProductToForm(name, desc, price, unit) {
  _items.push({ desc: name + (desc ? ` — ${desc}` : ''), qty: 1, price });
  renderItemsTable();
  toast(`"${name}" ajouté`, 'success', 1500);
}

