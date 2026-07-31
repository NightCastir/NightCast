/*
────────────────────────────────────────
NightCast Feed
────────────────────────────────────────
*/

'use strict';

const Feed = {

    page: 1,

    limit: 12,

    loading: false,

    finished: false,

    container: null,

    observer: null,

    async init() {

        this.container =
            document.getElementById("podcast-feed");

        await this.load();

        this.createObserver();

    },

    async load() {

        if (this.loading) return;

        if (this.finished) return;

        this.loading = true;

        try {

            const json =
                await API.getEpisodes(
                    this.page,
                    this.limit
                );

            if (!json.success)
                throw new Error(json.message);

            if (json.data.length === 0) {

                this.finished = true;

                return;

            }

            json.data.forEach(item => {

                this.render(item);

            });

            this.page++;

        }

        catch (e) {

            console.error(e);

        }

        finally {

            this.loading = false;

        }

    },

    render(item) {

        const article =
            document.createElement("article");

        article.className =
            "podcast-card";

        article.innerHTML = `

<div class="podcast-card-cover">

<img
src="${item.cover}"
alt="${item.title}"
loading="lazy">

</div>

<div class="podcast-card-body">

<h2>

${item.title}

</h2>

<p>

${item.author}

</p>

<button
class="play-button"
data-id="${item.id}">

<i class="fa-solid fa-play"></i>

</button>

</div>

`;

        this.container.append(article);

    },

    createObserver() {

        const loader =
            document.createElement("div");

        loader.id =
            "feed-loader";

        this.container.after(loader);

        this.observer =
            new IntersectionObserver(

                async entries => {

                    if (
                        entries[0].isIntersecting
                    ) {

                        await this.load();

                    }

                },

                {
                    rootMargin: "600px"
                }

            );

        this.observer.observe(loader);

    }

};
