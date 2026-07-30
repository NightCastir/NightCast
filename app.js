/*==================================================
NightCast Premium App
Version : 1.0
Author : ChatGPT
==================================================*/

"use strict";

/*==================================================
CONFIG
==================================================*/

const CONFIG = {

API:
"https://nightcast-api.tomasgermany2580.workers.dev/api",

CACHE_TIME:
1000 * 60 * 5,

THEME_KEY:
"nightcast_theme",

TOKEN_KEY:
"nightcast_token",

PLAYER_KEY:
"nightcast_player",

LAST_PLAYED_KEY:
"nightcast_last",

REQUEST_TIMEOUT:
15000

};


/*==================================================
GLOBAL STATE
==================================================*/

const App = {

theme:"auto",

user:null,

token:null,

rss:[],

books:[],

favorites:[],

recent:[],

player:null,

audio:null,

currentEpisode:null,

cache:{},

loading:false,

initialized:false

};


/*==================================================
DOM
==================================================*/

const DOM = {

body:
document.body,

overlay:
document.getElementById("overlay"),

toast:
document.getElementById("toast"),

player:
document.getElementById("player"),

playerTitle:
document.getElementById("playerTitle"),

playerAuthor:
document.getElementById("playerAuthor"),

playerImage:
document.getElementById("playerImage"),

playerProgress:
document.getElementById("playerProgress"),

playerPlay:
document.getElementById("playerPlay"),

playerNext:
document.getElementById("playerNext"),

playerPrev:
document.getElementById("playerPrev"),

playerSheet:
document.getElementById("playerSheet"),

sheetImage:
document.getElementById("sheetImage"),

sheetTitle:
document.getElementById("sheetTitle"),

sheetDescription:
document.getElementById("sheetDescription"),

sheetPlay:
document.getElementById("sheetPlay"),

searchInput:
document.getElementById("searchInput"),

searchModal:
document.getElementById("searchModal"),

searchResults:
document.getElementById("searchResults")

};


/*==================================================
UTILITIES
==================================================*/

const Utils = {

sleep(ms){

return new Promise(resolve=>{

setTimeout(resolve,ms);

});

},

uuid(){

return crypto.randomUUID();

},

formatTime(seconds){

seconds=
Math.floor(seconds);

const m=
Math.floor(seconds/60);

const s=
seconds%60;

return `${m}:${s.toString().padStart(2,"0")}`;

},

isEmail(value){

return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

},

isPhone(value){

return /^\+[1-9]\d{7,14}$/.test(value);

},

escape(text){

const div=
document.createElement("div");

div.innerText=text;

return div.innerHTML;

},

debounce(fn,delay){

let timer;

return (...args)=>{

clearTimeout(timer);

timer=setTimeout(()=>{

fn(...args);

},delay);

};

}

};


/*==================================================
TOAST
==================================================*/

const Toast={

show(message,time=2500){

if(!DOM.toast){

return;

}

DOM.toast.innerText=
message;

DOM.toast.style.display=
"block";

DOM.toast.classList.add(
"fade-in"
);

clearTimeout(

Toast.timer

);

Toast.timer=
setTimeout(()=>{

DOM.toast.style.display=
"none";

},time);

}

};


/*==================================================
LOADING
==================================================*/

const Loading={

show(button,text="در حال پردازش..."){

if(!button)return;

button.dataset.original=
button.innerHTML;

button.disabled=true;

button.innerHTML=text;

},

hide(button){

if(!button)return;

button.disabled=false;

button.innerHTML=
button.dataset.original ||
"ادامه";

}

};


/*==================================================
THEME MANAGER
==================================================*/

const Theme={

init(){

let saved=

localStorage.getItem(

CONFIG.THEME_KEY

);

if(!saved){

saved="auto";

}

App.theme=saved;

Theme.apply(saved);

},

apply(mode){

document.documentElement

.setAttribute(

"data-theme",

mode

);

localStorage.setItem(

CONFIG.THEME_KEY,

mode

);

App.theme=mode;

},

toggle(){

if(App.theme==="dark"){

Theme.apply("light");

return;

}

if(App.theme==="light"){

Theme.apply("auto");

return;

}

Theme.apply("dark");

}

};




