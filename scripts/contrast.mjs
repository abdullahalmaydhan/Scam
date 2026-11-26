// WCAG contrast of every text-on-background pair the UI uses, in both
// themes, read from the tokens in src/app/globals.css (BUILD_PLAN M7).
//   node scripts/contrast.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const block = (sel) => css.slice(css.indexOf(sel), css.indexOf("}", css.indexOf(sel)));
const vars = (b) => Object.fromEntries([...b.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const dark = vars(block(":root {"));
const light = { ...dark, ...vars(block('[data-theme="light"] {')) };

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const l = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [text token, background token, where]
const pairs = [
  ["paper", "ink", "body text on page"],
  ["paper", "surface", "text on cards, sheets, inputs"],
  ["dust", "ink", "secondary text on page"],
  ["dust", "surface", "secondary text on cards"],
  ["ink", "paper", "primary button label"],
  ["ink", "paper-pressed", "primary button pressed"],
  ["disabled-text", "line", "disabled button label"],
  ["alert", "ink", "احتيال button, errors, high risk"],
  ["alert", "surface", "errors / risk on cards"],
  ["safe", "ink", "حقيقية button, success"],
  ["safe", "surface", "low risk / success on cards"],
  ["warn", "ink", "suspicious risk on page"],
  ["warn", "surface", "suspicious risk on cards"],
  ["ink", "alert", "pressed احتيال / delete confirm"],
  ["ink", "safe", "pressed حقيقية"],
  ["paper", "line", "hover rows"],
  ["slip-text", "slip", "message slip text"],
  ["slip-meta", "slip", "slip meta / link chip"],
  ["stamp", "slip", "stamp on slip"],
  ["stamp-safe", "slip", "stamp-safe on slip"],
  ["stamp-safe", "urlbar", "«آمن» chip"],
  ["stamp", "urlbar", "«غير آمن» chip"],
  ["slip-text", "urlbar", "URL text"],
];

let fails = 0;
for (const [name, theme] of [["dark", dark], ["light", light]]) {
  console.log(`\n${name}`);
  for (const [fg, bg, where] of pairs) {
    const r = ratio(theme[fg], theme[bg]);
    const ok = r >= 4.5;
    if (!ok) fails++;
    console.log(`${ok ? "PASS" : "FAIL"} ${r.toFixed(2).padStart(5)}  ${fg} on ${bg}  (${where})`);
  }
}
console.log(fails ? `\n${fails} pair(s) under 4.5:1` : "\nAll pairs ≥ 4.5:1");
process.exit(fails ? 1 : 0);
