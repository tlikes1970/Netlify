#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import postcss from "postcss";
import safe from "postcss-safe-parser";
import { Parser } from "htmlparser2";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports");
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

// 1) Resolve commit for traceability
let commit = "unknown";
try {
  commit = (await import("node:child_process"))
    .execSync("git rev-parse HEAD", { encoding: "utf8" })
    .trim();
} catch { /* not a git repo — fine */ }

// 2) Define what counts as LAYOUT
const LAYOUT_PROPS = new Set([
  "position","inset","top","right","bottom","left","z-index",
  "display","visibility","opacity",
  "flex","flex-grow","flex-shrink","flex-basis","flex-direction","flex-wrap",
  "justify-content","align-items","align-content","order",
  "grid","grid-template","grid-template-columns","grid-template-rows",
  "grid-auto-rows","grid-auto-columns","grid-area","grid-column","grid-row",
  "place-items","place-content","gap","row-gap","column-gap",
  "width","min-width","max-width","height","min-height","max-height",
  "margin","margin-top","margin-right","margin-bottom","margin-left",
  "padding","padding-top","padding-right","padding-bottom","padding-left",
  "overflow","overflow-x","overflow-y","object-fit","object-position",
  "transform","translate","scale","rotate",
  "white-space","float","clear"
]);

// 3) Helpers
const today = new Date();
const yyyymmdd = today.toISOString().slice(0,10).replace(/-/g,"");
const csvPath = path.join(REPORT_DIR, `css-important-${yyyymmdd}.csv`);
const jsonPath = path.join(REPORT_DIR, `css-important-${yyyymmdd}.json`);
const mdPath  = path.join(REPORT_DIR, `css-important-${yyyymmdd}.md`);

const csvRows = [
  ["commit","file","line","selector","property","value","inline","category"].join(",")
];
const items = [];

function pushRecord({commit,file,line,selector,prop,value,inline}) {
  const category = LAYOUT_PROPS.has(prop.toLowerCase()) ? "LAYOUT" : "COSMETIC";
  const row = [
    commit,
    file.replace(ROOT + path.sep, ""),
    line ?? "",
    (selector || "").replaceAll(",", ";"),
    prop,
    value.replaceAll(",", "⎵"),
    inline ? "yes" : "no",
    category
  ].join(",");
  csvRows.push(row);
  items.push({ commit, file, line, selector, prop, value, inline, category });
}

// 4) Parse CSS files
async function scanCssFile(file) {
  const css = fs.readFileSync(file, "utf8");
  const root = postcss().process(css, { from: file, parser: safe }).root;
  root.walkRules(rule => {
    const selector = rule.selector || "(at-rule)";
    rule.nodes?.forEach(decl => {
      if (decl?.type !== "decl") return;
      if (decl.important) {
        pushRecord({
          commit, file, line: decl.source?.start?.line ?? "",
          selector, prop: decl.prop, value: String(decl.value), inline: false
        });
      }
    });
  });
}

// 5) Extract <style> blocks from HTML and parse
async function scanHtmlFile(file) {
  const html = fs.readFileSync(file, "utf8");
  let styles = [];
  let current = "";
  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === "style") current = "";
    },
    ontext(text) {
      if (current !== "") current += text;
    },
    onclosetag(name) {
      if (name === "style") {
        if (current.trim()) styles.push(current);
        current = "";
      }
    }
  }, { decodeEntities: false });
  parser.write(html);
  parser.end();

  styles.forEach((block, idx) => {
    const root = postcss().process(block, { from: `${file}#style${idx+1}`, parser: safe }).root;
    root.walkRules(rule => {
      const selector = rule.selector || "(at-rule)";
      rule.nodes?.forEach(decl => {
        if (decl?.type !== "decl") return;
        if (decl.important) {
          pushRecord({
            commit, file, line: decl.source?.start?.line ?? "",
            selector, prop: decl.prop, value: String(decl.value), inline: true
          });
        }
      });
    });
  });
}

// 6) Walk and scan
const cssFiles = await fg(["www/**/*.css"], { dot: false });
const htmlFiles = await fg(["www/**/*.html","www/index.html"], { dot: false });

for (const f of cssFiles) await scanCssFile(path.resolve(f));
for (const f of htmlFiles) await scanHtmlFile(path.resolve(f));

// 7) Write reports
fs.writeFileSync(csvPath, csvRows.join("\n"), "utf8");
fs.writeFileSync(jsonPath, JSON.stringify({ commit, generatedOn: new Date().toISOString(), total: items.length, items }, null, 2), "utf8");

// 8) Markdown rollups
const byFile = new Map();
const byProp = new Map();
const counts = { LAYOUT: 0, COSMETIC: 0 };
for (const it of items) {
  byFile.set(it.file, (byFile.get(it.file) ?? 0) + 1);
  byProp.set(it.prop, (byProp.get(it.prop) ?? 0) + 1);
  counts[it.category]++;
}
const top = (map, n=20) => [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n);

const md = [];
md.push(`# !important scan`);
md.push(`- commit: \`${commit}\``);
md.push(`- generated: ${new Date().toISOString()}`);
md.push(`- total: ${items.length}`);
md.push(`- LAYOUT: ${counts.LAYOUT}  |  COSMETIC: ${counts.COSMETIC}`);
md.push(`\n## Top files\n`);
top(byFile, 50).forEach(([f,c]) => md.push(`- ${f.replace(ROOT + path.sep, "")}: ${c}`));
md.push(`\n## Top properties\n`);
top(byProp, 50).forEach(([p,c]) => md.push(`- ${p}: ${c}`));
md.push(`\n## How to use\n- Primary source of truth: \`${path.basename(csvPath)}\` (open in a spreadsheet)\n- JSON for tooling: \`${path.basename(jsonPath)}\`\n- This README: \`${path.basename(mdPath)}\``);

fs.writeFileSync(mdPath, md.join("\n"), "utf8");

// 9) Console summary for humans
console.log(`Scan complete:
- CSV: ${path.relative(ROOT, csvPath)}
- JSON: ${path.relative(ROOT, jsonPath)}
- MD:  ${path.relative(ROOT, mdPath)}
- Total: ${items.length} (${counts.LAYOUT} LAYOUT, ${counts.COSMETIC} COSMETIC)`);
