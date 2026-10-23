const fs = require("node:fs");
const assert = require("node:assert/strict");
const bank = JSON.parse(fs.readFileSync("data/club/daily-questions.json", "utf8"));
assert.equal(bank.schemaVersion, 1);
assert.ok(Array.isArray(bank.questions) && bank.questions.length >= 20, "question bank must contain at least 20 questions");
const ids = new Set();
for (const q of bank.questions) {
  assert.ok(q.id && !ids.has(q.id), "question IDs must be unique"); ids.add(q.id);
  assert.ok(["روان‌شناسی","توسعه فردی","مدیریت"].includes(q.topic), "topic must be in the allowed domain");
  assert.ok(q.question && q.explanation, "question and explanation are required");
  assert.equal(q.options.length, 4, q.id + " must have exactly four options");
  assert.ok(q.options.every(x => typeof x === "string" && x.trim()), "options must be non-empty strings");
  assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4, "correctIndex must be 0..3");
}
console.log("PASS: " + bank.questions.length + " unique four-option Persian questions validated.");
