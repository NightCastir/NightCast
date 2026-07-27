/* ==========================================================
   NightCast
   Feed Manager
   File : feed.js
   Version : 4.0.0
   ========================================================== */

"use strict";

/* ==========================================================
   Feed Object
   ========================================================== */

const Feed = {

    version: "4.0.0",

    url: "data/feed.json",

    data: null,

    episodes: [],

    hero: null,

    page: 1,

    perPage: 10,

    loading: false,

    initialized: false,

    cacheKey: "nightcast-feed-cache",

    listeners: {}

};

/* ==========================================================
   Event System
   ========================================================== */

Feed.on = function(event, callback){

    if(!this.listeners[event]){

        this.listeners[event]=[];

    }

    this.listeners[event].push(callback);

};

Feed.emit = function(event, payload){

    if(!this.listeners[event]){

        return;

    }

    this.listeners[event].forEach(callback=>{

        try{

            callback(payload);

        }

        catch(error){

            console.error(error);

        }

    });

};

/* ==========================================================
   Helpers
   ========================================================== */

Feed.count=function(){

    return this.episodes.length;

};

Feed.isReady=function(){

    return this.initialized;

};

Feed.isLoading=function(){

    return this.loading;

};




/* ==========================================================
   Load Feed
   ========================================================== */

Feed.load = async function () {

    this.loading = true;

    try {

        const response = await fetch(

            this.url +

            "?t=" +

            Date.now(),

            {

                cache: "no-store"

            }

        );

        if (!response.ok) {

            throw new Error(

                "Feed not found."

            );

        }

        const json =

            await response.json();

        this.data = json;

        this.episodes =

            Array.isArray(

                json.episodes

            )

                ? json.episodes

                : [];

        this.hero =

            this.getHero();

        this.page = 1;

        this.saveCache();

        this.initialized = true;

        this.loading = false;

        this.emit(

            "feed:ready",

            this.data

        );

        return this.data;

    }

    catch (err) {

        this.loading = false;

        console.error(err);

        this.restoreCache();

        if (

            this.episodes.length > 0

        ) {

            this.emit(

                "feed:ready",

                this.data

            );

            return this.data;

        }

        this.emit(

            "feed:error",

            err

        );

        throw err;

    }

};

/* ==========================================================
   Init
   ========================================================== */

Feed.init = async function () {

    return await this.load();

};








/* ==========================================================
   Save Cache
   ========================================================== */

Feed.saveCache = function () {

    try {

        localStorage.setItem(

            this.cacheKey,

            JSON.stringify(this.data)

        );

    }

    catch (error) {

        console.warn(

            "Feed cache failed.",

            error

        );

    }

};

/* ==========================================================
   Restore Cache
   ========================================================== */

Feed.restoreCache = function () {

    try {

        const cache = localStorage.getItem(

            this.cacheKey

        );

        if (!cache) {

            return false;

        }

        this.data = JSON.parse(cache);

        this.episodes =

            this.data.episodes || [];

        this.hero =

            this.getHero();

        return true;

    }

    catch (error) {

        console.warn(

            "Invalid feed cache.",

            error

        );

        return false;

    }

};

/* ==========================================================
   Reload Feed
   ========================================================== */

Feed.reload = async function () {

    this.initialized = false;

    await this.load();

    this.emit(

        "feed:updated",

        this.data

    );

};

/* ==========================================================
   Clear Cache
   ========================================================== */

Feed.clearCache = function () {

    localStorage.removeItem(

        this.cacheKey

    );

};





/* ==========================================================
   Hero
   ========================================================== */

Feed.getHero = function () {

    if (!this.episodes.length) {

        return null;

    }

    if (

        !this.data ||

        !this.data.hero ||

        !this.data.hero.episode_id

    ) {

        return this.episodes[0];

    }

    const hero = this.episodes.find(

        episode =>

            episode.id ===

            this.data.hero.episode_id

    );

    return hero || this.episodes[0];

};

/* ==========================================================
   Episodes
   ========================================================== */

Feed.getEpisodes = function () {

    return this.episodes;

};

Feed.getEpisode = function (id) {

    id = Number(id);

    return this.episodes.find(

        episode =>

            Number(episode.id) === id

    ) || null;

};

/* ==========================================================
   Pagination
   ========================================================== */

Feed.getPage = function () {

    const end =

        this.page *

        this.perPage;

    return this.episodes.slice(

        0,

        end

    );

};

Feed.hasMore = function () {

    return (

        this.page *

        this.perPage

    ) < this.episodes.length;

};

