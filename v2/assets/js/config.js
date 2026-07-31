/*
==========================================================
NightCast V2
Global Configuration
Version : 2.0.0
==========================================================
*/

'use strict';

const CONFIG = {

    APP: {

        NAME: "NightCast",

        VERSION: "2.0.0",

        ENV: "production",

        LANGUAGE: "fa",

        RTL: true

    },



    API: {

        BASE_URL:
            "https://nightcast-api.tomasgermany2580.workers.dev",

        TIMEOUT:
            15000

    },



    MEDIA: {

        AUDIO:
            "https://nightcastir.github.io/NightCast-Media/audio/",

        COVER:
            "https://nightcastir.github.io/NightCast-Media/cover/",

        DEFAULT_COVER:
            "assets/images/default-cover.jpg",

        DEFAULT_AVATAR:
            "assets/images/default-avatar.png"

    },



    DATA: {

        EPISODES:
            "data/episodes.json"

    },



    PLAYER: {

        AUTOPLAY: false,

        DEFAULT_SPEED: 1,

        REMEMBER_POSITION: true,

        MINI_PLAYER: true

    },



    UI: {

        THEME: "dark",

        ANIMATION: true,

        MOBILE_FIRST: true

    },



    CACHE: {

        ENABLED: true,

        VERSION: "2.0.0"

    },



    PAGINATION: {

        LIMIT: 20

    },



    SEARCH: {

        MIN_LENGTH: 2

    },



    AUTH: {

        ENABLED: true

    },



    SOCIAL: {

        WEBSITE:
            "https://nightcast.ir",

        YOUTUBE:
            "",

        TELEGRAM:
            "",

        EITAA:
            "",

        BALE:
            "",

        RUBIKA:
            "",

        SAPPLUS:
            ""

    }

};



Object.freeze(CONFIG);
