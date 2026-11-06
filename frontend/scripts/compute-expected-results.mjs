// Recompute the Code Exercise answers with the same Python that students use (Pyodide in the browser),
// so the stored expected results match exactly even when scikit-learn versions differ.
//
//   npm run compute:expected            # recompute and save backend/scripts/experiment_content/expected_results.json
//   npm run compute:expected -- --check # only compare and report, do not save
//
// Needs the internet once (Pyodide downloads numpy, pandas and scikit-learn), or run `npm run setup:editor` first
// and the local copy in public/pyodide is used. After saving, run `python -m scripts.load_experiments` to
// put the new answers in the database.
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPyodide } from "pyodide";

const check = process.argv.includes("--check");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const content = join(root, "..", "backend", "scripts", "experiment_content");
const datasets = join(root, "public", "datasets");
const resultsPath = join(content, "expected_results.json");

const exists = (path) => access(path).then(() => true, () => false);

// slug -> solution file, read from the experiment modules
const experiments = [];
for (const name of (await readdir(content)).filter((n) => /^exp\d+_.*\.py$/.test(n)).sort()) {
  const text = await readFile(join(content, name), "utf8");
  const slug = text.match(/^SLUG = ['"]([^'"]+)['"]/m)?.[1];
  const file = text.match(/^SOLUTION_FILE = ['"]([^'"]+)['"]/m)?.[1];
  if (!slug || !file) throw new Error(`Cannot read SLUG and SOLUTION_FILE from ${name}`);
  experiments.push({ slug, file });
}

const local = join(root, "public", "pyodide");
const options = { stdout: () => {}, stderr: () => {} };
if (await exists(join(local, "pyodide-lock.json"))) options.indexURL = local + sep;

console.log("Starting Pyodide…");
const pyodide = await loadPyodide(options);
console.log(`Pyodide ${pyodide.version}. Loading numpy, pandas and scikit-learn…`);
await pyodide.loadPackage(["numpy", "pandas", "scikit-learn"]);

const results = {};
for (const { slug, file } of experiments) {
  const code = await readFile(join(content, "solutions", file), "utf8");
  // Make a dataset file available to the solution, as the code runner does for students.
  const csv = code.match(/read_csv\(["']([^"']+)["']\)/)?.[1];
  if (csv) pyodide.FS.writeFile(csv, await readFile(join(datasets, csv)));

  const namespace = pyodide.globals.get("dict")();
  pyodide.runPython(code, { globals: namespace });
  const value = namespace.get("result");
  results[slug] = value?.toJs ? value.toJs({ dict_converter: Object.fromEntries }) : value;
  namespace.destroy?.();
  console.log(`  ${slug}: done`);
}

const previous = JSON.parse(await readFile(resultsPath, "utf8"));
const changed = Object.keys(results).filter((slug) => JSON.stringify(results[slug]) !== JSON.stringify(previous.results[slug]));
console.log(changed.length ? `\nDifferent from the stored answers: ${changed.join(", ")}` : "\nAll answers match the stored ones.");

if (!check) {
  await writeFile(resultsPath, JSON.stringify({ source: `Pyodide ${pyodide.version} (the browser Python students use)`, results }, null, 1) + "\n");
  console.log("Saved expected_results.json. Now run: python -m scripts.load_experiments");
}
