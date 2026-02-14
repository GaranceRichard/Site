import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import istanbulCoverage from "istanbul-lib-coverage";
import istanbulReport from "istanbul-lib-report";
import istanbulReports from "istanbul-reports";
import { parseAstAsync } from "vite";
import { convert } from "ast-v8-to-istanbul";

const { createCoverageMap } = istanbulCoverage;
const { createContext } = istanbulReport;
const reports = istanbulReports;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const rawDir = path.join(rootDir, "coverage-e2e");
const outDir = path.join(rootDir, "coverage-e2e-report");
const virtualDir = path.join(rootDir, ".e2e-virtual");

function toPosix(input) {
  return input.replace(/\\/g, "/");
}

function isAppSource(filePath) {
  const normalized = toPosix(filePath).toLowerCase();
  return normalized.includes("/src/app/");
}

function decodeInlineSourceMap(code) {
  const base64Re = /sourceMappingURL=data:application\/json[^,]*;base64,([A-Za-z0-9+/=]+)/;
  const match = code.match(base64Re);
  if (!match || !match[1]) return null;

  const json = Buffer.from(match[1], "base64").toString("utf8");
  return JSON.parse(json);
}

function makeSyntheticFileUrl(seed) {
  const hash = crypto.createHash("sha1").update(seed).digest("hex");
  const filePath = path.join(virtualDir, `${hash}.js`);
  return pathToFileURL(filePath).href;
}

async function convertEntry(entry) {
  if (!entry || !entry.source || !Array.isArray(entry.functions) || entry.functions.length === 0) {
    return null;
  }

  let sourceMap = null;
  try {
    sourceMap = decodeInlineSourceMap(entry.source);
  } catch {
    return null;
  }

  if (!sourceMap) return null;

  try {
    return await convert({
      ast: parseAstAsync(entry.source),
      code: entry.source,
      coverage: {
        scriptId: String(entry.scriptId ?? ""),
        url: makeSyntheticFileUrl(`${entry.url ?? ""}:${entry.scriptId ?? ""}`),
        functions: entry.functions,
      },
      wrapperLength: 0,
      sourceMap,
    });
  } catch {
    return null;
  }
}

async function main() {
  if (!fs.existsSync(rawDir)) {
    console.error(`Missing raw coverage directory: ${rawDir}`);
    process.exit(1);
  }

  const rawFiles = fs.readdirSync(rawDir).filter((name) => name.endsWith(".json"));
  if (rawFiles.length === 0) {
    console.error("No raw E2E coverage JSON files found.");
    process.exit(1);
  }

  fs.mkdirSync(virtualDir, { recursive: true });

  const map = createCoverageMap({});

  for (const fileName of rawFiles) {
    const fullPath = path.join(rawDir, fileName);
    const payload = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    if (!Array.isArray(payload)) continue;

    for (const entry of payload) {
      const converted = await convertEntry(entry);
      if (!converted) continue;
      map.merge(converted);
    }
  }

  const filtered = createCoverageMap({});
  for (const filePath of map.files()) {
    if (!isAppSource(filePath)) continue;
    filtered.addFileCoverage(map.fileCoverageFor(filePath));
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const context = createContext({
    dir: outDir,
    coverageMap: filtered,
    defaultSummarizer: "nested",
  });

  reports.create("text-summary").execute(context);
  reports.create("json-summary").execute(context);
  reports.create("html").execute(context);

  const summary = filtered.getCoverageSummary().toJSON();
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));

  console.log("E2E coverage report generated in:", outDir);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