/*==================================================
HTTP ENGINE
==================================================*/

const Http = {

async request(

url,
options={}

){

const controller =
new AbortController();

const timeout =
setTimeout(()=>{

controller.abort();

},CONFIG.REQUEST_TIMEOUT);

try{

const response =
await fetch(

url,

{

...options,

signal:
controller.signal,

headers:{

"Content-Type":
"application/json",

...(options.headers||{})

}

}

);

clearTimeout(timeout);

const json =
await response.json();

if(!response.ok){

throw{

status:
response.status,

message:
json.message ||
"Server Error"

};

}

return json;

}catch(error){

clearTimeout(timeout);

if(error.name==="AbortError"){

throw{

message:
"Request Timeout"

};

}

throw error;

}

},

get(url){

return Http.request(

url,

{

method:"GET"

}

);

},

post(

url,
body

){

return Http.request(

url,

{

method:"POST",

body:
JSON.stringify(body)

}

);

}

};



/*==================================================
CACHE
==================================================*/

const Cache={

set(

key,
data

){

App.cache[key]={

time:
Date.now(),

data

};

},

get(key){

const item=

App.cache[key];

if(!item){

return null;

}

if(

Date.now()

-

item.time

>

CONFIG.CACHE_TIME

){

delete App.cache[key];

return null;

}

return item.data;

},

clear(){

App.cache={};

}

};



/*==================================================
API
==================================================*/

const API={

async status(){

return await Http.get(

CONFIG.API

);

},

async me(){

const token=

localStorage.getItem(

CONFIG.TOKEN_KEY

);

if(!token){

return null;

}

return await Http.get(

CONFIG.API+

"/me",

{

headers:{

Authorization:

"Bearer "+token

}

}

);

},

async logout(){

const token=

localStorage.getItem(

CONFIG.TOKEN_KEY

);

return await Http.post(

CONFIG.API+

"/logout",

{},{

headers:{

Authorization:

"Bearer "+token

}

}

);

},

async requestBook(

body

){

return await Http.post(

CONFIG.API+

"/request",

body

);

}

};



/*==================================================
USER
==================================================*/

const User={

async load(){

try{

const result=

await API.me();

if(

result &&

result.success

){

App.user=

result.user;

return true;

}

}catch(e){

console.log(e);

}

localStorage.removeItem(

CONFIG.TOKEN_KEY

);

return false;

},

logout(){

localStorage.removeItem(

CONFIG.TOKEN_KEY

);

App.user=null;

location.href=

"login.html";

}

};



/*==================================================
BOOT
==================================================*/

const Boot={

async start(){

Theme.init();

await User.load();

console.log(

"NightCast Ready"

);

}

};

document.addEventListener(

"DOMContentLoaded",

()=>{

Boot.start();

});




/*==================================================
RSS ENGINE
==================================================*/

const Feed = {

items:[],

async load(){

try{

const cache =

Cache.get("rss");

if(cache){

Feed.items = cache;

Renderer.renderEpisodes(cache);

return;

}

const result =

await Http.get(

CONFIG.API + "/rss"

);

if(

!result.success

){

throw "RSS Error";

}

Feed.items =

result.items || [];

Cache.set(

"rss",

Feed.items

);

Renderer.renderEpisodes(

Feed.items

);

}catch(e){

console.error(e);

Toast.show(

"خطا در دریافت اطلاعات"

);

}

}

};



/*==================================================
RENDERER
==================================================*/

