/* ==================================================
NightCast Podcasts Manager V2
/users/js/features/podcasts.js
================================================== */

const NightCastPodcasts = {

    podcasts: [],
    page: 1,
    limit: 12,
    loading: false,
    hasMore: true,

    async init() {

        this.grid =
            document.getElementById("podcastGrid");

        this.template =
            document.getElementById("podcastCardTemplate");

        if (!this.grid || !this.template) {
            return;
        }

        this.bindEvents();

        await this.load();

    },

    bindEvents() {

        const trigger =
            document.getElementById("podcastLoadingTrigger");

        if (trigger) {

            const observer =
                new IntersectionObserver(entries => {

                    if (
                        entries[0].isIntersecting &&
                        this.hasMore &&
                        !this.loading
                    ) {

                        this.page++;

                        this.load();

                    }

                });

            observer.observe(trigger);

        }

    },

    async load() {

        if (this.loading) return;

        this.loading = true;

        const result =
            await NightCastAPI.getPodcasts(
                this.page,
                this.limit
            );

        if (!result.success) {

            this.loading = false;

            NightCastUI.toast(
                "خطا در دریافت پادکست‌ها",
                "error"
            );

            return;

        }

        const items =
            result.items ||
            result.data ||
            [];

        if (items.length < this.limit) {

            this.hasMore = false;

        }

        this.podcasts.push(...items);

        this.render(items);

        this.loading = false;

    },

    render(list) {

        if (this.page === 1) {

            this.grid.innerHTML = "";

        }

        list.forEach(item => {

            const node =
                this.template.content
                .cloneNode(true);

            node.querySelector(".podcast-title")
                .textContent =
                item.title;

            node.querySelector(".podcast-author")
                .textContent =
                item.author_name || "";

            node.querySelector(".podcast-description")
                .textContent =
                item.description || "";

            node.querySelector(".podcast-image")
                .src =
                item.cover_url ||
                "/users/assets/images/default-cover.jpg";

            node.querySelector(".duration")
                .innerHTML =
                `<i class="fa-solid fa-clock"></i> ${item.duration || "--:--"}`;

            node.querySelector(".play-button")
                .onclick = () => {

                    NightCastPlayer.load(item);

                    NightCastPlayer.play();

                };

            node.querySelector(".download-button")
                .onclick = () => {

                    if (!NightCastAuth.canDownload()) {

                        NightCastAuth.openLogin();

                        return;

                    }

                    NightCastPlayer.download(item);

                };

            node.querySelector(".favorite-button")
                .onclick = () => {

                    NightCastLibrary.toggleFavorite(item.id);

                };

            node.querySelector(".comment-button")
                .onclick = () => {

                    NightCastComments.open(item.id);

                };

            this.grid.appendChild(node);

        });

    }

};

window.NightCastPodcasts = NightCastPodcasts;
