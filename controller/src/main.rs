#![windows_subsystem = "windows"]

use std::os::windows::process::CommandExt;
use std::process::Command;
use std::path::Path;
use std::thread;
use std::time::Duration;
use tray_icon::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    TrayIconBuilder,
};

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn install_dir() -> String {
    std::env::var("LOCALAPPDATA")
        .map(|h| format!("{}\\Intervys", h))
        .unwrap_or_else(|_| "C:\\Users\\Public\\Intervys".to_string())
}

fn is_running() -> bool {
    Command::new("tasklist")
        .args(["/FI", "IMAGENAME eq pocketbase.exe", "/NH"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).contains("pocketbase.exe"))
        .unwrap_or(false)
}

fn start_pb() {
    let d = install_dir();
    let pb = format!("{}\\pocketbase\\pocketbase.exe", d);
    if !Path::new(&pb).exists() { return; }
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
        .ok();
}

fn stop_pb() {
    Command::new("taskkill")
        .args(["/F", "/IM", "pocketbase.exe"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok();
}

fn open_url(url: &str) {
    Command::new("cmd")
        .args(["/c", "start", url])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .ok();
}

fn load_icon() -> tray_icon::Icon {
    let icon_path = format!("{}\\icon.ico", install_dir());
    tray_icon::Icon::from_path(&icon_path, Some((32, 32))).unwrap_or_else(|_| {
        let rgba: Vec<u8> = (0..32 * 32)
            .flat_map(|_| [79u8, 70, 229, 255])
            .collect();
        tray_icon::Icon::from_rgba(rgba, 32, 32).unwrap()
    })
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
        start_pb();
    }

    let open_i    = MenuItem::new("🌐 Ouvrir Intervys",      true, None);
    let sep1      = PredefinedMenuItem::separator();
    let start_i   = MenuItem::new("▶  Démarrer le serveur",  true, None);
    let stop_i    = MenuItem::new("■  Arrêter le serveur",   true, None);
    let restart_i = MenuItem::new("↺  Redémarrer",           true, None);
    let sep2      = PredefinedMenuItem::separator();
    let quit_i    = MenuItem::new("✕  Quitter",              true, None);

    let open_id    = open_i.id().clone();
    let start_id   = start_i.id().clone();
    let stop_id    = stop_i.id().clone();
    let restart_id = restart_i.id().clone();
    let quit_id    = quit_i.id().clone();

    let menu = Menu::with_items(&[
        &open_i, &sep1, &start_i, &stop_i, &restart_i, &sep2, &quit_i,
    ])
    .expect("menu");

    let _tray = TrayIconBuilder::new()
        .with_icon(load_icon())
        .with_menu(Box::new(menu))
        .with_tooltip("Intervys")
        .build()
        .expect("tray");

    loop {
        while let Ok(ev) = MenuEvent::receiver().try_recv() {
            if ev.id == open_id {
                open_url("http://localhost:8090/app/");
            } else if ev.id == start_id {
                start_pb();
            } else if ev.id == stop_id {
                stop_pb();
            } else if ev.id == restart_id {
                stop_pb();
                thread::sleep(Duration::from_secs(1));
                start_pb();
            } else if ev.id == quit_id {
                std::process::exit(0);
            }
        }
        thread::sleep(Duration::from_millis(50));
    }
}
