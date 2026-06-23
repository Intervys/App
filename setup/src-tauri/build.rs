use std::io::Write;

fn main() {
    tauri_build::build();

    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let payload_dir = std::path::Path::new(&manifest_dir)
        .parent()
        .unwrap()
        .join("src")
        .join("payload");

    let out_dir = std::env::var("OUT_DIR").unwrap();
    let zip_path = std::path::Path::new(&out_dir).join("payload.zip");

    let file = std::fs::File::create(&zip_path).expect("cannot create payload.zip");
    let mut zip = zip::ZipWriter::new(file);
    let opts = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    zip_dir(&mut zip, &payload_dir, &payload_dir, opts);
    zip.finish().expect("cannot finish payload.zip");

    println!("cargo:rerun-if-changed=../src/payload");
}

fn zip_dir(
    zip: &mut zip::ZipWriter<std::fs::File>,
    dir: &std::path::Path,
    base: &std::path::Path,
    opts: zip::write::SimpleFileOptions,
) {
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let rel = match path.strip_prefix(base) {
            Ok(r) => r.to_string_lossy().replace("\\", "/"),
            Err(_) => continue,
        };
        if path.is_dir() {
            zip.add_directory(&rel, opts).ok();
            zip_dir(zip, &path, base, opts);
        } else if let Ok(data) = std::fs::read(&path) {
            if zip.start_file(&rel, opts).is_ok() {
                let _ = zip.write_all(&data);
            }
        }
    }
}