Feed.nextPage = function () {

    if (!this.hasMore()) {

        return [];

    }

    this.page++;

    return this.getPage();

};

/* ==========================================================
   First / Last
   ========================================================== */

Feed.first = function () {

    return this.episodes.length

        ? this.episodes[0]

        : null;

};

Feed.last = function () {

    return this.episodes.length

        ? this.episodes[

            this.episodes.length - 1

        ]

        : null;

};





/* ==========================================================
   Search
   ========================================================== */

Feed.search = function (keyword = "") {

    keyword = String(keyword)
        .trim()
        .toLowerCase();

    if (!keyword) {

        return this.episodes;

    }

    return this.episodes.filter(episode => {

        return [

            episode.title,

            episode.description,

            episode.author,

            episode.category,

            ...(episode.tags || [])

        ]

        .join(" ")

        .toLowerCase()

        .includes(keyword);

    });

};

/* ==========================================================
   Filter By Category
   ========================================================== */

Feed.filterByCategory = function (category = "") {

    if (!category) {

        return this.episodes;

    }

    return this.episodes.filter(

        episode =>

            episode.category === category

    );

};

/* ==========================================================
   Latest Episodes
   ========================================================== */

Feed.latest = function (count = 5) {

    return [...this.episodes]

        .sort((a, b) => {

            return new Date(b.published) -

                   new Date(a.published);

        })

        .slice(0, count);

};

/* ==========================================================
   Sort By Date
   ========================================================== */

Feed.sortNewest = function () {

    return [...this.episodes]

        .sort((a, b) =>

            new Date(b.published) -

            new Date(a.published)

        );

};

Feed.sortOldest = function () {

    return [...this.episodes]

        .sort((a, b) =>

            new Date(a.published) -

            new Date(b.published)

        );

};








/* ==========================================================
   Format Duration
   ========================================================== */

Feed.formatDuration = function (seconds = 0) {

    seconds = Number(seconds) || 0;

    const h = Math.floor(seconds / 3600);

    const m = Math.floor((seconds % 3600) / 60);

    const s = Math.floor(seconds % 60);

    if (h > 0) {

        return [

            h,

            String(m).padStart(2, "0"),

            String(s).padStart(2, "0")

        ].join(":");

    }

    return [

        m,

        String(s).padStart(2, "0")

    ].join(":");

};

/* ==========================================================
   Format Date
   ========================================================== */

Feed.formatDate = function (date) {

    if (!date) {

        return "";

    }

    try {

        return new Intl.DateTimeFormat(

            "fa-IR",

            {

                year: "numeric",

                month: "long",

                day: "numeric"

            }

        ).format(new Date(date));

    }

    catch (error) {

        return date;

    }

};

/* ==========================================================
   Relative Date
   ========================================================== */

Feed.relativeDate = function (date) {

    if (!date) {

        return "";

    }

    const now = new Date();

    const then = new Date(date);

    const diff = Math.floor(

        (now - then) / 86400000

    );

    if (diff <= 0) return "امروز";

    if (diff === 1) return "دیروز";

    if (diff < 7) return `${diff} روز پیش`;

    if (diff < 30) return `${Math.floor(diff / 7)} هفته پیش`;

    if (diff < 365) return `${Math.floor(diff / 30)} ماه پیش`;

    return `${Math.floor(diff / 365)} سال پیش`;

};

/* ==========================================================
   Exists
   ========================================================== */

Feed.exists = function (id) {

    return this.episodes.some(

        episode =>

            String(episode.id) === String(id)

    );

};





/* ==========================================================
   Refresh
   ========================================================== */

Feed.refresh = async function () {

    try {

        await this.reload();

    }

    catch (error) {

        console.error(error);

    }

};

/* ==========================================================
   Destroy
   ========================================================== */

Feed.destroy = function () {

    this.data = null;

    this.hero = null;

    this.episodes = [];

    this.page = 1;

    this.initialized = false;

};

/* ==========================================================
   Debug
   ========================================================== */

Feed.info = function () {

    console.group("NightCast Feed");

    console.log("Version :", this.version);

    console.log("Episodes :", this.count());

    console.log("Hero :", this.hero);

    console.log("Initialized :", this.initialized);

    console.log("URL :", this.url);

    console.groupEnd();

};

/* ==========================================================
   Feed Ready Event
   ========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        try {

            await Feed.init();

        }

        catch (error) {

            console.error(error);

        }

    }

);

/* ==========================================================
   Global Export
   ========================================================== */

window.Feed = Feed;

/* ==========================================================
   End Of File
   ========================================================== */
















