/**
 * 中文职责说明：应用 Router 只创建稳定 Router 实例并挂载 RouterProvider，不承载 route state 或模块副作用。
 */
import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { desktopRoutes } from "@/spa/router/desktop-router.config";
import { createAppRouter } from "@/utils/router";

export function AppRouter() {
  const router = useMemo(() => createAppRouter(desktopRoutes), []);

  return <RouterProvider router={router} />;
}
