const Feed = {

    endpoint: "/api/episodes",

    container: null,

    page: 1,

    loading: false,

    finished: false,

    async init() {

        this.container =
            document.getElementById("podcast-feed");

        await this.load();

        this.scroll();

    },

    async load() {

        if (this.loading) return;

        if (this.finished) return;

        this.loading = true;

        try {

            const response =
                await fetch(`${this.endpoint}?page=${this.page}`);

            const json =
                await response.json();

            if (!json.success) return;

            if (json.data.length === 0) {

                this.finished = true;

                return;

            }

            json.data.forEach(item => {

                this.render(item);

            });

            this.page++;

        }

        catch (error) {

            console.error(error);

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

<div class="podcast-cover">

<img src="${item.cover}" loading="lazy">

</div>

<div class="podcast-content">

<h2>${item.title}</h2>

<p>${item.author}</p>

</div>

`;

        this.container.append(article);

    },

    scroll() {

        window.addEventListener("scroll", async () => {

            if (

                window.innerHeight +

                window.scrollY

                >=

                document.body.offsetHeight - 600

            ) {

                await this.load();

            }

        });

    }

};
