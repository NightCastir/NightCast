/* ==========================================================
   NightCast
   Aparat RSS Extractor
   Version 4.0.0
   ========================================================== */

import Parser from "rss-parser";

import {
    createId,
    cleanText,
    formatDate,
    now,
    log
} from "../utils.js";

/* ==========================================================
   RSS
   ========================================================== */

export const RSS_URL =
    "https://www.aparat.com/rss/nightcast";

const parser = new Parser({

    timeout: 30000,

    headers: {
        "User-Agent":
            "NightCast Feed Generator"
    }

});

/* ==========================================================
   Download Feed
   ========================================================== */

async function downloadFeed(){

    log("Downloading RSS...");

    const rss =
        await parser.parseURL(RSS_URL);

    if(
        !rss ||
        !rss.items ||
        rss.items.length===0
    ){

        throw new Error(
            "RSS Feed Empty."
        );

    }

    return rss;

}

/* ==========================================================
   Channel
   ========================================================== */

function buildChannel(feed){

    return{

        title:
            feed.title || "",

        description:
            feed.description || "",

        link:
            feed.link || "",

        language:
            "fa",

        platform:
            "aparat"

    };

}

/* ==========================================================
   Extract Cover
   ========================================================== */

function getCover(item) {

    const html =
        item.contentEncoded ||
        item.description ||
        item.content ||
        "";

    const image = html.match(
        /<img[^>]+src=["']([^"']+)["']/i
    );

    if (image) {

        return image[1];

    }

    return "assets/images/default-cover.jpg";

}

/* ==========================================================
   Guess Book
   ========================================================== */

function guessBook(title = "") {

    title = cleanText(title);

    title = title
        .replace(/^پادکست صوتی/i, "")
        .replace(/^پادکست/i, "")
        .replace(/^خلاصه کتاب/i, "")
        .trim();

    return {

        title,

        author: ""

    };

}

/* ==========================================================
   Guess Duration
   ========================================================== */

function guessDuration() {

    return 0;

}

function guessDurationText() {

    return "";

}



/* ==========================================================
   Normalize One Episode
   ========================================================== */

function normalizeEpisode(item, index = 0) {

    const title = cleanText(item.title);

    const description = cleanText(item.contentSnippet);

    const published = formatDate(item.pubDate);

    const id = createId(
        item.guid ||
        item.link ||
        title
    );

    return {

        id,

        title,

        description,

        cover:
            DEFAULT_COVER,

        audio:
            item.link,

        source:{

            platform:"aparat",

            url:item.link

        },

        published_at:
            published,

        duration:
            0,

        duration_text:
            "00:00",

        book:{

            title:
                extractBookTitle(title),

            author:""

        },

        category:
            "book",

        tags:[],

        views:0,

        likes:0

    };

}

/* ==========================================================
   Normalize Feed
   ========================================================== */

function normalize(feed){

    return feed.items.map(

        (item,index)=>

            normalizeEpisode(

                item,

                index

            )

    );

}




/* ==========================================================
   Extract Feed
   ========================================================== */

export async function extract() {

    log("Downloading RSS...");

    const rss = await loadRSS();

    const episodes = normalize(rss);

    return {

        version: "3.0.0",

        generated_at: now(),

        source: {

            type: "aparat",

            url: RSS_URL

        },

        channel: extractChannel(rss),

        hero: {

            episode_id:

                episodes.length
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

/* ==========================================================
   Health
   ========================================================== */

export async function health() {

    try {

        const rss = await loadRSS();

        return {

            status: "ok",

            title: rss.title,

            items: rss.items.length

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
   Module Version
   ========================================================== */

export const VERSION = "3.0.0";

/* ==========================================================
   Public API
   ========================================================== */

export {

    RSS_URL

};

/* ==========================================================
   End Of File
   ========================================================== */




