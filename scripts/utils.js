
/* ==========================================================
   NightCast
   Shared Utilities
   File : scripts/utils.js
   Version : 4.0.0
   ========================================================== */

import fs from "fs-extra";
import crypto from "crypto";

/* ==========================================================
   Logger
   ========================================================== */

export function log(...args) {
    console.log("[NightCast]", ...args);
}

export function warn(...args) {
    console.warn("[NightCast]", ...args);
}

export function error(...args) {
    console.error("[NightCast]", ...args);
}

/* ==========================================================
   Date & Time
   ========================================================== */

export function now() {
    return new Date().toISOString();
}

export function unixTime() {
    return Math.floor(Date.now() / 1000);
}

/* ==========================================================
   Random ID
   ========================================================== */

export function randomId(length = 12) {

    return crypto
        .randomBytes(length)
        .toString("hex")
        .substring(0, length);

}

/* ==========================================================
   Create Stable ID
   ========================================================== */

export function createId(value = "") {

    return crypto
        .createHash("md5")
        .update(String(value))
        .digest("hex");

}

/* ==========================================================
   Clean Text
   ========================================================== */

export function cleanText(text = "") {

    return String(text)

        .replace(/<!\[CDATA\[/g, "")

        .replace(/\]\]>/g, "")

        .replace(/&zwnj;/g, "‌")

        .replace(/&nbsp;/g, " ")

        .replace(/&amp;/g, "&")

        .replace(/\r/g, "")

        .replace(/\n+/g, " ")

        .replace(/\t+/g, " ")

        .replace(/\s+/g, " ")

        .trim();

}

/* ==========================================================
   Date Formatter
   ========================================================== */

export function formatDate(date) {

    if (!date) {

        return now();

    }

    try {

        return new Date(date).toISOString();

    }

    catch {

        return now();

    }

}

/* ==========================================================
   Number
   ========================================================== */

export function toNumber(value, fallback = 0) {

    const n = Number(value);

    return Number.isFinite(n)

        ? n

        : fallback;

}

/* ==========================================================
   Duration
   ========================================================== */

export function secondsToText(seconds = 0) {

    seconds = toNumber(seconds);

    const h = Math.floor(seconds / 3600);

    const m = Math.floor((seconds % 3600) / 60);

    const s = Math.floor(seconds % 60);

    if (h > 0) {

        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

    }

    return `${m}:${String(s).padStart(2, "0")}`;

}

/* ==========================================================
   Slug
   ========================================================== */

export function slug(text = "") {

    return cleanText(text)

        .toLowerCase()

        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")

        .replace(/^-+/g, "")

        .replace(/-+$/g, "");

}

/* ==========================================================
   Remove Empty
   ========================================================== */

export function compact(array = []) {

    return array.filter(Boolean);

}


/* ==========================================================
   Save JSON
   ========================================================== */

import fs from "fs-extra";

export async function saveJson(file, data) {

    await fs.outputJson(

        file,

        data,

        {

            spaces: 2,

            encoding: "utf8"

        }

    );

}

/* ==========================================================
   Read JSON
   ========================================================== */

export async function readJson(file) {

    try {

        return await fs.readJson(file);

    }

    catch {

        return null;

    }

}

/* ==========================================================
   File Exists
   ========================================================== */

export async function exists(file) {

    return await fs.pathExists(file);

}

/* ==========================================================
   Write Text
   ========================================================== */

export async function saveText(file, text) {

    await fs.outputFile(

        file,

        text,

        "utf8"

    );

}

/* ==========================================================
   Ensure Directory
   ========================================================== */

export async function ensureDirectory(dir) {

    await fs.ensureDir(dir);

}

/* ==========================================================
   SHA1 Like Hash
   ========================================================== */

export function hash(text = "") {

    text = String(text);

    let value = 0;

    for (let i = 0; i < text.length; i++) {

        value = ((value << 5) - value)

            + text.charCodeAt(i);

        value |= 0;

    }

    return Math.abs(value)

        .toString(16);

}

/* ==========================================================
   Create Episode ID
   ========================================================== */

export function createId(text = "") {

    return Number(

        String(

            Math.abs(

                parseInt(

                    hash(text),

                    16

                )

            )

        ).slice(0, 10)

    );

}

/* ==========================================================
   Sort Episodes
   ========================================================== */

export function sortEpisodes(items = []) {

    return [...items].sort(

        (a, b) =>

            new Date(b.published)

            -

            new Date(a.published)

    );

}

/* ==========================================================
   Remove Duplicate Episodes
   ========================================================== */

export function uniqueEpisodes(items = []) {

    const map = new Map();

    for (const item of items) {

        if (!map.has(item.id)) {

            map.set(item.id, item);

        }

    }

    return Array.from(

        map.values()

    );

}

/* ==========================================================
   Public API
   ========================================================== */

export default {

    now,

    log,

    error,

    cleanText,

    formatDate,

    formatDuration,

    createId,

    hash,

    sortEpisodes,

    uniqueEpisodes,

    saveJson,

    readJson,

    saveText,

    ensureDirectory,

    exists

};

/* ==========================================================
   End Of File
   ========================================================== */



