/* ==========================================================
   NightCast
   Infinite Scroll
   File : infinite-scroll.js
   Version : 1.0.0
   ========================================================== */

"use strict";

/* ==========================================================
   Infinite Scroll Object
   ========================================================== */

const InfiniteScroll = {

    observer : null,

    sentinel : null,

    loading : false,

    finished : false

};

/* ==========================================================
   Initialize
   ========================================================== */

InfiniteScroll.init = function(){

    this.sentinel =

        document.getElementById(

            "scroll-sentinel"

        );

    if(!this.sentinel){

        return;

    }

    this.createObserver();

};

/* ==========================================================
   Create Observer
   ========================================================== */

InfiniteScroll.createObserver = function(){

    this.observer =

        new IntersectionObserver(

            this.handleIntersect.bind(this),

            {

                root:null,

                rootMargin:"300px",

                threshold:0

            }

        );

    this.observer.observe(

        this.sentinel

    );

};





/* ==========================================================
   Handle Intersection
   ========================================================== */

InfiniteScroll.handleIntersect = function(entries){

    entries.forEach(entry=>{

        if(

            entry.isIntersecting

        ){

            this.loadMore();

        }

    });

};


/* ==========================================================
   Load More Episodes
   ========================================================== */

InfiniteScroll.loadMore = async function(){

    if(this.loading){

        return;

    }

    if(this.finished){

        return;

    }

    if(!Feed.hasMore()){

        this.finished = true;

        this.disconnect();

        return;

    }

    this.loading = true;

    UI.showLoader();

    try{

        await this.appendNextPage();

    }

    catch(error){

        console.error(error);

        UI.toast(

            "خطا در بارگذاری اپیزودها",

            "error"

        );

    }

    finally{

        this.loading = false;

        UI.hideLoader();

    }

};

/* ==========================================================
   Append Next Page
   ========================================================== */

InfiniteScroll.appendNextPage = async function(){

    const episodes = Feed.nextPage();

    if(

        !episodes ||

        episodes.length === 0

    ){

        this.finished = true;

        this.disconnect();

        return;

    }

    UI.renderEpisodes(

        episodes

    );

};

/* ==========================================================
   Has Finished
   ========================================================== */

InfiniteScroll.isFinished = function(){

    return this.finished;

};





/* ==========================================================
   Reset
   ========================================================== */

InfiniteScroll.reset = function(){

    this.loading = false;

    this.finished = false;

    Feed.reset();

};

/* ==========================================================
   Disconnect Observer
   ========================================================== */

InfiniteScroll.disconnect = function(){

    if(this.observer){

        this.observer.disconnect();

    }

};





/* ==========================================================
   Feed Events
   ========================================================== */

Feed.on(

    "feed:ready",

    () => {

        InfiniteScroll.reset();

        InfiniteScroll.init();

    }

);

Feed.on(

    "feed:updated",

    () => {

        InfiniteScroll.reset();

        InfiniteScroll.disconnect();

        InfiniteScroll.init();

    }

);

/* ==========================================================
   Prevent Multiple Loads
   ========================================================== */

InfiniteScroll.queue = false;

InfiniteScroll.safeLoad = function(){

    if(this.queue){

        return;

    }

    this.queue = true;

    requestAnimationFrame(

        async ()=>{

            await this.loadMore();

            this.queue = false;

        }

    );

};

/* ==========================================================
   Resume Observer
   ========================================================== */

InfiniteScroll.resume = function(){

    if(

        this.observer &&

        this.sentinel

    ){

        this.observer.observe(

            this.sentinel

        );

    }

};

/* ==========================================================
   Pause Observer
   ========================================================== */

InfiniteScroll.pause = function(){

    this.disconnect();

};

/* ==========================================================
   Visibility
   ========================================================== */

document.addEventListener(

    "visibilitychange",

    ()=>{

        if(document.hidden){

            InfiniteScroll.pause();

        }

        else{

            InfiniteScroll.resume();

        }

    }

);

/* ==========================================================
   Window Focus
   ========================================================== */

window.addEventListener(

    "focus",

    ()=>{

        InfiniteScroll.resume();

    }

);





/* ==========================================================
   Network Events
   ========================================================== */

window.addEventListener(

    "offline",

    ()=>{

        InfiniteScroll.pause();

    }

);

window.addEventListener(

    "online",

    ()=>{

        InfiniteScroll.resume();

    }

);




/* ==========================================================
   Rebuild Observer
   ========================================================== */

InfiniteScroll.rebuild = function () {

    this.disconnect();

    this.finished = false;

    this.loading = false;

    this.queue = false;

    this.init();

};

/* ==========================================================
   Destroy
   ========================================================== */

InfiniteScroll.destroy = function () {

    this.disconnect();

    this.loading = false;

    this.finished = true;

};

/* ==========================================================
   Refresh
   ========================================================== */

InfiniteScroll.refresh = function () {

    this.rebuild();

};

/* ==========================================================
   Debug
   ========================================================== */

InfiniteScroll.debug = function () {

    console.group(

        "Infinite Scroll"

    );

    console.log(

        "Loading :",

        this.loading

    );

    console.log(

        "Finished :",

        this.finished

    );

    console.log(

        "Observer :",

        this.observer

    );

    console.log(

        "Sentinel :",

        this.sentinel

    );

    console.groupEnd();

};

/* ==========================================================
   Feed Ready
   ========================================================== */

Feed.on(

    "feed:ready",

    () => {

        InfiniteScroll.rebuild();

    }

);

/* ==========================================================
   Feed Updated
   ========================================================== */

Feed.on(

    "feed:updated",

    () => {

        InfiniteScroll.refresh();

    }

);

/* ==========================================================
   Public API
   ========================================================== */

window.InfiniteScroll = InfiniteScroll;

/* ==========================================================
   Auto Start
   ========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        InfiniteScroll.init();

    }

);

/* ==========================================================
   End Of File
   ========================================================== */
