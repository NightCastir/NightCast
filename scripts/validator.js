import {
    isValidUrl,
    cleanText,
    uniqueBy,
    sortEpisodes
} from "./utils.js";

/* ==========================================================
   Validate Feed
   ========================================================== */

export function validateFeed(feed) {

    feed.episodes =

        validateEpisodes(

            feed.episodes

        );

    feed.episodes =

        uniqueBy(

            feed.episodes,

            "id"

        );

    feed.episodes =

        sortEpisodes(

            feed.episodes

        );

    return feed;

}



/* ==========================================================
   Validate Episodes
   ========================================================== */

function validateEpisodes(episodes = []) {

    const valid = [];

    for (const episode of episodes) {

        const item =

            validateEpisode(

                episode

            );

        if (item) {

            valid.push(item);

        }

    }

    return valid;

}





/* ==========================================================
   Validate Episode
   ========================================================== */

function validateEpisode(item) {

    if (!item.id) {

        return null;

    }

    if (!item.title) {

        return null;

    }

    item.title =

        cleanText(

            item.title

        );

    item.description =

        cleanText(

            item.description

        );

    return item;

}



/* ==========================================================
   Validate URLs
   ========================================================== */

function validateUrls(item) {

    if (

        item.cover &&

        !isValidUrl(item.cover)

    ) {

        item.cover = "";

    }

    if (

        item.video &&

        !isValidUrl(item.video)

    ) {

        return null;

    }

    if (

        item.audio &&

        !isValidUrl(item.audio)

    ) {

        item.audio = "";

    }

    return item;

}

/* ==========================================================
   Validate Date
   ========================================================== */

function validateDate(item) {

    if (!item.published) {

        item.published =

            new Date().toISOString();

    }

    return item;

}






/* ==========================================================
   Validate Strings
   ========================================================== */

function validateStrings(item) {

    item.title =

        (item.title || "").trim();

    item.subtitle =

        (item.subtitle || "").trim();

    item.description =

        (item.description || "").trim();

    item.author =

        (item.author || "").trim();

    item.category =

        (item.category || "").trim();

    return item;

}


/* ==========================================================
   Continue Validation
   ========================================================== */

function validateEpisode(item) {

    if (!item.id) return null;

    if (!item.title) return null;

    item = validateStrings(item);

    item = validateUrls(item);

    if (!item) return null;

    item = validateDate(item);

    return item;

}



/* ==========================================================
   Statistics
   ========================================================== */

export function statistics(feed) {

    return {

        total: feed.episodes.length,

        generated: feed.generated_at,

        platform: feed.source.type

    };

}

/* ==========================================================
   Report
   ========================================================== */

export function report(feed) {

    const stats = statistics(feed);

    console.log("");

    console.log("===================================");

    console.log(" NightCast Validator");

    console.log("===================================");

    console.log("Platform :", stats.platform);

    console.log("Episodes :", stats.total);

    console.log("Generated:", stats.generated);

    console.log("===================================");

    console.log("");

}

/* ==========================================================
   Validate & Report
   ========================================================== */

export function validate(feed) {

    const validated = validateFeed(feed);

    report(validated);

    return validated;

}

/* ==========================================================
   End Of File
   ========================================================== */

