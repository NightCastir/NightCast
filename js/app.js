
/* ==========================================================
   NightCast
   Application
   File : app.js
   Version : 1.0.0
   ========================================================== */

"use strict";

/* ==========================================================
   Application
   ========================================================== */

const App = {

    version : "1.0.0",

    initialized : false

};

/* ==========================================================
   Initialize
   ========================================================== */

App.init = async function(){

    if(this.initialized){

        return;

    }

    console.log(

        "NightCast Starting..."

    );

    UI.start();

    Player.start();

    await Feed.init();

    this.initialized = true;

};

/* ==========================================================
   Ready
   ========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    async ()=>{

        await App.init();

    }

);


/* ==========================================================
   Global Error Handler
   ========================================================== */

window.addEventListener(

    "error",

    function(event){

        console.error(

            "[NightCast Error]",

            event.error

        );

        UI.toast(

            "خطایی در برنامه رخ داد.",

            "error"

        );

    }

);

/* ==========================================================
   Promise Error Handler
   ========================================================== */

window.addEventListener(

    "unhandledrejection",

    function(event){

        console.error(

            "[Promise Error]",

            event.reason

        );

        UI.toast(

            "خطا در اجرای عملیات.",

            "error"

        );

    }

);

/* ==========================================================
   Network Status
   ========================================================== */

window.addEventListener(

    "offline",

    function(){

        UI.toast(

            "ارتباط اینترنت قطع شد.",

            "warning"

        );

    }

);

window.addEventListener(

    "online",

    function(){

        UI.toast(

            "ارتباط اینترنت برقرار شد.",

            "success"

        );

        Feed.reload();

    }

);

/* ==========================================================
   Visibility API
   ========================================================== */

document.addEventListener(

    "visibilitychange",

    function(){

        if(document.hidden){

            Player.savePlayback();

        }

    }

);


/* ==========================================================
   Service Worker
   ========================================================== */

App.registerServiceWorker = async function () {

    if (!("serviceWorker" in navigator)) {

        return;

    }

    try {

        await navigator.serviceWorker.register(

            "/sw.js"

        );

        console.log(

            "Service Worker Registered"

        );

    }

    catch (error) {

        console.error(

            "Service Worker Error",

            error

        );

    }

};

/* ==========================================================
   Application Information
   ========================================================== */

App.info = function () {

    console.group(

        "NightCast"

    );

    console.log(

        "Version :", this.version

    );

    console.log(

        "Feed :", Feed.url

    );

    console.log(

        "Episodes :",

        Feed.count()

    );

    console.groupEnd();

};

/* ==========================================================
   Debug
   ========================================================== */

App.debug = false;

App.log = function (...args) {

    if (!this.debug) {

        return;

    }

    console.log(

        "[NightCast]",

        ...args

    );

};

/* ==========================================================
   Feed Ready
   ========================================================== */

Feed.on(

    "feed:ready",

    () => {

        App.registerServiceWorker();

        App.info();

    }

);

/* ==========================================================
   Public API
   ========================================================== */

App.reload = async function () {

    await Feed.reload();

    UI.refresh();

};

App.destroy = function () {

    Player.stop();

    UI.destroy();

};

/* ==========================================================
   Global Export
   ========================================================== */

window.App = App;

/* ==========================================================
   End Of File
   ========================================================== */


