(() => {
    "use strict";

    const API = "https://ncstgetrssfromaparat.tomasgermany2580.workers.dev";
    const episodes = document.getElementById("episodes");
    const loader = document.getElementById("loader");
    const sheet = document.getElementById("playerSheet");
    const overlay = document.getElementById("overlay");
    const title = document.getElementById("sheetTitle");
    const video = document.getElementById("videoContainer");
    const desc = document.getElementById("episodeDescription");
    const search = document.getElementById("search");
    const closeButton = document.getElementById("closeSheet");
    const listenButton = document.getElementById("listenButton");
    let allEpisodes = [];

    const asText = value => typeof value === "string" ? value : "";

    async function loadEpisodes() {
        if (loader) loader.style.display = "flex";

        try {
            const response = await fetch(API, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error("دریافت اپیزودها ناموفق بود. کد: " + response.status);

            const data = await response.json();
            allEpisodes = Array.isArray(data.episodes) ? data.episodes : [];
            showEpisodes(allEpisodes);
        } catch (error) {
            console.error("NightCast episodes load failed:", error);
            if (episodes) {
                episodes.replaceChildren();
                const message = document.createElement("p");
                message.textContent = "بارگذاری اپیزودها انجام نشد. لطفاً دوباره تلاش کنید.";
                episodes.appendChild(message);
            }
        } finally {
            if (loader) loader.style.display = "none";
        }
    }

    function showEpisodes(list) {
        if (!episodes) return;
        episodes.replaceChildren();

        if (!list.length) {
            const empty = document.createElement("p");
            empty.textContent = "موردی یافت نشد.";
            episodes.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();
        list.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";

            const body = document.createElement("div");
            body.className = "cardBody";

            const heading = document.createElement("h3");
            heading.textContent = asText(item.title) || "اپیزود بدون عنوان";

            const description = document.createElement("p");
            description.textContent = shortText(asText(item.description));

            const meta = document.createElement("div");
            meta.className = "meta";

            const published = document.createElement("span");
            published.textContent = "📅 " + date(asText(item.published));

            const source = document.createElement("span");
            source.textContent = "▶ آپارات";
            meta.append(published, source);

            const button = document.createElement("button");
            button.className = "listen";
            button.type = "button";
            button.textContent = "🎧 همین الان گوش بده";
            button.addEventListener("click", event => {
                event.stopPropagation();
                openEpisode(item);
            });

            body.append(heading, description, meta, button);
            card.appendChild(body);
            card.addEventListener("click", () => openEpisode(item));
            fragment.appendChild(card);
        });
        episodes.appendChild(fragment);
    }

    function openEpisode(item) {
        if (!sheet || !video || !title || !desc || !overlay) return;

        title.textContent = asText(item.title) || "اپیزود NightCast";
        desc.textContent = asText(item.description);
        video.replaceChildren();

        let embedUrl;
        try {
            embedUrl = new URL(asText(item.embed));
        } catch {
            const message = document.createElement("p");
            message.textContent = "نشانی پخش این اپیزود معتبر نیست.";
            video.appendChild(message);
            sheet.classList.add("show");
            overlay.classList.add("show");
            return;
        }

        if (embedUrl.protocol !== "https:" ||
            !(embedUrl.hostname === "aparat.com" || embedUrl.hostname.endsWith(".aparat.com"))) {
            const message = document.createElement("p");
            message.textContent = "نشانی پخش این اپیزود معتبر نیست.";
            video.appendChild(message);
        } else {
            const iframe = document.createElement("iframe");
            iframe.src = embedUrl.href;
            iframe.loading = "lazy";
            iframe.title = title.textContent;
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = "strict-origin-when-cross-origin";
            video.appendChild(iframe);
        }

        sheet.classList.add("show");
        overlay.classList.add("show");
    }

    function closePlayer() {
        if (sheet) sheet.classList.remove("show");
        if (overlay) overlay.classList.remove("show");
        if (video) video.replaceChildren();
    }

    if (closeButton) closeButton.addEventListener("click", closePlayer);
    if (overlay) overlay.addEventListener("click", closePlayer);
    if (listenButton && sheet) {
        listenButton.addEventListener("click", () => sheet.scrollTo({ top: 0, behavior: "smooth" }));
    }

    if (search) {
        search.addEventListener("input", function () {
            const query = this.value.trim().toLocaleLowerCase();
            showEpisodes(allEpisodes.filter(item =>
                asText(item.title).toLocaleLowerCase().includes(query) ||
                asText(item.description).toLocaleLowerCase().includes(query)
            ));
        });
    }

    function shortText(value) {
        return value.length > 170 ? value.substring(0, 170) + "…" : value;
    }

    function date(value) {
        return value
            .replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/, "")
            .replace("+0330", "")
            .trim();
    }

    loadEpisodes();
})();
