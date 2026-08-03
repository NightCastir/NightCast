/*
==========================================
NightCast CMS Core
Version 2.0
==========================================
*/

const App={

version:"2.0.0",

init(){

this.initTheme();

this.initClock();

this.initSidebar();

this.showVersion();

},

// ======================
// THEME
// ======================

initTheme(){

const saved=

localStorage.getItem("NightCastTheme");

if(saved==="dark"){

document.documentElement.classList.add("dark");

}

},

toggleTheme(){

document.documentElement.classList.toggle("dark");

const dark=

document.documentElement.classList.contains("dark");

localStorage.setItem(

"NightCastTheme",

dark?"dark":"light"

);

},

// ======================
// SIDEBAR
// ======================

initSidebar(){

const btn=

document.getElementById("btnMenu");

if(!btn) return;

btn.onclick=()=>{

document.body.classList.toggle("sidebar-collapse");

};

},

// ======================
// CLOCK
// ======================

initClock(){

const clock=

document.getElementById("clock");

if(!clock) return;

const update=()=>{

const now=new Date();

clock.innerHTML=

now.toLocaleDateString("fa-IR")+

" | "+

now.toLocaleTimeString("fa-IR");

};

update();

setInterval(update,1000);

},

// ======================
// VERSION
// ======================

showVersion(){

const el=

document.getElementById("version");

if(!el) return;

el.innerHTML=

"NightCast CMS v"+this.version;

},

// ======================
// TITLE
// ======================

setTitle(text){

document.title=

text+" | NightCast CMS";

const h=

document.getElementById("pageTitle");

if(h){

h.innerHTML=text;

}

},

// ======================
// LOADER
// ======================

loading(show=true){

if(window.UI){

UI.loading(show);

}

},

// ======================
// TOAST
// ======================

toast(msg,color){

if(window.UI){

UI.toast(msg,color);

}

}

};

window.App=App;

document.addEventListener(

"DOMContentLoaded",

()=>{

App.init();

}
);
