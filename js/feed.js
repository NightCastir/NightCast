/* ==========================================================
   NightCast
   Feed Manager
   File : feed.js
   Version : 1.0.0
   ========================================================== */

"use strict";

/* ==========================================================
   Feed Manager
   ========================================================== */

const Feed = {

    url: "data/feed.json",

    cache: null,

    loading: false,

    initialized: false

};

/* ==========================================================
   Load Feed
   ========================================================== */

Feed.load = async function () {

    if (this.loading) {

        return this.cache;

    }

    this.loading = true;

    try {

        const response = await fetch(this.url, {

            cache: "no-cache"

        });

        if (!response.ok) {

            throw new Error(

                "Unable to load feed.json"

            );

        }

        const json = await response.json();

        this.validate(json);

        this.cache = json;

        this.initialized = true;

        return json;

    }

    catch (error) {

        console.error(error);

        this.showError(error);

        return null;

    }

    finally {

        this.loading = false;

    }

};

/* ==========================================================
   Reload Feed
   ========================================================== */

Feed.reload = async function () {

    this.cache = null;

    return await this.load();

};




/* ==========================================================
   Validate Feed Structure
   ========================================================== */

Feed.validate = function (data) {

    if (!data || typeof data !== "object") {

        throw new Error("Feed data is invalid.");

    }

    if (!Array.isArray(data.episodes)) {

        throw new Error("Episodes array not found.");

    }

    if (!data.site) {

        throw new Error("Site information is missing.");

    }

    if (!data.source) {

        throw new Error("Source information is missing.");

    }

    this.validateEpisodes(data.episodes);

};

/* ==========================================================
   Validate Episodes
   ========================================================== */

Feed.validateEpisodes = function (episodes) {

    episodes.forEach((episode, index) => {

        if (!episode.id) {

            console.warn(

                `Episode ${index} has no id.`

            );

        }

        if (!episode.title) {

            console.warn(

                `Episode ${index} has no title.`

            );

        }

        if (!episode.audio) {

            console.warn(

                `Episode ${index} has no audio.`

            );

        }

        if (!episode.cover) {

            console.warn(

                `Episode ${index} has no cover image.`

            );

        }

    });

};

/* ==========================================================
   Get Hero Episode
   ========================================================== */

Feed.getHero = function () {

    if (!this.cache) {

        return null;

    }

    const heroId = this.cache.hero.episode_id;

    return this.cache.episodes.find(

        item => item.id === heroId

    ) || this.cache.episodes[0];

};

/* ==========================================================
   Get Episodes
   ========================================================== */

Feed.getEpisodes = function () {

    if (!this.cache) {

        return [];

    }

    return this.cache.episodes;

};



/* ==========================================================
   Get Episode By ID
   ========================================================== */

Feed.getEpisode = function (id) {

    if (!this.cache) {

        return null;

    }

    return this.cache.episodes.find(

        episode => episode.id === id

    ) || null;

};

/* ==========================================================
   Get Latest Episode
   ========================================================== */

Feed.getLatest = function () {

    if (!this.cache) {

        return null;

    }

    return this.cache.episodes[0] || null;

};

/* ==========================================================
   Sort Episodes
   ========================================================== */

Feed.sortByDate = function () {

    if (!this.cache) {

        return [];

    }

    return this.cache.episodes.sort(

        (a, b) =>

            new Date(b.published_at) -

            new Date(a.published_at)

    );

};

/* ==========================================================
   Search Episodes
   ========================================================== */

Feed.search = function (keyword) {

    if (!this.cache) {

        return [];

    }

    keyword = keyword.trim().toLowerCase();

    return this.cache.episodes.filter(

        episode => {

            return (

                episode.title

                    ?.toLowerCase()

                    .includes(keyword)

                ||

                episode.description

                    ?.toLowerCase()

                    .includes(keyword)

                ||

                episode.book?.title

                    ?.toLowerCase()

                    .includes(keyword)

                ||

                episode.book?.author

                    ?.toLowerCase()

                    .includes(keyword)

            );

        }

    );

};

