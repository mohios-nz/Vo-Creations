#!/usr/bin/env node
// website-build-rules v1 docs gate — no dependencies. Exits non-zero on any failure.
//   1. env sync      — every process.env.X in code is declared in .env.example
//   2. dead links    — relative markdown links in CLAUDE.md/README.md/docs/*.md resolve
//   3. version skew  — CLAUDE.md embeds the current standing-rules version
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

// Synced down from website-build-rules.md. Bump here when the standard bumps.
const STANDARD_VERSION = "v1";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const failures = [];
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".vercel", "public"]);
function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.has(extname(name))) out.push(p);
  }
  return out;
}

// 1. env sync
const ENV_IGNORE = (n) => n === "NODE_ENV" || n.startsWith("VERCEL") || n.startsWith("NEXT_PUBLIC_");
const usedVars = new Set();
for (const f of walk(ROOT, new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]))) {
  if (f === SELF) continue;
  for (const m of readFileSync(f, "utf8").matchAll(/process\.env\.([A-Z0-9_]+)/g)) usedVars.add(m[1]);
}
const envExamplePath = join(ROOT, ".env.example");
const declaredVars = new Set();
if (!existsSync(envExamplePath)) fail("env", ".env.example is missing");
else for (const line of readFileSync(envExamplePath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
  if (m) declaredVars.add(m[1]);
}
for (const v of [...usedVars].sort()) {
  if (ENV_IGNORE(v)) continue;
  if (!declaredVars.has(v)) fail("env", `process.env.${v} is used in code but not in .env.example`);
}

// 2. dead links
const mdFiles = [
  join(ROOT, "CLAUDE.md"),
  join(ROOT, "README.md"),
  ...(existsSync(join(ROOT, "docs"))
    ? readdirSync(join(ROOT, "docs")).filter((f) => f.endsWith(".md")).map((f) => join(ROOT, "docs", f))
    : []),
].filter(existsSync);
const LINK_RE = /\[(?:[^\]]*)\]\(([^)]+)\)/g;
for (const f of mdFiles) {
  for (const m of readFileSync(f, "utf8").matchAll(LINK_RE)) {
    let target = m[1].trim();
    if (/^(https?:|mailto:|tel:|#)/.test(target)) continue;
    target = target.split("#")[0].split("?")[0];
    if (!target) continue;
    let decoded;
    try { decoded = decodeURIComponent(target); } catch { decoded = target; }
    if (!existsSync(resolve(dirname(f), decoded)))
      fail("links", `${f.replace(ROOT + "/", "")} → ${m[1]} does not resolve`);
  }
}

// 3. version skew (source lives outside the repo, so assert the embedded marker)
const claudePath = join(ROOT, "CLAUDE.md");
if (!existsSync(claudePath)) fail("version", "CLAUDE.md is missing");
else {
  const m = readFileSync(claudePath, "utf8").match(/website-build-rules\s+(v\d+)/);
  if (!m) fail("version", `CLAUDE.md has no "website-build-rules vN" marker (expected ${STANDARD_VERSION})`);
  else if (m[1] !== STANDARD_VERSION)
    fail("version", `CLAUDE.md embeds ${m[1]} but the synced standard is ${STANDARD_VERSION} — re-sync the standing-rules block`);
}

if (failures.length) {
  console.error(`docs:check FAILED (${failures.length})`);
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log(`docs:check passed — env sync, dead links, version skew (${STANDARD_VERSION}) all OK`);
