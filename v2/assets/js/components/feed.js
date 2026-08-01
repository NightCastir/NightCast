
/*
==================================================
NightCast V2
Feed Component
Version : 2.0.0
==================================================
*/

'use strict';

const Feed = {

    episodes: [],

    filteredEpisodes: [],

    loading: false,

    page: 1,

    pageSize: 20,

    hasMore: true,



    async init() {

        this.container = document.getElementById(
            "podcast-feed"
        );

        if (!this.container) {

            return;

        }

        this.showLoading();

        await this.load();

        this.initSearch();

        this.initInfiniteScroll();

        this.initPullToRefresh();
        
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

    if (!this.filteredEpisodes.length) {

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

    },



    createCard(

        episode

    ) {

        const article =
            document.createElement(
                "article"
            );

        article.className =
            "podcast-card fade-in";

        return article;

    }

};

    showEmpty() {

        this.container.innerHTML = `

<section class="empty-state fade-in">

<i class="fa-solid fa-podcast"></i>

<h2>

هنوز پادکستی منتشر نشده است

</h2>

<p>

به زودی اولین قسمت NightCast
در این بخش منتشر خواهد شد.

</p>

<button
class="btn btn-primary"
id="refreshFeed">

<i class="fa-solid fa-rotate"></i>

بروزرسانی

</button>

</section>

`;

        const btn =
            document.getElementById(
                "refreshFeed"
            );

        if (btn) {

            btn.onclick = () => {

                this.refresh();

            };

        }

    },



    showError() {

        this.container.innerHTML = `

<section class="empty-state fade-in">

<i class="fa-solid fa-triangle-exclamation"></i>

<h2>

خطا در دریافت اطلاعات

</h2>

<p>

اتصال به سرور برقرار نشد.

لطفاً دوباره تلاش کنید.

</p>

<button
class="btn btn-primary"
id="retryFeed">

<i class="fa-solid fa-arrows-rotate"></i>

تلاش مجدد

</button>

</section>

`;

        const btn =
            document.getElementById(
                "retryFeed"
            );

        if (btn) {

            btn.onclick = () => {

                this.refresh();

            };

        }

    },

    initSearch() {

        const input =
            document.querySelector(
                "#search-box input"
            );

        if (!input) {

            return;

        }

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

        keyword =

            keyword
            .trim()
            .toLowerCase();



        if (!keyword) {

            this.filteredEpisodes =

                [...this.episodes];

            this.render();

            return;

        }



        this.filteredEpisodes =

            this.episodes.filter(

                episode => {

                    const title =

                        (
                            episode.title || ""
                        ).toLowerCase();

                    const description =

                        (
                            episode.description || ""
                        ).toLowerCase();

                    const author =

                        (
                            episode.author || ""
                        ).toLowerCase();

                    return (

                        title.includes(keyword) ||

                        description.includes(keyword) ||

                        author.includes(keyword)

                    );

                }

            );



        this.render();

    },
   
initInfiniteScroll() {

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

    this.page++;

    this.render();

},
    startY: 0,

    endY: 0,



    initPullToRefresh() {

        document.addEventListener(

            "touchstart",

            e => {

                if (

                    window.scrollY === 0

                ) {

                    this.startY =

                        e.touches[0].clientY;

                }

            },

            {

                passive: true

            }

        );



        document.addEventListener(

            "touchend",

            e => {

                this.endY =

                    e.changedTouches[0].clientY;



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

    },

Object.freeze(Feed);
createCard(episode) {

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

<div class="podcast-title">

${title}

</div>



<div class="podcast-description">

${description}

</div>



<div class="podcast-meta">

<div class="meta-item">

<i class="fa-regular fa-calendar"></i>

<span>

${published}

</span>

</div>

</div>



<div class="podcast-actions">

<button
class="btn btn-primary play-btn">

<i class="fa-solid fa-play"></i>

پخش

</button>



<button
class="btn btn-secondary">

<i class="fa-regular fa-heart"></i>

</button>

</div>

</div>

`;



    const playButton =

        article.querySelector(

            ".play-btn"

        );



    if (playButton) {

        playButton.onclick = () => {

            if (

                window.Player &&

                episode.audio

            ) {

                Player.play(

                    episode

                );

            }

            else {

                console.log(

                    episode

                );

            }

        };

    }



    return article;

}
    showLoading() {

        this.container.innerHTML = "";

        for (let i = 0; i < 6; i++) {

            const card =
                document.createElement("article");

            card.className =
                "podcast-card";

            card.innerHTML = `

<div class="skeleton skeleton-cover"></div>

<div class="podcast-content">

<div class="skeleton skeleton-title"></div>

<div class="skeleton skeleton-text"></div>

<div class="skeleton skeleton-text"></div>

<div style="height:18px"></div>

<div class="skeleton"
style="height:42px;border-radius:12px;"></div>

</div>

`;

            this.container.appendChild(card);

        }

    },



    hideLoading() {

        const skeletons =
            this.container.querySelectorAll(
                ".skeleton"
            );

        skeletons.forEach(

            item => {

                item.remove();

            }

        );

    },



    refresh() {

        this.page = 1;

        this.hasMore = true;

        this.episodes = [];

        this.filteredEpisodes = [];

        this.showLoading();

        this.load();

    },
