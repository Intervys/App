/// Configure l'URL du lien "mot de passe oublie" vers l'app client locale.
migrate((app) => {
  try {
    const settings = app.settings();
    if (settings && settings.meta && settings.meta.resetPasswordTemplate) {
      settings.meta.resetPasswordTemplate.actionUrl = "http://localhost:8090/app/#/reset-password/{TOKEN}";
      app.save(settings);
    }
  } catch (e) {
    // resetPasswordTemplate absent sur certaines versions PocketBase.
  }
}, (app) => {
  try {
    const settings = app.settings();
    if (settings && settings.meta && settings.meta.resetPasswordTemplate) {
      settings.meta.resetPasswordTemplate.actionUrl = "";
      app.save(settings);
    }
  } catch (e) {}
});
