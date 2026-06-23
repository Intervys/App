#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use std::fs;
use std::io;
use std::path::Path;
use std::process::Command;
use std::sync::OnceLock;
use tauri::Emitter;
use tauri::Manager;
#[cfg(windows)]
use std::os::windows::process::CommandExt;
const CREATE_NO_WINDOW: u32 = 0x08000000;

static PAYLOAD_ZIP: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/payload.zip"));
static PAYLOAD_BASE: OnceLock<std::path::PathBuf> = OnceLock::new();

// ── Vérifications système ─────────────────────────────────────────

#[tauri::command]
fn check_docker() -> bool {
    which::which("docker").is_ok()
}

#[tauri::command]
fn check_wsl() -> bool {
    Command::new("wsl").args(["--status"]).output()
        .map(|o| o.status.success()).unwrap_or(false)
}

#[tauri::command]
fn check_mode() -> String {
    if which::which("docker").is_ok() { "docker".to_string() } else { "native".to_string() }
}

#[tauri::command]
fn get_default_dir() -> String {
    std::env::var("LOCALAPPDATA")
        .map(|h| format!("{}\\Intervys", h))
        .or_else(|_| std::env::var("USERPROFILE").map(|h| format!("{}\\Intervys", h)))
        .unwrap_or_else(|_| "C:\\Users\\Public\\Intervys".to_string())
}

#[tauri::command]
fn run_command(cmd: String, args: Vec<String>) -> Result<String, String> {
    let out = Command::new(&cmd).args(&args).output().map_err(|e| e.to_string())?;
    if out.status.success() { Ok(String::from_utf8_lossy(&out.stdout).to_string()) }
    else { Err(String::from_utf8_lossy(&out.stderr).to_string()) }
}

#[tauri::command]
fn run_detached(cmd: String, args: Vec<String>) -> Result<(), String> {
    Command::new(&cmd).args(&args).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_browser(url: String) {
    Command::new("cmd").args(["/c", "start", &url]).spawn().ok();
}

#[tauri::command]
fn enable_wsl() -> Result<String, String> {
    let out = Command::new("powershell")
        .args(["-Command", "wsl --install --no-distribution"])
        .output().map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

#[tauri::command]
fn install_docker() -> Result<String, String> {
    Command::new("cmd")
        .args(["/c", "start", "https://www.docker.com/products/docker-desktop/"])
        .spawn().map_err(|e| e.to_string())?;
    Ok("Page Docker ouverte".to_string())
}

// ── Helpers ───────────────────────────────────────────────────────

fn copy_dir_all(src: &Path, dst: &Path) -> io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let dst_path = dst.join(entry.file_name());
        if ty.is_dir() { copy_dir_all(&entry.path(), &dst_path)?; }
        else { fs::copy(entry.path(), &dst_path)?; }
    }
    Ok(())
}

fn emit_log(window: &tauri::WebviewWindow, msg: &str) {
    window.emit("deploy-log", msg).ok();
}

fn emit_progress(window: &tauri::WebviewWindow, label: &str, pct: u32) {
    #[derive(serde::Serialize, Clone)]
    struct P { label: String, pct: u32 }
    window.emit("download-progress", P { label: label.to_string(), pct }).ok();
}

fn generate_password() -> String {
    use std::time::SystemTime;
    let seed = SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as u64
        ^ (std::process::id() as u64).wrapping_mul(0xdeadbeef_cafebabe);
    let chars = b"abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let mut s = seed;
    let mut result = String::with_capacity(16);
    for _ in 0..16 {
        s ^= s << 13; s ^= s >> 7; s ^= s << 17;
        result.push(chars[(s as usize) % chars.len()] as char);
    }
    result
}

