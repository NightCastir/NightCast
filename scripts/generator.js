
/* ==========================================================
   NightCast Generator
   Production Version
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

const VERSION = "3.0.0";

const DATA_DIR = "./data";





/* ==========================================================
   Output Files
   ========================================================== */

const RAW_FILE =

    path.join(

        DATA_DIR,

        "raw-feed.json"

    );

const FEED_FILE =

    path.join(

        DATA_DIR,

        "feed.json"

    );

const LITE_FILE =

    path.join(

        DATA_DIR,

        "feed-lite.json"

    );

const SEARCH_FILE =

    path.join(

        DATA_DIR,

        "search.json"

    );

const RSS_FILE =

    path.join(

        DATA_DIR,

        "rss.xml"

    );

const SITEMAP_FILE =

    path.join(

        DATA_DIR,

        "sitemap-feed.xml"

    );





/* ==========================================================
   Site Information
   ========================================================== */

const SITE = {

    title:

        "NightCast",

    description:

        "رادیو خلاصه کتاب",

    language:

        "fa",

    direction:

        "rtl"

};





/* ==========================================================
   Ensure Folder
   ========================================================== */

async function ensureOutput() {

    await fs.ensureDir(

        DATA_DIR

    );

}








/* ==========================================================
   Generator Info
   ========================================================== */

export function info() {

    return {

        version: VERSION,

        folder: DATA_DIR,

        raw: RAW_FILE,

        feed: FEED_FILE,

        lite: LITE_FILE,

        search: SEARCH_FILE,

        rss: RSS_FILE,

        sitemap: SITEMAP_FILE

    };

}




/* ==========================================================
   Raw Feed
   ========================================================== */

async function generateRaw(feed) {

    await saveJson(

        RAW_FILE,

        feed

    );

}







/* ==========================================================
   Main Feed
   ========================================================== */

async function generateFeed(feed) {

    const output = {

        version:

            VERSION,

        generated_at:

            now(),

        source: {

            type:

                feed.source?.type ||

                "aparat",

            url:

                feed.source?.url ||

                ""

        },

        site:

            SITE,

        hero: {

            episode_id:

                feed.hero?.episode_id ||

                (

                    feed.episodes.length

                        ? feed.episodes[0].id

                        : null

                )

        },

        pagination: {

            page: 1,

            per_page: 10,

            has_more:

                feed.episodes.length > 10

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
   Feed Lite
   ========================================================== */

async function generateLite(feed) {

    const output = {

        version:

            VERSION,

        generated_at:

            now(),

        episodes:

            feed.episodes.map(

                episode => ({

                    id:

                        episode.id,

                    title:

                        episode.title,

                    cover:

                        episode.cover,

                    description:

                        episode.description,

                    duration:

                        episode.duration,

                    published:

                        episode.published,

                    video:

                        episode.video

                })

            )

    };

    await saveJson(

        LITE_FILE,

        output

    );

}




/* ==========================================================
   Search Index
   ========================================================== */

async function generateSearch(feed) {

    const output =

        feed.episodes.map(

            episode => ({

                id:

                    episode.id,

                title:

                    episode.title,

                description:

                    episode.description,

                author:

                    episode.author,

                category:

                    episode.category,

                tags:

                    episode.tags,

                published:

                    episode.published,

                cover:

                    episode.cover,

                url:

                    episode.video

            })

        );

    await saveJson(

        SEARCH_FILE,

        output

    );

}






/* ==========================================================
   RSS XML
   ========================================================== */

async function generateRSS(feed) {

    let xml = "";

    xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += "<rss version=\"2.0\">\n";
    xml += "<channel>\n";

    xml += `<title>${escape(SITE.title)}</title>\n`;
    xml += `<description>${escape(SITE.description)}</description>\n`;
    xml += `<language>fa</language>\n`;
    xml += `<lastBuildDate>${now()}</lastBuildDate>\n`;

    for (const episode of feed.episodes) {

        xml += "<item>\n";

        xml += `<guid>${episode.id}</guid>\n`;

        xml += `<title>${escape(episode.title)}</title>\n`;

        xml += `<link>${episode.video}</link>\n`;

        xml += `<description>${escape(episode.description)}</description>\n`;

        xml += `<pubDate>${episode.published}</pubDate>\n`;

        if (episode.cover) {

            xml += `<enclosure url="${episode.cover}" type="image/jpeg"/>\n`;

        }

        xml += "</item>\n";

    }

    xml += "</channel>\n";
    xml += "</rss>";

    await fs.writeFile(

        RSS_FILE,

        xml,

        "utf8"

    );

}




/* ==========================================================
   Sitemap
   ========================================================== */

async function generateSitemap(feed) {

    let xml = "";

    xml += '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    xml += `
<url>
<loc>https://nightcast.ir/</loc>
<lastmod>${now()}</lastmod>
</url>
`;

    for (const episode of feed.episodes) {

        xml += `
<url>

<loc>${episode.video}</loc>

<lastmod>${episode.published}</lastmod>

</url>
`;

    }

    xml += "</urlset>";

    await fs.writeFile(

        SITEMAP_FILE,

        xml,

        "utf8"

    );

}




/* ==========================================================
   XML Escape
   ========================================================== */

function escape(text = "") {

    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&apos;");

}



/* ==========================================================
   Build
   ========================================================== */

export async function build(feed) {

    await ensureOutput();

    log(

        "Generating data files..."

    );

    await generateRaw(feed);

    await generateFeed(feed);

    await generateLite(feed);

    await generateSearch(feed);

    await generateRSS(feed);

    await generateSitemap(feed);

    log(

        "Generator completed."

    );

}





/* ==========================================================
   Clean
   ========================================================== */

export async function clean() {

    await fs.ensureDir(

        DATA_DIR

    );

}



/* ==========================================================
   Public API
   ========================================================== */

export {

    VERSION

};










/* ==========================================================
   Default Export
   ========================================================== */

export default {

    build,

    clean,

    info,

    VERSION

};






/* ==========================================================
   End Of File
   ========================================================== */





















