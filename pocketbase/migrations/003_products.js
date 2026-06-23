migrate((db) => {
  const products = new Collection({
    name: "products",
    type: "base",
    fields: [
      { name: "name",        type: "text",   required: true },
      { name: "description", type: "text" },
      { name: "price",       type: "number", required: true },
      { name: "unit",        type: "select",
        values: ["h","forfait","piece","jour","mois","licence","deplacement","autre"] },
      { name: "category",    type: "select",
        values: ["depannage","reseau","domotique","gaming","multimedia","electronique","impression3d","gravure","flocage","deplacement","autre"] },
      { name: "active",      type: "bool" },
      { name: "created",     type: "autodate", onCreate: true,  onUpdate: false },
      { name: "updated",     type: "autodate", onCreate: true,  onUpdate: true  },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  db.save(products);
}, (db) => {
  try { const c = db.findCollectionByNameOrId("products"); if (c) db.deleteCollection(c); } catch(e) {}
});
