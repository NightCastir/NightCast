/*====================================
 NightCast App v1
====================================*/

document.addEventListener("DOMContentLoaded", () => {

initHeader();

initScrollAnimation();

initCounters();

initBackToTop();

initEpisodeButtons();

initSocialCards();

initSmoothScroll();

});


/*====================================
 Sticky Header
====================================*/

function initHeader(){

const header=document.querySelector("header");

window.addEventListener("scroll",()=>{

if(window.scrollY>80){

header.classList.add("header-active");

}else{

header.classList.remove("header-active");

}

});

}


/*====================================
 Fade Animation
====================================*/

function initScrollAnimation(){

const items=document.querySelectorAll(

".feature-card,.episode,.social-card,.newsletter"

);

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});

},{

threshold:.15

});

items.forEach(item=>observer.observe(item));

}


/*====================================
 Smooth Scroll
====================================*/

function initSmoothScroll(){

document.querySelectorAll("a[href^='#']").forEach(link=>{

link.onclick=function(e){

e.preventDefault();

const target=document.querySelector(

this.getAttribute("href")

);

if(target){

target.scrollIntoView({

behavior:"smooth"

});

}

}

});

}


/*====================================
 Episode Buttons
====================================*/

function initEpisodeButtons(){

document.querySelectorAll(".play-btn")

.forEach(btn=>{

btn.onclick=function(){

this.innerHTML="⏸ در حال پخش";

setTimeout(()=>{

this.innerHTML="▶ ادامه";

},3000);

}

});

}


/*====================================
 Social Cards
====================================*/

function initSocialCards(){

const links={

telegram:"https://t.me/NightCast_ir",

instagram:"https://instagram.com/NightCast.ir",

youtube:"https://youtube.com/@NightCast-r5e",

aparat:"https://www.aparat.com/rss/nightcast",

rubika:"https://rubika.ir/NightCast_ir",

bale:"https://ble.ir/NightCast_ir",

eitaa:"https://eitaa.com/NightCast",

splus:"https://splus.ir/NightCast"

};

document.querySelectorAll(".social-card")

.forEach(card=>{

card.addEventListener("click",()=>{

const network=card.dataset.network;

if(links[network]){

window.open(

links[network],

"_blank"

);

}

});

});

}


/*====================================
 Counter Animation
====================================*/

function initCounters(){

const counters=document.querySelectorAll("[data-count]");

counters.forEach(counter=>{

const target=parseInt(counter.dataset.count);

let value=0;

const timer=setInterval(()=>{

value+=Math.ceil(target/80);

if(value>=target){

value=target;

clearInterval(timer);

}

counter.innerText=value;

},25);

});

}


/*====================================
 Back To Top
====================================*/

function initBackToTop(){

const btn=document.getElementById("backTop");

if(!btn)return;

window.addEventListener("scroll",()=>{

btn.style.display=

window.scrollY>500

?

"flex"

:

"none";

});

btn.onclick=()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

};

}


