// ════════════════════════════════════════
// AUTO-UPDATE — Vérifier et appliquer les mises à jour
// ════════════════════════════════════════

function _updGetPublicDir() {
    var args = $os.args;
    for (var i = 0; i < args.length; i++) {
        if (typeof args[i] === 'string' && args[i].indexOf('--publicDir=') === 0) {
            return args[i].substring('--publicDir='.length);
        }
    }
    return '../public';
}

function _updGetManifestUrl() {
    try {
        var s = $app.findFirstRecordByFilter('settings', "key='app_update_url'");
        if (s) return s.getString('value');
    } catch(e) {}
    return 'https://github.com/Intervys/app/releases/latest/download/latest.json';
}

function _updGetCurrentVersion() {
    try {
        var s = $app.findFirstRecordByFilter('settings', "key='app_version'");
        if (s) return s.getString('value');
    } catch(e) {}
    return '1.0.0';
}

function _updSaveVersion(version) {
    try {
        var existing = null;
        try { existing = $app.findFirstRecordByFilter('settings', "key='app_version'"); } catch(e2) {}
        if (existing) {
            existing.set('value', version);
            $app.save(existing);
        } else {
            var col = $app.findCollectionByNameOrId('settings');
            var rec = new Record(col);
            rec.set('key', 'app_version');
            rec.set('value', version);
            $app.save(rec);
        }
    } catch(e) { console.error('[update] save version: ' + e); }
}

routerAdd('GET', '/api/iv-check', function(e) {
    var updateUrl = _updGetManifestUrl();
    var currentVersion = _updGetCurrentVersion();

    var res;
    try {
        res = $http.send({ url: updateUrl, method: 'GET', timeout: 10 });
    } catch(he) {
        return e.json(502, { error: 'Impossible de joindre le serveur de mises à jour : ' + he });
    }
    if (res.statusCode !== 200) {
        return e.json(502, { error: 'Manifeste introuvable (HTTP ' + res.statusCode + ')' });
    }

    var manifest;
    try { manifest = JSON.parse(res.rawBody); } catch(je) {
        return e.json(502, { error: 'Manifeste invalide' });
    }

    return e.json(200, {
        current:      currentVersion,
        latest:       manifest.version,
        needs_update: manifest.version !== currentVersion,
        notes:        manifest.notes || [],
        date:         manifest.date  || '',
        files_count:  Object.keys(manifest.files || {}).length
    });
}, $apis.requireSuperuserAuth());

routerAdd('POST', '/api/iv-update', function(e) {
    var pubDir = _updGetPublicDir();

    try { $os.stat(pubDir); } catch(se) {
        return e.json(400, { error: 'Mise à jour disponible uniquement en mode natif Windows' });
    }

    var updateUrl = _updGetManifestUrl();
    var res;
    try {
        res = $http.send({ url: updateUrl, method: 'GET', timeout: 10 });
    } catch(he) {
        return e.json(502, { error: 'Impossible de joindre le serveur de mises à jour' });
    }

    var manifest;
    try { manifest = JSON.parse(res.rawBody); } catch(je) {
        return e.json(502, { error: 'Manifeste invalide' });
    }

    var files = manifest.files || {};
    var updated = [];
    var errors  = [];

    for (var relPath in files) {
        var fileUrl = files[relPath];
        try {
            var fr = $http.send({ url: fileUrl, method: 'GET', timeout: 30 });
            if (fr.statusCode !== 200) {
                errors.push(relPath + ' : HTTP ' + fr.statusCode);
                continue;
            }
            $os.writeFile(pubDir + '/' + relPath, fr.rawBody, 420);
            updated.push(relPath);
        } catch(fe) {
            errors.push(relPath + ' : ' + fe);
        }
    }

    // Synchronise index.html si site.html est mis à jour
    if (updated.indexOf('site.html') !== -1) {
        try {
            var content = $os.readFile(pubDir + '/site.html');
            $os.writeFile(pubDir + '/index.html', content, 420);
            updated.push('index.html (sync depuis site.html)');
        } catch(ce) { errors.push('index.html : ' + ce); }
    }

    _updSaveVersion(manifest.version);

    return e.json(200, { updated: updated, errors: errors, version: manifest.version });
}, $apis.requireSuperuserAuth());

// ════════════════════════════════════════
// SUPPRESSION EN CASCADE — INTERVENTION
// messages, notes, colis, access_links liés
// ════════════════════════════════════════
onRecordDelete(function(e) {
    e.next();
    var id = e.record.id;
    var cols = ["messages", "notes", "colis", "access_links"];
    for (var ci = 0; ci < cols.length; ci++) {
        try {
            var rows = $app.findRecordsByFilter(cols[ci], "intervention='" + id + "'", "", 500, 0);
            for (var ri = 0; ri < rows.length; ri++) {
                try { $app.delete(rows[ri]); } catch(de) { console.error("[cascade] delete " + cols[ci] + " " + rows[ri].id + ": " + de); }
            }
        } catch(fe) { /* collection absente ou vide */ }
    }
}, "interventions");

// ════════════════════════════════════════
// SUPPRESSION EN CASCADE — USER
// interventions (et leur cascade), quotes, invoices, access_links
// ════════════════════════════════════════
onRecordDelete(function(e) {
    e.next();
    var uid = e.record.id;

    // Supprimer les interventions (le hook ci-dessus s'en chargera en cascade)
    try {
        var invs = $app.findRecordsByFilter("interventions", "user='" + uid + "'", "", 500, 0);
        for (var ii = 0; ii < invs.length; ii++) {
            try { $app.delete(invs[ii]); } catch(de) { console.error("[cascade] delete intervention " + invs[ii].id + ": " + de); }
        }
    } catch(fe) {}

    // Supprimer les devis liés (par email client) — les factures sont conservées
    var userEmail = e.record.getString("email");
    if (userEmail) {
        try {
            var quotes = $app.findRecordsByFilter("quotes", "client_email='" + userEmail + "'", "", 500, 0);
            for (var qi = 0; qi < quotes.length; qi++) {
                try { $app.delete(quotes[qi]); } catch(de) { console.error("[cascade] delete quote " + quotes[qi].id + ": " + de); }
            }
        } catch(fe) {}
    }

    // Supprimer access_links liés
    try {
        var links = $app.findRecordsByFilter("access_links", "user='" + uid + "'", "", 500, 0);
        for (var li = 0; li < links.length; li++) {
            try { $app.delete(links[li]); } catch(de) {}
        }
    } catch(fe) {}
}, "users");

// ════════════════════════════════════════
// CRON — ARCHIVAGE DES DEVIS (tous les jours à 3h)
// • Archive les devis de plus de 3 mois
// • Supprime les devis archivés dont le client n'existe plus
// ════════════════════════════════════════
cronAdd("archive-old-quotes", "0 3 * * *", function() {
    try {
        var cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        // 1. Archiver les devis > 3 mois (sauf déjà archivés et sauf acceptés liés à une facture)
        try {
            var toArchive = $app.findRecordsByFilter(
                "quotes",
                "created <= '" + cutoff + "' && status != 'archive' && status != 'accepte'",
                "", 500, 0
            );
            for (var i = 0; i < toArchive.length; i++) {
                try {
                    toArchive[i].set("status", "archive");
                    $app.saveNoValidate(toArchive[i]);
                } catch(se) { console.error("[archive-quotes] save " + toArchive[i].id + ": " + se); }
            }
            console.log("[archive-quotes] " + toArchive.length + " devis archivés (avant " + cutoff + ")");
        } catch(fe) { console.error("[archive-quotes] filter: " + fe); }

        // 2. Supprimer les devis archivés dont le client n'existe plus
        try {
            var archived = $app.findRecordsByFilter("quotes", "status='archive'", "", 500, 0);
            var deleted = 0;
            for (var j = 0; j < archived.length; j++) {
                var email = archived[j].getString("client_email");
                if (!email) { try { $app.delete(archived[j]); deleted++; } catch(de) {} continue; }
                try {
                    var users = $app.findRecordsByFilter("users", "email='" + email + "'", "", 1, 0);
                    if (!users || users.length === 0) { $app.delete(archived[j]); deleted++; }
                } catch(ue) { /* user introuvable = supprimer */ try { $app.delete(archived[j]); deleted++; } catch(de) {} }
            }
            console.log("[archive-quotes] " + deleted + " devis orphelins supprimés");
        } catch(fe) { console.error("[archive-quotes] cleanup: " + fe); }

    } catch(err) { console.error("[archive-quotes] " + err); }
});

