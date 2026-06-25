migrate((db) => {
  const inv = db.findCollectionByNameOrId("invoices");
  const statusField = inv.fields.getByName("status");
  statusField.values = ["brouillon","envoye","paye","annule","transmis_pa","transmis"];
  db.save(inv);
}, (db) => {
  const inv = db.findCollectionByNameOrId("invoices");
  const statusField = inv.fields.getByName("status");
  statusField.values = ["brouillon","envoye","paye","annule"];
  db.save(inv);
});
