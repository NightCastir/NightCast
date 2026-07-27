/* ==========================================================
   NightCast
   Aparat RSS Extractor
   Version 5.0.0
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
   Constants
   ========================================================== */

export const VERSION = "5.0.0";

export const RSS_URL =
    "https://www.aparat.com/rss/nightcast";

const DEFAULT_COVER =
    "assets/images/default-cover.jpg";

/* ==========================================================
   RSS Parser
   ========================================================== */

const parser = new Parser({

    timeout:30000,

    headers:{

        "User-Agent":

        "NightCast Feed Generator"

    }

});

/* ==========================================================
   Download RSS
   ========================================================== */

async function loadRSS(){

    log(

        "Downloading Aparat RSS..."

    );

    const rss=

        await parser.parseURL(

            RSS_URL

        );

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
   Cover
   ========================================================== */

function extractCover(item){

    const html =

        item.content ||

        item["content:encoded"] ||

        item.description ||

        "";

    const match = html.match(

        /<img[^>]+src=["']([^"']+)["']/i

    );

    if(match){

        return match[1];

    }

    return DEFAULT_COVER;

}

/* ==========================================================
   Book Information
   ========================================================== */

function extractBook(title=""){

    let book = cleanText(title);

    book = book

        .replace(/^پادکست صوتی/i,"")

        .replace(/^پادکست/i,"")

        .replace(/^خلاصه کتاب/i,"")

        .replace(/^کتاب/i,"")

        .trim();

    return{

        title:book,

        author:""

    };

}

/* ==========================================================
   Episode
   ========================================================== */

function buildEpisode(item,index=0){

    const book =

        extractBook(item.title);

    return{

        id:

            createId(

                item.guid ||

                item.link ||

                item.title ||

                index

            ),

        title:

            cleanText(

                item.title || ""

            ),

        description:

            cleanText(

                item.description ||

                ""

            ),

        cover:

            extractCover(item),

        video:

            item.link ||

            "",

        published:

            formatDate(

                item.pubDate

            ),

        duration:

            0,

        duration_text:

            "",

        book,

        category:

            "book",

        tags:[],

        author:

            "",

        platform:

            "aparat",

        views:0,

        likes:0

    };

}





/* ==========================================================
   Normalize Episodes
   ========================================================== */

function normalize(feed){

    const episodes=[];

    feed.items.forEach(

        (item,index)=>{

            try{

                episodes.push(

                    buildEpisode(

                        item,

                        index

                    )

                );

            }

            catch(err){

                log(

                    "Skip Item : " +

                    err.message

                );

            }

        }

    );

    return episodes;

}

/* ==========================================================
   Extract Feed
   ========================================================== */

export async function extract(){

    const rss=

        await loadRSS();

    const episodes=

        normalize(rss);

    return{

        version:VERSION,

        generated_at:

            now(),

        source:{

            type:"aparat",

            url:RSS_URL

        },

        channel:

            buildChannel(

                rss

            ),

        hero:{

            episode_id:

                episodes.length

                ? episodes[0].id

                : null

        },

        pagination:{

            page:1,

            per_page:10,

            has_more:

                episodes.length>10

        },

        episodes

    };

}




/* ==========================================================
   Health Check
   ========================================================== */

export async function health(){

    try{

        const rss=

            await loadRSS();

        return{

            status:"ok",

            title:

                rss.title ||

                "",

            items:

                rss.items

                ? rss.items.length

                : 0

        };

    }

    catch(err){

        return{

            status:"error",

            message:

                err.message

        };

    }

}

/* ==========================================================
   Feed Summary
   ========================================================== */

export async function summary(){

    const rss=

        await loadRSS();

    return{

        generated_at:

            now(),

        channel:

            rss.title ||

            "",

        total:

            rss.items

            ? rss.items.length

            : 0

    };

}

/* ==========================================================
   Public API
   ========================================================== */

export default{

    extract,

    health,

    summary,

    VERSION,

    RSS_URL

};

/* ==========================================================
   End Of File
   ========================================================== */



