const fs = require("node:fs");
const assert = require("node:assert/strict");

const app = fs.readFileSync("js/nightcast-app.js", "utf8");
const css = fs.readFileSync("css/nightcast-player-finish.css", "utf8");
const html = fs.readFileSync("index.html", "utf8");

const checks = [
  ["player loading feedback is created", app.includes('id = "ncAudioLoadFeedback"')],
  ["progress bar has accessible semantics", app.includes('role="progressbar" aria-label="پیشرفت بارگذاری فایل صوتی"')],
  ["numeric percent is localized to Persian", app.includes('new Intl.NumberFormat("fa-IR"')],
  ["buffered MP3 data determines progress", app.includes("audio.buffered.end(audio.buffered.length - 1) / audio.duration")],
  ["loading and readiness events are observed", /\["loadstart", "progress", "loadedmetadata", "loadeddata", "canplay", "canplaythrough", "waiting", "playing"/.test(app)],
  ["loading progress is styled", css.includes(".nc-audio-load-feedback.is-visible") && css.includes(".nc-audio-load-fill")],
  ["stylesheet cache version is refreshed", html.includes("/css/nightcast-player-finish.css?v=7")]
];
for (const [label, ok] of checks) {
  console.log((ok ? "PASS" : "FAIL") + " | " + label);
}
assert.ok(checks.every(([, ok]) => ok), "MP3 loading progress acceptance checks failed");
