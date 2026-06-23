const http       = require('http');
const nodemailer = require('nodemailer');

const PORT   = 3001;
const SECRET = process.env.MAILER_SECRET || '';

http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/send') {
        res.writeHead(404); res.end(); return;
    }
    if (SECRET && req.headers['x-mailer-secret'] !== SECRET) {
        res.writeHead(401); res.end(JSON.stringify({ error: 'Unauthorized' })); return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const d = JSON.parse(body);

            // Transporter créé à partir de la config SMTP envoyée par PocketBase
            const transporter = nodemailer.createTransport({
                host:   d.smtpHost,
                port:   parseInt(d.smtpPort, 10) || 587,
                secure: d.smtpTls === true || d.smtpTls === 'true',
                auth:   { user: d.smtpUser, pass: d.smtpPass },
            });

            const mail = {
                from:    `"${d.fromName}" <${d.fromAddress}>`,
                to:      d.to,
                subject: d.subject,
                html:    d.html,
            };
            if (d.pdfB64 && d.filename) {
                mail.attachments = [{ filename: d.filename, content: d.pdfB64, encoding: 'base64' }];
            }

            await transporter.sendMail(mail);
            console.log('[mailer] OK →', d.to);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        } catch (err) {
            console.error('[mailer] ERR', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    });
}).listen(PORT, () => console.log('[mailer] listening on :' + PORT));
