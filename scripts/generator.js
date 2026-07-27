
/* ==========================================================
   NightCast Generator
   Version : 4.0.0
   ========================================================== */

import fs from "fs-extra";
import path from "path";

import {
    saveJson,
    now,
    log
} from "./utils.js";

/* ==========================================================
   Constants
   ========================================================== */

const DATA_DIR = "./data";

const FEED_FILE =
    path.join(DATA_DIR,"feed.json");

const LITE_FILE =
    path.join(DATA_DIR,"feed-lite.json");

const RAW_FILE =
    path.join(DATA_DIR,"raw-feed.json");

const SEARCH_FILE =
    path.join(DATA_DIR,"search.json");

const RSS_FILE =
    path.join(DATA_DIR,"rss.xml");

const SITEMAP_FILE =
    path.join(DATA_DIR,"sitemap-feed.xml");

/* ==========================================================
   Site Information
   ========================================================== */

const SITE={

    title:"NightCast",

    description:"رادیو خلاصه کتاب",

    language:"fa",

    direction:"rtl"

};

/* ==========================================================
   Ensure Output Folder
   ========================================================== */

async function ensureOutput(){

    await fs.ensureDir(DATA_DIR);

}




/* ==========================================================
   Generate feed.json
   ========================================================== */

async function generateFeed(feed){

    const output={

        version:"4.0.0",

        generated_at:now(),

        source:{

            type:"aparat",

            url:feed.source.url

        },

        site:SITE,

        hero:{

            episode_id:

                feed.hero?.episode_id ||

                (

                    feed.episodes.length

                        ? feed.episodes[0].id

                        : null

                )

        },

        pagination:{

            page:1,

            per_page:10,

            has_more:

                feed.episodes.length>10

        },

        episodes:

            feed.episodes

    };

    await saveJson(

        FEED_FILE,

        output

    );

}

/* ==========================================================
   Generate Raw Feed
   ========================================================== */

async function generateRaw(feed){

    await saveJson(

        RAW_FILE,

        feed

    );

           }






/* ==========================================================
   Generate feed-lite.json
   ========================================================== */

async function generateLite(feed){

    const output={

        version:"4.0.0",

        generated_at:now(),

        episodes:

            feed.episodes.map(

                episode=>({

                    id:episode.id,

                    title:episode.title,

                    cover:episode.cover,

                    description:episode.description,

                    published_at:

                        episode.published_at,

                    duration_text:

                        episode.duration_text

                })

            )

    };

    await saveJson(

        LITE_FILE,

        output

    );

}

/* ==========================================================
   Generate search.json
   ========================================================== */

async function generateSearch(feed){

    const output=

        feed.episodes.map(

            episode=>({

                id:episode.id,

                title:episode.title,

                description:

                    episode.description,

                book:

                    episode.book.title,

                published_at:

                    episode.published_at,

                cover:

                    episode.cover,

                url:

                    episode.source.url

            })

        );

    await saveJson(

        SEARCH_FILE,

        output

    );

}

/* ==========================================================
   Generate rss.xml
   ========================================================== */

async function generateRSS(feed){

    let xml="";

    xml+=`<?xml version="1.0" encoding="UTF-8"?>\n`;

    xml+=`<rss version="2.0">\n`;

    xml+=`<channel>\n`;

    xml+=`<title>${SITE.title}</title>\n`;

    xml+=`<description>${SITE.description}</description>\n`;

    xml+=`<language>fa</language>\n`;

    xml+=`<lastBuildDate>${now()}</lastBuildDate>\n`;

    for(const episode of feed.episodes){

        xml+=`<item>\n`;

        xml+=`<guid>${episode.id}</guid>\n`;

        xml+=`<title><![CDATA[${episode.title}]]></title>\n`;

        xml+=`<link>${episode.source.url}</link>\n`;

        xml+=`<description><![CDATA[${episode.description}]]></description>\n`;

        xml+=`<pubDate>${episode.published_at}</pubDate>\n`;

        xml+=`</item>\n`;

    }

    xml+=`</channel>\n`;

    xml+=`</rss>`;

    await fs.writeFile(

        RSS_FILE,

        xml,

        "utf8"

    );

}


/* ==========================================================
   Generate sitemap-feed.xml
   ========================================================== */

async function generateSitemap(feed){

    let xml="";

    xml+=`<?xml version="1.0" encoding="UTF-8"?>\n`;

    xml+=`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    xml+=`
<url>
    <loc>https://nightcast.ir/</loc>
    <lastmod>${now()}</lastmod>
</url>
`;

    for(const episode of feed.episodes){

        xml+=`
<url>
    <loc>${episode.source.url}</loc>
    <lastmod>${episode.published_at}</lastmod>
</url>
`;

    }

    xml+=`</urlset>`;

    await fs.writeFile(

        SITEMAP_FILE,

        xml,

        "utf8"

    );

}

/* ==========================================================
   Build
   ========================================================== */

export async function build(feed){

    await ensureOutput();

    log("Generating data files...");

    await generateRaw(feed);

    await generateFeed(feed);

    await generateLite(feed);

    await generateSearch(feed);

    await generateRSS(feed);

    await generateSitemap(feed);

    log("All files generated successfully.");

}

/* ==========================================================
   Clean
   ========================================================== */

export async function clean(){

    await fs.ensureDir(DATA_DIR);

}

/* ==========================================================
   Public API
   ========================================================== */

export function info(){

    return{

        folder:DATA_DIR,

        feed:FEED_FILE,

        lite:LITE_FILE,

        raw:RAW_FILE,

        search:SEARCH_FILE,

        rss:RSS_FILE,

        sitemap:SITEMAP_FILE

    };

}

/* ==========================================================
   Default Export
   ========================================================== */

export default{

    build,

    clean,

    info

};

/* ==========================================================
   End Of File
   ========================================================== */