// ════════════════════════════════════════
// HELPERS EMAIL
// ════════════════════════════════════════
globalThis._readBrand = function(from) {
    var name = from.name; var color = "#4f46e5"; var siteUrl = "";
    try {
        var rows = $app.findRecordsByFilter("settings", "key='theme' || key='site_name' || key='site_url'", "", 10, 0);
        for (var i = 0; i < rows.length; i++) {
            var k = rows[i].getString("key"); var v = rows[i].getString("value");
            if (k === "site_name" && v) name = v;
            if (k === "site_url"  && v) siteUrl = v.replace(/\/$/, "");
            if (k === "theme"     && v) { try { var th = JSON.parse(v); color = th["--blue"]||th["--accent"]||th["--primary"]||color; } catch(pe) {} }
        }
    } catch(x) {}
    return { name: name, color: color, url: siteUrl };
};

globalThis._emailTpl = function(brand, salutation, bodyHtml, ctaLabel, ctaUrl) {
    var c = brand.color;
    return "<div style='font-family:Arial,sans-serif;background:#f0f4f8;padding:30px 15px'>"
        + "<div style='background:#fff;border-radius:12px;padding:28px 32px;max-width:600px;margin:0 auto;border-top:4px solid " + c + "'>"
        + "<div style='font-size:1.4rem;font-weight:800;color:" + c + ";margin-bottom:20px'>" + brand.name + "</div>"
        + (salutation ? "<p style='color:#333;font-size:1rem;margin:0 0 16px'>" + salutation + "</p>" : "")
        + "<div style='color:#444;font-size:.95rem;line-height:1.7;margin-bottom:20px'>" + bodyHtml + "</div>"
        + (ctaLabel && ctaUrl ? "<div style='text-align:center;margin:24px 0'><a href='" + ctaUrl + "' style='background:" + c + ";color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:.95rem;display:inline-block'>" + ctaLabel + "</a></div>" : "")
        + "<div style='margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:.72rem;color:#999;text-align:center'>Pour nous répondre, utilisez le bouton ci-dessus — ne répondez pas directement à cet email.</div>"
        + "</div></div>";
};

