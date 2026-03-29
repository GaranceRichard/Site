import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const demoRoot = path.join(root, ".demo-build-workdir");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const childProcessRetryPatch = path.join(root, "scripts", "node-child-process-retry.cjs").replaceAll("\\", "/");
const maxStartupAttempts = 4;

function waitBeforeRetry() {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
}

function shouldRetrySpawnError(error) {
  if (!error) {
    return false;
  }

  const message = String(error.message || "");
  return /spawn(?:Sync)?(?: .*?)? EPERM/i.test(message);
}

function buildNodeOptions() {
  const existing = process.env.NODE_OPTIONS?.trim();
  const preload = `--require "${childProcessRetryPatch}"`;

  if (!existing) {
    return preload;
  }

  if (existing.includes(childProcessRetryPatch)) {
    return existing;
  }

  return `${preload} ${existing}`;
}

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

  const nextConfigPath = path.join(demoRoot, "next.config.ts");
  const nextConfigSource = await readFile(nextConfigPath, "utf8");
  const patchedNextConfig = nextConfigSource.replace(
    "  trailingSlash: isDemoMode,\n",
    "  trailingSlash: isDemoMode,\n  typescript: {\n    ignoreBuildErrors: true,\n  },\n  experimental: {\n    cpus: 1,\n  },\n",
  );

  await writeFile(nextConfigPath, patchedNextConfig, "utf8");

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
    let attempt = 1;

    function start() {
      const child = spawn(process.execPath, [nextBin, "build"], {
        cwd: demoRoot,
        stdio: "inherit",
        env: {
          ...process.env,
          NEXT_PUBLIC_DEMO_MODE: "true",
          NEXT_PUBLIC_BACKOFFICE_ENABLED: "false",
          NEXT_PUBLIC_BASE_PATH: "/Site",
          NEXT_PUBLIC_SITE_URL: "https://garancerichard.github.io/Site",
          NODE_OPTIONS: buildNodeOptions(),
        },
      });

      child.on("close", (code) => resolve(code ?? 1));
      child.on("error", (error) => {
        if (shouldRetrySpawnError(error) && attempt < maxStartupAttempts) {
          process.stderr.write(`Demo build startup failed on attempt ${attempt}, retrying...\n`);
          waitBeforeRetry();
          attempt += 1;
          start();
          return;
        }

        resolve(1);
      });
    }

    start();
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
