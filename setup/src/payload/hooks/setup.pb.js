/// <reference path="../pb_data/types.d.ts" />
// ─────────────────────────────────────────────────────────────────────────────
// État de l'installation — endpoint public.
// Sert de portail : la vitrine et l'app redirigent vers /setup.html tant que
// l'assistant n'a pas écrit settings.setup_done.
// Expose uniquement deux valeurs non sensibles (fait / non fait + date).
// ─────────────────────────────────────────────────────────────────────────────
routerAdd('GET', '/api/setup-status', (e) => {
    let done = false;
    let date = '';
    try {
        const rec = $app.findFirstRecordByFilter('settings', "key='setup_done'");
        const val = rec ? rec.getString('value') : '';
        if (val) { done = true; date = val; }
    } catch (_) { /* collection absente au tout premier démarrage */ }
    return e.json(200, { done, date });
});  // route publique : aucune authentification requise
