/* ==========================================================
   NightCast
   UI Manager
   File : ui.js
   Version : 1.0.0
   ========================================================== */

"use strict";

/* ==========================================================
   UI Object
   ========================================================== */

const UI = {

    heroContainer:

        document.getElementById("hero"),

    episodesContainer:

        document.getElementById("episodes"),

    loader:

        document.getElementById("loader"),

    empty:

        document.getElementById("empty")

};

/* ==========================================================
   Initialize
   ========================================================== */

UI.init = function () {

    this.clear();

};

/* ==========================================================
   Clear Screen
   ========================================================== */

UI.clear = function () {

    if(this.heroContainer){

        this.heroContainer.innerHTML="";

    }

    if(this.episodesContainer){

        this.episodesContainer.innerHTML="";

    }

};

/* ==========================================================
   Loading
   ========================================================== */

UI.showLoader=function(){

    if(this.loader){

        this.loader.hidden=false;

    }

};

UI.hideLoader=function(){

    if(this.loader){

        this.loader.hidden=true;

    }

};

/* ==========================================================
   Empty State
   ========================================================== */

UI.showEmpty=function(){

    if(this.empty){

        this.empty.hidden=false;

    }

};

UI.hideEmpty=function(){

    if(this.empty){

        this.empty.hidden=true;

    }

};



/* ==========================================================
   Render Hero
   ========================================================== */

UI.renderHero = function () {

    if (!this.heroContainer) {

        return;

    }

    const hero = Feed.getHero();

    if (!hero) {

        return;

    }

    this.heroContainer.innerHTML = `

<section class="hero-card">

    <div class="hero-content">

        <span class="hero-badge">

            جدیدترین اپیزود

        </span>

        <h1 class="hero-title">

            ${hero.title}

        </h1>

        <p class="hero-description">

            ${hero.description}

        </p>

        <div class="hero-meta">

            <div class="hero-meta-item">

                <i class="fa-regular fa-calendar"></i>

                ${Feed.formatDate(hero.published_at)}

            </div>

            <div class="hero-meta-item">

                <i class="fa-regular fa-clock"></i>

                ${hero.duration_text}

            </div>

            <div class="hero-meta-item">

                <i class="fa-solid fa-book"></i>

                ${hero.book.title}

            </div>

        </div>

        <div class="hero-actions">

            <button

                class="hero-play"

                data-id="${hero.id}"

            >

                <i class="fa-solid fa-play"></i>

                پخش

            </button>

        </div>

    </div>

    <div class="hero-media">

        <img

            src="${hero.cover}"

            alt="${hero.title}"

            loading="eager"

        >

    </div>

</section>

`;

};




/* ==========================================================
   Create Episode Card
   ========================================================== */

UI.createEpisodeCard = function (episode) {

    return `

<article
    class="episode-card"
    data-id="${episode.id}"
>

    <div class="episode-cover">

        <img
            src="${episode.cover}"
            alt="${episode.title}"
            loading="lazy"
        >

        <span class="episode-duration">

            ${episode.duration_text}

        </span>

        <div class="cover-play">

            <button
                class="episode-cover-play"
                data-id="${episode.id}"
                aria-label="پخش ${episode.title}"
            >

                <i class="fa-solid fa-play"></i>

            </button>

        </div>

    </div>

    <div class="episode-body">

        <h2 class="episode-title">

            ${episode.title}

        </h2>

        <p class="episode-description">

            ${episode.description}

        </p>

        <div class="episode-meta">

            <span class="episode-meta-item">

                <i class="fa-regular fa-calendar"></i>

                ${Feed.formatDate(
                    episode.published_at
                )}

            </span>

            <span class="episode-meta-item">

                <i class="fa-solid fa-book"></i>

                ${episode.book.title}

            </span>

        </div>

        <div class="episode-footer">

            <button

                class="episode-play"

                data-id="${episode.id}"

            >

                <i class="fa-solid fa-play"></i>

                پخش اپیزود

            </button>

            <a

                class="episode-link"

                href="${episode.source.url}"

                target="_blank"

                rel="noopener"

            >

                مشاهده در ایتا

            </a>

        </div>

    </div>

</article>

`;

};

/* ==========================================================
   Render Episodes
   ========================================================== */

UI.renderEpisodes = function (episodes) {

    if (!this.episodesContainer) {

        return;

    }

    if (!episodes.length) {

        this.showEmpty();

        return;

    }

    this.hideEmpty();

    const html = episodes

        .map(

            episode =>

                this.createEpisodeCard(episode)

        )

        .join("");

    this.episodesContainer.insertAdjacentHTML(

        "beforeend",

        html

    );

};



/* ==========================================================
   Bind UI Events
   ========================================================== */

