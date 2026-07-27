/* ==========================================================
   NightCast Validator
   Version : 4.0.0
   ========================================================== */

import { now } from "./utils.js";

/* ==========================================================
   Helpers
   ========================================================== */

function string(value) {

    return String(value || "").trim();

}

function array(value) {

    return Array.isArray(value)

        ? value

        : [];

}

function number(value) {

    return Number(value || 0);

}

/* ==========================================================
   Episode Validation
   ========================================================== */

function validateEpisode(item) {

    if (!item) {

        return null;

    }

    if (!item.id) {

        return null;

    }

    if (!item.title) {

        return null;

    }

    if (!item.video) {

        return null;

    }

    return {

        id:

            item.id,

        title:

            string(item.title),

        subtitle:

            string(item.subtitle),

        description:

            string(item.description),

        cover:

            string(item.cover),

        audio:

            string(item.audio),

        video:

            string(item.video),

        duration:

            number(item.duration),

        duration_text:

            string(item.duration_text),

        published:

            string(item.published),

        published_at:

            string(item.published),

        author:

            string(item.author),

        category:

            string(item.category),

        tags:

            array(item.tags),

        source: {

            platform:

                "aparat",

            url:

                string(item.video)

        },

        book: {

            title:

                string(item.title),

            author:

                string(item.author)

        }

    };

}


/* ==========================================================
   Normalize Episodes
   ========================================================== */

function normalizeEpisodes(list) {

    if (!Array.isArray(list)) {

        return [];

    }

    const episodes = [];

    const ids = new Set();

    for (const item of list) {

        const episode = validateEpisode(item);

        if (!episode) {

            continue;

        }

        if (ids.has(episode.id)) {

            continue;

        }

        ids.add(episode.id);

        episodes.push(episode);

    }

    episodes.sort(

        (a, b) =>

            new Date(b.published_at) -

            new Date(a.published_at)

    );

    return episodes;

}

/* ==========================================================
   Normalize Hero
   ========================================================== */

function normalizeHero(feed, episodes) {

    if (

        feed.hero &&

        feed.hero.episode_id

    ) {

        return {

            episode_id:

                feed.hero.episode_id

        };

    }

    return {

        episode_id:

            episodes.length

                ? episodes[0].id

                : null

    };

        }


/* ==========================================================
   Normalize Feed
   ========================================================== */

export function validate(feed) {

    if (!feed) {

        throw new Error("Feed is empty.");

    }

    const episodes = normalizeEpisodes(

        feed.episodes || []

    );

    return {

        version:

            feed.version || "3.0.0",

        generated_at:

            new Date().toISOString(),

        source: {

            type:

                feed.source?.type ||

                "aparat",

            url:

                feed.source?.url ||

                "https://www.aparat.com/rss/nightcast"

        },

        channel:

            feed.channel || {

                title: "NightCast",

                description: "رادیو خلاصه کتاب",

                platform: "aparat"

            },

        hero:

            normalizeHero(

                feed,

                episodes

            ),

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
   Count
   ========================================================== */

export function count(feed) {

    if (

        !feed ||

        !Array.isArray(feed.episodes)

    ) {

        return 0;

    }

    return feed.episodes.length;

}







