mod adapters;
mod application;
mod commands;
mod contracts;
mod core;
mod platform;
mod repository;

pub fn run() {
    adapters::tauri::run();
}

pub fn run_daemon_once_cli() -> Result<(), String> {
    application::service::BackendServices::default()
        .daemon()
        .run_once_cli()
        .map(|_| ())
        .map_err(|error| error.public_message().to_owned())
}
