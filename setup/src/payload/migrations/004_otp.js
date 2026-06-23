migrate((db) => {
  // Ajouter champs OTP à la collection users
  const users = db.findCollectionByNameOrId("users");
  users.fields.add(new Field({ name: "otp_code",    type: "text" }));
  users.fields.add(new Field({ name: "otp_expires", type: "text" }));
  users.fields.add(new Field({ name: "email_verified", type: "bool" }));
  db.save(users);
}, (db) => {
  const users = db.findCollectionByNameOrId("users");
  users.fields.removeByName("otp_code");
  users.fields.removeByName("otp_expires");
  users.fields.removeByName("email_verified");
  db.save(users);
});
