migrate((app) => {
  var col = app.findCollectionByNameOrId("invoices");
  col.fields.addAt(col.fields.length, new Field({
    name: "doc_type", type: "text", required: false, system: false, hidden: false, presentable: false,
  }));
  col.fields.addAt(col.fields.length, new Field({
    name: "ref_invoice", type: "text", required: false, system: false, hidden: false, presentable: false,
  }));
  app.save(col);
}, (app) => {
  var col = app.findCollectionByNameOrId("invoices");
  col.fields.removeByName("doc_type");
  col.fields.removeByName("ref_invoice");
  app.save(col);
});
