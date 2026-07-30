"use strict";

/*==================================================
NightCast
Application Core
Version 6.0
==================================================*/

const App = {

version: "6.0.0",

api: "https://nightcast-api.tomasgermany2580.workers.dev",

rss: null,

user: null,

player: null,

theme: "auto",

loading: false,

currentEpisode: null,

episodes: [],

favorites: [],

history: [],

searchResult: [],

};

/*==================================================
DOM CACHE
==================================================*/

const DOM = {};

/*==================================================
INITIALIZE DOM
==================================================*/

function cacheDOM() {

DOM.body = document.body;

DOM.html = document.documentElement;

DOM.loader = document.getElementById("pageLoader");

DOM.overlay = document.getElementById("overlay");

DOM.toast = document.getElementById("toast");

DOM.player = document.getElementById("player");

DOM.bottomNav = document.getElementById("bottomNav");

DOM.backTop = document.getElementById("backToTop");

DOM.progress = document.getElementById("scrollProgress");

DOM.searchInput = document.getElementById("searchInput");

DOM.episodes = document.getElementById("episodesContainer");

}

/*==================================================
BOOTSTRAP
==================================================*/

document.addEventListener("DOMContentLoaded", init);

function init() {

console.log(

`NightCast ${App.version}`

);

cacheDOM();

initUI();
  
loadTheme();

bindGlobalEvents();

hideLoader();

}




/*==================================================
THEME ENGINE
==================================================*/

function loadTheme() {

const savedTheme = localStorage.getItem("nightcast-theme");

if (savedTheme) {

App.theme = savedTheme;

} else {

App.theme = "auto";

}

applyTheme(App.theme);

}

function applyTheme(theme) {

App.theme = theme;

DOM.html.setAttribute("data-theme", theme);

localStorage.setItem(

"nightcast-theme",

theme

);

updateThemeIcon();

}

function toggleTheme() {

switch (App.theme) {

case "light":

applyTheme("dark");

break;

case "dark":

applyTheme("auto");

break;

default:

applyTheme("light");

}

}

function updateThemeIcon() {

const btn = document.getElementById("themeToggle");

if (!btn) return;

const icon = btn.querySelector("i");

if (!icon) return;

icon.className = "";

switch (App.theme) {

case "light":

icon.classList.add(

"fa-solid",

"fa-sun"

);

break;

case "dark":

icon.classList.add(

"fa-solid",

"fa-moon"

);

break;

default:

icon.classList.add(

"fa-solid",

"fa-circle-half-stroke"

);

}

}

/*==================================================
SYSTEM THEME CHANGE
==================================================*/

window.matchMedia(

"(prefers-color-scheme: dark)"

).addEventListener(

"change",

() => {

if (App.theme === "auto") {

applyTheme("auto");

}

}

);






/*==================================================
STORAGE MANAGER
==================================================*/

const Storage = {

get(key, defaultValue = null) {

try {

const value = localStorage.getItem(key);

return value ? JSON.parse(value) : defaultValue;

} catch {

return defaultValue;

}

},

set(key, value) {

try {

localStorage.setItem(

key,

JSON.stringify(value)

);

} catch (err) {

console.error(err);

}

},

remove(key) {

localStorage.removeItem(key);

},

clear() {

localStorage.clear();

}

};

/*==================================================
USER
==================================================*/

function saveUser(user) {

App.user = user;

Storage.set(

"nightcast-user",

user

);

}

function loadUser() {

App.user = Storage.get(

"nightcast-user",

null

);

}

/*==================================================
TOKEN
==================================================*/

function saveToken(token) {

Storage.set(

"nightcast-token",

token

);

}

function getToken() {

return Storage.get(

"nightcast-token",

null

);

}

function logoutLocal() {

Storage.remove(

"nightcast-user"

);

Storage.remove(

"nightcast-token"

);

App.user = null;

}

/*==================================================
FAVORITES
==================================================*/

function loadFavorites() {

App.favorites = Storage.get(

"nightcast-favorites",

[]

);

}

