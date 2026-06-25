migrate((app) => {
  for (var name of ["invoices", "quotes"]) {
    var col = app.findCollectionByNameOrId(name);
    col.fields.addAt(col.fields.length, new Field({
      name: "client_tva", type: "text", required: false, system: false, hidden: false, presentable: false,
    }));
    app.save(col);
  }
}, (app) => {
  for (var name of ["invoices", "quotes"]) {
    var col = app.findCollectionByNameOrId(name);
    col.fields.removeByName("client_tva");
    app.save(col);
  }
});
