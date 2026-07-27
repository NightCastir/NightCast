/* ==========================================================
   NightCast Parser
   Production Version
   ========================================================== */

import { extract } from "./extractors/aparat.js";

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

const VERSION = "3.0.0";

const APP_NAME =

    "NightCast Feed Generator";




/* ==========================================================
   Banner
   ========================================================== */

function banner() {

    log("");

    log("========================================");

    log(APP_NAME);

    log(`Version : ${VERSION}`);

    log(`Started : ${now()}`);

    log("========================================");

    log("");

}






/* ==========================================================
   Health Check
   ========================================================== */

function health(feed) {

    if (!feed) {

        throw new Error(

            "Feed is empty."

        );

    }

    if (!feed.channel) {

        throw new Error(

            "Channel information not found."

        );

    }

    if (!feed.episodes) {

        throw new Error(

            "Episodes array not found."

        );

    }

    if (feed.episodes.length === 0) {

        throw new Error(

            "No episodes extracted."

        );

    }

}










/* ==========================================================
   Statistics
   ========================================================== */

function statistics(feed) {

    return {

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

function printStatistics(feed) {

    const stats =

        statistics(feed);

    log("");

    log("========================================");

    log("Build Statistics");

    log("========================================");

    log(

        `Channel   : ${stats.channel}`

    );

    log(

        `Episodes  : ${stats.episodes}`

    );

    log(

        `Generated : ${stats.generated}`

    );

    log("========================================");

    log("");

}






/* ==========================================================
   Build Process
   ========================================================== */

async function start() {

    banner();

    try {

        log(

            "Cleaning old files..."

        );

        await Generator.clean();

        log(

            "Downloading RSS..."

        );

        const feed =

            await extract();

        health(feed);

        log(

            "Validating feed..."

        );

        const validated =

            validate(feed);

        log(

            "Generating output files..."

        );

        await Generator.build(

            validated

        );

        printStatistics(

            validated

        );

        return validated;

    }

    catch (err) {

        error("");

        error(

            "Parser Error"

        );

        error(

            err.message

        );

        error("");

        throw err;

    }

}





/* ==========================================================
   Main
   ========================================================== */

async function main() {

    try {

        await start();

        log("");

        log("========================================");

        log(" NightCast Build Completed ");

        log("========================================");

        log("");

        process.exit(0);

    }

    catch (err) {

        error("");

        error("========================================");

        error(" Build Failed ");

        error("========================================");

        error(err.message);

        error("");

        process.exit(1);

    }

}




/* ==========================================================
   Execute
   ========================================================== */

main();

























