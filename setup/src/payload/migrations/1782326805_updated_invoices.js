/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_711030668")

  // update field
  collection.fields.addAt(23, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2223416718",
    "max": 5000000,
    "min": 0,
    "name": "pdf_b64",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_711030668")

  // update field
  collection.fields.addAt(23, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2223416718",
    "max": 0,
    "min": 0,
    "name": "pdf_b64",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
