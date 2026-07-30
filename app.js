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
LOGIN MODULE
==================================================*/

const Login = {

step: 1,

type: "phone",

value: "",

code: ""

};


/*==================================================
START LOGIN
==================================================*/

async function startLogin() {

const input = document.getElementById("loginInput");

const button = document.getElementById("continueButton");

if (!input) return;

const value = input.value.trim();

if (!value) {

showToast(

"شماره موبایل یا ایمیل را وارد کنید.",

"warning"

);

input.focus();

return;

}

Login.value = value;

Login.type =

value.includes("@")

? "email"

: "phone";

try {

buttonLoading(button, true);

showLoader();

const result = await apiPost(

"/api/auth/start",

{

type: Login.type,

value: Login.value

}

);

hideLoader();

buttonLoading(button, false);

showToast(

"کد تایید ارسال شد.",

"success"

);

showOTPPage();

/* فقط برای تست */

console.log(

"OTP:",

result.code

);

} catch (err) {

hideLoader();

buttonLoading(button, false);

handleApiError(err);

}

}


/*==================================================
SHOW OTP
==================================================*/

function showOTPPage() {

const loginBox =

document.getElementById("loginBox");

const otpBox =

document.getElementById("otpBox");

if (loginBox)

loginBox.classList.add("hide");

if (otpBox)

otpBox.classList.remove("hide");

const firstInput =

document.querySelector(".otp-input");

if (firstInput)

firstInput.focus();

}