// ════════════════════════════════════════
// NOUVELLE INTERVENTION → email admin
// ════════════════════════════════════════
onRecordCreate(function(e) {
    e.next();
    try {
        var from = { address: "noreply@example.com", name: "Intervio" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervio" }; } catch(x) {}

        var ADMIN = "";
        try { var ar = $app.findRecordsByFilter("settings", "key='admin_email'", "", 1, 0); if (ar && ar.length > 0) ADMIN = ar[0].getString("value"); } catch(x) {}
        if (!ADMIN) { try { var su = $app.findRecordsByFilter("_superusers", "", "", 1, 0); if (su && su.length > 0) ADMIN = su[0].getString("email"); } catch(x) {} }
        if (!ADMIN) return;

        var r = e.record;
        var title = r.getString("title");
        var clientLine = "";
        var uid = r.getString("user");
        if (uid) { try { var u = $app.findRecordById("users", uid); clientLine = u.getString("name") + " (" + u.getString("email") + ")"; } catch(x) {} }
        var body = "<p><b>" + title + "</b>" + (clientLine ? " - " + clientLine : "") + "</p>"
            + "<p><b>Service:</b> " + r.getString("service") + "</p>"
            + "<p>" + r.getString("description") + "</p>";
        var msg = new MailerMessage({ from: from, to: [{ address: ADMIN }], subject: "Nouvelle intervention : " + title, html: body });
        $app.newMailClient().send(msg);
        console.log("[newIntervention] Email envoyé pour : " + title);
    } catch(err) { console.error("[newIntervention] " + err); }
}, "interventions");

// ════════════════════════════════════════
// NOUVEAU MESSAGE → admin ou client
// ════════════════════════════════════════
onRecordCreate(function(e) {
    e.next();
    try {
        var from = { address: "noreply@example.com", name: "Intervio" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervio" }; } catch(x) {}

        var ADMIN = "";
        try { var ar = $app.findRecordsByFilter("settings", "key='admin_email'", "", 1, 0); if (ar && ar.length > 0) ADMIN = ar[0].getString("value"); } catch(x) {}
        if (!ADMIN) { try { var su = $app.findRecordsByFilter("_superusers", "", "", 1, 0); if (su && su.length > 0) ADMIN = su[0].getString("email"); } catch(x) {} }

        var r = e.record;
        var content = r.getString("content");
        var fromAdmin = r.getBool("from_admin");
        var invId = r.getString("intervention");
        var sender = r.getString("sender_name");
        console.log("[newMessage] fromAdmin=" + fromAdmin + " invId=" + invId + " sender=" + sender);
        var inv = null;
        try { inv = $app.findRecordById("interventions", invId); } catch(ex) { console.error("[newMessage] intervention introuvable: " + ex); }
        var invTitle = inv ? inv.getString("title") : invId;

        // inline _readBrand + mentions légales
        var brandName = from.name; var brandColor = "#4f46e5"; var brandUrl = ""; var brandLogo = ""; var brandAppUrl = "";
        var legalLine = "";
        try {
            var brows = $app.findRecordsByFilter("settings", "key='theme' || key='site_name' || key='site_url' || key='hg_logo_url' || key='hg_app_url' || key='business_settings'", "", 10, 0);
            for (var bi=0;bi<brows.length;bi++){
                var bk=brows[bi].getString("key"); var bv=brows[bi].getString("value");
                if(bk==="site_name"&&bv)brandName=bv;
                if(bk==="site_url"&&bv)brandUrl=bv.replace(/\/$/,"");
                if(bk==="hg_logo_url"&&bv)brandLogo=bv;
                if(bk==="hg_app_url"&&bv)brandAppUrl=bv.replace(/\/$/,"");
                if(bk==="theme"&&bv){try{var bth=JSON.parse(bv);brandColor=bth["--blue"]||bth["--accent"]||bth["--primary"]||brandColor;}catch(pe){}}
                if(bk==="business_settings"&&bv){try{
                    var bs=JSON.parse(bv); var parts=[];
                    if(bs.name)parts.push(bs.name);
                    if(bs.legal)parts.push(bs.legal);
                    if(bs.address){var addr=bs.address+(bs.zip?" "+bs.zip:"")+(bs.city?" "+bs.city:"");parts.push(addr);}
                    if(bs.siret)parts.push("SIRET : "+bs.siret);
                    if(bs.tva_num)parts.push("TVA : "+bs.tva_num);
                    legalLine=parts.join(" — ");
                }catch(je){}}
            }
        } catch(x) {}
        var brand = { name: brandName, color: brandColor, url: brandUrl, logo: brandLogo, appUrl: brandAppUrl };

        // inline _emailTpl
        var _tpl = function(sal, body, ctaL, ctaU) {
            var c = brand.color;
            var header = brand.logo ? "<div style='text-align:center;margin-bottom:24px'><img src='"+brand.logo+"' style='height:140px;max-width:340px;object-fit:contain' alt='"+brand.name+"'></div>" : "<div style='font-size:1.4rem;font-weight:800;color:"+c+";margin-bottom:20px'>"+brand.name+"</div>";
            var footer = "<div style='margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:.72rem;color:#999;text-align:center'>Pour nous répondre, utilisez le bouton ci-dessus — ne répondez pas directement à cet email."+(legalLine?"<br><br>"+legalLine:"")+"</div>";
            return "<div style='font-family:Arial,sans-serif;background:#f0f4f8;padding:30px 15px'><div style='background:#fff;border-radius:12px;padding:28px 32px;max-width:600px;margin:0 auto;border-top:4px solid "+c+"'>"+header+(sal?"<p style='color:#333;font-size:1rem;margin:0 0 16px'>"+sal+"</p>":"")+"<div style='color:#444;font-size:.95rem;line-height:1.7;margin-bottom:20px'>"+body+"</div>"+(ctaL&&ctaU?"<div style='text-align:center;margin:24px 0'><a href='"+ctaU+"' style='background:"+c+";color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:.95rem;display:inline-block'>"+ctaL+"</a></div>":"")+footer+"</div></div>";
        };

        if (fromAdmin) {
            var cEmail = ""; var cName = "Client"; var cToken = "";
            var uid2 = inv ? inv.getString("user") : "";
            if (uid2) { try { var u2 = $app.findRecordById("users", uid2); cEmail = u2.getString("email"); cName = u2.getString("name") || "Client"; } catch(x) { console.error("[newMessage] user lookup: " + x); } }
            if (!cEmail) { var lid = inv ? inv.getString("access_link") : ""; if (lid) { try { var lk = $app.findRecordById("access_links", lid); cEmail = lk.getString("client_email"); cName = lk.getString("client_name") || "Client"; cToken = lk.getString("token"); } catch(x) { console.error("[newMessage] access_link lookup: " + x); } } }
            console.log("[newMessage] cEmail=" + cEmail);
            if (cEmail) {
                var appBase = brand.appUrl || brand.url || "";
                var portalUrl = (appBase && cToken) ? appBase + "/#/access/" + cToken : (appBase ? appBase + "/#/login" : "");
                var msgBody = "<p>Vous avez reçu un nouveau message concernant votre intervention <strong>" + invTitle + "</strong> :</p>"
                    + "<div style='background:#f0f4f8;border-left:4px solid "+brand.color+";border-radius:0 8px 8px 0;padding:14px 18px;margin:16px 0;color:#333;font-size:.95rem;line-height:1.7'>" + content.replace(/\n/g, "<br>") + "</div>"
                    + "<p style='color:#666;font-size:.88rem'>Pour nous répondre, cliquez sur le bouton ci-dessous et accédez à votre espace de suivi.</p>";
                var m2 = new MailerMessage({ from: from, to: [{ address: cEmail }], subject: brand.name + " — Nouveau message : " + invTitle, html: _tpl("Bonjour " + cName + ",", msgBody, "Répondre sur votre espace", portalUrl) });
                $app.newMailClient().send(m2);
                console.log("[newMessage] email client envoyé à " + cEmail);
            } else {
                console.warn("[newMessage] SKIP: cEmail vide");
            }
        } else if (ADMIN) {
            var adminUrl = brand.url ? brand.url + "/#/admin/intervention/" + invId : "";
            var m3 = new MailerMessage({ from: from, to: [{ address: ADMIN }], subject: brand.name + " — Message de " + (sender||"client") + " : " + invTitle, html: _tpl("", "<p><b>"+(sender||"Client")+"</b> vous a envoyé un message concernant <b>"+invTitle+"</b> :</p><blockquote style='border-left:3px solid "+brand.color+";margin:12px 0;padding:8px 16px;background:#f8f8f8;border-radius:0 4px 4px 0;color:#333'>"+content.replace(/\n/g,"<br>")+"</blockquote>", adminUrl ? "Voir l'intervention" : "", adminUrl) });
            $app.newMailClient().send(m3);
        }
    } catch(err) { console.error("[newMessage] " + err); }
}, "messages");

// ════════════════════════════════════════
// CHANGEMENT DE STATUT → client
// ════════════════════════════════════════
onRecordUpdate(function(e) {
    e.next();
    try {
        var from = { address: "noreply@example.com", name: "Intervio" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervio" }; } catch(x) {}

        var r = e.record;
        var newS = r.getString("status");
        var oldS = e.original ? e.original.getString("status") : "";
        if (!newS || newS === oldS) return;

        var cEmail = ""; var cName = "Client";
        var uid3 = r.getString("user");
        if (uid3) { try { var uu = $app.findRecordById("users", uid3); cEmail = uu.getString("email"); cName = uu.getString("name") || "Client"; } catch(x) {} }
        if (!cEmail) { var lid2 = r.getString("access_link"); if (lid2) { try { var ll = $app.findRecordById("access_links", lid2); cEmail = ll.getString("client_email"); cName = ll.getString("client_name") || "Client"; } catch(x) {} } }
        if (!cEmail) return;

        var STATUS_FR = { nouveau:"Nouvelle demande", diagnostic:"En diagnostic", en_cours:"En cours", attente_piece:"En attente de pièce", attente_client:"En attente de votre retour", termine:"Terminée ✓", annule:"Annulée" };
        // inline _readBrand + mentions légales
        var bn2 = from.name; var bc2 = "#4f46e5"; var bu2 = ""; var bl2 = ""; var ba2 = ""; var ll2g = "";
        try {
            var br2 = $app.findRecordsByFilter("settings", "key='theme' || key='site_name' || key='site_url' || key='hg_logo_url' || key='hg_app_url' || key='business_settings'", "", 10, 0);
            for (var bi2=0;bi2<br2.length;bi2++){
                var bk2=br2[bi2].getString("key"); var bv2=br2[bi2].getString("value");
                if(bk2==="site_name"&&bv2)bn2=bv2;
                if(bk2==="site_url"&&bv2)bu2=bv2.replace(/\/$/,"");
                if(bk2==="hg_logo_url"&&bv2)bl2=bv2;
                if(bk2==="hg_app_url"&&bv2)ba2=bv2.replace(/\/$/,"");
                if(bk2==="theme"&&bv2){try{var bth2=JSON.parse(bv2);bc2=bth2["--blue"]||bth2["--accent"]||bth2["--primary"]||bc2;}catch(pe2){}}
                if(bk2==="business_settings"&&bv2){try{
                    var bs2=JSON.parse(bv2); var pp2=[];
                    if(bs2.name)pp2.push(bs2.name);
                    if(bs2.legal)pp2.push(bs2.legal);
                    if(bs2.address){var addr2=bs2.address+(bs2.zip?" "+bs2.zip:"")+(bs2.city?" "+bs2.city:"");pp2.push(addr2);}
                    if(bs2.siret)pp2.push("SIRET : "+bs2.siret);
                    if(bs2.tva_num)pp2.push("TVA : "+bs2.tva_num);
                    ll2g=pp2.join(" — ");
                }catch(je2){}}
            }
        } catch(x2) {}
        var brand2 = { name: bn2, color: bc2, url: bu2, logo: bl2, appUrl: ba2 };
        var cToken2 = "";
        var lid2b = r.getString("access_link"); if (lid2b) { try { var ll2 = $app.findRecordById("access_links", lid2b); cToken2 = ll2.getString("token"); } catch(x) {} }
        var appBase2 = brand2.appUrl || brand2.url || "";
        // user enregistré → lien direct vers l'intervention ; client par lien → token d'accès
        var portalUrl2 = "";
        if (appBase2 && cToken2) { portalUrl2 = appBase2 + "/#/access/" + cToken2; }
        else if (appBase2 && uid3) { portalUrl2 = appBase2 + "/#/intervention/" + r.getString("id"); }
        else if (appBase2) { portalUrl2 = appBase2 + "/#/login"; }
        var statusLabel = STATUS_FR[newS] || newS;
        var bodyHtml4 = "<p>Le statut de votre intervention <b>" + r.getString("title") + "</b> a été mis à jour :</p>"
            + "<div style='background:#f0f4f8;border-radius:8px;padding:14px 20px;margin:12px 0;font-size:1.05rem;font-weight:700;color:" + brand2.color + "'>" + statusLabel + "</div>";
        var hdr4 = brand2.logo ? "<div style='text-align:center;margin-bottom:24px'><img src='"+brand2.logo+"' style='height:140px;max-width:340px;object-fit:contain' alt='"+brand2.name+"'></div>" : "<div style='font-size:1.4rem;font-weight:800;color:"+brand2.color+";margin-bottom:20px'>"+brand2.name+"</div>";
        var ftr4 = "<div style='margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:.72rem;color:#999;text-align:center'>Pour nous répondre, utilisez le bouton ci-dessus — ne répondez pas directement à cet email."+(ll2g?"<br><br>"+ll2g:"")+"</div>";
        var html4 = "<div style='font-family:Arial,sans-serif;background:#f0f4f8;padding:30px 15px'><div style='background:#fff;border-radius:12px;padding:28px 32px;max-width:600px;margin:0 auto;border-top:4px solid "+brand2.color+"'>"+hdr4+"<p style='color:#333;font-size:1rem;margin:0 0 16px'>Bonjour "+cName+",</p><div style='color:#444;font-size:.95rem;line-height:1.7;margin-bottom:20px'>"+bodyHtml4+"</div>"+(portalUrl2?"<div style='text-align:center;margin:24px 0'><a href='"+portalUrl2+"' style='background:"+brand2.color+";color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:.95rem;display:inline-block'>Suivre mon intervention</a></div>":"")+ftr4+"</div></div>";
        var m4 = new MailerMessage({ from: from, to: [{ address: cEmail }], subject: brand2.name + " — Mise à jour : " + r.getString("title"), html: html4 });
        $app.newMailClient().send(m4);
    } catch(err) { console.error("[statusChange] " + err); }
}, "interventions");

// ════════════════════════════════════════
// INSCRIPTION → OTP
// ════════════════════════════════════════
onRecordCreate(function(e) {
    e.next();
    try {
        var from = { address: "noreply@example.com", name: "Intervio" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervio" }; } catch(x) {}

        var brandName = from.name;
        var brandColor = "#4f46e5";
        var brandLogo = "";
        try {
            var trows = $app.findRecordsByFilter("settings", "key='theme' || key='site_name' || key='hg_logo_url'", "", 10, 0);
            for (var ti = 0; ti < trows.length; ti++) {
                var tk = trows[ti].getString("key"); var tv = trows[ti].getString("value");
                if (tk === "site_name" && tv) brandName = tv;
                if (tk === "hg_logo_url" && tv) brandLogo = tv;
                if (tk === "theme" && tv) { try { var th = JSON.parse(tv); brandColor = th["--blue"] || th["--accent"] || th["--primary"] || brandColor; } catch(pe) {} }
            }
        } catch(se) {}

        var r = e.record;
        var email = r.getString("email");
        var firstname = r.getString("firstname");
        var lastname = r.getString("name");
        var displayName = ((firstname ? firstname + " " : "") + (lastname || "")).replace(/^\s+|\s+$/g, "") || "Client";
        if (!email) return;

        var otp = String(Math.floor(100000 + Math.random() * 900000));
        var expires = new Date(Date.now() + 15 * 60000).toISOString();
        try { r.set("otp_code", otp); r.set("otp_expires", expires); r.set("email_verified", false); $app.saveNoValidate(r); } catch(se) { console.error("[OTP] Save error: " + se); }

        var msg = new MailerMessage({
            from: from,
            to: [{ address: email }],
            subject: "Votre code de vérification : " + otp,
            html: "<div style='font-family:Arial,sans-serif;background:#f0f4f8;padding:30px 15px'>"
                + "<div style='background:#fff;border-radius:12px;padding:28px 32px;max-width:600px;margin:0 auto;border-top:4px solid " + brandColor + "'>"
                + (brandLogo ? "<div style='text-align:center;margin-bottom:24px'><img src='" + brandLogo + "' style='height:140px;max-width:340px;object-fit:contain' alt='" + brandName + "'></div>" : "<div style='font-size:1.4rem;font-weight:800;color:" + brandColor + ";margin-bottom:20px'>" + brandName + "</div>")
                + "<p style='color:#333;font-size:1rem;margin:0 0 16px'>Bonjour " + displayName + ",</p>"
                + "<div style='color:#444;font-size:.95rem;line-height:1.7;margin-bottom:20px'><p style='margin:0 0 14px'>Votre code de vérification :</p></div>"
                + "<div style='background:" + brandColor + ";border-radius:10px;padding:24px;text-align:center;margin:18px 0 24px'>"
                + "<div style='font-size:2.6rem;font-weight:800;letter-spacing:.28em;color:#ffffff;font-family:monospace'>" + otp + "</div>"
                + "<div style='font-size:.78rem;color:rgba(255,255,255,.82);margin-top:10px'>Valable 15 minutes</div></div>"
                + "<p style='color:#777;font-size:.86rem;text-align:center;margin:0 0 22px'>Si vous n''avez pas demandé ce code, ignorez cet email.</p>"
                + "<div style='margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:.82rem;color:#999;text-align:center'>Pour nous répondre, utilisez votre espace client — ne répondez pas directement à cet email.</div>"
                + "</div></div>",
        });
        $app.newMailClient().send(msg);
        console.log("[OTP] Code envoyé à " + email);
    } catch(err) { console.error("[OTP] " + err); }
}, "users");

// ════════════════════════════════════════
// VÉRIFICATION OTP
// POST /api/verify-otp  { code: "123456" }  (auth requise)
// POST /api/resend-otp  {}                   (auth requise)
// ════════════════════════════════════════
routerAdd("POST", "/api/verify-otp", function(e) {
    var info = e.requestInfo();
    var auth = info.auth;
    if (!auth) return e.json(401, { error: "Non authentifié" });

    var code = String((info.body && info.body.code) || "").trim();
    if (!code) return e.json(400, { error: "Code manquant" });

    if (auth.getBool("email_verified")) return e.json(200, { ok: true });

    var stored  = auth.getString("otp_code");
    var expires = auth.getString("otp_expires");
    if (!stored) return e.json(400, { error: "Aucun code en attente" });

    if (new Date(expires).getTime() < Date.now()) return e.json(400, { error: "Code expiré — demandez-en un nouveau" });
    if (code !== stored) return e.json(400, { error: "Code incorrect" });

    auth.set("email_verified", true);
    auth.set("otp_code", "");
    auth.set("otp_expires", "");
    try { $app.saveNoValidate(auth); } catch(se) { return e.json(500, { error: "Erreur sauvegarde : " + se }); }

    return e.json(200, { ok: true });
});

routerAdd("POST", "/api/resend-otp", function(e) {
    var info = e.requestInfo();
    var auth = info.auth;
    if (!auth) return e.json(401, { error: "Non authentifié" });

    if (auth.getBool("email_verified")) return e.json(200, { ok: true });

    var email = auth.getString("email");
    var firstname = auth.getString("firstname");
    var lastname = auth.getString("name");
    var displayName = ((firstname ? firstname + " " : "") + (lastname || "")).replace(/^\s+|\s+$/g, "") || "Client";

    var otp = String(Math.floor(100000 + Math.random() * 900000));
    var expires = new Date(Date.now() + 15 * 60000).toISOString();
    auth.set("otp_code", otp);
    auth.set("otp_expires", expires);
    try { $app.saveNoValidate(auth); } catch(se) { return e.json(500, { error: "Erreur : " + se }); }

    var from = { address: "noreply@example.com", name: "Intervio" };
    try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : ""; from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervio" }; } catch(x) {}

    var brandName = from.name;
    var brandColor = "#4f46e5";
    var brandLogo = "";
    try {
        var trows = $app.findRecordsByFilter("settings", "key='theme' || key='site_name' || key='hg_logo_url'", "", 10, 0);
        for (var ti = 0; ti < trows.length; ti++) {
            var tk = trows[ti].getString("key"); var tv = trows[ti].getString("value");
            if (tk === "site_name" && tv) brandName = tv;
            if (tk === "hg_logo_url" && tv) brandLogo = tv;
            if (tk === "theme" && tv) { try { var th = JSON.parse(tv); brandColor = th["--blue"] || th["--accent"] || th["--primary"] || brandColor; } catch(pe) {} }
        }
    } catch(se) {}

    try {
        var msg = new MailerMessage({
            from: from, to: [{ address: email }],
            subject: "Votre nouveau code : " + otp,
            html: "<div style='font-family:Arial,sans-serif;background:#f0f4f8;padding:30px 15px'>"
                + "<div style='background:#fff;border-radius:12px;padding:28px 32px;max-width:600px;margin:0 auto;border-top:4px solid " + brandColor + "'>"
                + (brandLogo ? "<div style='text-align:center;margin-bottom:24px'><img src='" + brandLogo + "' style='height:140px;max-width:340px;object-fit:contain' alt='" + brandName + "'></div>" : "<div style='font-size:1.4rem;font-weight:800;color:" + brandColor + ";margin-bottom:20px'>" + brandName + "</div>")
                + "<p style='color:#333;font-size:1rem;margin:0 0 16px'>Bonjour " + displayName + ",</p>"
                + "<div style='color:#444;font-size:.95rem;line-height:1.7;margin-bottom:20px'><p style='margin:0 0 14px'>Votre nouveau code de vérification :</p></div>"
                + "<div style='background:" + brandColor + ";border-radius:10px;padding:24px;text-align:center;margin:18px 0 24px'>"
                + "<div style='font-size:2.6rem;font-weight:800;letter-spacing:.28em;color:#ffffff;font-family:monospace'>" + otp + "</div>"
                + "<div style='font-size:.78rem;color:rgba(255,255,255,.82);margin-top:10px'>Valable 15 minutes</div></div>"
                + "<p style='color:#777;font-size:.86rem;text-align:center;margin:0 0 22px'>Si vous n''avez pas demandé ce code, ignorez cet email.</p>"
                + "<div style='margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:.82rem;color:#999;text-align:center'>Pour nous répondre, utilisez votre espace client — ne répondez pas directement à cet email.</div>"
                + "</div></div>",
        });
        $app.newMailClient().send(msg);
    } catch(me) { return e.json(500, { error: "Erreur envoi email : " + me }); }

    return e.json(200, { ok: true });
});

// ════════════════════════════════════════
// ENVOI EMAIL DEVIS/FACTURE avec PDF en pièce jointe
// POST /send-doc  { collection, id, pdfB64 }
// ════════════════════════════════════════
routerAdd("POST", "/send-doc", function(e) {
    var authHeader = "";
    try { authHeader = e.request.header.get("Authorization") || ""; } catch(he) {}
    if (!authHeader) return e.json(401, { message: "Non autorisé" });

    var col    = String(e.request.header.get("X-Doc-Collection") || "");
    var id     = String(e.request.header.get("X-Doc-Id")         || "");
    var pdfB64 = "";
    try {
        var ri = e.requestInfo();
        if (ri && ri.body && ri.body.pdfB64) pdfB64 = String(ri.body.pdfB64);
    } catch(be) {
        console.error("[send-doc] requestInfo: " + be);
        try {
            var bodyBytes = $io.readAll(e.request.body);
            if (bodyBytes && bodyBytes.length > 0) {
                var bodyStr = Buffer.from(bodyBytes).toString('utf-8');
                var bd = JSON.parse(bodyStr);
                pdfB64 = String(bd.pdfB64 || "");
            }
        } catch(be2) { console.error("[send-doc] $io: " + be2); }
    }
    console.log("[send-doc] pdfB64 chars=" + pdfB64.length);

    if (col !== "quotes" && col !== "invoices") return e.json(400, { message: "Collection invalide col=" + col });
    if (!id) return e.json(400, { message: "id manquant" });

    try {
        var rec = $app.findRecordById(col, id);
        var clientEmail = rec.getString("client_email");
        var clientName  = rec.getString("client_name") || "Client";
        if (!clientEmail) return e.json(400, { message: "Pas d'email client sur ce document" });

        var number  = rec.getString("number");
        var total   = parseFloat(rec.get("total") || 0).toFixed(2).replace(".", ",");
        var isInv   = number.indexOf("FAC") === 0;
        var docType = isInv ? "Facture" : "Devis";

        // FROM
        var from = { address: "noreply@example.com", name: "Intervio" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervio" }; } catch(x) {}

        // Brand
        var brandName = from.name; var brandColor = "#4f46e5";
        try {
            var trows = $app.findRecordsByFilter("settings", "key='theme' || key='site_name'", "", 10, 0);
            for (var ti = 0; ti < trows.length; ti++) {
                var tk = trows[ti].getString("key"); var tv = trows[ti].getString("value");
                if (tk === "site_name" && tv) brandName = tv;
                if (tk === "theme"     && tv) { try { var th = JSON.parse(tv); brandColor = th["--blue"] || th["--accent"] || th["--primary"] || brandColor; } catch(pe) {} }
            }
        } catch(se) {}

        // HTML email
        var emailHtml = "<div style='font-family:Arial,sans-serif;background:#f0f4f8;padding:30px 15px'>"
            + "<div style='background:#fff;border-radius:12px;padding:24px;max-width:600px;margin:0 auto;border-top:4px solid " + brandColor + "'>"
            + "<div style='font-size:1.5rem;font-weight:800;color:" + brandColor + ";margin-bottom:16px'>" + brandName + "</div>"
            + "<p style='color:#333;margin:0 0 8px'>Bonjour <strong>" + clientName + "</strong>,</p>"
            + "<p style='color:#555;margin:0 0 20px'>Veuillez trouver en pièce jointe votre " + docType.toLowerCase() + " " + brandName + ".</p>"
            + "<div style='background:#f0f6ff;border-radius:8px;padding:14px 18px;margin-bottom:20px'>"
            + "<div style='font-size:.72rem;color:#888;text-transform:uppercase'>" + docType + " N°</div>"
            + "<div style='font-size:1.1rem;font-weight:700;color:" + brandColor + "'>" + number + "</div>"
            + "<div style='font-size:1.3rem;font-weight:800;color:#1a1a2e;margin-top:4px'>" + total + " €</div></div>"
            + "<div style='margin-top:20px;padding-top:14px;border-top:1px solid #eee;font-size:.72rem;color:#999;text-align:center'>" + brandName + "</div>"
            + "</div></div>";

        var subject = docType + " " + brandName + " N° " + number + " — " + total + " €";

        // Lire config SMTP depuis PocketBase settings
        var smtpHost = "", smtpPort = 587, smtpUser = "", smtpPass = "", smtpTls = false;
        try {
            var st = $app.settings();
            if (st.smtp) {
                smtpHost = st.smtp.host     || "";
                smtpPort = st.smtp.port     || 587;
                smtpUser = st.smtp.username || "";
                smtpPass = st.smtp.password || "";
                smtpTls  = st.smtp.tls      || false;
            }
        } catch(se) {}

        // Envoi via sidecar mailer (pièce jointe PDF supportée)
        // URL lue depuis settings PocketBase (clé "mailer_url"), sinon Docker, sinon localhost
        var mailerSecret = "Intervys-mailer-2026";
        var mailerUrl = "http://Intervys_mailer:3001/send";
        var mailerRes = null;
        try {
            mailerRes = $http.send({
                method:  "POST",
                url:     mailerUrl,
                headers: { "Content-Type": "application/json", "X-Mailer-Secret": mailerSecret },
                body:    JSON.stringify({
                    to:          clientEmail,
                    fromName:    from.name,
                    fromAddress: from.address,
                    subject:     subject,
                    html:        emailHtml,
                    pdfB64:      pdfB64,
                    filename:    number + ".pdf",
                    smtpHost:    smtpHost,
                    smtpPort:    smtpPort,
                    smtpUser:    smtpUser,
                    smtpPass:    smtpPass,
                    smtpTls:     smtpTls,
                }),
                timeout: 30,
            });
        } catch(he) { console.error("[send-doc] mailer HTTP: " + he); }

        if (mailerRes && (mailerRes.statusCode === 200 || mailerRes.statusCode === 201)) {
            console.log("[send-doc] " + docType + " envoyé via mailer → " + clientEmail);
            return e.json(200, { message: "ok" });
        }

        // Fallback SMTP PocketBase sans pièce jointe
        console.error("[send-doc] mailer indispo (" + (mailerRes ? mailerRes.statusCode : "err") + "), fallback SMTP");
        var msg = new MailerMessage({ from: from, to: [{ address: clientEmail, name: clientName }], subject: subject, html: emailHtml });
        $app.newMailClient().send(msg);
        console.log("[send-doc] " + docType + " envoyé SMTP (sans PDF) → " + clientEmail);
        return e.json(200, { message: "ok" });
    } catch(err) {
        console.error("[send-doc] " + err);
        return e.json(500, { message: String(err) });
    }
});


// ════════════════════════════════════════
// TRANSMISSION PA — AFNOR XP Z12-013
// ════════════════════════════════════════
onRecordUpdate(function(e) {
    e.next();
    try {
        var r = e.record;
        var newStatus = r.getString("status");
        var oldStatus = e.original ? e.original.getString("status") : "";
        if (newStatus !== "transmis_pa" || oldStatus === "transmis_pa") return;

        var paUrl = "", clientId = "", clientSecret = "";
        try {
            var rows = $app.findRecordsByFilter("settings", "key='pa_url' || key='pa_client_id' || key='pa_client_secret'", "", 10, 0);
            for (var i = 0; i < rows.length; i++) {
                var k = rows[i].getString("key"); var v = rows[i].getString("value");
                if (k === "pa_url")           paUrl        = v;
                if (k === "pa_client_id")     clientId     = v;
                if (k === "pa_client_secret") clientSecret = v;
            }
        } catch(ce) { console.error("[PA] Config error: " + ce); return; }

        if (!paUrl || !clientId) {
            console.error("[PA] Configuration incomplète");
            r.set("status", "envoye"); $app.saveNoValidate(r); return;
        }

        // PocketBase v0.22+ : res.body est un tableau de bytes, pas une string
        function decodeBody(body) {
            if (typeof body === "string") return body;
            try { return String.fromCharCode.apply(null, Array.isArray(body) ? body : Array.from(body)); } catch(e) { return String(body); }
        }

        var accessToken = "";
        var tokenRes;
        try {
            tokenRes = $http.send({
                url: paUrl.replace(/\/$/, "") + "/oauth2/token",
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "grant_type=client_credentials&client_id=" + encodeURIComponent(clientId) + "&client_secret=" + encodeURIComponent(clientSecret),
                timeout: 15,
            });
            if (tokenRes.statusCode === 200) {
                var tokenData = JSON.parse(decodeBody(tokenRes.body));
                accessToken = tokenData.access_token || "";
            } else { console.error("[PA] OAuth2 error " + tokenRes.statusCode + " : " + decodeBody(tokenRes.body).slice(0,200)); }
        } catch(te) { console.error("[PA] OAuth2 error: " + te); }

        if (!accessToken) {
            var oauthErr = tokenRes ? ("HTTP " + tokenRes.statusCode + " : " + decodeBody(tokenRes.body).slice(0,150)) : "no response";
            r.set("status", "envoye");
            r.set("pa_invoice_id", "ERR:oauth:" + oauthErr);
            $app.saveNoValidate(r); return;
        }

        var pdfBase64 = r.getString("pdf_b64");
        if (!pdfBase64) {
            r.set("status", "envoye");
            r.set("pa_invoice_id", "ERR:flows:pdf_b64 manquant — regénérez la facture");
            $app.saveNoValidate(r); return;
        }

        var invoiceXml = r.getString("pdf_b64");
        if (!invoiceXml) {
            r.set("status", "envoye");
            r.set("pa_invoice_id", "ERR:xml manquant — retransmettez");
            $app.saveNoValidate(r); return;
        }

        // Étape 1 : valider le XML via SUPER PDP avant soumission
        var boundary = "PBVal" + r.id + Date.now();
        var valBody =
            "--" + boundary + "\r\n" +
            "Content-Disposition: form-data; name=\"file\"; filename=\"invoice.xml\"\r\n" +
            "Content-Type: application/xml\r\n\r\n" +
            invoiceXml + "\r\n" +
            "--" + boundary + "--\r\n";
        var valRes;
        try {
            valRes = $http.send({
                url: paUrl.replace(/\/$/, "") + "/v1.beta/validation_reports",
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + accessToken,
                    "Content-Type": "multipart/form-data; boundary=" + boundary,
                },
                body: valBody,
                timeout: 30,
            });
        } catch(ve) { console.error("[PA] validation error: " + ve); }

        var valBody2 = valRes ? decodeBody(valRes.body) : "";
        console.log("[PA] validation HTTP " + (valRes ? valRes.statusCode : "?") + " : " + valBody2.slice(0, 1000));

        if (valRes && valRes.statusCode !== 200 && valRes.statusCode !== 201) {
            r.set("status", "envoye");
            r.set("pa_invoice_id", "ERR:validation:HTTP " + valRes.statusCode + " : " + valBody2.slice(0, 600));
            $app.saveNoValidate(r); return;
        }

        // Étape 2 : soumettre la facture validée
        var invoiceRes = $http.send({
            url: paUrl.replace(/\/$/, "") + "/v1.beta/invoices",
            method: "POST",
            headers: { "Authorization": "Bearer " + accessToken },
            body: invoiceXml,
            timeout: 60,
        });

        if (invoiceRes && (invoiceRes.statusCode === 200 || invoiceRes.statusCode === 201 || invoiceRes.statusCode === 202)) {
            var invData = {};
            try { invData = JSON.parse(decodeBody(invoiceRes.body)); } catch(x) {}
            var invId = invData.id || invData.invoiceId || invData.flowId || ("PA-" + r.id);
            r.set("pa_invoice_id", String(invId));
            r.set("pa_transmitted_at", new Date().toISOString());
            r.set("status", "transmis");
            r.set("pdf_b64", "");
            $app.saveNoValidate(r);
        } else {
            var errBody = invoiceRes ? ("HTTP " + invoiceRes.statusCode + " : " + decodeBody(invoiceRes.body).slice(0,800)) : "no response";
            // Inclure aussi la réponse validation pour debug
            var errFull = errBody + " | VAL:" + valBody2.slice(0,400);
            r.set("status", "envoye");
            r.set("pa_invoice_id", "ERR:invoices:" + errFull);
            $app.saveNoValidate(r);
        }
    } catch(err) { r.set("pa_invoice_id", "ERR:exception:" + String(err).slice(0,200)); $app.saveNoValidate(r); }
}, "invoices");

// ════════════════════════════════════════
// PROBE PA — découverte des endpoints (prod hook)
// POST /api/probe-pa
// ════════════════════════════════════════
routerAdd("POST", "/api/probe-pa", function(e) {
    var paUrl = "", clientId = "", clientSecret = "";
    try {
        var rows = $app.findRecordsByFilter("settings", "key='pa_url' || key='pa_client_id' || key='pa_client_secret'", "", 10, 0);
        for (var i = 0; i < rows.length; i++) {
            var k = rows[i].getString("key"); var v = rows[i].getString("value");
            if (k === "pa_url")           paUrl        = v;
            if (k === "pa_client_id")     clientId     = v;
            if (k === "pa_client_secret") clientSecret = v;
        }
    } catch(ce) { return e.json(500, { error: "Config: " + ce }); }
    if (!paUrl || !clientId) return e.json(400, { error: "PA non configurée" });

    function decodeB(body) {
        if (typeof body === "string") return body;
        try { return String.fromCharCode.apply(null, Array.isArray(body) ? body : Array.from(body)); } catch(ex) { return String(body); }
    }

    var base = paUrl.replace(/\/$/, "");
    var accessToken = "";
    try {
        var tr = $http.send({ url: base + "/oauth2/token", method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "grant_type=client_credentials&client_id=" + encodeURIComponent(clientId) + "&client_secret=" + encodeURIComponent(clientSecret),
            timeout: 15 });
        if (tr.statusCode === 200) { var td = JSON.parse(decodeB(tr.body)); accessToken = td.access_token || ""; }
        else { return e.json(200, { token: false, status: tr.statusCode, body: decodeB(tr.body).slice(0,200) }); }
    } catch(te) { return e.json(200, { token: false, error: String(te) }); }

    var candidates = [
        "/flows", "/v1/flows", "/v1.beta/flows", "/api/flows", "/api/v1/flows",
        "/invoices", "/v1/invoices", "/api/invoices", "/api/v1/invoices",
        "/e-invoices", "/v1/e-invoices", "/api/v1/e-invoices",
        "/invoice-flows", "/flux", "/api/flux",
    ];
    var results = [];
    var h = { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" };
    var tb = JSON.stringify({ invoiceNumber: "TEST-PROBE", totalAmount: 0, currency: "EUR" });
    for (var j = 0; j < candidates.length; j++) {
        var path = candidates[j];
        try {
            var pr = $http.send({ url: base + path, method: "POST", headers: h, body: tb, timeout: 8 });
            results.push({ path: path, status: pr.statusCode, body: decodeB(pr.body).slice(0, 200) });
        } catch(pe) {
            results.push({ path: path, error: String(pe).slice(0, 80) });
        }
    }
    return e.json(200, { token: true, base: base, results: results });
}, $apis.requireSuperuserAuth());

// ════════════════════════════════════════
// TEST FORMAT FACTURE PA — POST /api/test-pa-invoice
// Télécharge la facture de test SUPER PDP et tente de la soumettre
// ════════════════════════════════════════
routerAdd("POST", "/api/test-pa-invoice", function(e) {
    var paUrl = "", clientId = "", clientSecret = "";
    try {
        var rows = $app.findRecordsByFilter("settings", "key='pa_url' || key='pa_client_id' || key='pa_client_secret'", "", 10, 0);
        for (var i = 0; i < rows.length; i++) {
            var k = rows[i].getString("key"); var v = rows[i].getString("value");
            if (k === "pa_url")           paUrl        = v;
            if (k === "pa_client_id")     clientId     = v;
            if (k === "pa_client_secret") clientSecret = v;
        }
    } catch(ce) { return e.json(500, { error: "Config: " + ce }); }
    if (!paUrl || !clientId) return e.json(400, { error: "PA non configurée" });

    function decodeB2(body) {
        if (typeof body === "string") return body;
        try { return String.fromCharCode.apply(null, Array.isArray(body) ? body : Array.from(body)); } catch(ex) { return String(body); }
    }

    var base = paUrl.replace(/\/$/, "");
    var tok = "";
    try {
        var tr = $http.send({ url: base + "/oauth2/token", method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "grant_type=client_credentials&client_id=" + encodeURIComponent(clientId) + "&client_secret=" + encodeURIComponent(clientSecret),
            timeout: 15 });
        if (tr.statusCode === 200) { tok = (JSON.parse(decodeB2(tr.body))).access_token || ""; }
        else { return e.json(200, { token: false, body: decodeB2(tr.body).slice(0,200) }); }
    } catch(te) { return e.json(200, { token: false, error: String(te) }); }

    var h = { "Authorization": "Bearer " + tok };
    var out = { token: true };

    // 1. Récupérer le CII de test SUPER PDP — extraire SellerTradeParty + BuyerTradeParty
    try {
        var ciiRes = $http.send({ url: base + "/v1.beta/invoices/generate_test_invoice?format=cii", method: "GET", headers: h, timeout: 15 });
        if (ciiRes.statusCode === 200) {
            var fullCii = decodeB2(ciiRes.body);
            // Extraire les sections TradeParty
            var sellerIdx = fullCii.indexOf("SellerTradeParty");
            var buyerIdx  = fullCii.indexOf("BuyerTradeParty");
            var buyerEnd  = fullCii.indexOf("BuyerTradeParty", buyerIdx + 10);
            out["seller_section"] = sellerIdx >= 0 ? fullCii.slice(sellerIdx > 100 ? sellerIdx - 5 : 0, sellerIdx + 1500) : "non trouvé";
            out["buyer_section"]  = buyerIdx  >= 0 ? fullCii.slice(buyerIdx  > 100 ? buyerIdx  - 5 : 0, buyerIdx  + 1500) : "non trouvé";
        } else {
            out["cii_test_xml"] = "HTTP " + ciiRes.statusCode;
        }
    } catch(ge) { out["cii_test_xml"] = "ERR: " + String(ge).slice(0, 80); }

    // 2. Valider notre XML CII via l'invoice ID passé en body
    var info2 = e.requestInfo();
    var invoiceId = String((info2.body && info2.body.invoice_id) || "");
    if (invoiceId) {
        var ourXml = "";
        try {
            var invRec = $app.findRecordById("invoices", invoiceId);
            ourXml = invRec ? invRec.getString("pdf_b64") : "";
        } catch(re) { out["our_xml_read"] = "ERR: " + String(re).slice(0,80); }

        if (ourXml) {
            out["our_xml_preview"] = ourXml.slice(0, 500);

            // Valider via POST /v1.beta/validation_reports (FormData)
            var vBoundary = "ValBound" + Date.now();
            var vMultipart =
                "--" + vBoundary + "\r\n" +
                "Content-Disposition: form-data; name=\"file\"; filename=\"invoice.xml\"\r\n" +
                "Content-Type: application/xml\r\n\r\n" +
                ourXml + "\r\n--" + vBoundary + "--\r\n";
            try {
                var vRes = $http.send({ url: base + "/v1.beta/validation_reports", method: "POST",
                    headers: { "Authorization": "Bearer " + tok, "Content-Type": "multipart/form-data; boundary=" + vBoundary },
                    body: vMultipart, timeout: 30 });
                out["validation"] = { status: vRes.statusCode, body: decodeB2(vRes.body).slice(0, 2000) };
            } catch(ve) { out["validation"] = { error: String(ve).slice(0,80) }; }

            // Soumettre pour comparaison
            try {
                var subRes = $http.send({ url: base + "/v1.beta/invoices", method: "POST", headers: h, body: ourXml, timeout: 30 });
                out["our_submit"] = { status: subRes.statusCode, body: decodeB2(subRes.body).slice(0, 400) };
            } catch(se) { out["our_submit"] = { error: String(se).slice(0,80) }; }
        }
    }

    return e.json(200, out);
}, $apis.requireSuperuserAuth());

// ════════════════════════════════════════════════════════════
// DÉCOUVERTE ROUTING IDs — GET /api/pa-sender-routing
// Seller + buyer routing depuis le CII de test SUPER PDP
// ════════════════════════════════════════════════════════════
routerAdd("GET", "/api/pa-sender-routing", function(e) {
    var paUrl = "", clientId = "", clientSecret = "";
    try {
        var rows = $app.findRecordsByFilter("settings", "key='pa_url' || key='pa_client_id' || key='pa_client_secret'", "", 10, 0);
        for (var i = 0; i < rows.length; i++) {
            var k = rows[i].getString("key"); var v = rows[i].getString("value");
            if (k === "pa_url")           paUrl        = v;
            if (k === "pa_client_id")     clientId     = v;
            if (k === "pa_client_secret") clientSecret = v;
        }
    } catch(ce) { return e.json(500, { error: "Config: " + String(ce) }); }
    if (!paUrl || !clientId || !clientSecret) return e.json(400, { error: "PA non configurée" });

    function decodeB(body) {
        if (typeof body === "string") return body;
        try { return String.fromCharCode.apply(null, Array.isArray(body) ? body : Array.from(body)); } catch(ex) { return String(body); }
    }

    var base = paUrl.replace(/\/$/, "");
    var tok = "";
    try {
        var tr = $http.send({ url: base + "/oauth2/token", method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "grant_type=client_credentials&client_id=" + encodeURIComponent(clientId) + "&client_secret=" + encodeURIComponent(clientSecret),
            timeout: 15 });
        if (tr.statusCode === 200) tok = (JSON.parse(decodeB(tr.body))).access_token || "";
        else return e.json(200, { error: "Token HTTP " + tr.statusCode, body: decodeB(tr.body).slice(0,200) });
    } catch(te) { return e.json(200, { error: "Token error: " + String(te) }); }

    var h = { "Authorization": "Bearer " + tok };
    var sellerRouting = "", buyerRouting = "", buyerSiren = "", prefix = "";
    var debug = {};

    // Récupérer le CII de test — extraire les routing IDs
    try {
        var ciiRes = $http.send({ url: base + "/v1.beta/invoices/generate_test_invoice?format=cii", method: "GET", headers: h, timeout: 15 });
        debug.cii_status = ciiRes.statusCode;
        if (ciiRes.statusCode === 200) {
            var cii = decodeB(ciiRes.body);
            debug.cii_len = cii.length;

            // Extraire tous les URIID schemeID="0225" du document (avec ou sans attributs xmlns entre)
            var uriRe = /<[A-Za-z:]*URIID[^>]*schemeID="0225"[^>]*>([^<]+)<\/[A-Za-z:]*URIID>/g;
            var allUriids = [], mu;
            while ((mu = uriRe.exec(cii)) !== null) { allUriids.push(mu[1].trim()); }
            debug.all_uriids = allUriids;

            // Déterminer seller vs buyer selon ordre dans le doc (seller vient en premier dans CII)
            var sellerIdx = cii.indexOf("SellerTradeParty");
            var buyerIdx  = cii.indexOf("BuyerTradeParty");
            for (var ui = 0; ui < allUriids.length; ui++) {
                var pos = cii.indexOf(allUriids[ui]);
                if (!sellerRouting && pos > 0 && pos < buyerIdx) {
                    sellerRouting = allUriids[ui];
                    var pm = sellerRouting.match(/^(\d+)_/); if (pm) prefix = pm[1];
                } else if (!buyerRouting && pos > buyerIdx) {
                    buyerRouting = allUriids[ui];
                }
            }

            // SIREN acheteur : chercher GlobalID ou ID schemeID="0002" après BuyerTradeParty
            var buyerSection = buyerIdx >= 0 ? cii.slice(buyerIdx, buyerIdx + 2000) : "";
            var bs = buyerSection.match(/<[A-Za-z:]*GlobalID[^>]*schemeID="0225"[^>]*>([^<]+)<\/[A-Za-z:]*GlobalID>/);
            if (!bs) bs = buyerSection.match(/<[A-Za-z:]*ID[^>]*schemeID="0002"[^>]*>([^<]+)<\/[A-Za-z:]*ID>/);
            if (bs) buyerSiren = bs[1].trim().replace(/\s/g,"").slice(0,9);
        } else {
            debug.cii_body = decodeB(ciiRes.body).slice(0, 200);
        }
    } catch(ge) { debug.cii_error = String(ge); }

    // Fallback seller depuis companies/me si CII échoue
    if (!sellerRouting && prefix) {
        try {
            var meR = $http.send({ url: base + "/v1.beta/companies/me", method: "GET", headers: h, timeout: 10 });
            if (meR.statusCode === 200) {
                var me = JSON.parse(decodeB(meR.body));
                if (me.id) sellerRouting = prefix + "_" + me.id;
            }
        } catch(_) {}
    }

    return e.json(200, { routing_id: sellerRouting, prefix: prefix, test_buyer: { routing_id: buyerRouting, siren: buyerSiren }, debug: debug });
});

// ════════════════════════════════════════
// TEST CONNEXION PA — proxy server-side (évite CORS)
// POST /api/test-pa  { pa_url, client_id, client_secret }
// ════════════════════════════════════════
routerAdd("POST", "/api/test-pa", function(e) {
    var info = e.requestInfo();
    var paUrl        = String((info.body && info.body.pa_url)        || "").trim();
    var clientId     = String((info.body && info.body.client_id)     || "").trim();
    var clientSecret = String((info.body && info.body.client_secret) || "").trim();

    if (!paUrl || !clientId || !clientSecret) {
        return e.json(400, { ok: false, message: "Paramètres manquants (pa_url, client_id, client_secret)" });
    }

    var tokenUrl = paUrl.replace(/\/$/, "") + "/oauth2/token";
    try {
        var res = $http.send({
            url:     tokenUrl,
            method:  "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body:    "grant_type=client_credentials&client_id=" + encodeURIComponent(clientId)
                   + "&client_secret=" + encodeURIComponent(clientSecret),
            timeout: 15,
        });
        if (res.statusCode === 200 || res.statusCode === 201) {
            return e.json(200, { ok: true, message: "Connexion PA réussie ✅ (HTTP " + res.statusCode + ")" });
        }
        var errDetail = (res.body || "").slice(0, 200);
        return e.json(200, { ok: false, message: "PA répond HTTP " + res.statusCode + " : " + errDetail });
    } catch(err) {
        return e.json(200, { ok: false, message: "Impossible de joindre la PA : " + String(err) });
    }
}, $apis.requireSuperuserAuth());

// ════════════════════════════════════════
// DEBUG — tester le lookup email pour un message
// GET /api/debug-msg-email?inv=<interventionId>
// ════════════════════════════════════════
routerAdd("GET", "/api/debug-msg-email", function(e) {
    var invId = e.request.url.query().get("inv");
    var result = { invId: invId, inv_found: false, uid: "", cEmail: "", cName: "", lid: "", cToken: "", error: "" };
    try {
        var inv = $app.findRecordById("interventions", invId);
        result.inv_found = true;
        result.inv_title = inv.getString("title");
        var uid2 = inv.getString("user");
        result.uid = uid2;
        if (uid2) {
            try {
                var u2 = $app.findRecordById("users", uid2);
                result.cEmail = u2.getString("email");
                result.cName  = u2.getString("name") || "";
            } catch(ux) { result.error += "user_lookup: " + ux + " | "; }
        }
        if (!result.cEmail) {
            var lid = inv.getString("access_link");
            result.lid = lid;
            if (lid) {
                try {
                    var lk = $app.findRecordById("access_links", lid);
                    result.cEmail  = lk.getString("client_email");
                    result.cName   = lk.getString("client_name") || "";
                    result.cToken  = lk.getString("token");
                } catch(lx) { result.error += "access_link_lookup: " + lx + " | "; }
            }
        }
    } catch(ex) { result.error += "inv_lookup: " + ex; }
    return e.json(200, result);
}, $apis.requireSuperuserAuth());
