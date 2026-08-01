
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

        this.filteredEpisodes.forEach(

            episode => {

                this.container.appendChild(

                    this.createCard(

                        episode

                    )

                );

            }

        );

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
