/**
 * 中文职责说明：桌面 SPA 入口只初始化窗口表面、全局样式和应用根，不承载业务流程。
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "@/entry/root";
import { applyWindowSurfaceStyle } from "@/entry/surface";
import "@/index.css";

applyWindowSurfaceStyle();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
