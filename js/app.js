

/* ==========================================================
   NightCast
   Application
   ========================================================== */

"use strict";

const App={

    version:"3.0.0",

    initialized:false

};

App.init=async function(){

    if(this.initialized){

        return;

    }

    console.log("NightCast Starting...");

    UI.start();

    await Feed.init();

    this.initialized=true;

};

document.addEventListener(

    "DOMContentLoaded",

    async()=>{

        await App.init();

    }

);

/* ==========================================================
   Global Error
   ========================================================== */

window.addEventListener(

    "error",

    function(event){

        console.error(event.error);

    }

);

window.addEventListener(

    "unhandledrejection",

    function(event){

        console.error(event.reason);

    }

);

/* ==========================================================
   Network
   ========================================================== */

window.addEventListener(

    "online",

    ()=>{

        Feed.reload();

    }

);

window.addEventListener(

    "offline",

    ()=>{

        UI.toast(

            "ارتباط اینترنت قطع شد.",

            "warning"

        );

    }

);

/* ==========================================================
   Service Worker
   ========================================================== */

App.registerServiceWorker=async function(){

    if(

        !("serviceWorker" in navigator)

    ){

        return;

    }

    try{

        await navigator.serviceWorker.register(

            "/sw.js"

        );

    }

    catch(err){

        console.error(err);

    }

};

if(window.Feed){

    Feed.on(

        "feed:ready",

        ()=>{

            App.registerServiceWorker();

        }

    );

}

window.App=App;






