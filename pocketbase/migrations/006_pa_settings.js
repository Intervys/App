migrate((db) => {
  // Collection settings (clé/valeur)
  const settings = new Collection({
    name: "settings",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      new Field({ name: "key",   type: "text", required: true }),
      new Field({ name: "value", type: "text" }),
    ],
  });
  db.save(settings);

  // Champs PA sur invoices
  const inv = db.findCollectionByNameOrId("invoices");
  inv.fields.add(new Field({ name: "pa_invoice_id",    type: "text" }));
  inv.fields.add(new Field({ name: "pa_transmitted_at",type: "text" }));
  db.save(inv);
}, (db) => {
  try { db.deleteCollection(db.findCollectionByNameOrId("settings")); } catch(e) {}
  const inv = db.findCollectionByNameOrId("invoices");
  inv.fields.removeByName("pa_invoice_id");
  inv.fields.removeByName("pa_transmitted_at");
  db.save(inv);
});
