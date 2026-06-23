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
    return 'https://homegeek.fr/Intervys/latest.json';
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
// NOUVELLE INTERVENTION → email admin
// ════════════════════════════════════════
onRecordCreate(function(e) {
    e.next();
    try {
        var from = { address: "noreply@example.com", name: "Intervys" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervys" }; } catch(x) {}

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
        var from = { address: "noreply@example.com", name: "Intervys" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervys" }; } catch(x) {}

        var ADMIN = "";
        try { var ar = $app.findRecordsByFilter("settings", "key='admin_email'", "", 1, 0); if (ar && ar.length > 0) ADMIN = ar[0].getString("value"); } catch(x) {}
        if (!ADMIN) { try { var su = $app.findRecordsByFilter("_superusers", "", "", 1, 0); if (su && su.length > 0) ADMIN = su[0].getString("email"); } catch(x) {} }

        var r = e.record;
        var content = r.getString("content");
        var fromAdmin = r.getBool("from_admin");
        var invId = r.getString("intervention");
        var sender = r.getString("sender_name");
        var inv = $app.findRecordById("interventions", invId);
        var invTitle = inv ? inv.getString("title") : invId;

        if (fromAdmin) {
            var cEmail = ""; var cName = "Client";
            var uid2 = inv ? inv.getString("user") : "";
            if (uid2) { try { var u2 = $app.findRecordById("users", uid2); cEmail = u2.getString("email"); cName = u2.getString("name") || "Client"; } catch(x) {} }
            if (!cEmail) { var lid = inv ? inv.getString("access_link") : ""; if (lid) { try { var lk = $app.findRecordById("access_links", lid); cEmail = lk.getString("client_email"); cName = lk.getString("client_name") || "Client"; } catch(x) {} } }
            if (cEmail) {
                var m2 = new MailerMessage({ from: from, to: [{ address: cEmail }], subject: "Reponse : " + invTitle, html: "<p>Bonjour " + cName + ",</p><p>" + content + "</p>" });
                $app.newMailClient().send(m2);
            }
        } else if (ADMIN) {
            var m3 = new MailerMessage({ from: from, to: [{ address: ADMIN }], subject: "Message client : " + invTitle, html: "<p><b>" + (sender||"Client") + "</b> :</p><p>" + content + "</p>" });
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
        var from = { address: "noreply@example.com", name: "Intervys" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervys" }; } catch(x) {}

        var r = e.record;
        var newS = r.getString("status");
        var oldS = e.original ? e.original.getString("status") : "";
        if (!newS || newS === oldS) return;

        var cEmail = ""; var cName = "Client";
        var uid3 = r.getString("user");
        if (uid3) { try { var uu = $app.findRecordById("users", uid3); cEmail = uu.getString("email"); cName = uu.getString("name") || "Client"; } catch(x) {} }
        if (!cEmail) { var lid2 = r.getString("access_link"); if (lid2) { try { var ll = $app.findRecordById("access_links", lid2); cEmail = ll.getString("client_email"); cName = ll.getString("client_name") || "Client"; } catch(x) {} } }
        if (!cEmail) return;

        var STATUS_FR = { nouveau:"Nouvelle demande", diagnostic:"En diagnostic", en_cours:"En cours", attente_piece:"Attente piece", attente_client:"Attente client", termine:"Terminee", annule:"Annulee" };
        var m4 = new MailerMessage({ from: from, to: [{ address: cEmail }], subject: "Mise a jour : " + r.getString("title"), html: "<p>Bonjour " + cName + ",</p><p>Statut : <b>" + (STATUS_FR[newS]||newS) + "</b></p>" });
        $app.newMailClient().send(m4);
    } catch(err) { console.error("[statusChange] " + err); }
}, "interventions");

// ════════════════════════════════════════
// INSCRIPTION → OTP
// ════════════════════════════════════════
onRecordCreate(function(e) {
    e.next();
    try {
        var from = { address: "noreply@example.com", name: "Intervys" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervys" }; } catch(x) {}

        var brandName = from.name;
        var brandColor = "#4f46e5";
        try {
            var trows = $app.findRecordsByFilter("settings", "key='theme' || key='site_name'", "", 10, 0);
            for (var ti = 0; ti < trows.length; ti++) {
                var tk = trows[ti].getString("key"); var tv = trows[ti].getString("value");
                if (tk === "site_name" && tv) brandName = tv;
                if (tk === "theme" && tv) { try { var th = JSON.parse(tv); brandColor = th["--blue"] || th["--accent"] || th["--primary"] || brandColor; } catch(pe) {} }
            }
        } catch(se) {}

        var r = e.record;
        var email = r.getString("email");
        var name = r.getString("name") || "Client";
        if (!email) return;

        var otp = String(Math.floor(100000 + Math.random() * 900000));
        var expires = new Date(Date.now() + 15 * 60000).toISOString();
        try { r.set("otp_code", otp); r.set("otp_expires", expires); r.set("email_verified", false); $app.saveNoValidate(r); } catch(se) { console.error("[OTP] Save error: " + se); }

        var msg = new MailerMessage({
            from: from,
            to: [{ address: email }],
            subject: "Votre code de vérification : " + otp,
            html: "<div style='font-family:Arial,sans-serif;background:#0d1117;padding:40px 20px'>"
                + "<div style='background:#111820;border-radius:12px;padding:32px;max-width:480px;margin:0 auto;border:1px solid rgba(79,70,229,.3)'>"
                + "<div style='text-align:center;margin-bottom:24px;font-size:1.8rem;font-weight:800;color:" + brandColor + "'>" + brandName + "</div>"
                + "<h2 style='color:#e2e8f0;font-size:1.1rem;margin:0 0 12px'>Bonjour " + name + ",</h2>"
                + "<p style='color:#8fa8c0;margin:0 0 24px'>Votre code de vérification :</p>"
                + "<div style='background:#0a1628;border:2px solid " + brandColor + ";border-radius:12px;padding:24px;text-align:center;margin-bottom:24px'>"
                + "<div style='font-size:2.8rem;font-weight:800;letter-spacing:.3em;color:" + brandColor + ";font-family:monospace'>" + otp + "</div>"
                + "<div style='font-size:.75rem;color:#5f7a96;margin-top:8px'>Valable 15 minutes</div></div>"
                + "<p style='color:#5f7a96;font-size:.82rem;text-align:center'>Si vous n'avez pas demandé ce code, ignorez cet email.</p>"
                + "</div></div>",
        });
        $app.newMailClient().send(msg);
        console.log("[OTP] Code envoyé à " + email);
    } catch(err) { console.error("[OTP] " + err); }
}, "users");

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
        var from = { address: "noreply@example.com", name: "Intervys" };
        try { var s = $app.settings(); var a = s.meta && s.meta.senderAddress ? s.meta.senderAddress : (s.smtp ? s.smtp.username||"" : ""); from = { address: a||"noreply@example.com", name: s.meta && s.meta.senderName ? s.meta.senderName : "Intervys" }; } catch(x) {}

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
        var mailerSecret = "hg-mailer-secret-2026";
        var mailerUrl = "http://homegeek_mailer:3001/send";
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

        var accessToken = "";
        try {
            var tokenRes = $http.send({
                url: paUrl.replace(/\/$/, "") + "/oauth/token",
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "grant_type=client_credentials&client_id=" + encodeURIComponent(clientId) + "&client_secret=" + encodeURIComponent(clientSecret) + "&scope=invoices:write",
                timeout: 15,
            });
            if (tokenRes.statusCode === 200) {
                var tokenData = JSON.parse(tokenRes.body);
                accessToken = tokenData.access_token || "";
            } else { console.error("[PA] OAuth2 error " + tokenRes.statusCode); }
        } catch(te) { console.error("[PA] OAuth2 error: " + te); }

        if (!accessToken) {
            console.error("[PA] Impossible d'obtenir un token OAuth2");
            r.set("status", "envoye"); $app.saveNoValidate(r); return;
        }

        var trackingId = "HG-" + r.id + "-" + Date.now();
        var flowRes = $http.send({
            url: paUrl.replace(/\/$/, "") + "/flows",
            method: "POST",
            headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
            body: JSON.stringify({
                trackingId:    trackingId,
                invoiceNumber: r.getString("number"),
                buyerEmail:    r.getString("client_email"),
                totalAmount:   parseFloat(r.get("total") || 0),
                currency:      "EUR",
                issueDate:     (r.getString("issued_at") || "").slice(0, 10),
            }),
            timeout: 30,
        });

        if (flowRes && (flowRes.statusCode === 200 || flowRes.statusCode === 201 || flowRes.statusCode === 202)) {
            var flowData = {};
            try { flowData = JSON.parse(flowRes.body); } catch(x) {}
            var flowId = flowData.flowId || flowData.id || trackingId;
            r.set("pa_invoice_id", String(flowId));
            r.set("pa_transmitted_at", new Date().toISOString());
            r.set("status", "transmis");
            r.set("pdf_b64", "");
            $app.saveNoValidate(r);
            console.log("[PA] Flux transmis — flowId: " + flowId);
        } else {
            var errBody = flowRes ? flowRes.body.slice(0, 300) : "no response";
            console.error("[PA] Erreur " + (flowRes ? flowRes.statusCode : "?") + " : " + errBody);
            r.set("status", "envoye");
            $app.saveNoValidate(r);
        }
    } catch(err) { console.error("[PA] Erreur générale : " + err); }
}, "invoices");
