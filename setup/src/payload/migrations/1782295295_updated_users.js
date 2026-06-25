/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(16, new Field({
    "help": "",
    "hidden": false,
    "id": "bool667972919",
    "name": "is_pro",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1337919823",
    "max": 0,
    "min": 0,
    "name": "company",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text3683367432",
    "max": 9,
    "min": 0,
    "name": "siren",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1276048111",
    "max": 0,
    "min": 0,
    "name": "tva_num",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("bool667972919")

  // remove field
  collection.fields.removeById("text1337919823")

  // remove field
  collection.fields.removeById("text3683367432")

  // remove field
  collection.fields.removeById("text1276048111")

  return app.save(collection)
})