function saveFavorites() {

Storage.set(

"nightcast-favorites",

App.favorites

);

}

/*==================================================
HISTORY
==================================================*/

function loadHistory() {

App.history = Storage.get(

"nightcast-history",

[]

);

}

function saveHistory() {

Storage.set(

"nightcast-history",

App.history

);

}

/*==================================================
PLAYER POSITION
==================================================*/

function savePlayerState() {

if (!App.player) return;

Storage.set(

"nightcast-player",

{

episode: App.currentEpisode,

time: App.player.currentTime,

speed: App.player.playbackRate

}

);

}

function loadPlayerState() {

return Storage.get(

"nightcast-player",

null

);

}








/*==================================================
HELPERS
==================================================*/

function $(selector) {

return document.querySelector(selector);

}

function $$(selector) {

return document.querySelectorAll(selector);

}

function sleep(ms) {

return new Promise(resolve =>

setTimeout(resolve, ms)

);

}

function escapeHTML(text = "") {

const div = document.createElement("div");

div.textContent = text;

return div.innerHTML;

}

function formatTime(seconds = 0) {

seconds = Math.floor(seconds);

const m = Math.floor(seconds / 60);

const s = seconds % 60;

return `${m}:${String(s).padStart(2,"0")}`;

}

function formatNumber(number) {

return new Intl.NumberFormat("fa-IR")

.format(number);

}


/*==================================================
LOADER
==================================================*/

function showLoader() {

if (DOM.loader) {

DOM.loader.classList.remove("hide");

}

App.loading = true;

}

function hideLoader() {

if (DOM.loader) {

DOM.loader.classList.add("hide");

}

App.loading = false;

}


/*==================================================
OVERLAY
==================================================*/

function showOverlay() {

if (!DOM.overlay) return;

DOM.overlay.classList.add("show");

}

function hideOverlay() {

if (!DOM.overlay) return;

DOM.overlay.classList.remove("show");

}


/*==================================================
TOAST
==================================================*/

let toastTimer = null;

function showToast(

message,

type = "info",

duration = 3000

) {

if (!DOM.toast) return;

clearTimeout(toastTimer);

DOM.toast.textContent = message;

DOM.toast.className = "toast show";

switch (type) {

case "success":

DOM.toast.style.background = "#27AE60";

break;

case "error":

DOM.toast.style.background = "#E53935";

break;

case "warning":

DOM.toast.style.background = "#F39C12";

break;

default:

DOM.toast.style.background = "var(--primary)";

}

toastTimer = setTimeout(() => {

DOM.toast.classList.remove("show");

}, duration);

}


/*==================================================
BUTTON LOADING
==================================================*/

function buttonLoading(

button,

loading = true

) {

if (!button) return;

if (loading) {

button.classList.add(

"button-loading"

);

button.disabled = true;

} else {

button.classList.remove(

"button-loading"

);

button.disabled = false;

}

}







/*==================================================
API ENGINE
==================================================*/

const API = {

base: App.api,

timeout: 15000,

async request(endpoint, options = {}) {

const controller = new AbortController();

const timeout = setTimeout(() => {

controller.abort();

}, this.timeout);

const headers = {

"Content-Type": "application/json",

...options.headers

};

const token = getToken();

if (token) {

headers.Authorization = `Bearer ${token}`;

}

try {

const response = await fetch(

this.base + endpoint,

{

...options,

headers,

signal: controller.signal

}

);

clearTimeout(timeout);

const data = await response.json();

if (!response.ok) {

throw {

status: response.status,

message:

data.message ||

"Server Error"

};

}

return data;

} catch (err) {

clearTimeout(timeout);

if (err.name === "AbortError") {

throw {

status: 408,

message:

"ارتباط با سرور بیش از حد طول کشید."

};

}

throw err;

}

}

};


/*==================================================
GET
==================================================*/

async function apiGet(endpoint) {

return API.request(endpoint, {

method: "GET"

});

}


/*==================================================
POST
==================================================*/

