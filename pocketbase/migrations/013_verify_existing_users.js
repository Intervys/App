/// Marque comme vérifiés tous les utilisateurs existants sans OTP en attente
/// (créés avant la migration 004_otp, ils n'ont jamais reçu de code)
migrate((app) => {
  const records = app.findAllRecords("users");
  for (const r of records) {
    if (!r.getBool("email_verified") && !r.getString("otp_code")) {
      r.set("email_verified", true);
      app.saveNoValidate(r);
    }
  }
}, (app) => {
  // irréversible — on ne peut pas distinguer qui était vérifié avant
});
