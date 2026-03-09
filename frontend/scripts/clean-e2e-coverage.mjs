import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

for (const dirName of ["coverage-e2e", "coverage-e2e-report", ".e2e-virtual"]) {
  fs.rmSync(path.join(rootDir, dirName), { recursive: true, force: true });
}

console.log("E2E coverage workspace cleaned.");