fn payload_base() -> &'static std::path::PathBuf {
    PAYLOAD_BASE.get_or_init(|| {
        // Mode développement : cherche src/payload dans les ancêtres
        let exe = std::env::current_exe().unwrap_or_default();
        for p in exe.ancestors() {
            let c = p.join("src").join("payload");
            if c.exists() { return c; }
        }
        // Production : extrait le zip embarqué dans %TEMP%\IntervysSetup
        let dest = std::env::temp_dir().join("IntervysSetup");
        let marker = dest.join(".payload_ok");
        if !marker.exists() {
            let _ = std::fs::remove_dir_all(&dest);
            std::fs::create_dir_all(&dest).ok();
            let cursor = std::io::Cursor::new(PAYLOAD_ZIP);
            if let Ok(mut archive) = zip::ZipArchive::new(cursor) {
                archive.extract(&dest).ok();
            }
            std::fs::write(&marker, b"").ok();
        }
        dest
    })
}

fn get_payload_path(subdir: &str) -> std::path::PathBuf {
    payload_base().join(subdir)
}

async fn download_pocketbase(dest_dir: &Path, window: &tauri::WebviewWindow) -> Result<(), String> {
    let ver = "0.23.4";
    let url = format!(
        "https://github.com/pocketbase/pocketbase/releases/download/v{}/pocketbase_{}_windows_amd64.zip",
        ver, ver
    );
    emit_log(window, &format!("Téléchargement PocketBase v{}...", ver));
    emit_progress(window, "Téléchargement PocketBase", 25);

    let bytes = reqwest::get(&url)
        .await
        .map_err(|e| format!("Erreur réseau : {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Erreur lecture : {}", e))?;

    emit_log(window, "Extraction PocketBase...");
    emit_progress(window, "Extraction", 40);

    let zip_path = dest_dir.join("pb.zip");
    fs::write(&zip_path, &bytes).map_err(|e| format!("Erreur écriture zip : {}", e))?;

    let file = fs::File::open(&zip_path).map_err(|e| format!("Erreur ouverture zip : {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Erreur zip : {}", e))?;
    for i in 0..archive.len() {
        let mut zf = archive.by_index(i).map_err(|e| format!("Erreur entry : {}", e))?;
        let out = dest_dir.join(zf.name());
        if zf.name().ends_with('/') { fs::create_dir_all(&out).ok(); }
        else {
            if let Some(p) = out.parent() { fs::create_dir_all(p).ok(); }
            let mut f = fs::File::create(&out).map_err(|e| format!("Erreur fichier : {}", e))?;
            io::copy(&mut zf, &mut f).map_err(|e| format!("Erreur extraction : {}", e))?;
        }
    }
    fs::remove_file(&zip_path).ok();
    emit_log(window, "✓ PocketBase extrait");
    Ok(())
}

fn create_url_shortcut(desktop: &str, name: &str, url: &str, icon_path: &str) {
    let mut content = format!("[InternetShortcut]\r\nURL={}\r\n", url);
    if !icon_path.is_empty() {
        content.push_str(&format!("IconFile={}\r\nIconIndex=0\r\n", icon_path));
    }
    fs::write(format!("{}\\{}.url", desktop, name), content).ok();
}

// Crée un raccourci .lnk via VBScript encodé en UTF-16 LE (WScript gère tous les chemins Unicode)
fn create_lnk_shortcut(desktop: &str, name: &str, target: &str, icon_path: &str) {
    let lnk = format!("{}\\{}.lnk", desktop, name);
    let icon_line = if icon_path.is_empty() { String::new() }
        else { format!("s.IconLocation = \"{}\"\r\n", icon_path) };
    let vbs = format!(
        "Set ws = CreateObject(\"WScript.Shell\")\r\nSet s = ws.CreateShortcut(\"{}\")\r\ns.TargetPath = \"{}\"\r\n{}s.Save\r\n",
        lnk, target, icon_line
    );
    // UTF-16 LE avec BOM : WScript supporte tous les caractères Unicode dans les chemins
    let mut bytes: Vec<u8> = vec![0xFF, 0xFE];
    for cu in vbs.encode_utf16() {
        bytes.push(cu as u8);
        bytes.push((cu >> 8) as u8);
    }
    let tmp = std::env::temp_dir().join("Intervys_lnk.vbs");
    fs::write(&tmp, &bytes).ok();
    Command::new("wscript.exe")
        .args([tmp.to_string_lossy().as_ref()])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok();
    fs::remove_file(&tmp).ok();
}

