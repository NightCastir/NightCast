/* ==================================================
   NightCast Auth Manager V1
   File : /js/auth.js
   ================================================== */

(function () {

"use strict";

/* ============================================= */

const API_URL =
"https://nightcast-api.tomasgermany2580.workers.dev/api/v1";

/* ============================================= */

const STORAGE_TOKEN = "NightCastToken";
const STORAGE_USER  = "NightCastUser";

/* ============================================= */

const Auth = {

    token:null,

    user:null,

    /* ============================== */

    init(){

        this.token =
        localStorage.getItem(STORAGE_TOKEN);

        const user =
        localStorage.getItem(STORAGE_USER);

        if(user){

            try{

                this.user =
                JSON.parse(user);

            }
            catch(e){

                this.user = null;

            }

        }

    },

    /* ============================== */

    isLoggedIn(){

        return !!this.token;

    },

    /* ============================== */

    getToken(){

        return this.token;

    },

    /* ============================== */

    getUser(){

        return this.user;

    },

    /* ============================== */

    getHeaders(){

        if(!this.token){

            return{

                "Content-Type":"application/json"

            };

        }

        return{

            "Content-Type":"application/json",

            "Authorization":
            "Bearer " + this.token

        };

    },

    /* ============================== */

    async validate(){

        if(!this.token){

            return false;

        }

        try{

            const response =

            await fetch(

                API_URL +

                "/auth/status",

                {

                    method:"GET",

                    headers:this.getHeaders()

                }

            );

            const result =
            await response.json();

            if(

                result.success &&

                result.authenticated

            ){

                return true;

            }

            this.logout(false);

            return false;

        }

        catch(error){

            console.error(error);

            return false;

        }

    },

    /* ============================== */

    save(token,user){

        this.token = token;

        this.user = user;

        localStorage.setItem(

            STORAGE_TOKEN,

            token

        );

        localStorage.setItem(

            STORAGE_USER,

            JSON.stringify(user)

        );

    },

    /* ============================== */

    async logout(callAPI=true){

        if(

            callAPI &&

            this.token

        ){

            try{

                await fetch(

                    API_URL +

                    "/auth/logout",

                    {

                        method:"POST",

                        headers:this.getHeaders()

                    }

                );

            }

            catch(e){}

        }

        this.token = null;

        this.user = null;

        localStorage.removeItem(STORAGE_TOKEN);

        localStorage.removeItem(STORAGE_USER);

    }

};

/* ============================================= */

Auth.init();

window.NightCastAuth = Auth;

/* ============================================= */

})();
