migrate((db) => {
  for (const colName of ["quotes", "invoices"]) {
    const col = db.findCollectionByNameOrId(colName);
    col.fields.add(new Field({ name: "pdf_b64", type: "text" }));
    db.save(col);
  }
}, (db) => {
  for (const colName of ["quotes", "invoices"]) {
    const col = db.findCollectionByNameOrId(colName);
    col.fields.removeByName("pdf_b64");
    db.save(col);
  }
});
