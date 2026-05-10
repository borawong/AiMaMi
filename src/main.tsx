import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "./components/error-boundary";
import App from "./App";
import "./index.css";
import { getTauriWindowLabel } from "@/lib/tauri-runtime";

const WINDOW_LABEL = getTauriWindowLabel();

if (
  WINDOW_LABEL === "hotspot" ||
  WINDOW_LABEL === "voice-overlay" ||
  WINDOW_LABEL === "voice-search-overlay"
) {
  document.documentElement.style.cssText =
    "background:transparent!important;margin:0;padding:0;overflow:hidden;height:100%";
  document.body.style.cssText =
    "background:transparent!important;margin:0;padding:0;overflow:hidden;height:100%";
  const root = document.getElementById("root");
  if (root) {
    root.style.cssText = "background:transparent;height:100%;width:100%";
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
