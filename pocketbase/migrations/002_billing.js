migrate((db) => {

  // ── COLLECTION : quotes (devis) ──
  const quotes = new Collection({
    name: "quotes",
    type: "base",
    fields: [
      { name: "number",         type: "text",   required: true },
      { name: "status",         type: "select", required: true,
        values: ["brouillon","envoye","accepte","refuse","expire"] },
      { name: "intervention",   type: "text" },
      { name: "client_name",    type: "text",   required: true },
      { name: "client_email",   type: "text" },
      { name: "client_phone",   type: "text" },
      { name: "client_address", type: "text" },
      { name: "items",          type: "json",   required: true },
      { name: "subtotal",       type: "number" },
      { name: "tax_rate",       type: "number" },
      { name: "tax_amount",     type: "number" },
      { name: "total",          type: "number" },
      { name: "notes",          type: "text" },
      { name: "valid_until",    type: "date" },
      { name: "issued_at",      type: "date" },
      { name: "created",        type: "autodate", onCreate: true,  onUpdate: false },
      { name: "updated",        type: "autodate", onCreate: true,  onUpdate: true  },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  db.save(quotes);

  // ── COLLECTION : invoices (factures) ──
  const invoices = new Collection({
    name: "invoices",
    type: "base",
    fields: [
      { name: "number",         type: "text",   required: true },
      { name: "status",         type: "select", required: true,
        values: ["brouillon","envoye","paye","annule"] },
      { name: "quote_id",       type: "text" },
      { name: "intervention",   type: "text" },
      { name: "client_name",    type: "text",   required: true },
      { name: "client_email",   type: "text" },
      { name: "client_phone",   type: "text" },
      { name: "client_address", type: "text" },
      { name: "items",          type: "json",   required: true },
      { name: "subtotal",       type: "number" },
      { name: "tax_rate",       type: "number" },
      { name: "tax_amount",     type: "number" },
      { name: "total",          type: "number" },
      { name: "notes",          type: "text" },
      { name: "payment_link",   type: "url" },
      { name: "due_date",       type: "date" },
      { name: "paid_at",        type: "date" },
      { name: "issued_at",      type: "date" },
      { name: "created",        type: "autodate", onCreate: true,  onUpdate: false },
      { name: "updated",        type: "autodate", onCreate: true,  onUpdate: true  },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  db.save(invoices);

}, (db) => {
  for (const name of ["quotes","invoices"]) {
    try { const c = db.findCollectionByNameOrId(name); if (c) db.deleteCollection(c); } catch(e) {}
  }
});
