migrate((db) => {

  const interventions = new Collection({
    name: "interventions",
    type: "base",
    fields: [
      { name: "title",       type: "text",     required: true },
      { name: "description", type: "text",     required: true },
      { name: "service",     type: "select",   required: true,
        values: ["depannage","reseau","domotique","serveur","multimedia","electronique","gaming","impression3d","gravure","flocage","autre"] },
      { name: "status",      type: "select",   required: true,
        values: ["nouveau","diagnostic","en_cours","attente_piece","attente_client","termine","annule"] },
      { name: "priority",    type: "select",
        values: ["basse","normale","haute","urgente"] },
      { name: "user", type: "text" },
      { name: "access_link", type: "text" },
      { name: "admin_notes", type: "text" },
      { name: "device_info", type: "text" },
      { name: "closed_at",   type: "date" },
      { name: "created",     type: "autodate", onCreate: true,  onUpdate: false },
      { name: "updated",     type: "autodate", onCreate: true,  onUpdate: true  },
    ],
    listRule: "@request.auth.id != ''", viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''", updateRule: "@request.auth.id != ''", deleteRule: "@request.auth.id != ''",
  });
  db.save(interventions);

  const notes = new Collection({
    name: "notes",
    type: "base",
    fields: [
      { name: "intervention", type: "text", required: true },
      { name: "content",      type: "text",     required: true },
      { name: "is_public",    type: "bool" },
      { name: "author",       type: "text" },
      { name: "created",      type: "autodate", onCreate: true,  onUpdate: false },
      { name: "updated",      type: "autodate", onCreate: true,  onUpdate: true  },
    ],
    listRule: "@request.auth.id != ''", viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''", updateRule: "@request.auth.id != ''", deleteRule: "@request.auth.id != ''",
  });
  db.save(notes);

  const colis = new Collection({
    name: "colis",
    type: "base",
    fields: [
      { name: "intervention", type: "text", required: true },
      { name: "tracking_number", type: "text",     required: true },
      { name: "carrier",         type: "select",   values: ["colissimo","chronopost","ups","dpd","fedex","gls","mondial_relay","autre"] },
      { name: "tracking_url",    type: "url" },
      { name: "direction",       type: "select",   values: ["envoi_client","retour_client"] },
      { name: "notes",           type: "text" },
      { name: "created",         type: "autodate", onCreate: true,  onUpdate: false },
      { name: "updated",         type: "autodate", onCreate: true,  onUpdate: true  },
    ],
    listRule: "@request.auth.id != ''", viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''", updateRule: "@request.auth.id != ''", deleteRule: "@request.auth.id != ''",
  });
  db.save(colis);

  const messages = new Collection({
    name: "messages",
    type: "base",
    fields: [
      { name: "intervention", type: "text", required: true },
      { name: "content",       type: "text",     required: true },
      { name: "from_admin",    type: "bool" },
      { name: "sender_name",   type: "text" },
      { name: "read",          type: "bool" },
      { name: "created",       type: "autodate", onCreate: true,  onUpdate: false },
      { name: "updated",       type: "autodate", onCreate: true,  onUpdate: true  },
    ],
    listRule: "@request.auth.id != ''", viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''", updateRule: "@request.auth.id != ''", deleteRule: "@request.auth.id != ''",
  });
  db.save(messages);

  const accessLinks = new Collection({
    name: "access_links",
    type: "base",
    fields: [
      { name: "token",         type: "text", required: true },
      { name: "password_hash", type: "text", required: true },
      { name: "client_name",   type: "text" },
      { name: "client_email",  type: "text" },
      { name: "expires_at",    type: "date" },
      { name: "active",        type: "bool" },
      { name: "created",       type: "autodate", onCreate: true,  onUpdate: false },
      { name: "updated",       type: "autodate", onCreate: true,  onUpdate: true  },
    ],
    listRule: "@request.auth.id != ''", viewRule: "",
    createRule: "@request.auth.id != ''", updateRule: "@request.auth.id != ''", deleteRule: "@request.auth.id != ''",
  });
  db.save(accessLinks);

}, (db) => {
  for (const name of ["access_links","messages","colis","notes","interventions"]) {
    try { const c = db.findCollectionByNameOrId(name); if (c) db.deleteCollection(c); } catch(e) {}
  }
});
