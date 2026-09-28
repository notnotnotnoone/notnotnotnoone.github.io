import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

// en dash (U+2013) and em dash (U+2014), built from char codes so this file passes its own check
const DASH = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const EXTS = new Set([".ts", ".tsx", ".css", ".md", ".mdx", ".json"]);

export function findDashes(text) {
  const hits = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const col = line.search(DASH);
    if (col !== -1) hits.push({ line: i + 1, col: col + 1 });
  });
  return hits;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXTS.has(extname(path))) yield path;
  }
}

export function scan(dir) {
  const out = [];
  for (const file of walk(dir)) {
    for (const hit of findDashes(readFileSync(file, "utf8"))) out.push({ file, ...hit });
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hits = scan(process.argv[2] ?? "src");
  for (const h of hits) {
    console.error(`${h.file}:${h.line}:${h.col} dash character. Use a comma, colon, period or parentheses.`);
  }
  if (hits.length) {
    console.error(`\n${hits.length} dash(es) found.`);
    process.exit(1);
  }
  console.log("No em or en dashes in src/.");
}
