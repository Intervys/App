#![windows_subsystem = "windows"]

use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::os::windows::process::CommandExt;
use std::process::Command;
use std::fs;
use windows_sys::Win32::UI::WindowsAndMessaging::{
    MessageBoxW, MB_ICONQUESTION, MB_OKCANCEL, MB_ICONINFORMATION, MB_OK, IDOK,
};

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn to_wide(s: &str) -> Vec<u16> {
    OsStr::new(s).encode_wide().chain(std::iter::once(0)).collect()
}

fn msgbox(text: &str, title: &str, flags: u32) -> i32 {
    let t = to_wide(text);
    let c = to_wide(title);
    unsafe { MessageBoxW(std::ptr::null_mut(), t.as_ptr(), c.as_ptr(), flags) }
}

fn kill(name: &str) {
    Command::new("taskkill")
        .args(["/F", "/IM", name])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok();
}

fn main() {
    let result = msgbox(
        "Voulez-vous désinstaller Intervys ?\n\nLe serveur sera arrêté et tous les fichiers supprimés.",
        "Désinstaller Intervys",
        MB_OKCANCEL | MB_ICONQUESTION,
    );

    if result != IDOK { return; }

    kill("pocketbase.exe");
    kill("intervys.exe");

    Command::new("schtasks")
        .args(["/delete", "/tn", "Intervys", "/f"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok();

    Command::new("reg")
        .args(["delete",
               r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
               "/v", "Intervys", "/f"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok();

    if let Ok(profile) = std::env::var("USERPROFILE") {
        for name in &["Intervys.lnk", "Intervys Vitrine.url", "Intervys Admin.url"] {
            fs::remove_file(format!("{}\\Desktop\\{}", profile, name)).ok();
        }
    }

    let install_dir = std::env::var("LOCALAPPDATA")
        .map(|h| format!("{}\\Intervys", h))
        .unwrap_or_default();

    if !install_dir.is_empty() {
        if let Ok(entries) = fs::read_dir(&install_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.file_name().and_then(|n| n.to_str()) == Some("uninstall.exe") {
                    continue;
                }
                if path.is_dir() { fs::remove_dir_all(&path).ok(); }
                else { fs::remove_file(&path).ok(); }
            }
        }

        let uninstall_exe = format!("{}\\uninstall.exe", install_dir);
        let cleanup = format!(
            "ping 127.0.0.1 -n 3 > nul && del /F /Q \"{}\" && rmdir /Q \"{}\"",
            uninstall_exe, install_dir
        );
        Command::new("cmd")
            .args(["/c", &cleanup])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .ok();
    }

    msgbox("Intervys a été désinstallé.", "Intervys", MB_OK | MB_ICONINFORMATION);
}
