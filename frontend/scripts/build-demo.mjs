import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const demoRoot = path.join(root, ".demo-build-workdir");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

async function resetDemoRoot() {
  await rm(demoRoot, { recursive: true, force: true });
  await mkdir(demoRoot, { recursive: true });
}

async function copyIntoDemoRoot(relativePath, options) {
  await cp(path.join(root, relativePath), path.join(demoRoot, relativePath), options);
}

async function prepareDemoWorkspace() {
  await resetDemoRoot();

  await Promise.all([
    copyIntoDemoRoot("public", { recursive: true }),
    copyIntoDemoRoot("src", {
      recursive: true,
      filter: (source) => {
        const normalized = source.replaceAll("\\", "/");
        return !normalized.includes("/src/app/api-proxy") && !normalized.includes("/src/app/@modal");
      },
    }),
    copyIntoDemoRoot("next.config.ts", {}),
    copyIntoDemoRoot("package.json", {}),
    copyIntoDemoRoot("tsconfig.json", {}),
    copyIntoDemoRoot("tsconfig.typecheck.json", {}),
    copyIntoDemoRoot("postcss.config.mjs", {}),
    copyIntoDemoRoot("tailwind.config.mjs", {}),
  ]);

  const layoutPath = path.join(demoRoot, "src", "app", "layout.tsx");
  const layoutSource = await readFile(layoutPath, "utf8");
  const patchedLayout = layoutSource
    .replace(/,\s*modal,\s*\}\s*:\s*\{\s*children:\s*React\.ReactNode;\s*modal:\s*React\.ReactNode;\s*\}/m, " }: { children: React.ReactNode }")
    .replace(/\s*\{modal\}\s*\n/, "\n");

  await writeFile(layoutPath, patchedLayout, "utf8");

  const backendMediaRoot = path.join(root, "..", "backend", "media");
  try {
    const mediaStats = await stat(backendMediaRoot);
    if (mediaStats.isDirectory()) {
      await mkdir(path.join(demoRoot, "public", "demo-media"), { recursive: true });
      await cp(backendMediaRoot, path.join(demoRoot, "public", "demo-media"), {
        recursive: true,
      });
    }
  } catch {
    // Demo builds stay functional even when backend media is absent locally.
  }
}

function runDemoBuild() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd: demoRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_PUBLIC_DEMO_MODE: "true",
        NEXT_PUBLIC_BACKOFFICE_ENABLED: "false",
        NEXT_PUBLIC_BASE_PATH: "/Site",
        NEXT_PUBLIC_SITE_URL: "https://garancerichard.github.io/Site",
      },
    });

    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

async function copyOutFolderBack() {
  await rm(path.join(root, "out"), { recursive: true, force: true });
  await cp(path.join(demoRoot, "out"), path.join(root, "out"), { recursive: true });
}

await prepareDemoWorkspace();
const code = await runDemoBuild();

if (code !== 0) {
  await rm(demoRoot, { recursive: true, force: true });
  process.exit(code);
}

await copyOutFolderBack();
await rm(demoRoot, { recursive: true, force: true });
