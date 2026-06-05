#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().nth(1).as_deref() == Some("daemon-run-once") {
        if let Err(error) = aimami_lib::run_daemon_once_cli() {
            eprintln!("{error}");
            std::process::exit(1);
        }
        return;
    }

    aimami_lib::run()
}
