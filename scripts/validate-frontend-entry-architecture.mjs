import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();

const requiredFiles = [
  "src/entry/root.tsx",
  "src/app/providers/app-providers.tsx",
  "src/app/router/app-router.tsx",
  "src/app/router/app-shell.tsx",
  "src/app/runtime/runtime-initializer.tsx",
  "src/app/runtime/runtime-events.ts",
  "src/routes/registry/route-registry.tsx",
  "src/routes/registry/route-objects.tsx",
  "src/routes/registry/route-meta.ts",
  "src/routes/registry/route-preload.ts",
  "src/routes/registry/route-skeletons.tsx",
  "src/routes/registry/high-io-feedback.tsx",
  "src/types/navigation.ts",
];

const failures = [];

function readRequiredFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`缺少文件：${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function expectIncludes(relativePath, content, snippets) {
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      failures.push(`${relativePath} 缺少结构片段：${snippet}`);
    }
  }
}

function expectNotIncludes(relativePath, content, snippets) {
  for (const snippet of snippets) {
    if (content.includes(snippet)) {
      failures.push(`${relativePath} 出现禁止结构片段：${snippet}`);
    }
  }
}

function expectPattern(relativePath, content, pattern, description) {
  if (!pattern.test(content)) {
    failures.push(`${relativePath} 未满足：${description}`);
  }
}

function listTextFiles(root) {
  const ignoredDirectories = new Set([
    ".git",
    "node_modules",
    "dist",
    "target",
    ".next",
    ".turbo",
  ]);
  const result = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      const relativePath = path.relative(repoRoot, absolutePath).replaceAll(path.sep, "/");

      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          stack.push(absolutePath);
        }
        continue;
      }

      if (
        /\.(cjs|css|html|js|json|jsx|md|mjs|ts|tsx|txt|yml|yaml)$/i.test(entry.name)
      ) {
        result.push(relativePath);
      }
    }
  }

  return result;
}

// 外部参考名通过字符码构造，避免验证脚本自身写入名称。
const forbiddenReferenceNames = [
  [108, 111, 98, 101, 104, 117, 98],
  [76, 111, 98, 101, 72, 117, 98],
  [108, 111, 98, 101, 104, 117, 98, 47, 108, 111, 98, 101, 104, 117, 98],
].map((codes) => String.fromCharCode(...codes));

function validateNoForbiddenReferenceNames() {
  for (const relativePath of listTextFiles(repoRoot)) {
    const content = readRequiredFile(relativePath);
    const lowerContent = content.toLowerCase();

    for (const forbiddenName of forbiddenReferenceNames) {
      if (lowerContent.includes(forbiddenName.toLowerCase())) {
        failures.push(`${relativePath} 出现外部参考项目名称`);
      }
    }
  }
}

for (const relativePath of requiredFiles) {
  readRequiredFile(relativePath);
}

const root = readRequiredFile("src/entry/root.tsx");
expectIncludes("src/entry/root.tsx", root, [
  "import { AppProviders }",
  "import { RuntimeInitializer }",
  "import { AppRouter }",
  "import { ErrorBoundary }",
  "<AppProviders>",
  "<ErrorBoundary",
  "<RuntimeInitializer />",
  "<AppRouter />",
]);
expectNotIncludes("src/entry/root.tsx", root, [
  "@/features/",
  "@/services/",
  "@/routes/desktop/",
]);

const appProviders = readRequiredFile("src/app/providers/app-providers.tsx");
expectIncludes("src/app/providers/app-providers.tsx", appProviders, [
  "<I18nProvider>",
  "<AppQueryClientProvider>",
  "<TooltipProvider",
  "<PromptHost>",
  "<RouteSettingsProvider>",
]);
expectNotIncludes("src/app/providers/app-providers.tsx", appProviders, [
  "@/features/",
  "@/services/",
  "@/routes/desktop/",
]);

const queryProvider = readRequiredFile("src/app/providers/query-client-provider.tsx");
expectIncludes("src/app/providers/query-client-provider.tsx", queryProvider, [
  "const queryClient = createAppQueryClient();",
  "<QueryClientProvider client={queryClient}>",
]);

const appRouter = readRequiredFile("src/app/router/app-router.tsx");
expectIncludes("src/app/router/app-router.tsx", appRouter, [
  "import { createRegistryRouter } from \"@/routes/registry/route-objects\";",
  "useMemo(() => createRegistryRouter(), [])",
  "<RouterProvider router={router} />",
]);
expectNotIncludes("src/app/router/app-router.tsx", appRouter, [
  "@/spa/",
  "@/utils/router",
  "desktopRoutes",
]);

const appShell = readRequiredFile("src/app/router/app-shell.tsx");
expectIncludes("src/app/router/app-shell.tsx", appShell, [
  "getRouteMeta(activeRoute)",
  "getVisibleRouteMeta()",
  "preloadVisibleRoutes()",
  "resolveRouteFromPath(location.pathname)",
  "resolveRoutePath(nextRoute)",
  "<SiteHeader routeMeta={activeRouteMeta} />",
  "routeItems={visibleRouteMeta}",
]);
expectNotIncludes("src/app/router/app-shell.tsx", appShell, [
  "titleKey:",
  "visible:",
  "preload:",
  "skeleton:",
]);

const routeRegistry = readRequiredFile("src/routes/registry/route-registry.tsx");
expectIncludes("src/routes/registry/route-registry.tsx", routeRegistry, [
  "export interface RouteDefinition",
  "route: Route;",
  "path: `/${string}`;",
  "titleKey: string;",
  "icon: LucideIcon;",
  "visible: boolean;",
  "layout: ComponentType<RouteLayoutProps>;",
  "ErrorBoundary: ComponentType<RouteErrorBoundaryProps>;",
  "redirect: Route | null;",
  "fillHeight: boolean;",
  "highIo: boolean;",
  "preload: () => Promise<unknown>;",
  "skeleton: ReactNode;",
  "HighIoFeedback: ComponentType<{ route: Route }>",
  "export const routeDefinitions",
]);

const routeObjects = readRequiredFile("src/routes/registry/route-objects.tsx");
expectIncludes("src/routes/registry/route-objects.tsx", routeObjects, [
  "export const registryRouteObjects",
  "export function createRegistryRouter()",
  "createHashRouter(registryRouteObjects)",
  "routeDefinitions.map",
  "handle: {",
  "meta: getRouteMeta(definition.route)",
  "<Suspense fallback={definition.skeleton}>",
  "<PageStage state=\"active\" fillHeight={definition.fillHeight}>",
]);
expectNotIncludes("src/routes/registry/route-objects.tsx", routeObjects, [
  "@/spa/",
  "@/utils/router",
]);

const routeMeta = readRequiredFile("src/routes/registry/route-meta.ts");
expectIncludes("src/routes/registry/route-meta.ts", routeMeta, [
  "export interface RouteMeta",
  "getRouteMeta(route: Route)",
  "getVisibleRouteMeta()",
  "routeDefinitions.filter((definition) => definition.visible).map(toRouteMeta)",
]);

const routePreload = readRequiredFile("src/routes/registry/route-preload.ts");
expectIncludes("src/routes/registry/route-preload.ts", routePreload, [
  "resolveRouteDefinition(route).preload()",
  "preloadVisibleRoutes()",
]);

const runtimeInitializer = readRequiredFile("src/app/runtime/runtime-initializer.tsx");
expectIncludes("src/app/runtime/runtime-initializer.tsx", runtimeInitializer, [
  "subscribeRuntimeEvent",
  "applyRuntimeEventToQueryCache(queryClient, event)",
  "return null;",
]);
expectNotIncludes("src/app/runtime/runtime-initializer.tsx", runtimeInitializer, [
  "AlertDialog",
  "toast",
  "Toaster",
]);

const runtimeEvents = readRequiredFile("src/app/runtime/runtime-events.ts");
expectIncludes("src/app/runtime/runtime-events.ts", runtimeEvents, [
  "RUNTIME_QUERY_KEYS_BY_MODULE",
  "getRuntimeEventQueryTargets",
  "acceptRuntimeEventSequence",
  "invalidateRuntimeTargets",
]);

const navigationTypes = readRequiredFile("src/types/navigation.ts");
expectPattern(
  "src/types/navigation.ts",
  navigationTypes,
  /export type Route =[\s\S]+export const ALL_APP_ROUTES: Route\[\] =/,
  "Route union 与 ALL_APP_ROUTES 同文件维护",
);

validateNoForbiddenReferenceNames();

if (failures.length > 0) {
  console.error("前端入口架构验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("前端入口架构验证通过：entry/root、Provider、Router 和 route registry 边界满足要求。");
