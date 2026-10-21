/* ==================================================

NightCast Login Controller V6

File:
users/js/login.js

Connect:
Cloudflare Worker API

Google:
- Browser: Google Identity Services
- Android: Native Credential Manager Plugin

================================================== */


(function(){

"use strict";


/* ==================================================
   CONFIG
================================================== */

const API_URL =
"https://nightcast-shield.tomasgermany2580.workers.dev/api/v1";


const GOOGLE_CLIENT_ID =
"242292157493-km4c11qgkf0lr3e6pv9paspkn95jbf3a.apps.googleusercontent.com";


/* ==================================================
   LOGIN CONTROLLER
================================================== */

const Login = {

    googleReady:false,


    /* ==================================================
       POST-LOGIN RETURN TARGET
    ================================================== */

    getPostLoginDestination(){
        const fallback = "/podcasts";
        try {
            const params = new URLSearchParams(window.location.search);
            const next = params.get("next");
            if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
            const target = new URL(next, window.location.origin);
            if (target.origin !== window.location.origin) return fallback;
            return target.pathname + target.search + target.hash;
        } catch (_) {
            return fallback;
        }
    },


    /* ==================================================
       INIT
    ================================================== */

    init(){

        console.log(
            "NightCast Login Loaded"
        );


        /*
        ==========================================
        CHECK EXISTING NIGHTCAST SESSION
        ==========================================
        */

        const token =
            localStorage.getItem(
                "NightCastToken"
            );


        const user =
            localStorage.getItem(
                "NightCastUser"
            );


        console.log(
            "Session Check:",
            {
                token: token ? "FOUND" : "NULL",
                user: user ? "FOUND" : "NULL"
            }
        );


        /*
        ==========================================
        EXISTING SESSION
        ==========================================
        */

        if(token && user){

            console.log(
                "Existing NightCast session found."
            );


            window.location.replace(
                this.getPostLoginDestination()
            );


            return;

        }


        /*
        ==========================================
        NO SESSION
        ==========================================
        */

        console.log(
            "No NightCast session found."
        );


        this.bindEvents();


        this.initGoogle();

    },


    /* ==================================================
       DETECT ANDROID CAPACITOR APP
    ================================================== */

    isAndroidApp(){

        try{

            if(
                !window.Capacitor
            ){

                return false;

            }


            /*
            Capacitor 7
            */

            if(
                typeof window.Capacitor.isNativePlatform ===
                "function"
            ){

                if(
                    !window.Capacitor.isNativePlatform()
                ){

                    return false;

                }

            }


            if(
                typeof window.Capacitor.getPlatform ===
                "function"
            ){

                return (
                    window.Capacitor.getPlatform() ===
                    "android"
                );

            }


            /*
            Fallback
            */

            return false;

        }

        catch(error){

            console.error(
                "Android platform detection failed:",
                error
            );


            return false;

        }

    },


    /* ==================================================
       GET NATIVE GOOGLE PLUGIN
    ================================================== */

    getNativeGooglePlugin(){

        try{

            if(
                !window.Capacitor
            ){

                return null;

            }


            if(
                !window.Capacitor.Plugins
            ){

                return null;

            }


            const plugin =
                window.Capacitor.Plugins.NightCastGoogleAuth;


            if(
                !plugin ||
                typeof plugin.signIn !== "function"
            ){

                return null;

            }


            return plugin;

        }

        catch(error){

            console.error(
                "NightCastGoogleAuth plugin lookup failed:",
                error
            );


            return null;

        }

    },


    /* ==================================================
       EVENTS
    ================================================== */

    bindEvents(){

        const homeButton = document.getElementById("goToIndexButton");

        if (homeButton) {
            homeButton.addEventListener("click", () => {
                window.location.assign("/podcasts");
            });
        }

    },


    /* ==================================================
       GOOGLE INITIALIZE
    ================================================== */

    initGoogle(){

        const container = document.getElementById("googleLoginButton");

        if (!container) {
            console.error("Google login button container not found");
            return;
        }

        /*
         * Show a usable, visible placeholder immediately. GIS replaces it
         * with Google's official button once the external library is ready.
         * This prevents a blank login panel when Google's script is delayed.
         */
        if (!this.isAndroidApp()) {
            container.innerHTML = "";
            const fallback = document.createElement("button");
            fallback.type = "button";
            fallback.id = "googleLoginFallback";
            fallback.className = "nightcast-google-fallback";
            fallback.innerHTML = '<span class="nightcast-google-fallback-icon" aria-hidden="true">G</span><span>ادامه با Google</span>';
            fallback.addEventListener("click", () => {
                if (window.google && window.google.accounts && window.google.accounts.id) {
                    this.setupGoogle();
                } else {
                    this.showError("سرویس ورود Google بارگذاری نشده است. اتصال اینترنت را بررسی کنید و صفحه را دوباره بارگذاری کنید.");
                }
            });
            container.appendChild(fallback);
        }

        if (this.isAndroidApp()) {
            console.log("Android Capacitor detected.");
            this.setupNativeGoogle();
            return;
        }

        console.log("Browser detected. Initializing Google Identity Services.");

        if (window.google && window.google.accounts && window.google.accounts.id) {
            this.setupGoogle();
            return;
        }

        const checker = setInterval(() => {
            if (window.google && window.google.accounts && window.google.accounts.id) {
                clearInterval(checker);
                this.setupGoogle();
            }
        }, 200);

        setTimeout(() => {
            clearInterval(checker);
            if (!this.googleReady) {
                console.error("Google Identity timeout: GIS script did not become ready.");
                this.showError("دکمه ورود نمایش داده شده، اما سرویس Google پاسخ نمی‌دهد. اتصال اینترنت یا مسدودکننده محتوا را بررسی کنید.");
            }
        }, 10000);
    },


    /* ==================================================
       BROWSER GOOGLE GIS
    ================================================== */

    setupGoogle(){

        /*
        ==========================================
        SAFETY CHECK
        ==========================================
        */

        if(
            this.isAndroidApp()
        ){

            console.warn(
                "Google Web GIS blocked inside Android."
            );


            this.setupNativeGoogle();


            return;

        }


        const container = document.getElementById("googleLoginButton");
        if (!container) {
            console.error("Google login button container not found");
            return;
        }

        google.accounts.id.initialize({

            client_id:
                GOOGLE_CLIENT_ID,

            callback:(response)=>{

                console.log(
                    "Google Web Token Received"
                );


                this.googleCallback(
                    response
                );

            }

        });


        /*
        ==========================================
        RENDER GOOGLE WEB BUTTON
        ==========================================
        */

        container.innerHTML = "";

        google.accounts.id.renderButton(

            container,

            {

                type:"standard",

                theme:"outline",

                size:"large",

                text:"continue_with",

                shape:"rectangular",

                width:320,

                logo_alignment:"left"

            }

        );


        this.googleReady = true;


        console.log(
            "Google Identity Web Ready"
        );

    },


    /* ==================================================
       NATIVE ANDROID GOOGLE BUTTON
    ================================================== */

    setupNativeGoogle(){

        const container =
            document.getElementById(
                "googleLoginButton"
            );


        if(!container){

            console.error(
                "Google login button container not found"
            );


            return;

        }


        /*
        ==========================================
        CHECK NATIVE PLUGIN
        ==========================================
        */

        const plugin =
            this.getNativeGooglePlugin();


        if(!plugin){

            console.error(
                "NightCastGoogleAuth native plugin is not available."
            );


            this.showError(
                "امکان ورود با Google در نسخه Android فراهم نیست. لطفاً نسخه برنامه را به‌روزرسانی کنید."
            );


            return;

        }


        /*
        ==========================================
        REMOVE GOOGLE WEB GIS BUTTON
        ==========================================
        */

        container.innerHTML = "";


        /*
        ==========================================
        CREATE NATIVE GOOGLE BUTTON
        ==========================================
        */

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.id =
            "nativeGoogleLogin";


        button.className =
            "nightcast-native-google-button";


        /*
        ==========================================
        BUTTON CONTENT
        ==========================================
        */

        button.innerHTML =

            '<span class="nightcast-google-icon">G</span>' +

            '<span class="nightcast-google-text">' +

            'ادامه با Google' +

            '</span>';


        /*
        ==========================================
        BASIC INLINE FALLBACK STYLE
        ==========================================
        */

        button.style.width =
            "320px";


        button.style.maxWidth =
            "100%";


        button.style.height =
            "44px";


        button.style.display =
            "flex";


        button.style.alignItems =
            "center";


        button.style.justifyContent =
            "center";


        button.style.gap =
            "12px";


        button.style.padding =
            "0 18px";


        button.style.border =
            "1px solid rgba(128,128,128,.35)";


        button.style.borderRadius =
            "6px";


        button.style.background =
            "#ffffff";


        button.style.color =
            "#202124";


        button.style.fontSize =
            "14px";


        button.style.fontWeight =
            "500";


        button.style.fontFamily =
            "inherit";


        button.style.cursor =
            "pointer";


        button.style.boxSizing =
            "border-box";


        /*
        ==========================================
        GOOGLE ICON
        ==========================================
        */

        const icon =
            button.querySelector(
                ".nightcast-google-icon"
            );


        if(icon){

            icon.style.fontSize =
                "18px";


            icon.style.fontWeight =
                "700";


            icon.style.lineHeight =
                "1";

        }


        /*
        ==========================================
        CLICK
        ==========================================
        */

        button.addEventListener(
            "click",
            ()=>{

                this.nativeGoogleSignIn();

            }
        );


        container.appendChild(
            button
        );


        this.googleReady = true;


        console.log(
            "Native Android Google Login Ready"
        );

    },


    /* ==================================================
       NATIVE GOOGLE SIGN-IN
    ================================================== */

    async nativeGoogleSignIn(){

        try{

            console.log(
                "Starting native Google Sign-In..."
            );


            this.showLoader();


            /*
            ==========================================
            GET PLUGIN
            ==========================================
            */

            const plugin =
                this.getNativeGooglePlugin();


            if(!plugin){

                throw new Error(
                    "Native Google Login Plugin در برنامه پیدا نشد."
                );

            }


            /*
            ==========================================
            DISABLE BUTTON
            ==========================================
            */

            const button =
                document.getElementById(
                    "nativeGoogleLogin"
                );


            if(button){

                button.disabled =
                    true;


                button.style.opacity =
                    "0.6";

            }


            /*
            ==========================================
            CALL ANDROID NATIVE LOGIN
            ==========================================
            */

            const result =
                await plugin.signIn();


            console.log(
                "Native Google Sign-In Result:",
                result
            );


            /*
            ==========================================
            CHECK ID TOKEN
            ==========================================
            */

            if(
                !result ||
                !result.idToken
            ){

                throw new Error(
                    "Google ID Token از Android دریافت نشد."
                );

            }


            console.log(
                "Native Google ID Token received."
            );


            /*
            ==========================================
            SEND TOKEN TO NIGHTCAST
            ==========================================
            */

            await this.loginWithGoogleToken(
                result.idToken
            );

        }

        catch(error){

            this.hideLoader();


            console.error(
                "Native Google Login Error:",
                error
            );


            let message =
                "خطا در ورود با Google";


            if(
                error &&
                error.message
            ){

                message =
                    error.message;

            }
            else if(
                typeof error === "string"
            ){

                message =
                    error;

            }


            this.showError(
                message
            );


            /*
            ==========================================
            ENABLE BUTTON AGAIN
            ==========================================
            */

            const button =
                document.getElementById(
                    "nativeGoogleLogin"
                );


            if(button){

                button.disabled =
                    false;


                button.style.opacity =
                    "1";

            }

        }

    },


    /* ==================================================
       BROWSER GOOGLE CALLBACK
    ================================================== */

    async googleCallback(response){

        try{

            /*
            ==========================================
            CHECK GOOGLE TOKEN
            ==========================================
            */

            if(
                !response ||
                !response.credential
            ){

                throw new Error(
                    "Google Token دریافت نشد."
                );

            }


            console.log(
                "Processing browser Google ID Token..."
            );


            /*
            ==========================================
            SAME BACKEND FLOW
            ==========================================
            */

            await this.loginWithGoogleToken(
                response.credential
            );

        }

        catch(error){

            this.hideLoader();


            console.error(
                "NightCast Google Login Error:",
                error
            );


            this.showError(

                error.message ||

                "خطا در ورود با Google"

            );

        }

    },


    /* ==================================================
       GOOGLE TOKEN → NIGHTCAST WORKER
    ================================================== */

    async loginWithGoogleToken(idToken){

        try{

            /*
            ==========================================
            CHECK TOKEN
            ==========================================
            */

            if(
                !idToken ||
                typeof idToken !== "string"
            ){

                throw new Error(
                    "Google ID Token معتبر نیست."
                );

            }


            /*
            ==========================================
            LOADER
            ==========================================
            */

            this.showLoader();


            console.log(
                "Sending Google ID Token to NightCast Worker..."
            );


            /*
            ==========================================
            API REQUEST
            ==========================================
            */

            const controller = new AbortController();
            const requestTimeout = window.setTimeout(() => controller.abort(), 12000);

            let result;
            try {
                result = await fetch(
                    API_URL + "/public/openid/google",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idToken, captcha: window.NightCastShield.getProof("login") }),
                        signal: controller.signal
                    }
                );
            } catch (requestError) {
                if (requestError && requestError.name === "AbortError") {
                    throw new Error("پاسخ سرور ورود بیش از ۱۲ ثانیه طول کشید. لطفاً دوباره تلاش کنید.");
                }
                throw new Error("ارتباط با سرور ورود برقرار نشد. اینترنت را بررسی کرده و دوباره تلاش کنید.");
            } finally {
                window.clearTimeout(requestTimeout);
            }


            /*
            ==========================================
            READ RESPONSE
            ==========================================
            */

            let data;


            try{

                data =
                    await result.json();

            }

            catch(error){

                throw new Error(
                    "پاسخ معتبر از NightCast دریافت نشد."
                );

            }


            /*
            ==========================================
            CHECK API RESULT
            ==========================================
            */

            if (!result.ok && result.status === 403 && window.NightCastShield) {
                await window.NightCastShield.refresh("login");
            }

            if(
                !result.ok ||
                !data.success
            ){

                throw new Error(

                    data.message ||

                    "ورود Google در NightCast ناموفق بود."

                );

            }


            /*
            ==========================================
            CHECK SESSION TOKEN
            ==========================================
            */

            if(
                !data.token
            ){

                throw new Error(
                    "Session از NightCast دریافت نشد."
                );

            }


            /*
            ==========================================
            CHECK USER
            ==========================================
            */

            if(
                !data.user
            ){

                throw new Error(
                    "اطلاعات کاربر دریافت نشد."
                );

            }


            /*
            ==========================================
            SAVE REAL NIGHTCAST SESSION
            ==========================================
            */

            this.saveSession(

                data.token,

                data.user

            );


            /*
            ==========================================
            VERIFY LOCAL STORAGE
            ==========================================
            */

            const savedToken =
                localStorage.getItem(
                    "NightCastToken"
                );


            const savedUser =
                localStorage.getItem(
                    "NightCastUser"
                );


            if(
                !savedToken ||
                !savedUser
            ){

                throw new Error(
                    "Session در NightCast ذخیره نشد."
                );

            }


            /*
            ==========================================
            SUCCESS
            ==========================================
            */

            console.log(
                "NightCast Google Login Successful"
            );


            this.hideLoader();


            /*
            ==========================================
            REDIRECT
            ==========================================
            */

            window.location.replace(
                this.getPostLoginDestination()
            );

        }

        catch(error){

            console.error(
                "NightCast Google API Login Error:",
                error
            );


            throw error;

        }

    },

    /* ==================================================
       SESSION
    ================================================== */

