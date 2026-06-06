/**
 * 中文职责说明：应用 Router 只消费 route registry 创建稳定 Router 实例，不承载 route state 或模块副作用。
 */
import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { createRegistryRouter } from "@/routes/registry/objects";

export function AppRouter() {
  const router = useMemo(() => createRegistryRouter(), []);

  return <RouterProvider router={router} />;
}
