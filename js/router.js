/* ==================================================
   NightCast Router V1
   File : /js/router.js
   ================================================== */

(function(){

"use strict";

/* =============================================== */

const SPLASH_TIME = 1800;

/* =============================================== */

const Router = {

    async start(){

        await this.delay(SPLASH_TIME);

        const logged =
        NightCastAuth.isLoggedIn();

        if(!logged){

            this.goWelcome();

            return;

        }

        const valid =
        await NightCastAuth.validate();

        if(valid){

            this.goHome();

        }

        else{

            this.goWelcome();

        }

    },

    /* =========================================== */

    goWelcome(){

        window.location.replace(

            "/users/login.html"

        );

    },

    /* =========================================== */

    goHome(){

        window.location.replace(

            "/users/index.html"

        );

    },

    /* =========================================== */

    delay(ms){

        return new Promise(

            resolve=>setTimeout(

                resolve,

                ms

            )

        );

    }

};

/* =============================================== */

document.addEventListener(

"DOMContentLoaded",

()=>{

    Router.start();

});

/* =============================================== */

})();
