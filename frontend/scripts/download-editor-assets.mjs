// One-time setup: copy the code editor files into the app so students do not need the internet.
//
//   npm run setup:editor
//
// * Pyodide (Python in the browser) and the Python packages the experiments use are downloaded from the public
//   Pyodide CDN into public/pyodide/. Add package names to PACKAGES below if an experiment needs more.
// * The Monaco editor files are copied from node_modules (the monaco-editor package) into public/monaco/vs/.
//
// Both folders are ignored by Git. Run this on the machine that builds the frontend (and once on your own computer),
// then build with VITE_SELF_HOST_EDITOR=true so the editor uses its own copy.
import { cp, mkdir, rm, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "0.26.2";
const CDN = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
const PACKAGES = ["numpy", "pandas", "scikit-learn"]; // their dependencies (scipy, joblib, ...) are added automatically
const CORE_FILES = ["pyodide.js", "pyodide.mjs", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip"];

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pyodideDir = join(root, "public", "pyodide");
const monacoDir = join(root, "public", "monaco", "vs");

async function download(name, target = join(pyodideDir, name)) {
  const response = await fetch(CDN + name);
  if (!response.ok) throw new Error(`Could not download ${name} (HTTP ${response.status})`);
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  console.log("  downloaded", name);
}

async function setupPyodide() {
  console.log(`Pyodide ${VERSION} -> public/pyodide`);
  await rm(pyodideDir, { recursive: true, force: true });
  await mkdir(pyodideDir, { recursive: true });

  for (const file of CORE_FILES) await download(file);

  const lock = await (await fetch(CDN + "pyodide-lock.json")).json();
  const wanted = new Set();
  const visit = (name) => {
    const key = name.toLowerCase();
    if (wanted.has(key)) return;
    const pkg = lock.packages[key];
    if (!pkg) throw new Error(`Unknown Pyodide package: ${name}`);
    wanted.add(key);
    (pkg.depends || []).forEach(visit);
  };
  PACKAGES.forEach(visit);

  const packages = {};
  for (const key of wanted) {
    packages[key] = lock.packages[key];
    await download(lock.packages[key].file_name);
  }
  // A lock file that lists only what was downloaded: other packages fail with a clear message.
  await writeFile(join(pyodideDir, "pyodide-lock.json"), JSON.stringify({ ...lock, packages }));
  console.log(`  ${wanted.size} packages: ${[...wanted].join(", ")}`);
}

async function setupMonaco() {
  console.log("Monaco editor -> public/monaco/vs");
  const source = join(root, "node_modules", "monaco-editor", "min", "vs");
  try {
    await access(source);
  } catch {
    throw new Error("monaco-editor is not installed. Run `npm install` first.");
  }
  await rm(monacoDir, { recursive: true, force: true });
  await mkdir(dirname(monacoDir), { recursive: true });
  await cp(source, monacoDir, { recursive: true });
}

await setupPyodide();
await setupMonaco();
console.log("Done. Build with VITE_SELF_HOST_EDITOR=true to use these files.");