saveSession(token,user){

        if(!token){

            throw new Error(
                "Token خالی است."
            );

        }


        if(!user){

            throw new Error(
                "اطلاعات کاربر خالی است."
            );

        }


        /*
        ==========================================
        SAVE TOKEN
        ==========================================
        */

        localStorage.setItem(
            "NightCastToken",
            token
        );


        /*
        ==========================================
        SAVE USER
        ==========================================
        */

        localStorage.setItem(
            "NightCastUser",
            JSON.stringify(user)
        );


        console.log(
            "NightCast Session Saved"
        );

    },


    /* ==================================================
       UI - LOADER
    ================================================== */

    showLoader(){

        const loader = document.getElementById("authLoader");
        const help = document.getElementById("redirectHelp");

        if (loader) {
            loader.classList.remove("hidden");
            loader.setAttribute("aria-busy", "true");
        }

        /*
         * Fail-safe: a stalled network/API must not leave the user
         * trapped behind the full-screen loader indefinitely.
         */
        window.clearTimeout(this.loaderFailsafe);
        this.loaderFailsafe = window.setTimeout(() => {
            this.hideLoader();
            if (help) help.classList.remove("hidden");
            this.showError("اتصال بیش از حد طول کشید. می‌توانید دوباره تلاش کنید یا به صفحه اصلی بروید.");
        }, 12000);

    },


    /* ==================================================
       UI - HIDE LOADER
    ================================================== */

    hideLoader(){

        window.clearTimeout(this.loaderFailsafe);

        const loader = document.getElementById("authLoader");

        if (loader) {
            loader.classList.add("hidden");
            loader.removeAttribute("aria-busy");
        }

    },


    /* ==================================================
       UI - ERROR
    ================================================== */

    showError(message){

        const box =
            document.getElementById(
                "loginMessage"
            );


        const safeMessage =
            message ||
            "خطا در ورود به NightCast";


        if(box){

            box.textContent =
                safeMessage;

        }

        else{

            alert(
                safeMessage
            );

        }

    }

};


/* ==================================================
   GLOBAL
================================================== */

window.NightCastLogin =
    Login;


/* ==================================================
   DOM READY
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    ()=>{

        Login.init();

    }
);


})();
