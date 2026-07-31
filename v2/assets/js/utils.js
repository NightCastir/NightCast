
/*
==========================================================
NightCast V2
Utility Functions
Version : 2.0.0
==========================================================
*/

'use strict';

const Utils = {

    /*
    ==========================================
    DOM
    ==========================================
    */

    id(id) {
        return document.getElementById(id);
    },

    qs(selector) {
        return document.querySelector(selector);
    },

    qsa(selector) {
        return document.querySelectorAll(selector);
    },

    create(tag) {
        return document.createElement(tag);
    },



    /*
    ==========================================
    TEXT
    ==========================================
    */

    escape(text = "") {

        const div = document.createElement("div");

        div.innerText = text;

        return div.innerHTML;

    },



    /*
    ==========================================
    NUMBER
    ==========================================
    */

    number(value) {

        return new Intl.NumberFormat("fa-IR").format(value);

    },



    /*
    ==========================================
    TIME
    ==========================================
    */

    secondsToTime(seconds = 0) {

        seconds = Math.floor(seconds);

        const m = Math.floor(seconds / 60);

        const s = seconds % 60;

        return `${m}:${String(s).padStart(2, "0")}`;

    },



    /*
    ==========================================
    STORAGE
    ==========================================
    */

    save(key, value) {

        localStorage.setItem(

            key,

            JSON.stringify(value)

        );

    },



    load(key, defaultValue = null) {

        const value = localStorage.getItem(key);

        if (!value)
            return defaultValue;

        try {

            return JSON.parse(value);

        }

        catch {

            return defaultValue;

        }

    },



    remove(key) {

        localStorage.removeItem(key);

    },



    /*
    ==========================================
    CLIPBOARD
    ==========================================
    */

    async copy(text) {

        try {

            await navigator.clipboard.writeText(text);

            return true;

        }

        catch {

            return false;

        }

    },



    /*
    ==========================================
    URL
    ==========================================
    */

    open(url) {

        window.open(

            url,

            "_blank"

        );

    },



    /*
    ==========================================
    IMAGE
    ==========================================
    */

    image(url) {

        if (!url)

            return CONFIG.MEDIA.DEFAULT_COVER;

        return url;

    },



    /*
    ==========================================
    AUDIO
    ==========================================
    */

    audio(url) {

        return url;

    },



    /*
    ==========================================
    RANDOM
    ==========================================
    */

    random(min, max) {

        return Math.floor(

            Math.random()

            *

            (max - min + 1)

        ) + min;

    },



    /*
    ==========================================
    DEBOUNCE
    ==========================================
    */

    debounce(callback, delay = 300) {

        let timer;

        return (...args) => {

            clearTimeout(timer);

            timer = setTimeout(

                () => callback(...args),

                delay

            );

        };

    },



    /*
    ==========================================
    TOAST
    ==========================================
    */

    toast(message) {

        console.log(

            "[NightCast]",

            message

        );

    },



    /*
    ==========================================
    LOADER
    ==========================================
    */

    showLoader() {

        document.body.classList.add(

            "loading"

        );

    },



    hideLoader() {

        document.body.classList.remove(

            "loading"

        );

    },



    /*
    ==========================================
    THEME
    ==========================================
    */

    toggleTheme() {

        document.body.classList.toggle(

            "light"

        );

    }

};



Object.freeze(Utils);
