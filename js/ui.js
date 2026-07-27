
/* ==========================================================
   NightCast
   UI Manager
   Version : 2.0.0
   ========================================================== */

"use strict";

/* ==========================================================
   UI Object
   ========================================================== */

const UI = {

    heroContainer:

        document.getElementById(

            "heroCard"

        ),

    episodesContainer:

        document.getElementById(

            "episodeList"

        ),

    loader:

        document.getElementById(

            "loading"

        ),

    empty:

        document.getElementById(

            "emptyState"

        )

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

    if (this.heroContainer) {

        this.heroContainer.innerHTML = "";

    }

    if (this.episodesContainer) {

        this.episodesContainer.innerHTML = "";

    }

};



/* ==========================================================
   Loader
   ========================================================== */

UI.showLoader = function () {

    if (this.loader) {

        this.loader.hidden = false;

    }

};

UI.hideLoader = function () {

    if (this.loader) {

        this.loader.hidden = true;

    }

};


/* ==========================================================
   Empty State
   ========================================================== */

UI.showEmpty = function () {

    if (this.empty) {

        this.empty.hidden = false;

    }

};

UI.hideEmpty = function () {

    if (this.empty) {

        this.empty.hidden = true;

    }

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
   Render Skeleton
   ========================================================== */

UI.renderSkeleton = function (

    count = 6

) {

    if (!this.episodesContainer) {

        return;

    }

    let html = "";

    for (

        let i = 0;

        i < count;

        i++

    ) {

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

    this.episodesContainer.innerHTML =

        html;

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

<article class="hero-card">

    <div class="hero-content">

        <span class="hero-badge">

            جدیدترین اپیزود

        </span>

        <h1 class="hero-title">

            ${hero.title}

        </h1>

        <p class="hero-description">

            ${hero.description || ""}

        </p>

        <div class="hero-meta">

            <div class="hero-meta-item">

                <i class="fa-regular fa-calendar"></i>

                ${Feed.formatDate(hero.published)}

            </div>

            <div class="hero-meta-item">

                <i class="fa-regular fa-clock"></i>

                ${hero.duration || ""}

            </div>

        </div>

        <div class="hero-actions">

            <a

                class="hero-play"

                href="${hero.video}"

                target="_blank"

                rel="noopener"

            >

                <i class="fa-solid fa-play"></i>

                مشاهده در آپارات

            </a>

        </div>

    </div>

    <div class="hero-media">

        <img

            src="${hero.cover}"

            alt="${hero.title}"

            loading="eager"

        >

    </div>

</article>

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

            ${episode.duration || ""}

        </span>

    </div>

    <div class="episode-body">

        <h2 class="episode-title">

            ${episode.title}

        </h2>

        <p class="episode-description">

            ${episode.description || ""}

        </p>

        <div class="episode-meta">

            <span class="episode-meta-item">

                <i class="fa-regular fa-calendar"></i>

                ${Feed.formatDate(

                    episode.published

                )}

            </span>

            <span class="episode-meta-item">

                <i class="fa-brands fa-youtube"></i>

                آپارات

            </span>

        </div>

        <div class="episode-footer">

            <a

                class="episode-play"

                href="${episode.video}"

                target="_blank"

                rel="noopener"

            >

                <i class="fa-solid fa-play"></i>

                مشاهده در آپارات

            </a>

        </div>

    </div>

</article>

`;

};



/* ==========================================================
   Render Episodes
   ========================================================== */

UI.renderEpisodes = function (

    episodes

) {

    if (

        !this.episodesContainer

    ) {

        return;

    }

    if (

        !episodes ||

        episodes.length === 0

    ) {

        this.showEmpty();

        return;

    }

    this.hideEmpty();

    this.episodesContainer.innerHTML =

        episodes

            .map(

                episode =>

                    this.createEpisodeCard(

                        episode

                    )

            )

            .join("");

};








/* ==========================================================
   Bind Events
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

UI.handleClick = function (

    event

) {

    const play =

        event.target.closest(

            ".episode-play"

        );

    if (

        !play

    ) {

        return;

    }

    event.preventDefault();

    window.open(

        play.href,

        "_blank"

    );

};





/* ==========================================================
   Scroll Hero
   ========================================================== */

UI.scrollToHero = function () {

    document

        .getElementById(

            "hero"

        )

        ?.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

};





/* ==========================================================
   Scroll Episode
   ========================================================== */

UI.scrollToEpisode = function (

    id

) {

    document

        .querySelector(

            `.episode-card[data-id="${id}"]`

        )

        ?.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });

};





/* ==========================================================
   Highlight Card
   ========================================================== */

UI.highlightPlayingCard = function (

    id

) {

    document

        .querySelectorAll(

            ".episode-card"

        )

        .forEach(

            card =>

                card.classList.remove(

                    "playing"

                )

        );

    document

        .querySelector(

            `.episode-card[data-id="${id}"]`

        )

        ?.classList.add(

            "playing"

        );

};









/* ==========================================================
   Toast
   ========================================================== */

UI.toast = function (

    message,

    type = "info"

) {

    const toast =

        document.createElement(

            "div"

        );

    toast.className =

        `toast ${type}`;

    toast.textContent =

        message;

    document.body.appendChild(

        toast

    );

    requestAnimationFrame(

        () =>

            toast.classList.add(

                "show"

            )

    );

    setTimeout(

        () => {

            toast.classList.remove(

                "show"

            );

            setTimeout(

                () =>

                    toast.remove(),

                300

            );

        },

        2500

    );

};






/* ==========================================================
   Error Screen
   ========================================================== */

UI.showError = function (

    message

) {

    if (

        !this.episodesContainer

    ) {

        return;

    }

    this.episodesContainer.innerHTML = `

<div class="feed-error">

    <h2>

        خطا در دریافت اطلاعات

    </h2>

    <p>

        ${message}

    </p>

</div>

`;

};






/* ==========================================================
   Feed Events
   ========================================================== */

Feed.on(

    "feed:ready",

    () => {

        UI.removeSkeleton();

        UI.renderHero();

        UI.renderEpisodes(

            Feed.getPage()

        );

    }

);

Feed.on(

    "feed:updated",

    () => {

        UI.refresh();

    }

);

Feed.on(

    "network:offline",

    () => {

        UI.toast(

            "اتصال اینترنت قطع شد.",

            "warning"

        );

    }

);

Feed.on(

    "network:online",

    () => {

        UI.toast(

            "اتصال اینترنت برقرار شد.",

            "success"

        );

    }

);





/* ==========================================================
   Refresh
   ========================================================== */

UI.refresh = function () {

    this.clear();

    this.renderHero();

    this.renderEpisodes(

        Feed.getPage()

    );

};




/* ==========================================================
   Start
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
   Auto Start
   ========================================================== */

UI.start();






/* ==========================================================
   End Of File
   ========================================================== */