const Renderer = {

renderEpisodes(items){

const container =

document.getElementById(

"episodes"

);

if(!container){

return;

}

container.innerHTML="";

items.forEach(item=>{

container.appendChild(

Renderer.createCard(item)

);

});

},

createCard(item){

const card =

document.createElement("article");

card.className =

"episode-card fade-in";

card.innerHTML =

`

<div class="episode-cover">

<img

loading="lazy"

src="${item.image}"

alt="${Utils.escape(item.title)}">

<div class="play-overlay">

<div class="play-circle">

▶

</div>

</div>

</div>

<div class="episode-body">

<h3 class="episode-title">

${Utils.escape(item.title)}

</h3>

<p class="episode-desc">

${Utils.escape(

item.description || ""

)}

</p>

<div class="episode-footer">

<span>

🎧 ${item.duration || ""}

</span>

<span>

📅 ${item.date || ""}

</span>

</div>

</div>

`;

card.onclick = ()=>{

Player.open(item);

};

return card;

}

};



/*==================================================
BOOKS
==================================================*/

const Books = {

items:[],

set(items){

Books.items = items;

},

find(text){

text =

text.toLowerCase();

return Books.items.filter(book=>{

return (

book.title

.toLowerCase()

.includes(text)

||

book.author

.toLowerCase()

.includes(text)

);

});

}

};



/*==================================================
HOME
==================================================*/

const Home={

async init(){

await Feed.load();

}

};



/*==================================================
BOOT UPDATE
==================================================*/

document.addEventListener(

"DOMContentLoaded",

async ()=>{

await Boot.start();

await Home.init();

});



/*==================================================
SEARCH ENGINE
==================================================*/

const Search={

keyword:"",

results:[],

init(){

if(!DOM.searchInput){

return;

}

DOM.searchInput.addEventListener(

"input",

Utils.debounce(

Search.onSearch,

250

)

);

},

onSearch(e){

Search.keyword=

e.target.value

.trim()

.toLowerCase();

if(

Search.keyword===""

){

Search.clear();

return;

}

Search.results=

Feed.items.filter(item=>{

const title=

(item.title||"")

.toLowerCase();

const desc=

(item.description||"")

.toLowerCase();

const author=

(item.author||"")

.toLowerCase();

return(

title.includes(Search.keyword)||

desc.includes(Search.keyword)||

author.includes(Search.keyword)

);

});

Search.render();

},

render(){

if(!DOM.searchResults){

return;

}

DOM.searchResults.innerHTML="";

if(

Search.results.length===0

){

DOM.searchResults.innerHTML=`

<div class="empty-search">

<h3>

نتیجه‌ای پیدا نشد

</h3>

<p>

عبارت دیگری را امتحان کنید.

</p>

</div>

`;

return;

}

Search.results.forEach(item=>{

const card=

Renderer.createCard(item);

DOM.searchResults

.appendChild(card);

});

},

clear(){

if(DOM.searchResults){

DOM.searchResults.innerHTML="";

}

},

open(){

if(!DOM.searchModal){

return;

}

DOM.searchModal

.classList.add("open");

DOM.overlay?.classList.add(

"show"

);

setTimeout(()=>{

DOM.searchInput?.focus();

},150);

},

close(){

DOM.searchModal

.classList.remove("open");

DOM.overlay?.classList.remove(

"show"

);

Search.clear();

if(DOM.searchInput){

DOM.searchInput.value="";

}

Search.keyword="";

}

};



/*==================================================
SEARCH BUTTONS
==================================================*/

document

.getElementById("searchButton")

?.addEventListener(

"click",

()=>{

Search.open();

}

);

document

.getElementById("searchClose")

?.addEventListener(

"click",

()=>{

Search.close();

}

);

DOM.overlay?.addEventListener(

"click",

()=>{

Search.close();

}

);



/*==================================================
KEYBOARD SHORTCUTS
==================================================*/

document.addEventListener(

"keydown",

e=>{

if(

e.key==="Escape"

){

Search.close();

}

if(

e.ctrlKey &&

e.key==="k"

){

e.preventDefault();

Search.open();

}

}

);



/*==================================================
BOOT UPDATE
==================================================*/

document.addEventListener(

"DOMContentLoaded",

()=>{

Search.init();

});





