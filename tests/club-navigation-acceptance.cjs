const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),quiz=fs.readFileSync('quiz/index.html','utf8'),club=fs.readFileSync('club.html','utf8');
assert.match(html,/href="\/club"/);assert.match(html,/href="\/quiz"/);assert.match(html,/باشگاه شنوندگان/);assert.match(html,/سؤال روز/);
assert.match(quiz,/id="ncQuizForm"/);assert.match(club,/ncLeaderboard/);assert.match(club,/ncEnableNotifications/);
console.log('PASS | club and daily quiz are discoverable and community controls are present');