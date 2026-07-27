import Parser from "rss-parser";

import {
    createId,
    cleanText,
    formatDate,
    log
} from "../utils.js";

const rss = new Parser({

    timeout: 15000,

    customFields: {

        item: [

            ["media:thumbnail", "thumbnail"],

            ["media:content", "media"],

            ["enclosure", "enclosure"],

            ["guid", "guid"]

        ]

    }

});

const RSS_URL =

    "https://www.aparat.com/rss/nightcast";



/* ==========================================================
   Download RSS
   ========================================================== */

export async function loadRSS() {

    log(

        "Downloading RSS..."

    );

    const feed =

        await rss.parseURL(

            RSS_URL

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

            ""

    };

}



/* ==========================================================
   Extract Episodes
   ========================================================== */

export function extractEpisodes(feed) {

    const episodes = [];

    for (const item of feed.items) {

        episodes.push(

            normalizeItem(item)

        );

    }

    return episodes;

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

            cleanText(

                item.content ||

                item.contentSnippet ||

                item.summary ||

                ""

            ),

        cover:

            getThumbnail(item),

        audio: "",

        video:

            item.link || "",

        duration:

            getDuration(item),

        published:

            formatDate(

                item.pubDate

            ),

        author:

            item.creator ||

            item.author ||

            "",

        category:

            item.categories?.[0] ||

            "",

        tags:

            item.categories ||

            [],

        source:

            item.link || "",

        platform:

            "aparat",

        views: 0,

        likes: 0

    };

}


/* ==========================================================
   Thumbnail
   ========================================================== */

function getThumbnail(item) {

    if (

        item.thumbnail &&

        item.thumbnail.$ &&

        item.thumbnail.$.url

    ) {

        return item.thumbnail.$.url;

    }

    if (

        item.media &&

        item.media.$ &&

        item.media.$.url

    ) {

        return item.media.$.url;

    }

    return "";

}



/* ==========================================================
   Duration
   ========================================================== */

function getDuration(item) {

    if (item.itunes?.duration) {

        return item.itunes.duration;

    }

    if (item.duration) {

        return item.duration;

    }

    return "";

}




/* ==========================================================
   Video URL
   ========================================================== */

function getVideoUrl(item) {

    if (item.link) {

        return item.link;

    }

    if (

        item.enclosure &&

        item.enclosure.url

    ) {

        return item.enclosure.url;

    }

    return "";

}

/* ==========================================================
   Best Image
   ========================================================== */

function getBestImage(item) {

    const thumbnail = getThumbnail(item);

    if (thumbnail !== "") {

        return thumbnail;

    }

    if (

        item.enclosure &&

        item.enclosure.type &&

        item.enclosure.type.startsWith("image")

    ) {

        return item.enclosure.url;

    }

    return "";

}





/* ==========================================================
   Validate Episode
   ========================================================== */

function isValidEpisode(episode) {

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

        const episode = normalizeItem(item);

        episode.cover = getBestImage(item);

        episode.video = getVideoUrl(item);

        if (

            isValidEpisode(episode)

        ) {

            episodes.push(

                episode

            );

        }

    }

    return episodes;

}



/* ==========================================================
   Statistics
   ========================================================== */

export function statistics(feed) {

    return {

        total:

            feed.items.length,

        extracted:

            normalizeFeed(feed).length

    };

}



/* ==========================================================
   Main Extract Function
   ========================================================== */

export async function extract() {

    try {

        const feed = await loadRSS();

        const channel = extractChannel(feed);

        const episodes = normalizeFeed(feed);

        const stats = statistics(feed);

        log(

            `RSS Loaded : ${stats.total} items`

        );

        log(

            `Episodes : ${stats.extracted}`

        );

        return {

            version: "2.0",

            generated_at: new Date().toISOString(),

            source: {

                type: "aparat-rss",

                url: RSS_URL

            },

            channel,

            episodes

        };

    }

    catch (err) {

        throw new Error(

            `RSS Extract Error : ${err.message}`

        );

    }

}



/* ==========================================================
   Health Check
   ========================================================== */

export async function health() {

    try {

        const feed = await loadRSS();

        return {

            status: "ok",

            title: feed.title,

            items: feed.items.length

        };

    }

    catch (err) {

        return {

            status: "error",

            message: err.message

        };

    }

}



/* ==========================================================
   Constants
   ========================================================== */

export {

    RSS_URL

};

/* ==========================================================
   End Of File
   ========================================================== */