UI.bindEvents = function () {

    document.addEventListener(

        "click",

        this.handleClick.bind(this)

    );

};

/* ==========================================================
   Handle Click
   ========================================================== */

UI.handleClick = function (event) {

    const playButton = event.target.closest(

        ".episode-play"

    );

    const coverButton = event.target.closest(

        ".episode-cover-play"

    );

    const heroButton = event.target.closest(

        ".hero-play"

    );

    if (playButton) {

        event.preventDefault();

        this.playEpisode(

            playButton.dataset.id

        );

        return;

    }

    if (coverButton) {

        event.preventDefault();

        this.playEpisode(

            coverButton.dataset.id

        );

        return;

    }

    if (heroButton) {

        event.preventDefault();

        this.playEpisode(

            heroButton.dataset.id

        );

        return;

    }

};

/* ==========================================================
   Play Episode
   ========================================================== */

UI.playEpisode = function (id) {

    const episode = Feed.getEpisode(

        Number(id)

    );

    if (!episode) {

        return;

    }

    this.highlightPlayingCard(id);

    Player.load(episode);

    Player.play();

};

/* ==========================================================
   Highlight Playing Card
   ========================================================== */

UI.highlightPlayingCard = function (id) {

    document

        .querySelectorAll(".episode-card")

        .forEach(card => {

            card.classList.remove(

                "playing"

            );

        });

    const active = document.querySelector(

        `.episode-card[data-id="${id}"]`

    );

    if (active) {

        active.classList.add(

            "playing"

        );

    }

};






/* ==========================================================
   Render Skeleton
   ========================================================== */

UI.renderSkeleton = function (count = 6) {

    if (!this.episodesContainer) {

        return;

    }

    let html = "";

    for (let i = 0; i < count; i++) {

        html += `

<article class="episode-card skeleton">

    <div class="episode-cover"></div>

    <div class="episode-body">

        <div class="skeleton-line title"></div>

        <div class="skeleton-line long"></div>

        <div class="skeleton-line medium"></div>

        <div class="skeleton-line short"></div>

    </div>

</article>

`;

    }

    this.episodesContainer.innerHTML = html;

};

/* ==========================================================
   Remove Skeleton
   ========================================================== */

UI.removeSkeleton = function () {

    if (!this.episodesContainer) {

        return;

    }

    this.episodesContainer.innerHTML = "";

};

/* ==========================================================
   Scroll To Hero
   ========================================================== */

UI.scrollToHero = function () {

    const hero = document.getElementById("hero");

    if (!hero) {

        return;

    }

    hero.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

};

/* ==========================================================
   Scroll To Episode
   ========================================================== */

UI.scrollToEpisode = function (id) {

    const card = document.querySelector(

        `.episode-card[data-id="${id}"]`

    );

    if (!card) {

        return;

    }

    card.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });

};

/* ==========================================================
   Toast Message
   ========================================================== */

UI.toast = function (

    message,

    type = "info"

) {

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {

        toast.classList.add("show");

    });

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 2500);

};

/* ==========================================================
   Show Error
   ========================================================== */

UI.showError = function (message) {

    if (!this.episodesContainer) {

        return;

    }

    this.episodesContainer.innerHTML = `

<div class="feed-error">

    <h2>خطایی رخ داده است</h2>

    <p>${message}</p>

</div>

`;

};


/* ==========================================================
   Feed Events
   ========================================================== */

Feed.on(

    "feed:ready",

    function () {

        UI.removeSkeleton();

        UI.renderHero();

        UI.renderEpisodes(

            Feed.getPage()

        );

    }

);

Feed.on(

    "feed:updated",

    function () {

        UI.clear();

        UI.renderHero();

        UI.renderEpisodes(

            Feed.getPage()

        );

    }

);

Feed.on(

    "network:offline",

    function () {

        UI.toast(

            "اتصال اینترنت قطع شده است.",

            "warning"

        );

    }

);

Feed.on(

    "network:online",

    function () {

        UI.toast(

            "اتصال اینترنت برقرار شد.",

            "success"

        );

    }

);

/* ==========================================================
   Refresh UI
   ========================================================== */

UI.refresh = function () {

    this.clear();

    this.renderHero();

    this.renderEpisodes(

        Feed.getPage()

    );

};

/* ==========================================================
   Initialize UI
   ========================================================== */

UI.start = function () {

    this.init();

    this.renderSkeleton();

    this.bindEvents();

};

/* ==========================================================
   Public Methods
   ========================================================== */

UI.reload = function () {

    this.refresh();

};

UI.destroy = function () {

    this.clear();

};

/* ==========================================================
   Global Export
   ========================================================== */

window.UI = UI;

/* ==========================================================
   End Of File
   ========================================================== */





