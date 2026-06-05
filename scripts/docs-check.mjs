#!/usr/bin/env node
// Near-free docs-standard enforcement. Run locally (`npm run docs:check`) and in CI.
// Three checks, all cheap:
//   1. env sync   — every process.env.X referenced in code is listed in .env.example
//   2. dead links — relative markdown links in the doc set resolve to real files
//   3. known-broken expiry — no dated entry in CLAUDE.md is older than MAX_AGE_DAYS
// Exit non-zero on any failure. Portable across website repos (no deps).

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const ROOT = process.cwd();
const MAX_AGE_DAYS = 30;
const CODE_DIRS = ["app", "components", "content", "lib", "src"];
const CODE_FILES = ["middleware.ts"];
const DOC_FILES = ["CLAUDE.md", "README.md"]; // plus everything in docs/
const errors = [];

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

// ── 1. env sync ────────────────────────────────────────────────────────────
function checkEnv() {
  const examplePath = join(ROOT, ".env.example");
  if (!existsSync(examplePath)) {
    // No env vars to track is fine; an example file with vars is the contract.
    return;
  }
  const declared = new Set(
    readFileSync(examplePath, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => l.split("=")[0].trim())
      .filter(Boolean)
  );
  const codeFiles = [
    ...CODE_DIRS.flatMap((d) => walk(join(ROOT, d), [".ts", ".tsx", ".js", ".jsx", ".mjs"])),
    ...CODE_FILES.map((f) => join(ROOT, f)).filter(existsSync),
  ];
  const referenced = new Set();
  for (const f of codeFiles) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/process\.env\.([A-Z0-9_]+)/g)) referenced.add(m[1]);
  }
  // Ignore framework/runtime built-ins.
  const IGNORE = new Set(["NODE_ENV", "VERCEL", "VERCEL_ENV", "VERCEL_URL", "NEXT_RUNTIME"]);
  for (const v of referenced) {
    if (IGNORE.has(v) || v.startsWith("NEXT_PUBLIC_")) continue;
    if (!declared.has(v)) {
      errors.push(`env: \`process.env.${v}\` is used in code but missing from .env.example`);
    }
  }
}

// ── 2. dead links ──────────────────────────────────────────────────────────
function checkLinks() {
  const docs = [
    ...DOC_FILES.map((f) => join(ROOT, f)).filter(existsSync),
    ...walk(join(ROOT, "docs"), [".md"]),
  ];
  const linkRe = /\]\(([^)]+)\)/g;
  for (const doc of docs) {
    const src = readFileSync(doc, "utf8");
    for (const m of src.matchAll(linkRe)) {
      let target = m[1].split("#")[0].split(" ")[0].trim();
      if (!target || /^[a-z]+:\/\//i.test(target) || target.startsWith("mailto:")) continue;
      const abs = resolve(dirname(doc), target);
      if (!existsSync(abs)) {
        errors.push(`dead-link: ${doc.replace(ROOT + "/", "")} → ${target}`);
      }
    }
  }
}

// ── 3. known-broken expiry ─────────────────────────────────────────────────
function checkExpiry() {
  const claude = join(ROOT, "CLAUDE.md");
  if (!existsSync(claude)) return;
  const src = readFileSync(claude, "utf8");
  // Grab the "Known-broken" section: from its heading to the next "## ".
  const start = src.search(/^#+\s.*known-broken/im);
  if (start === -1) return;
  const rest = src.slice(start);
  const end = rest.search(/\n#+\s/);
  const section = end === -1 ? rest : rest.slice(0, end);
  const now = Date.now();
  for (const m of section.matchAll(/\[(\d{4})-(\d{2})-(\d{2})\]/g)) {
    const entryDate = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    const ageDays = Math.floor((now - entryDate) / 86_400_000);
    if (ageDays > MAX_AGE_DAYS) {
      errors.push(
        `expiry: known-broken entry [${m[1]}-${m[2]}-${m[3]}] is ${ageDays}d old (max ${MAX_AGE_DAYS}). Re-confirm (bump the date) or delete it.`
      );
    }
  }
}

checkEnv();
checkLinks();
checkExpiry();

if (errors.length) {
  console.error("docs-check FAILED:\n" + errors.map((e) => "  ✗ " + e).join("\n"));
  process.exit(1);
}
console.log("docs-check passed ✓ (env sync, dead links, known-broken expiry)");
