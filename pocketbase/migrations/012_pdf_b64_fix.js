migrate((db) => {
  for (const colName of ["quotes", "invoices"]) {
    const col = db.findCollectionByNameOrId(colName);
    col.fields.removeByName("pdf_b64");
    col.fields.add(new Field({ name: "pdf_b64", type: "text", max: 0 }));
    db.save(col);
  }
}, (db) => {
  for (const colName of ["quotes", "invoices"]) {
    const col = db.findCollectionByNameOrId(colName);
    col.fields.removeByName("pdf_b64");
    col.fields.add(new Field({ name: "pdf_b64", type: "text", max: 5000 }));
    db.save(col);
  }
});