/*==================================================
PLAYER ENGINE
==================================================*/

const Player={

audio:new Audio(),

current:null,

playing:false,

init(){

Player.audio.preload="metadata";

Player.audio.addEventListener(

"timeupdate",

Player.updateProgress

);

Player.audio.addEventListener(

"ended",

Player.next

);

Player.audio.addEventListener(

"loadedmetadata",

Player.updateDuration

);

},

open(item){

Player.current=item;

Player.audio.src=item.audio;

Player.audio.load();

Player.render(item);

Player.play();

localStorage.setItem(

CONFIG.LAST_PLAYED_KEY,

JSON.stringify(item)

);

},

render(item){

if(DOM.player){

DOM.player.style.display="flex";

}

if(DOM.playerTitle){

DOM.playerTitle.innerText=item.title;

}

if(DOM.playerAuthor){

DOM.playerAuthor.innerText=

item.author || "";

}

if(DOM.playerImage){

DOM.playerImage.src=item.image;

}

if(DOM.sheetTitle){

DOM.sheetTitle.innerText=item.title;

}

if(DOM.sheetDescription){

DOM.sheetDescription.innerText=

item.description || "";

}

if(DOM.sheetImage){

DOM.sheetImage.src=item.image;

}

},

play(){

Player.audio.play();

Player.playing=true;

Player.refreshButtons();

},

pause(){

Player.audio.pause();

Player.playing=false;

Player.refreshButtons();

},

toggle(){

if(Player.playing){

Player.pause();

}else{

Player.play();

}

},

refreshButtons(){

const icon=

Player.playing ? "⏸" : "▶";

if(DOM.playerPlay){

DOM.playerPlay.innerHTML=icon;

}

if(DOM.sheetPlay){

DOM.sheetPlay.innerHTML=icon;

}

},

updateProgress(){

if(

!DOM.playerProgress ||

!Player.audio.duration

){

return;

}

const percent=

(Player.audio.currentTime/

Player.audio.duration)

*100;

DOM.playerProgress.style.width=

percent+"%";

},

updateDuration(){

console.log(

Utils.formatTime(

Player.audio.duration

)

);

},

next(){

if(

Feed.items.length===0 ||

!Player.current

){

return;

}

const index=

Feed.items.findIndex(

x=>x.audio===Player.current.audio

);

if(index===-1){

return;

}

const next=

Feed.items[

(index+1)

%

Feed.items.length

];

Player.open(next);

},

previous(){

if(

Feed.items.length===0 ||

!Player.current

){

return;

}

const index=

Feed.items.findIndex(

x=>x.audio===Player.current.audio

);

if(index===-1){

return;

}

const prev=

Feed.items[

(index-1+Feed.items.length)

%

Feed.items.length

];

Player.open(prev);

}

};



/*==================================================
PLAYER EVENTS
==================================================*/

DOM.playerPlay?.addEventListener(

"click",

()=>{

Player.toggle();

}

);

DOM.sheetPlay?.addEventListener(

"click",

()=>{

Player.toggle();

}

);

DOM.playerNext?.addEventListener(

"click",

()=>{

Player.next();

}

);

DOM.playerPrev?.addEventListener(

"click",

()=>{

Player.previous();

}

);



DOM.player?.addEventListener(

"dblclick",

()=>{

DOM.playerSheet?.classList.add(

"open"

);

DOM.overlay?.classList.add(

"show"

);

}

);



document

.getElementById("sheetClose")

?.addEventListener(

"click",

()=>{

DOM.playerSheet?.classList.remove(

"open"

);

DOM.overlay?.classList.remove(

"show"

);

}

);



/*==================================================
RESTORE LAST PLAYED
==================================================*/

document.addEventListener(

"DOMContentLoaded",

()=>{

Player.init();

const last=

localStorage.getItem(

CONFIG.LAST_PLAYED_KEY

);

if(last){

try{

const item=

JSON.parse(last);

Player.render(item);

Player.current=item;

}catch(e){

console.log(e);

}

}

});










