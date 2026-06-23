migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");
  collection.fields.addAt(collection.fields.length, new Field({
    "name": "firstname",
    "type": "text",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false,
  }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");
  collection.fields.removeByName("firstname");
  return app.save(collection);
});
