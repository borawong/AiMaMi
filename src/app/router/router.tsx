import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { createRegistryRouter } from "@/routes/registry/objects";

export function AppRouter() {
  const router = useMemo(() => createRegistryRouter(), []);

  return <RouterProvider router={router} />;
}
