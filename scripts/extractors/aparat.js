import Parser from "rss-parser";

import {

    createId,

    cleanText,

    formatDate,

    log

} from "../utils.js";

/* ==========================================================
   RSS Configuration
   ========================================================== */

const RSS_URL =

    "https://www.aparat.com/rss/nightcast";

const rss = new Parser({

    timeout: 20000,

    headers: {

        "User-Agent":

            "NightCast RSS Reader"

    },

    customFields: {

        item: [

            ["guid", "guid"],

            ["description", "description"],

            ["content:encoded", "contentEncoded"],

            ["media:thumbnail", "thumbnail"],

            ["media:content", "media"],

            ["enclosure", "enclosure"]

        ],

        feed: [

            ["image", "image"]

        ]

    }

});



/* ==========================================================
   Download RSS
   ========================================================== */

export async function loadRSS() {

    log(

        "Connecting to Aparat RSS..."

    );

    const feed =

        await rss.parseURL(

            RSS_URL

        );

    if (

        !feed ||

        !feed.items ||

        feed.items.length === 0

    ) {

        throw new Error(

            "RSS feed is empty."

        );

    }

    log(

        `RSS Loaded (${feed.items.length} items)`

    );

    return feed;

}



/* ==========================================================
   Extract Channel
   ========================================================== */

export function extractChannel(feed) {

    return {

        title:

            feed.title || "",

        description:

            feed.description || "",

        link:

            feed.link || "",

        image:

            feed.image?.url ||

            "",

        language:

            "fa",

        platform:

            "aparat"

    };

}




/* ==========================================================
   Extract Image
   ========================================================== */

function getImage(item) {

    if (item.thumbnail?.url) {

        return item.thumbnail.url;

    }

    if (item.thumbnail?.$?.url) {

        return item.thumbnail.$.url;

    }

    if (item.media?.url) {

        return item.media.url;

    }

    if (item.media?.$?.url) {

        return item.media.$.url;

    }

    if (

        item.enclosure?.url &&

        item.enclosure.type?.startsWith("image")

    ) {

        return item.enclosure.url;

    }

    const html =

        item.contentEncoded ||

        item.description ||

        item.content ||

        "";

    const match = html.match(

        /<img[^>]+src=["']([^"']+)["']/i

    );

    if (match) {

        return match[1];

    }

    return "";

}



/* ==========================================================
   Extract Video
   ========================================================== */

function getVideoUrl(item) {

    if (item.link) {

        return item.link;

    }

    if (

        item.enclosure?.url

    ) {

        return item.enclosure.url;

    }

    return "";

}









/* ==========================================================
   Extract Description
   ========================================================== */

function getDescription(item) {

    return cleanText(

        item.contentSnippet ||

        item.description ||

        item.content ||

        item.contentEncoded ||

        ""

    );

}




/* ==========================================================
   Normalize Item
   ========================================================== */

function normalizeItem(item) {

    return {

        id:

            createId(

                item.guid ||

                item.link ||

                item.title

            ),

        title:

            cleanText(

                item.title || ""

            ),

        subtitle: "",

        description:

            getDescription(item),

        cover:

            getImage(item),

        audio:

            "",

        video:

            getVideoUrl(item),

        duration:

            "",

        published:

            formatDate(

                item.pubDate

            ),

        author:

            item.creator ||

            item.author ||

            "NightCast",

        category:

            item.categories?.[0] ||

            "",

        tags:

            item.categories ||

            [],

        source:

            item.link ||

            "",

        platform:

            "aparat",

        views: 0,

        likes: 0

    };

}








/* ==========================================================
   Validate Episode
   ========================================================== */

function isValidEpisode(episode) {

    if (!episode) {

        return false;

    }

    if (!episode.title) {

        return false;

    }

    if (!episode.video) {

        return false;

    }

    return true;

}




/* ==========================================================
   Normalize Feed
   ========================================================== */

export function normalizeFeed(feed) {

    const episodes = [];

    for (const item of feed.items) {

        try {

            const episode =

                normalizeItem(item);

            if (

                isValidEpisode(episode)

            ) {

                episodes.push(

                    episode

                );

            }

        }

        catch (err) {

            log(

                `Skip Item : ${err.message}`

            );

        }

    }

    return episodes;

}






/* ==========================================================
   Extract Episodes
   ========================================================== */

export function extractEpisodes(feed) {

    return normalizeFeed(feed);

}









/* ==========================================================
   Get Latest Episode
   ========================================================== */

export function latestEpisode(feed) {

    const episodes =

        normalizeFeed(feed);

    if (

        episodes.length === 0

    ) {

        return null;

    }

    return episodes[0];

}








/* ==========================================================
   Feed Summary
   ========================================================== */

export function feedSummary(feed) {

    const episodes =

        normalizeFeed(feed);

    return {

        total:

            episodes.length,

        latest:

            episodes[0]?.title ||

            "",

        generated:

            new Date()

                .toISOString()

    };

}



/* ==========================================================
   Statistics
   ========================================================== */

export function statistics(feed) {

    const episodes = normalizeFeed(feed);

    return {

        total: feed.items.length,

        extracted: episodes.length,

        skipped:

            feed.items.length -

            episodes.length

    };

}



/* ==========================================================
   Main Extract Function
   ========================================================== */

export async function extract() {

    try {

        log(

            "Starting Aparat Extract..."

        );

        const feed =

            await loadRSS();

        const channel =

            extractChannel(feed);

        const episodes =

            normalizeFeed(feed);

        const stats =

            statistics(feed);

        log(

            `Downloaded : ${stats.total}`

        );

        log(

            `Extracted : ${stats.extracted}`

        );

        log(

            `Skipped : ${stats.skipped}`

        );

        return {

            version: "2.1.0",

            generated_at:

                new Date().toISOString(),

            source: {

                type: "aparat",

                url: RSS_URL

            },

            channel,

            hero: {

                episode_id:

                    episodes.length > 0

                        ? episodes[0].id

                        : null

            },

            pagination: {

                page: 1,

                per_page: 10,

                has_more:

                    episodes.length > 10

            },

            episodes

        };

    }

    catch (err) {

        log(

            `Extractor Error : ${err.message}`

        );

        throw err;

    }

}


/* ==========================================================
   Health Check
   ========================================================== */

export async function health() {

    try {

        const feed =

            await loadRSS();

        const stats =

            statistics(feed);

        return {

            status: "ok",

            title:

                feed.title,

            items:

                stats.total,

            extracted:

                stats.extracted

        };

    }

    catch (err) {

        return {

            status: "error",

            message:

                err.message

        };

    }

}






/* ==========================================================
   Public API
   ========================================================== */

export {

    RSS_URL

};

/* ==========================================================
   Self Test
   ========================================================== */

export async function selfTest() {

    log(

        "Running Aparat Extractor Self Test..."

    );

    const result =

        await extract();

    log(

        `Channel : ${result.channel.title}`

    );

    log(

        `Episodes : ${result.episodes.length}`

    );

    if (

        result.episodes.length > 0

    ) {

        log(

            `Latest : ${result.episodes[0].title}`

        );

    }

    return true;

}

/* ==========================================================
   Module Version
   ========================================================== */

export const VERSION = "2.1.0";

/* ==========================================================
   End Of File
   ========================================================== */





















