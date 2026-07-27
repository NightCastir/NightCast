import crypto from "crypto";

/* ==========================================================
   Create Hash ID
   ========================================================== */

export function createId(text) {

    return crypto
        .createHash("md5")
        .update(text)
        .digest("hex");

}

/* ==========================================================
   Clean Text
   ========================================================== */

export function cleanText(text = "") {

    return text
        .replace(/<[^>]*>/g, "")
        .replace(/\r/g, "")
        .replace(/\n+/g, "\n")
        .replace(/\t/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}

/* ==========================================================
   Decode HTML
   ========================================================== */

export function decodeHtml(text = "") {

    return text
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");

}

/* ==========================================================
   Remove Emoji
   ========================================================== */

export function removeEmoji(text = "") {

    return text.replace(

        /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,

        ""

    );

}




/* ==========================================================
   Slug
   ========================================================== */

export function slugify(text = "") {

    return cleanText(text)

        .toLowerCase()

        .replace(/[^\w\u0600-\u06FF]+/g, "-")

        .replace(/^-+|-+$/g, "");

}

/* ==========================================================
   Limit Text
   ========================================================== */

export function limit(text = "", length = 180) {

    if (text.length <= length) {

        return text;

    }

    return text.substring(0, length).trim() + "...";

}




/* ==========================================================
   Format Date
   ========================================================== */

export function formatDate(date) {

    if (!date) {

        return "";

    }

    return new Date(date).toISOString();

}

/* ==========================================================
   Validate URL
   ========================================================== */

export function isValidUrl(url = "") {

    try {

        new URL(url);

        return true;

    }

    catch {

        return false;

    }

}

/* ==========================================================
   Absolute URL
   ========================================================== */

export function absoluteUrl(base, path) {

    try {

        return new URL(path, base).href;

    }

    catch {

        return "";

    }

}

/* ==========================================================
   File Extension
   ========================================================== */

export function extension(url = "") {

    const index = url.lastIndexOf(".");

    if (index === -1) {

        return "";

    }

    return url.substring(index + 1).toLowerCase();

}




/* ==========================================================
   Remove Duplicate Objects
   ========================================================== */

export function uniqueBy(array = [], key = "id") {

    const map = new Map();

    array.forEach(item => {

        map.set(item[key], item);

    });

    return [...map.values()];

}

/* ==========================================================
   Sort By Publish Date
   ========================================================== */

export function sortEpisodes(items = []) {

    return items.sort(

        (a, b) =>

            new Date(b.published) -

            new Date(a.published)

    );

                         }




/* ==========================================================
   Safe Number
   ========================================================== */

export function toNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isNaN(number)

        ? fallback

        : number;

}


import fs from "fs-extra";

/* ==========================================================
   Save JSON
   ========================================================== */

export async function saveJson(filePath, data) {

    await fs.ensureFile(filePath);

    await fs.writeJson(

        filePath,

        data,

        {

            spaces: 2

        }

    );

}

/* ==========================================================
   Read JSON
   ========================================================== */

export async function readJson(filePath) {

    if (!(await fs.pathExists(filePath))) {

        return null;

    }

    return await fs.readJson(filePath);

}

/* ==========================================================
   Logger
   ========================================================== */

export function log(...args) {

    console.log(

        "[NightCast]",

        ...args

    );

}

export function error(...args) {

    console.error(

        "[NightCast ERROR]",

        ...args

    );

}

/* ==========================================================
   Current Time
   ========================================================== */

export function now() {

    return new Date().toISOString();

}

/* ==========================================================
   Sleep
   ========================================================== */

export function sleep(ms = 1000) {

    return new Promise(

        resolve =>

            setTimeout(resolve, ms)

    );

}

/* ==========================================================
   End Of File
   ========================================================== */

