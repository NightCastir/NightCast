import fs from "fs-extra";
import path from "path";

import {
    saveJson,
    now,
    log
} from "./utils.js";

/* ==========================================================
   Paths
   ========================================================== */

const DATA_DIR = "./data";

const RAW_FILE =
    path.join(DATA_DIR, "raw-feed.json");

const FEED_FILE =
    path.join(DATA_DIR, "feed.json");

const LITE_FILE =
    path.join(DATA_DIR, "feed-lite.json");

const SEARCH_FILE =
    path.join(DATA_DIR, "search.json");

const RSS_FILE =
    path.join(DATA_DIR, "rss.xml");

const SITEMAP_FILE =
    path.join(DATA_DIR, "sitemap-feed.xml");




/* ==========================================================
   Generate All
   ========================================================== */

export async function generate(feed) {

    await fs.ensureDir(DATA_DIR);

    await generateRaw(feed);

    await generateFeed(feed);

    await generateLite(feed);

    await generateSearch(feed);

    log("Generator Finished");

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
   Feed
   ========================================================== */

async function generateFeed(feed) {

    const output = {

        version: feed.version,

        generated_at: now(),

        channel: feed.channel,

        episodes: feed.episodes

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

        version: feed.version,

        generated_at: now(),

        episodes: feed.episodes.map(

            episode => ({

                id: episode.id,

                title: episode.title,

                cover: episode.cover,

                audio: episode.audio,

                video: episode.video,

                duration: episode.duration,

                published: episode.published

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

                id: episode.id,

                title: episode.title,

                subtitle: episode.subtitle,

                author: episode.author,

                category: episode.category,

                tags: episode.tags,

                published: episode.published,

                source: episode.source

            })

        );

    await saveJson(

        SEARCH_FILE,

        output

    );

}



/* ==========================================================
   Generator Info
   ========================================================== */

export function info() {

    return {

        raw: RAW_FILE,

        feed: FEED_FILE,

        lite: LITE_FILE,

        search: SEARCH_FILE,

        rss: RSS_FILE,

        sitemap: SITEMAP_FILE

    };

}




/* ==========================================================
   RSS XML
   ========================================================== */

async function generateRSS(feed) {

    let xml = "";

    xml += '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml += '<rss version="2.0">\n';

    xml += '<channel>\n';

    xml += `<title>${escape(feed.channel.title)}</title>\n`;

    xml += `<link>${feed.channel.link}</link>\n`;

    xml += `<description>${escape(feed.channel.description)}</description>\n`;

    xml += `<lastBuildDate>${now()}</lastBuildDate>\n`;

    for (const episode of feed.episodes) {

        xml += "<item>\n";

        xml += `<guid>${episode.id}</guid>\n`;

        xml += `<title>${escape(episode.title)}</title>\n`;

        xml += `<link>${episode.video}</link>\n`;

        xml += `<description>${escape(episode.description)}</description>\n`;

        xml += `<pubDate>${episode.published}</pubDate>\n`;

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

    for (const episode of feed.episodes) {

        xml += "<url>\n";

        xml += `<loc>${episode.video}</loc>\n`;

        xml += `<lastmod>${episode.published}</lastmod>\n`;

        xml += "</url>\n";

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
   Run All Generators
   ========================================================== */

export async function build(feed) {

    try {

        await generateRaw(feed);

        await generateFeed(feed);

        await generateLite(feed);

        await generateSearch(feed);

        await generateRSS(feed);

        await generateSitemap(feed);

        log("All files generated successfully.");

    }

    catch (err) {

        console.error(

            "Generator Error:",

            err.message

        );

        throw err;

    }

}

/* ==========================================================
   Clean Output Folder
   ========================================================== */

export async function clean() {

    await fs.ensureDir(DATA_DIR);

}

/* ==========================================================
   Generator Version
   ========================================================== */

export const VERSION = "2.0.0";

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















