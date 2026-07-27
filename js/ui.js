/* ==========================================================
   NightCast
   UI Manager
   Version : 3.0.0
   ========================================================== */

"use strict";

/* ==========================================================
   UI Object
   ========================================================== */

const UI={

    heroContainer:

        document.getElementById("heroCard"),

    episodesContainer:

        document.getElementById("episodeList"),

    loader:

        document.getElementById("loading"),

    empty:

        document.getElementById("emptyState")

};

/* ==========================================================
   Initialize
   ========================================================== */

UI.init=function(){

    this.clear();

    this.hideLoader();

    this.hideEmpty();

};

/* ==========================================================
   Clear
   ========================================================== */

UI.clear=function(){

    if(this.heroContainer){

        this.heroContainer.innerHTML="";

    }

    if(this.episodesContainer){

        this.episodesContainer.innerHTML="";

    }

};

/* ==========================================================
   Loader
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
   Skeleton
   ========================================================== */

UI.renderSkeleton=function(count=6){

    if(!this.episodesContainer){

        return;

    }

    let html="";

    for(let i=0;i<count;i++){

        html+=`

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

    this.episodesContainer.innerHTML=html;

};

/* ==========================================================
   Remove Skeleton
   ========================================================== */

UI.removeSkeleton=function(){

    if(this.episodesContainer){

        this.episodesContainer.innerHTML="";

    }

};





/* ==========================================================
   Render Hero
   ========================================================== */

UI.renderHero=function(){

    if(!this.heroContainer){

        return;

    }

    const hero=Feed.getHero();

    if(!hero){

        this.heroContainer.innerHTML="";

        return;

    }

    const cover=

        hero.cover ||

        "assets/images/default-cover.webp";

    this.heroContainer.innerHTML=`

<article class="hero-card">

    <div class="hero-content">

        <span class="hero-badge">

            جدیدترین اپیزود

        </span>

        <h1 class="hero-title">

            ${hero.title||""}

        </h1>

        <p class="hero-description">

            ${hero.description||""}

        </p>

        <div class="hero-meta">

            <span class="hero-meta-item">

                <i class="fa-regular fa-calendar"></i>

                ${Feed.formatDate(hero.published)}

            </span>

            <span class="hero-meta-item">

                <i class="fa-regular fa-clock"></i>

                ${hero.duration||""}

            </span>

        </div>

        <div class="hero-actions">

            <a

                class="hero-play"

                href="${hero.video}"

                target="_blank"

                rel="noopener"

            >

                <i class="fa-solid fa-circle-play"></i>

                مشاهده اپیزود

            </a>

        </div>

    </div>

    <div class="hero-media">

        <img

            src="${cover}"

            alt="${hero.title||""}"

            loading="eager"

            onerror="this.src='assets/images/default-cover.webp'"

        >

    </div>

</article>

`;

};

/* ==========================================================
   Episode Card
   ========================================================== */

UI.createEpisodeCard=function(episode){

    const cover=

        episode.cover ||

        "assets/images/default-cover.webp";

    return`

<article

    class="episode-card"

    data-id="${episode.id}"

>

    <div class="episode-cover">

        <img

            src="${cover}"

            alt="${episode.title||""}"

            loading="lazy"

            onerror="this.src='assets/images/default-cover.webp'"

        >

        <span class="episode-duration">

            ${episode.duration||""}

        </span>

    </div>

    <div class="episode-body">

        <h2 class="episode-title">

            ${episode.title||""}

        </h2>

        <p class="episode-description">

            ${episode.description||""}

        </p>

        <div class="episode-meta">

            <span class="episode-meta-item">

                <i class="fa-regular fa-calendar"></i>

                ${Feed.formatDate(

                    episode.published

                )}

            </span>

            <span class="episode-meta-item">

                <i class="fa-solid fa-podcast"></i>

                NightCast

            </span>

        </div>

        <div class="episode-footer">

            <a

                class="episode-play"

                href="${episode.video}"

                target="_blank"

                rel="noopener"

            >

                <i class="fa-solid fa-circle-play"></i>

                مشاهده اپیزود

            </a>

        </div>

    </div>

</article>

`;

};

/* ==========================================================
   Render Episodes
   ========================================================== */

UI.renderEpisodes=function(episodes){

    if(!this.episodesContainer){

        return;

    }

    if(

        !episodes ||

        episodes.length===0

    ){

        this.showEmpty();

        return;

    }

    this.hideEmpty();

    this.episodesContainer.innerHTML=

        episodes

            .map(

                episode=>

                    this.createEpisodeCard(

                        episode

                    )

            )

            .join("");

}





/* ==========================================================
   Bind Events
   ========================================================== */

UI.bindEvents=function(){

    document.addEventListener(

        "click",

        this.handleClick.bind(this)

    );

};

/* ==========================================================
   Handle Click
   ========================================================== */

UI.handleClick=function(event){

    const play=

        event.target.closest(

            ".episode-play"

        );

    if(!play){

        return;

    }

    event.preventDefault();

    window.open(

        play.href,

        "_blank",

        "noopener"

    );

};

/* ==========================================================
   Scroll Helpers
   ========================================================== */

UI.scrollToHero=function(){

    document

        .getElementById("hero")

        ?.scrollIntoView({

            behavior:"smooth",

            block:"start"

        });

};

UI.scrollToEpisode=function(id){

    document

        .querySelector(

            `.episode-card[data-id="${id}"]`

        )

        ?.scrollIntoView({

            behavior:"smooth",

            block:"center"

        });

};

/* ==========================================================
   Highlight Playing Card
   ========================================================== */

UI.highlightPlayingCard=function(id){

    document

        .querySelectorAll(

            ".episode-card"

        )

        .forEach(card=>{

            card.classList.remove(

                "playing"

            );

        });

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

UI.toast=function(

    message,

    type="info"

){

    const toast=

        document.createElement(

            "div"

        );

    toast.className=

        `toast ${type}`;

    toast.textContent=

        message;

    document.body.appendChild(

        toast

    );

    requestAnimationFrame(()=>{

        toast.classList.add(

            "show"

        );

    });

    setTimeout(()=>{

        toast.classList.remove(

            "show"

        );

        setTimeout(()=>{

            toast.remove();

        },300);

    },2500);

};

/* ==========================================================
   Error Screen
   ========================================================== */

UI.showError=function(message){

    if(!this.episodesContainer){

        return;

    }

    this.episodesContainer.innerHTML=`

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
   Refresh
   ========================================================== */

UI.refresh=function(){

    this.clear();

    this.renderHero();

    this.renderEpisodes(

        Feed.getPage()

    );

};






/* ==========================================================
   Feed Events
   ========================================================== */

if(window.Feed){

    Feed.on(

        "feed:ready",

        ()=>{

            UI.hideLoader();

            UI.removeSkeleton();

            UI.renderHero();

            UI.renderEpisodes(

                Feed.getPage()

            );

        }

    );

    Feed.on(

        "feed:updated",

        ()=>{

            UI.refresh();

        }

    );

    Feed.on(

        "network:offline",

        ()=>{

            UI.toast(

                "اتصال اینترنت قطع شد.",

                "warning"

            );

        }

    );

    Feed.on(

        "network:online",

        ()=>{

            UI.toast(

                "اتصال اینترنت برقرار شد.",

                "success"

            );

        }

    );

}

/* ==========================================================
   Start
   ========================================================== */

UI.start=function(){

    this.init();

    this.showLoader();

    this.renderSkeleton();

    this.bindEvents();

};

/* ==========================================================
   Reload
   ========================================================== */

UI.reload=function(){

    this.refresh();

};

/* ==========================================================
   Destroy
   ========================================================== */

UI.destroy=function(){

    this.clear();

};

/* ==========================================================
   Global Export
   ========================================================== */

window.UI=UI;

/* ==========================================================
   End Of File
   ========================================================== */