/* ==========================================================
   Filter By Tag
   ========================================================== */

Feed.filterByTag = function (tag) {

    if (!this.cache) {

        return [];

    }

    return this.cache.episodes.filter(

        episode =>

            Array.isArray(episode.tags)

            &&

            episode.tags.includes(tag)

    );

};





/* ==========================================================
   Pagination
   ========================================================== */

Feed.page = 1;

Feed.perPage = 10;

/* ==========================================================
   Get Page
   ========================================================== */

Feed.getPage = function (page = 1) {

    if (!this.cache) {

        return [];

    }

    const start = (page - 1) * this.perPage;

    const end = start + this.perPage;

    return this.cache.episodes.slice(start, end);

};

/* ==========================================================
   Load Next Page
   ========================================================== */

Feed.nextPage = function () {

    this.page++;

    return this.getPage(this.page);

};

/* ==========================================================
   Reset Pagination
   ========================================================== */

Feed.reset = function () {

    this.page = 1;

};

/* ==========================================================
   Has More Episodes
   ========================================================== */

Feed.hasMore = function () {

    if (!this.cache) {

        return false;

    }

    return (

        this.page * this.perPage

    ) < this.cache.episodes.length;

};

/* ==========================================================
   Total Episodes
   ========================================================== */

Feed.count = function () {

    if (!this.cache) {

        return 0;

    }

    return this.cache.episodes.length;

};

/* ==========================================================
   Cache Helpers
   ========================================================== */

Feed.clearCache = function () {

    this.cache = null;

    this.initialized = false;

};

Feed.isLoaded = function () {

    return this.initialized;

};

/* ==========================================================
   Last Updated
   ========================================================== */

Feed.lastUpdated = function () {

    if (!this.cache) {

        return null;

    }

    return this.cache.generated_at;

};





/* ==========================================================
   Event System
   ========================================================== */

Feed.events = {};

Feed.on = function (eventName, callback) {

    if (!this.events[eventName]) {

        this.events[eventName] = [];

    }

    this.events[eventName].push(callback);

};

Feed.emit = function (eventName, payload = null) {

    if (!this.events[eventName]) {

        return;

    }

    this.events[eventName].forEach(function (callback) {

        callback(payload);

    });

};

/* ==========================================================
   Auto Refresh
   ========================================================== */

Feed.autoRefresh = function (minutes = 30) {

    setInterval(async () => {

        await this.reload();

        this.emit("feed:updated", this.cache);

    }, minutes * 60 * 1000);

};

/* ==========================================================
   Network Status
   ========================================================== */

Feed.isOnline = function () {

    return navigator.onLine;

};

window.addEventListener("online", () => {

    Feed.emit("network:online");

});

window.addEventListener("offline", () => {

    Feed.emit("network:offline");

});

/* ==========================================================
   Error Screen
   ========================================================== */

Feed.showError = function (error) {

    const container = document.getElementById("episodes");

    if (!container) {

        return;

    }

    container.innerHTML = `

        <div class="feed-error">

            <h2>خطا در دریافت اطلاعات</h2>

            <p>${error.message}</p>

        </div>

    `;

};

/* ==========================================================
   Utilities
   ========================================================== */

Feed.formatDate = function (dateString) {

    return new Date(dateString)

        .toLocaleDateString(

            "fa-IR"

        );

};

Feed.formatDuration = function (seconds) {

    const min = Math.floor(seconds / 60);

    const sec = seconds % 60;

    return `${min}:${String(sec).padStart(2,"0")}`;

};

/* ==========================================================
   Initialize
   ========================================================== */

Feed.init = async function () {

    await this.load();

    this.emit("feed:ready", this.cache);

};

/* ==========================================================
   Global Export
   ========================================================== */

window.Feed = Feed;

/* ==========================================================
   End Of File
   ========================================================== */