fn create_desktop_shortcuts(base: &Path, icon_path: &str) {
    let desktop = std::env::var("USERPROFILE")
        .map(|p| format!("{}\\Desktop", p))
        .unwrap_or_default();
    if desktop.is_empty() { return; }
    // Raccourci Site (navigateur → vitrine publique)
    create_url_shortcut(&desktop, "Intervys Site", "http://localhost:8090/", icon_path);
    // Raccourci Admin (navigateur → back-office)
    create_url_shortcut(&desktop, "Intervys Admin", "http://localhost:8090/app/#/admin-login", icon_path);
    // Raccourci Contrôleur (lance Intervys.exe)
    let ctrl = base.join("Intervys.exe").to_string_lossy().to_string();
    create_lnk_shortcut(&desktop, "Intervys Controleur", &ctrl, icon_path);
}

// ── DÉPLOIEMENT NATIF ─────────────────────────────────────────────

#[tauri::command]
async fn deploy_native(install_dir: String, app: tauri::AppHandle) -> Result<String, String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;
    let base = Path::new(&install_dir);

    emit_log(&window, "Création des dossiers...");
    emit_progress(&window, "Initialisation", 5);
    // Structure : public/ = publicDir de PocketBase
    //   public/index.html = vitrine (site thématisé = page d'accueil à localhost:8090/)
    //   public/app/       = SPA admin (accessible à localhost:8090/app/#/admin)
    for sub in &["public", "public/app", "pocketbase/pb_data", "pocketbase/pb_migrations", "pocketbase/pb_hooks"] {
        fs::create_dir_all(base.join(sub))
            .map_err(|e| format!("Erreur dossier {} : {}", sub, e))?;
    }

    emit_log(&window, "Copie de la vitrine (page d'accueil)...");
    emit_progress(&window, "Copie vitrine", 10);
    let p_vitrine = get_payload_path("vitrine");
    if p_vitrine.exists() {
        // Copier tous les fichiers vitrine à la racine de public/
        copy_dir_all(&p_vitrine, &base.join("public"))
            .map_err(|e| format!("Erreur copie vitrine : {}", e))?;
        // site.html devient aussi index.html (page d'accueil à localhost:8090/)
        let site_src = base.join("public").join("site.html");
        let idx_dst  = base.join("public").join("index.html");
        if site_src.exists() {
            fs::copy(&site_src, &idx_dst)
                .map_err(|e| format!("Erreur copie index vitrine : {}", e))?;
        }
        emit_log(&window, "✓ Vitrine copiée (racine = site.html)");
    }

    emit_log(&window, "Copie de l'application admin...");
    emit_progress(&window, "Copie admin", 18);
    let p_app = get_payload_path("app");
    emit_log(&window, &format!("Recherche payload app : {:?}", p_app));
    if p_app.exists() {
        copy_dir_all(&p_app, &base.join("public").join("app"))
            .map_err(|e| format!("Erreur copie app : {}", e))?;
        emit_log(&window, "✓ Fichiers admin copiés (public/app/)");
    } else {
        let cwd = std::env::current_dir().unwrap_or_default();
        let cwd_payload = cwd.join("src").join("payload").join("app");
        emit_log(&window, &format!("Fallback CWD : {:?}", cwd_payload));
        if cwd_payload.exists() {
            copy_dir_all(&cwd_payload, &base.join("public").join("app"))
                .map_err(|e| format!("Erreur copie app : {}", e))?;
            emit_log(&window, "✓ Fichiers admin copiés (fallback CWD)");
        } else {
            return Err(format!("Payload introuvable.\nCherché dans : {:?}\nET : {:?}", p_app, cwd_payload));
        }
    }

    let p_mig = get_payload_path("migrations");
    if p_mig.exists() {
        copy_dir_all(&p_mig, &base.join("pocketbase/pb_migrations"))
            .map_err(|e| format!("Erreur migrations : {}", e))?;
    }
    let p_hooks = get_payload_path("hooks");
    if p_hooks.exists() {
        copy_dir_all(&p_hooks, &base.join("pocketbase/pb_hooks"))
            .map_err(|e| format!("Erreur hooks : {}", e))?;
    }
    let p_mailer = get_payload_path("mailer");
    if p_mailer.exists() {
        fs::create_dir_all(base.join("mailer"))
            .map_err(|e| format!("Erreur dossier mailer : {}", e))?;
        copy_dir_all(&p_mailer, &base.join("mailer"))
            .map_err(|e| format!("Erreur copie mailer : {}", e))?;
        emit_log(&window, "✓ Mailer copié");
    }
    emit_log(&window, "✓ Migrations et hooks copiés");

    let pb_dir = base.join("pocketbase");
    let pb_exe = pb_dir.join("pocketbase.exe");
    if !pb_exe.exists() {
        download_pocketbase(&pb_dir, &window).await?;
    } else {
        emit_log(&window, "✓ PocketBase déjà présent");
        emit_progress(&window, "PocketBase OK", 40);
    }

    emit_log(&window, "Génération des scripts...");
    emit_progress(&window, "Scripts", 60);

    let pb_dir_s    = pb_dir.to_string_lossy().to_string();
    // publicDir = public/ (vitrine à la racine, admin dans /app/)
    let pub_dir_s   = base.join("public").to_string_lossy().to_string();
    let data_dir_s  = pb_dir.join("pb_data").to_string_lossy().to_string();
    let mig_dir_s   = pb_dir.join("pb_migrations").to_string_lossy().to_string();
    let hooks_dir_s = pb_dir.join("pb_hooks").to_string_lossy().to_string();

    let mailer_dir_s = base.join("mailer").to_string_lossy().to_string();
    let mailer_exe   = base.join("mailer").join("mailer.exe");
    let mailer_launch = if mailer_exe.exists() {
        // Exécutable autonome (compilé avec pkg)
        format!("start \"Intervys Mailer\" /B \"{mailer}\\mailer.exe\"\r\ntimeout /t 1 /nobreak > nul\r\n",
            mailer = mailer_dir_s)
    } else {
        // Fallback : Node.js si installé
        format!("where node >nul 2>&1 && (start \"Intervys Mailer\" /B cmd /c \"cd /d \\\"{mailer}\\\" && node server.js\") || echo [mailer] Node.js introuvable - envoi sans piece jointe\r\ntimeout /t 1 /nobreak > nul\r\n",
            mailer = mailer_dir_s)
    };

    // VBScript : lance PocketBase sans aucune fenêtre console (0 = hidden)
    let vbs_content = format!(
        "Set sh = CreateObject(\"WScript.Shell\")\r\nsh.Run \"\"\"{}\"\" serve --http=127.0.0.1:8090 --dir=\"\"{}\"\" --migrationsDir=\"\"{}\"\" --hooksDir=\"\"{}\"\" --publicDir=\"\"{}\"\"\", 0, False\r\n",
        pb_exe.to_string_lossy(), data_dir_s, mig_dir_s, hooks_dir_s, pub_dir_s
    );
    fs::write(base.join("start-pb.vbs"), &vbs_content)
        .map_err(|e| format!("Erreur start-pb.vbs : {}", e))?;

    let start_bat = format!(
        "@echo off\r\ntitle Intervys\r\n{mailer}wscript.exe \"%~dp0start-pb.vbs\"\r\ntimeout /t 2 /nobreak > nul\r\nstart http://localhost:8090\r\n",
        mailer = mailer_launch
    );
    fs::write(base.join("start.bat"), &start_bat)
        .map_err(|e| format!("Erreur start.bat : {}", e))?;
    fs::write(base.join("stop.bat"), "@echo off\r\ntaskkill /F /IM pocketbase.exe 2>nul\r\ntaskkill /F /IM mailer.exe 2>nul\r\ntaskkill /F /IM node.exe /FI \"WINDOWTITLE eq Intervys Mailer\" 2>nul\r\necho Intervys arrete.\r\n")
        .map_err(|e| format!("Erreur stop.bat : {}", e))?;

    let password = generate_password();
    let admin_email = "admin@Intervys.local";
    let pb_exe_str = pb_exe.to_string_lossy().to_string();

    // 1. Créer le superuser via CLI AVANT de démarrer le serveur
    //    "upsert" est idempotent : crée ou met à jour si déjà existant
    emit_log(&window, "Création du compte administrateur...");
    emit_progress(&window, "Compte admin", 70);
    let su_out = tokio::task::block_in_place(|| {
        Command::new(&pb_exe_str)
            .args(["superuser", "upsert", admin_email, &password,
                   &format!("--dir={}", data_dir_s)])
            .output()
    });
    match su_out {
        Ok(o) if o.status.success() => emit_log(&window, "✓ Compte administrateur créé"),
        Ok(o) => emit_log(&window, &format!("Note admin : {}", String::from_utf8_lossy(&o.stderr).trim())),
        Err(e) => emit_log(&window, &format!("Note admin : {}", e)),
    }

    // 2. Démarrer PocketBase
    emit_log(&window, "Démarrage de PocketBase...");
    emit_progress(&window, "Démarrage", 85);
    Command::new(&pb_exe_str)
        .args([
            "serve",
            "--http=127.0.0.1:8090",
            &format!("--dir={}", data_dir_s),
            &format!("--migrationsDir={}", mig_dir_s),
            &format!("--hooksDir={}", hooks_dir_s),
            &format!("--publicDir={}", pub_dir_s),
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| format!("Erreur lancement PocketBase : {}", e))?;
    emit_log(&window, "✓ PocketBase démarré");

    // Planificateur de tâches — démarrage automatique via VBS (sans console)
    emit_log(&window, "Enregistrement démarrage automatique...");
    let vbs_path = base.join("start-pb.vbs").to_string_lossy().to_string();
    let task_cmd = format!("wscript.exe \"{}\"", vbs_path);
    let schtask = tokio::task::block_in_place(|| {
        Command::new("schtasks")
            .args(["/create", "/tn", "Intervys", "/tr", &task_cmd,
                   "/sc", "ONLOGON", "/f", "/rl", "HIGHEST"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
    });
    match schtask {
        Ok(o) if o.status.success() => emit_log(&window, "✓ Démarrage automatique configuré"),
        Ok(o) => emit_log(&window, &format!("Note tâche : {}", String::from_utf8_lossy(&o.stderr).trim())),
        Err(e) => emit_log(&window, &format!("Note tâche : {}", e)),
    }

    // Copier l'icône dans le dossier d'install pour les raccourcis
    let icon_dest = base.join("icon.ico");
    let icon_payload = get_payload_path("icon.ico");
    if icon_payload.exists() { fs::copy(&icon_payload, &icon_dest).ok(); }
    let icon_path = icon_dest.to_string_lossy().to_string();

    create_desktop_shortcuts(base, &icon_path);

    // Installer le contrôleur (Intervys.exe)
    let ctrl_payload = get_payload_path("Intervys.exe");
    let ctrl_dest    = base.join("Intervys.exe");
    if ctrl_payload.exists() {
        fs::copy(&ctrl_payload, &ctrl_dest)
            .map_err(|e| format!("Erreur copie contrôleur : {}", e))?;
        emit_log(&window, "✓ Contrôleur Intervys installé");

        // Raccourci bureau vers le contrôleur
        let desktop = std::env::var("USERPROFILE")
            .map(|p| format!("{}\\Desktop", p))
            .unwrap_or_default();
        if !desktop.is_empty() {
            let ctrl_s = ctrl_dest.to_string_lossy().to_string();
            create_lnk_shortcut(&desktop, "Intervys", &ctrl_s, &icon_path);
        }

        // Démarrage automatique au login via registre HKCU Run
        let ctrl_s = ctrl_dest.to_string_lossy().to_string();
        tokio::task::block_in_place(|| {
            Command::new("reg")
                .args(["add",
                       r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                       "/v", "Intervys",
                       "/t", "REG_SZ",
                       "/d", &format!("\"{}\"", ctrl_s),
                       "/f"])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
        }).ok();
        emit_log(&window, "✓ Démarrage automatique au login configuré");

        // Installer le désinstalleur
        let uninst_payload = get_payload_path("uninstall.exe");
        let uninst_dest    = base.join("uninstall.exe");
        if uninst_payload.exists() {
            fs::copy(&uninst_payload, &uninst_dest).ok();
            emit_log(&window, "✓ Désinstalleur copié");
        }

        // Lancer le contrôleur immédiatement
        Command::new(&ctrl_dest)
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .ok();
    } else {
        emit_log(&window, "⚠ Contrôleur introuvable dans le payload (Intervys.exe)");
    }

    emit_progress(&window, "Terminé", 100);
    emit_log(&window, "Intervys installé !");
    Ok(format!("{{\"email\":\"{}\",\"password\":\"{}\"}}", admin_email, password))
}

// ── DÉPLOIEMENT DOCKER ────────────────────────────────────────────

#[tauri::command]
async fn deploy_docker(install_dir: String, app: tauri::AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;
    let base = Path::new(&install_dir);
    emit_log(&window, "Création des dossiers...");
    emit_progress(&window, "Initialisation", 10);
    for sub in &["app", "pocketbase/pb_data", "pocketbase/pb_migrations", "pocketbase/pb_hooks"] {
        fs::create_dir_all(base.join(sub))
            .map_err(|e| format!("Erreur dossier {} : {}", sub, e))?;
    }

    emit_log(&window, "Copie des fichiers...");
    emit_progress(&window, "Copie", 20);
    let p_app = get_payload_path("app");
    if p_app.exists() { copy_dir_all(&p_app, &base.join("app")).map_err(|e| format!("{}", e))?; }
    let p_mig = get_payload_path("migrations");
    if p_mig.exists() { copy_dir_all(&p_mig, &base.join("pocketbase/pb_migrations")).map_err(|e| format!("{}", e))?; }
    let p_hooks = get_payload_path("hooks");
    if p_hooks.exists() { copy_dir_all(&p_hooks, &base.join("pocketbase/pb_hooks")).map_err(|e| format!("{}", e))?; }

    emit_log(&window, "Génération docker-compose.yml...");
    emit_progress(&window, "Configuration Docker", 50);
    let base_s = base.to_string_lossy().replace('\\', "/");
    let compose = format!(
        "name: Intervys\nservices:\n  app:\n    image: nginx:alpine\n    container_name: Intervys_app\n    ports:\n      - \"8080:80\"\n    volumes:\n      - {b}/app:/usr/share/nginx/html:ro\n    restart: unless-stopped\n\n  pocketbase:\n    image: ghcr.io/muchobien/pocketbase:latest\n    container_name: Intervys_pocketbase\n    ports:\n      - \"8090:8090\"\n    volumes:\n      - {b}/pocketbase/pb_data:/pb_data\n      - {b}/pocketbase/pb_migrations:/pb_migrations\n      - {b}/pocketbase/pb_hooks:/pb_hooks\n    restart: unless-stopped\n",
        b = base_s
    );
    fs::write(base.join("docker-compose.yml"), compose)
        .map_err(|e| format!("Erreur docker-compose.yml : {}", e))?;

    emit_log(&window, "Lancement Docker Compose...");
    emit_progress(&window, "Démarrage containers", 75);
    let out = Command::new("docker").args(["compose", "up", "-d"]).current_dir(base).output()
        .map_err(|e| format!("Erreur Docker : {}", e))?;
    if !out.status.success() {
        return Err(format!("Docker Compose échoué : {}", String::from_utf8_lossy(&out.stderr)));
    }

    let icon_dest = base.join("icon.ico");
    let icon_payload = get_payload_path("icon.ico");
    if icon_payload.exists() { fs::copy(&icon_payload, &icon_dest).ok(); }
    create_desktop_shortcuts(base, &icon_dest.to_string_lossy());
    emit_log(&window, "Intervys demarre via Docker !");
    emit_progress(&window, "Terminé", 100);
    Ok(())
}

// ── Gestion serveur (tray) ────────────────────────────────────────

#[tauri::command]
fn start_server() -> Result<(), String> {
    let dir   = get_default_dir();
    let pb    = format!("{}\\pocketbase\\pocketbase.exe", dir);
    let data  = format!("{}\\pocketbase\\pb_data", dir);
    let mig   = format!("{}\\pocketbase\\pb_migrations", dir);
    let hooks = format!("{}\\pocketbase\\pb_hooks", dir);
    let pubd  = format!("{}\\public", dir);
    Command::new(&pb)
        .args(["serve", "--http=127.0.0.1:8090",
               &format!("--dir={}", data),
               &format!("--migrationsDir={}", mig),
               &format!("--hooksDir={}", hooks),
               &format!("--publicDir={}", pubd)])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn stop_server() -> Result<(), String> {
    Command::new("taskkill")
        .args(["/F", "/IM", "pocketbase.exe"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn is_installed() -> bool {
    Path::new(&get_default_dir()).exists()
}

#[tauri::command]
fn uninstall(app: tauri::AppHandle) -> Result<(), String> {
    let dir = get_default_dir();

    macro_rules! log {
        ($pct:expr, $msg:expr) => {{
            #[derive(serde::Serialize, Clone)]
            struct P { msg: String, pct: u32 }
            app.emit("uninst-step", P { msg: $msg.to_string(), pct: $pct }).ok();
            std::thread::sleep(std::time::Duration::from_millis(200));
        }};
    }

    log!(10, "Arrêt du contrôleur Intervys...");
    Command::new("taskkill").args(["/F", "/IM", "Intervys.exe"])
        .creation_flags(CREATE_NO_WINDOW).output().ok();

    log!(22, "Arrêt de PocketBase...");
    Command::new("taskkill").args(["/F", "/IM", "pocketbase.exe"])
        .creation_flags(CREATE_NO_WINDOW).output().ok();

    log!(30, "Arrêt du mailer...");
    Command::new("taskkill").args(["/F", "/IM", "mailer.exe"])
        .creation_flags(CREATE_NO_WINDOW).output().ok();
    std::thread::sleep(std::time::Duration::from_millis(600));

    log!(42, "Suppression de la tâche planifiée...");
    Command::new("schtasks").args(["/delete", "/tn", "Intervys", "/f"])
        .creation_flags(CREATE_NO_WINDOW).output().ok();

    log!(52, "Suppression du démarrage automatique...");
    Command::new("reg")
        .args(["delete", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
               "/v", "Intervys", "/f"])
        .creation_flags(CREATE_NO_WINDOW).output().ok();

    log!(62, "Suppression des raccourcis bureau...");
    if let Ok(profile) = std::env::var("USERPROFILE") {
        for name in &[
            "Intervys.lnk", "Intervys Controleur.lnk",
            "Intervys Site.url", "Intervys Admin.url",
            "Intervys.url", "Intervys Vitrine.url",
        ] {
            fs::remove_file(format!("{}\\Desktop\\{}", profile, name)).ok();
        }
    }

    log!(72, "Suppression du dossier d'installation...");
    if Path::new(&dir).exists() {
        fs::remove_dir_all(&dir).map_err(|e| format!("Erreur suppression dossier : {}", e))?;
    }

    log!(85, "Suppression du cache temporaire...");
    fs::remove_dir_all(std::env::temp_dir().join("IntervysSetup")).ok();

    log!(93, "Nettoyage des anciens fichiers...");
    if let Ok(localappdata) = std::env::var("LOCALAPPDATA") {
        let nsis = format!("{}\\Programs\\Intervys Setup", localappdata);
        if Path::new(&nsis).exists() { fs::remove_dir_all(&nsis).ok(); }
    }

    log!(100, "✓ Désinstallation terminée");
    Ok(())
}

fn is_server_running() -> bool {
    Command::new("tasklist")
        .args(["/FI", "IMAGENAME eq pocketbase.exe", "/NH"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).contains("pocketbase.exe"))
        .unwrap_or(false)
}

// ── Point d'entrée ────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            check_docker, check_wsl, check_mode, get_default_dir,
            run_command, run_detached, create_dir, write_file, open_browser,
            enable_wsl, install_docker,
            deploy_native, deploy_docker,
            start_server, stop_server, uninstall, is_installed,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
