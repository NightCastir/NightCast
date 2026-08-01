/*
==================================================
NightCast V2
Feed Component
Version : 3.0.0
==================================================
*/

'use strict';

const Feed = {

    episodes: [],

    filteredEpisodes: [],

    page: 1,

    pageSize: 20,

    hasMore: true,

    loading: false,

    container: null,



    async init() {

        this.container =
            document.getElementById(
                "podcast-feed"
            );

        if (!this.container)
            return;

        this.loadCache();

        this.showLoading();

        await this.load();

        this.initSearch();

        this.initInfiniteScroll();

        this.initPullToRefresh();

        this.startAutoRefresh();

    },



    async load() {

        try {

            this.loading = true;

            const result =
                await FeedService.getEpisodes();

            if (
                !result ||
                !result.success
            ) {

                this.hideLoading();

                this.showError();

                return;

            }

            this.episodes =
                result.episodes || [];

            this.filteredEpisodes =
                [...this.episodes];

            if (window.Player) {

                Player.setPlaylist(
                    this.episodes
                );

            }

            this.saveCache();

            this.hideLoading();

            this.render();

        }

        catch (error) {

            console.error(error);

            this.hideLoading();

            this.showError();

        }

        finally {

            this.loading = false;

        }

    },



    render() {

        if (
            !this.filteredEpisodes.length
        ) {

            this.showEmpty();

            return;

        }

        this.container.innerHTML = "";

        const limit =
            this.page *
            this.pageSize;

        this.filteredEpisodes

            .slice(0, limit)

            .forEach(

                episode => {

                    this.container.appendChild(

                        this.createCard(
                            episode
                        )

                    );

                }

            );

        this.hasMore =

            limit <

            this.filteredEpisodes.length;

    },    createCard(episode) {

        const article =
            document.createElement(
                "article"
            );

        article.className =
            "podcast-card fade-in";



        const image =

            episode.image ||

            episode.thumbnail ||

            "assets/images/logo.png";



        const title =

            episode.title ||

            "بدون عنوان";



        const description =

            episode.description ||

            "توضیحی برای این قسمت ثبت نشده است.";



        const duration =

            episode.duration ||

            "--:--";



        const published =

            episode.published ||

            "";



        article.innerHTML = `

<div class="podcast-cover">

<img
src="${image}"
loading="lazy"
alt="${title}">

<div class="cover-play">

<i class="fa-solid fa-play"></i>

</div>

<div class="duration">

${duration}

</div>

</div>



<div class="podcast-content">

<h3 class="podcast-title">

${title}

</h3>



<p class="podcast-description">

${description}

</p>



<div class="podcast-meta">

<span>

<i class="fa-regular fa-calendar"></i>

${published}

</span>

</div>



<div class="podcast-actions">

<button
class="btn btn-primary play-btn">

<i class="fa-solid fa-play"></i>

پخش

</button>



<button
class="btn btn-secondary favorite-btn">

<i class="fa-regular fa-heart"></i>

</button>

</div>

</div>

`;



        const playButton =

            article.querySelector(

                ".play-btn"

            );



        playButton.addEventListener(

            "click",

            () => {

                if (

                    window.Player

                ) {

                    Player.play(

                        episode

                    );

                }

            }

        );



        return article;

    },    showLoading() {

        this.container.innerHTML = "";

        for (let i = 0; i < 6; i++) {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "podcast-card skeleton-card";

            card.innerHTML = `

<div class="skeleton skeleton-cover"></div>

<div class="podcast-content">

<div class="skeleton skeleton-title"></div>

<div class="skeleton skeleton-text"></div>

<div class="skeleton skeleton-text"></div>

<div class="skeleton skeleton-button"></div>

</div>

`;

            this.container.appendChild(
                card
            );

        }

    },



    hideLoading() {

        this.container
            .querySelectorAll(
                ".skeleton-card"
            )
            .forEach(

                item => {

                    item.remove();

                }

            );

    },



    showEmpty() {

        this.container.innerHTML = `

<div class="feed-state">

<i class="fa-solid fa-podcast"></i>

<h2>

هنوز پادکستی منتشر نشده است

</h2>

<p>

به زودی اولین قسمت NightCast
منتشر خواهد شد.

</p>

<button
class="btn btn-primary"
id="feedReload">

بروزرسانی

</button>

</div>

`;

        document
            .getElementById(
                "feedReload"
            )
            ?.addEventListener(

                "click",

                () => {

                    this.refresh();

                }

            );

    },



    showError() {

        this.container.innerHTML = `

<div class="feed-state">

<i class="fa-solid fa-triangle-exclamation"></i>

<h2>

خطا در دریافت اطلاعات

</h2>

<p>

ارتباط با سرور برقرار نشد.

</p>

<button
class="btn btn-primary"
id="feedRetry">

تلاش مجدد

</button>

</div>

`;

        document
            .getElementById(
                "feedRetry"
            )
            ?.addEventListener(

                "click",

                () => {

                    this.refresh();

                }

            );

    },    initSearch() {

        const input =
            document.querySelector(
                "#search-box input"
            );

        if (!input)
            return;

        input.addEventListener(

            "input",

            e => {

                this.search(

                    e.target.value

                );

            }

        );

    },



    search(keyword = "") {

        keyword = keyword
            .trim()
            .toLowerCase();

        if (!keyword) {

            this.filteredEpisodes = [

                ...this.episodes

            ];

            this.page = 1;

            this.render();

            return;

        }

        this.filteredEpisodes =

            this.episodes.filter(

                episode => {

                    const title =
                        (episode.title || "")
                        .toLowerCase();

                    const description =
                        (episode.description || "")
                        .toLowerCase();

                    const author =
                        (episode.author || "")
                        .toLowerCase();

                    return (

                        title.includes(keyword) ||

                        description.includes(keyword) ||

                        author.includes(keyword)

                    );

                }

            );

        this.page = 1;

        this.render();

    },



    refresh() {

        this.page = 1;

        this.hasMore = true;

        this.loading = false;

        this.filteredEpisodes = [];

        this.showLoading();

        this.load();

    },    initInfiniteScroll() {

        window.addEventListener(

            "scroll",

            () => {

                if (

                    this.loading ||

                    !this.hasMore

                ) {

                    return;

                }

                const scrollTop =
                    window.scrollY;

                const windowHeight =
                    window.innerHeight;

                const documentHeight =
                    document.documentElement.scrollHeight;

                if (

                    scrollTop + windowHeight >=

                    documentHeight - 300

                ) {

                    this.loadMore();

                }

            }

        );

    },



    loadMore() {

        if (

            this.loading ||

            !this.hasMore

        ) {

            return;

        }

        this.page++;

        this.render();

    },    startY: 0,

    endY: 0,



    initPullToRefresh() {

        document.addEventListener(

            "touchstart",

            (event) => {

                if (window.scrollY === 0) {

                    this.startY =

                        event.touches[0].clientY;

                }

            },

            {

                passive: true

            }

        );



        document.addEventListener(

            "touchend",

            (event) => {

                this.endY =

                    event.changedTouches[0].clientY;



                if (

                    window.scrollY === 0 &&

                    this.endY - this.startY > 120

                ) {

                    this.refresh();

                }

            },

            {

                passive: true

            }

        );

    },    saveCache() {

        try {

            localStorage.setItem(

                "nightcast_feed",

                JSON.stringify(

                    this.episodes

                )

            );



            localStorage.setItem(

                "nightcast_feed_time",

                Date.now()

            );

        }

        catch (error) {

            console.warn(

                "Cache Save Error",

                error

            );

        }

    },



    loadCache() {

        try {

            const cache =

                localStorage.getItem(

                    "nightcast_feed"

                );



            if (!cache)

                return;



            this.episodes =

                JSON.parse(cache);



            this.filteredEpisodes =

                [...this.episodes];



            this.render();

        }

        catch (error) {

            console.warn(

                "Cache Load Error",

                error

            );

        }

    },



    clearCache() {

        localStorage.removeItem(

            "nightcast_feed"

        );



        localStorage.removeItem(

            "nightcast_feed_time"

        );

    },    startAutoRefresh() {

        setInterval(

            async () => {

                if (this.loading) {

                    return;

                }

                try {

                    const result =

                        await FeedService.getEpisodes();

                    if (

                        result &&

                        result.success

                    ) {

                        this.episodes =

                            result.episodes || [];

                        this.filteredEpisodes =

                            [...this.episodes];

                        if (window.Player) {

                            Player.setPlaylist(

                                this.episodes

                            );

                        }

                        this.saveCache();

                        this.render();

                    }

                }

                catch (error) {

                    console.warn(

                        "Auto Refresh Error",

                        error

                    );

                }

            },

            300000

        );

    }

};

Object.freeze(Feed);
