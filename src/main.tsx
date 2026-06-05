import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "@/entry/root";
import { applyWindowSurfaceStyle } from "@/entry/window-surface";
import "./index.css";

applyWindowSurfaceStyle();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
