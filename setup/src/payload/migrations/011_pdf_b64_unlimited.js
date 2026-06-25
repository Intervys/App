migrate((db) => {
  for (const colName of ["quotes", "invoices"]) {
    const col = db.findCollectionByNameOrId(colName);
    const f = col.fields.getByName("pdf_b64");
    f.max = 0; // illimité
    db.save(col);
  }
}, (db) => {
  for (const colName of ["quotes", "invoices"]) {
    const col = db.findCollectionByNameOrId(colName);
    const f = col.fields.getByName("pdf_b64");
    f.max = 5000;
    db.save(col);
  }
});
