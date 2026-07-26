
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
