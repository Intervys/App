migrate((db) => {
  const interventions = db.findCollectionByNameOrId("interventions");
  const statusField = interventions.fields.getByName("status");
  if (statusField && !statusField.values.includes("archive")) {
    statusField.values.push("archive");
    db.save(interventions);
  }
}, (db) => {
  const interventions = db.findCollectionByNameOrId("interventions");
  const statusField = interventions.fields.getByName("status");
  if (statusField) {
    statusField.values = statusField.values.filter(v => v !== "archive");
    db.save(interventions);
  }
});
