/* ==========================================================
   NightCast Parser
   Main Entry
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
   Parser Version
   ========================================================== */

const VERSION = "2.0.0";

/* ==========================================================
   Start
   ========================================================== */

async function start() {

    log("--------------------------------");

    log("NightCast Feed Generator");

    log("Version :", VERSION);

    log("Started :", now());

    log("--------------------------------");

    try {

        await Generator.clean();

        const feed =

            await extract();

        const validated =

            validate(feed);

        await Generator.build(

            validated

        );

        log("");

        log("Feed Generated Successfully");

        log("");

    }

    catch (err) {

        error(err.message);

        process.exit(1);

    }

}


/* ==========================================================
   Execute
   ========================================================== */

start();
/* ==========================================================
   Health Check
   ========================================================== */

async function health(feed) {

    if (!feed) {

        throw new Error(

            "Feed is empty."

        );

    }

    if (!feed.channel) {

        throw new Error(

            "Channel not found."

        );

    }

    if (!feed.episodes) {

        throw new Error(

            "Episodes not found."

        );

    }

    if (feed.episodes.length === 0) {

        throw new Error(

            "No episodes found."

        );

    }

    log(

        `Channel : ${feed.channel.title}`

    );

    log(

        `Episodes : ${feed.episodes.length}`

    );

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

    log("--------------------------------");

    log("Statistics");

    log("--------------------------------");

    log(

        "Channel :", stats.channel

    );

    log(

        "Episodes :", stats.episodes

    );

    log(

        "Generated :", stats.generated

    );

    log("--------------------------------");

}


/* ==========================================================
   Continue Start()
   ========================================================== */

// بعد از extract()

await health(feed);

// بعد از validate()

printStatistics(validated);




/* ==========================================================
   Exit Success
   ========================================================== */

function success() {

    log("");

    log("====================================");

    log(" NightCast Build Completed ");

    log("====================================");

    log("");

    process.exit(0);

}

/* ==========================================================
   Exit Error
   ========================================================== */

function failure(err) {

    error("");

    error("====================================");

    error(" Build Failed ");

    error("====================================");

    error(err.message);

    error("");

    process.exit(1);

}





/* ==========================================================
   Main
   ========================================================== */

(async () => {

    try {

        await start();

        success();

    }

    catch (err) {

        failure(err);

    }

})();





/* ==========================================================
   Export
   ========================================================== */

export {

    start,

    VERSION

};

/* ==========================================================
   End Of File
   ========================================================== */














