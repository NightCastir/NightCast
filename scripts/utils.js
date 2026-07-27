/* ==========================================================
   NightCast
   Utilities
   File : scripts/utils.js
   Version : 2.0.0
   ========================================================== */

import crypto from "node:crypto";

import fs from "fs-extra";

/* ==========================================================
   Current Time
   ========================================================== */

export function now() {

    return new Date().toISOString();

}

/* ==========================================================
   Log
   ========================================================== */

export function log(...args) {

    console.log(

        "[NightCast]",

        ...args

    );

}

/* ==========================================================
   Error
   ========================================================== */

export function error(...args) {

    console.error(

        "[NightCast ERROR]",

        ...args

    );

}



/* ==========================================================
   Create Unique ID
   ========================================================== */

export function createId(value = "") {

    return crypto

        .createHash("md5")

        .update(String(value))

        .digest("hex")

        .substring(0, 16);

}

/* ==========================================================
   Clean Text
   ========================================================== */

export function cleanText(text = "") {

    return String(text)

        .replace(/<[^>]*>/g, "")

        .replace(/&nbsp;/g, " ")

        .replace(/&amp;/g, "&")

        .replace(/&quot;/g, "\"")

        .replace(/&#39;/g, "'")

        .replace(/\s+/g, " ")

        .trim();

}

/* ==========================================================
   Format Date
   ========================================================== */

export function formatDate(date) {

    if (!date) {

        return "";

    }

    try {

        return new Date(date)

            .toISOString();

    }

    catch {

        return "";

    }

       }



/* ==========================================================
   Save JSON
   ========================================================== */

export async function saveJson(

    file,

    data

) {

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

export async function readJson(

    file

) {

    return await fs.readJson(

        file

    );

}

/* ==========================================================
   File Exists
   ========================================================== */

export async function fileExists(

    file

) {

    return await fs.pathExists(

        file

    );

}



/* ==========================================================
   Ensure Directory
   ========================================================== */

export async function ensureDir(

    dir

) {

    await fs.ensureDir(

        dir

    );

}

/* ==========================================================
   Sleep
   ========================================================== */

export function sleep(

    ms = 1000

) {

    return new Promise(

        resolve =>

            setTimeout(

                resolve,

                ms

            )

    );

}

/* ==========================================================
   Version
   ========================================================== */

export const VERSION = "2.0.0";

/* ==========================================================
   Default Export
   ========================================================== */

export default {

    now,

    log,

    error,

    createId,

    cleanText,

    formatDate,

    saveJson,

    readJson,

    fileExists,

    ensureDir,

    sleep,

    VERSION

};

/* ==========================================================
   End Of File
   ========================================================== */













