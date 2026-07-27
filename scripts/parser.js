/* ==========================================================
   NightCast Parser
   Version : 4.0.0
   ========================================================== */

import Extractor from "./extractors/aparat.js";

import { validate } from "./validator.js";

import Generator from "./generator.js";

import {

    log,

    error,

    now

} from "./utils.js";

/* ==========================================================
   Constants
   ========================================================== */

const VERSION = "4.0.0";

const APP_NAME =

    "NightCast Feed Generator";

/* ==========================================================
   Banner
   ========================================================== */

function banner(){

    log("");

    log("================================");

    log(APP_NAME);

    log(`Version : ${VERSION}`);

    log(`Started : ${now()}`);

    log("================================");

    log("");

}

/* ==========================================================
   Health Check
   ========================================================== */

function health(feed){

    if(!feed){

        throw new Error(
            "Feed is empty."
        );

    }

    if(!feed.channel){

        throw new Error(
            "Channel not found."
        );

    }

    if(!Array.isArray(feed.episodes)){

        throw new Error(
            "Episodes array not found."
        );

    }

    if(feed.episodes.length===0){

        throw new Error(
            "No episodes extracted."
        );

    }

}

/* ==========================================================
   Statistics
   ========================================================== */

function statistics(feed){

    return{

        channel:
            feed.channel.title,

        episodes:
            feed.episodes.length,

        generated:
            now()

    };

}

/* ==========================================================
   Print Statistics
   ========================================================== */

function printStatistics(feed){

    const stats=
        statistics(feed);

    log("");

    log("==============================");

    log("Build Statistics");

    log("==============================");

    log(
        `Channel  : ${stats.channel}`
    );

    log(
        `Episodes : ${stats.episodes}`
    );

    log(
        `Generated: ${stats.generated}`
    );

    log("==============================");

    log("");

}






