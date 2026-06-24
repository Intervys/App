#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::os::windows::process::CommandExt;
use std::process::Command;
use std::path::Path;
use tauri::{Manager, Emitter};
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn install_dir() -> String {
    std::env::var("LOCALAPPDATA")
        .map(|h| format!("{}\\Intervys", h))
        .unwrap_or_default()
}

fn is_running() -> bool {
    Command::new("tasklist")
        .args(["/FI", "IMAGENAME eq pocketbase.exe", "/NH"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).contains("pocketbase.exe"))
        .unwrap_or(false)
}

#[tauri::command]
fn start_server() -> Result<(), String> {
    let d = install_dir();
    let pb = format!("{}\\pocketbase\\pocketbase.exe", d);
    if !Path::new(&pb).exists() { return Err("PocketBase introuvable".into()); }
    Command::new(&pb)
        .args([
            "serve", "--http=127.0.0.1:8090",
            &format!("--dir={}\\pocketbase\\pb_data", d),
            &format!("--migrationsDir={}\\pocketbase\\pb_migrations", d),
            &format!("--hooksDir={}\\pocketbase\\pb_hooks", d),
            &format!("--publicDir={}\\public", d),
        ])
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
fn server_status() -> bool {
    is_running()
}

#[tauri::command]
fn open_url(url: String) {
    Command::new("explorer")
        .arg(&url)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn().ok();
}

#[tauri::command]
fn reset_password(email: String, password: String) -> Result<(), String> {
    let d = install_dir();
    let pb = format!("{}\\pocketbase\\pocketbase.exe", d);
    let data = format!("{}\\pocketbase\\pb_data", d);

    Command::new("taskkill")
        .args(["/F", "/IM", "pocketbase.exe"])
        .creation_flags(CREATE_NO_WINDOW)
        .output().ok();
    std::thread::sleep(std::time::Duration::from_millis(800));

    let out = Command::new(&pb)
        .args(["superuser", "upsert", &email, &password,
               &format!("--dir={}", data)])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        let out2 = Command::new(&pb)
            .args(["admin", "update", &email, &password,
                   &format!("--dir={}", data)])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| e.to_string())?;
        if !out2.status.success() {
            start_server().ok();
            return Err(String::from_utf8_lossy(&out2.stderr).trim().to_string());
        }
    }

    start_server()
}

#[tauri::command]
fn uninstall_app() -> Result<(), String> {
    let dir = install_dir();

    Command::new("taskkill").args(["/F", "/IM", "pocketbase.exe"])
        .creation_flags(CREATE_NO_WINDOW).output().ok();

    Command::new("schtasks").args(["/delete", "/tn", "Intervys", "/f"])
        .creation_flags(CREATE_NO_WINDOW).output().ok();

    Command::new("reg")
        .args(["delete", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
               "/v", "Intervys", "/f"])
        .creation_flags(CREATE_NO_WINDOW).output().ok();

    if let Ok(profile) = std::env::var("USERPROFILE") {
        for name in &[
            "Intervys.lnk", "Intervys Controleur.lnk",
            "Intervys Site.url", "Intervys Admin.url",
        ] {
            std::fs::remove_file(format!("{}\\Desktop\\{}", profile, name)).ok();
        }
    }

    let dir_clone = dir.clone();
    Command::new("cmd")
        .args(["/c",
               &format!("ping 127.0.0.1 -n 3 > nul && rmdir /s /q \"{}\"", dir_clone)])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn().ok();

    std::process::exit(0);
}

static LOCK: std::sync::OnceLock<std::net::TcpListener> = std::sync::OnceLock::new();

fn already_running() -> bool {
    match std::net::TcpListener::bind("127.0.0.1:27182") {
        Ok(l)  => { LOCK.set(l).ok(); false }
        Err(_) => true,
    }
}

fn main() {
    if already_running() { return; }

    let pb_bin = format!("{}\\pocketbase\\pocketbase.exe", install_dir());
    if Path::new(&pb_bin).exists() && !is_running() {
        start_server().ok();
    }

    tauri::Builder::default()
        .setup(|app| {
            let open_i = MenuItemBuilder::with_id("open", "🌐 Ouvrir Intervys").build(app)?;
            let sep1   = PredefinedMenuItem::separator(app)?;
            let show_i = MenuItemBuilder::with_id("show", "⚙  Contrôleur").build(app)?;
            let sep2   = PredefinedMenuItem::separator(app)?;
            let quit_i = MenuItemBuilder::with_id("quit", "✕  Quitter").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&open_i, &sep1, &show_i, &sep2, &quit_i])
                .build()?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Intervys")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => { Command::new("explorer")
                        .arg("http://localhost:8090/app/")
                        .creation_flags(CREATE_NO_WINDOW).spawn().ok(); }
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            w.show().ok(); w.set_focus().ok();
                        }
                    }
                    "quit" => std::process::exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up, ..
                    } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                w.hide().ok();
                            } else {
                                w.show().ok(); w.set_focus().ok();
                            }
                        }
                    }
                })
                .build(app)?;

            let app_h = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(500));
                if let Some(w) = app_h.get_webview_window("main") {
                    w.emit("status", is_running()).ok();
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().ok();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            start_server, stop_server, server_status, open_url, reset_password, uninstall_app
        ])
        .run(tauri::generate_context!())
        .expect("error");
}