async function apiPost(endpoint, body) {

return API.request(endpoint, {

method: "POST",

body: JSON.stringify(body)

});

}


/*==================================================
API STATUS
==================================================*/

async function apiStatus() {

return apiGet("/api");

}


/*==================================================
ERROR HANDLER
==================================================*/

function handleApiError(error) {

console.error(error);

const message =

error.message ||

"خطای ناشناخته";

showToast(

message,

"error"

);

}



/*==================================================
LOGIN MANAGER
==================================================*/

const Login = {

type: null,

value: "",

step: 1,

isRunning: false,

reset() {

this.type = null;

this.value = "";

this.step = 1;

this.isRunning = false;

}

};

/*==================================================
LOGIN HELPERS
==================================================*/

function detectLoginType(value) {

value = value.trim();

if (value.includes("@")) {

return "email";

}

return "phone";

}

function validateLoginValue(value) {

value = value.trim();

if (!value) {

return {

ok: false,

message: "شماره موبایل یا ایمیل را وارد کنید."

};

}

if (value.includes("@")) {

const emailRegex =

/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(value)) {

return {

ok: false,

message: "ایمیل صحیح نیست."

};

}

} else {

const phone = value.replace(/\D/g, "");

if (phone.length < 10) {

return {

ok: false,

message: "شماره موبایل صحیح نیست."

};

}

}

return {

ok: true

};

}

/*==================================================
LOGIN START
==================================================*/

async function loginStart(value) {

if (Login.isRunning) return;

const check = validateLoginValue(value);

if (!check.ok) {

showToast(

check.message,

"warning"

);

return false;

}

Login.isRunning = true;

showLoader();

try {

Login.type = detectLoginType(value);

Login.value = value.trim();

const result = await apiPost(

"/api/auth/start",

{

type: Login.type,

value: Login.value

}

);

Login.step = 2;

showToast(

result.message ||

"کد تایید ارسال شد.",

"success"

);

console.log(

"Verification Code:",

result.code

);

return true;

}

catch(error){

handleApiError(error);

return false;

}

finally{

hideLoader();

Login.isRunning = false;

}

  }



/*==================================================
APP MODULES
==================================================*/

App.login = Login;

App.player = {

audio: null,

episode: null,

playing: false,

duration: 0,

currentTime: 0,

speed: 1,

volume: 1

};

App.search = {

keyword: "",

result: []

};

App.profile = {

loaded: false

};

App.ui = {

page: "home",

modal: null,

loading: false

};

App.network = {

online: navigator.onLine

};

/*==================================================
APPLICATION STATE
==================================================*/

function setPage(name){

App.ui.page = name;

}

function getPage(){

return App.ui.page;

}

function setLoading(state){

App.ui.loading = state;

if(state){

showLoader();

}else{

hideLoader();

}

}

function isLoggedIn(){

return getToken() !== null;

  }




/*==================================================
UI CONTROLLER
==================================================*/

const UI = {

elements: {},

init() {

this.elements = {

loginInput: $("#loginInput"),

continueButton: $("#continueButton"),

otpContainer: $("#otpBox"),

loginContainer: $("#loginBox"),

themeButton: $("#themeButton"),

player: $("#player"),

playerSheet: $("#playerSheet"),

searchModal: $("#searchModal")

};

},

get(name) {

return this.elements[name] || null;

},

show(name) {

const el = this.get(name);

if (!el) return;

el.classList.remove("hide");

},

hide(name) {

const el = this.get(name);

if (!el) return;

el.classList.add("hide");

},

enable(name) {

const el = this.get(name);

if (!el) return;

el.disabled = false;

},

disable(name) {

const el = this.get(name);

if (!el) return;

el.disabled = true;

},

value(name) {

const el = this.get(name);

if (!el) return "";

return el.value.trim();

},

setValue(name, value) {

const el = this.get(name);

if (!el) return;

el.value = value;

},

focus(name) {

const el = this.get(name);

if (!el) return;

el.focus();

}

};

/*==================================================
UI BOOTSTRAP
==================================================*/

function initUI(){

UI.init();

}









