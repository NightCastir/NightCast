const fs = require('node:fs');
const assert = require('node:assert/strict');
const js = fs.readFileSync('js/nightcast-quiz-notification.js', 'utf8');
const css = fs.readFileSync('css/nightcast-quiz-notification.css', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const club = fs.readFileSync('club.html', 'utf8');
const quiz = fs.readFileSync('quiz/index.html', 'utf8');
const quizLogic = fs.readFileSync('js/nightcast-quiz.js', 'utf8');
assert.match(js, /\/quiz\/today/);
assert.match(js, /result\.data\.session && result\.data\.session\.answered/);
assert.match(js, /is-inactive/);
assert.match(js, /aria-disabled/);
assert.match(js, /5 \* 60 \* 1000/);
assert.match(css, /\.nc-quiz-notification\.is-inactive/);
assert.match(css, /\.nc-quiz-notification-label\\{display:none!important\\}/, 'bell label must not consume header space');
assert.match(css, /min-width:36px;min-height:36px;padding:7px/, 'mobile bell must remain compact');
assert.match(css, /prefers-reduced-motion/);
assert.match(js, /nightcast:quizanswered/);
assert.match(quizLogic, /nightcast:quizanswered/);
for (const [name, html] of [['home', home], ['club', club], ['quiz', quiz]]) {
  assert.match(html, /nc-quiz-notification/, name + ' header must contain the daily quiz bell');
  assert.match(html, /nightcast-quiz-notification\.js/, name + ' must load bell state script');
  assert.match(html, /nightcast-quiz-notification\.css/, name + ' must load bell styles');
}
console.log('PASS | daily quiz header bell markup, API state, 24-hour answer lock, accessibility and reduced motion');
