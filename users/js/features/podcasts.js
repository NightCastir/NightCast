/* ==================================================

NightCast User Podcasts Manager V2

File:
users/js/features/podcasts.js

Responsibility

✔ Load Podcasts
✔ Render Cards
✔ Infinite Scroll
✔ Queue Builder
✔ Search Integration
✔ Player Integration
✔ Library Integration
✔ Error Handling

Depends

api.js
player.js
library.js
ui.js

================================================== */

"use strict";

const NightCastPodcasts = {

    grid:null,

    template:null,

    trigger:null,

    observer:null,

    loading:false,

    page:1,

    limit:6,

    hasMore:true,

    items:[],



    /* ==========================================
       INIT
    ========================================== */

    init(){

        this.grid =
        document.getElementById(
            "podcastGrid"
        );

        this.template =
        document.getElementById(
            "podcastCardTemplate"
        );

        this.trigger =
        document.getElementById(
            "podcastLoadingTrigger"
        );

        if(
            !this.grid ||
            !this.template
        ){

            console.error(
                "Podcast container not found."
            );

            return;

        }

        this.createObserver();

        this.loadFirstPage();

        console.log(
            "NightCast Podcasts Ready"
        );

    },



    /* ==========================================
       FIRST LOAD
    ========================================== */

    async loadFirstPage(){

        this.page = 1;

        this.items = [];

        this.hasMore = true;

        this.grid.innerHTML = "";

        this.showSkeleton();

        await this.load();

    },



    /* ==========================================
       LOAD NEXT PAGE
    ========================================== */

    async load(){

        if(
            this.loading ||
            !this.hasMore
        ){
            return;
        }

        this.loading = true;

        try{

            const result =
            await API.podcasts(

                this.page,

                this.limit

            );

            this.removeSkeleton();

            if(!result.success){

                this.renderError(
                    result.message ||
                    "خطا در دریافت اطلاعات"
                );

                this.loading=false;

                return;

            }

            const podcasts =
            result.podcasts || [];

            if(
                this.page===1 &&
                podcasts.length===0
            ){

                this.renderEmpty();

                this.loading=false;

                return;

            }

            this.items.push(

                ...podcasts

            );

            this.render(
                podcasts
            );

            this.hasMore =
            Boolean(
                result.hasMore
            );

            this.page++;

            this.updatePlayerQueue();

        }

        catch(error){

            console.error(error);

            this.renderError(
                error.message
            );

        }

        this.loading=false;

    },

        /* ==========================================
       RENDER PODCASTS
    ========================================== */

    render(items){


        if(
            !Array.isArray(items) ||
            items.length===0
        ){

            return;

        }



        items.forEach(
            
            podcast=>{


                const fragment =
                this.template.content.cloneNode(
                    true
                );



                const card =
                fragment.querySelector(
                    ".podcast-card"
                );



                if(!card){

                    console.warn(
                        "Podcast card template invalid"
                    );

                    return;

                }



                /*
                =================================
                DATA ATTRIBUTES
                =================================
                */


                card.dataset.id =
                podcast.id || "";



                card.dataset.title =
                podcast.title || "";



                card.dataset.audio =
                podcast.audio_url || "";



                card.dataset.cover =
                podcast.cover_url || "";



                card.dataset.author =
                podcast.author_name || "";



                card.dataset.duration =
                podcast.duration_seconds || 0;




                /*
                =================================
                IMAGE
                =================================
                */


                const image =
                card.querySelector(
                    ".podcast-image"
                );


                if(image){


                    image.src =
                    podcast.cover_url ||

                    "/users/assets/images/default-cover.jpg";


                    image.alt =
                    podcast.title || "NightCast";


                }




                /*
                =================================
                TITLE
                =================================
                */


                const title =
                card.querySelector(
                    ".podcast-title"
                );


                if(title){

                    title.textContent =
                    podcast.title ||

                    "بدون عنوان";

                }





                /*
                =================================
                AUTHOR
                =================================
                */


                const author =
                card.querySelector(
                    ".podcast-author"
                );


                if(author){


                    author.textContent =
                    podcast.author_name ||

                    "NightCast";


                }







                /*
                =================================
                BOOK
                =================================
                */


                const book =
                card.querySelector(
                    ".podcast-book"
                );


                if(book){


                    book.textContent =
                    podcast.book_name ||

                    "";


                }








                /*
                =================================
                CATEGORY
                =================================
                */


                const category =
                card.querySelector(
                    ".podcast-category"
                );


                if(category){


                    category.textContent =
                    podcast.category_name ||

                    "";


                }








                /*
                =================================
                DESCRIPTION
                =================================
                */


                const description =
                card.querySelector(
                    ".podcast-description"
                );


                if(description){


                    description.textContent =

                    podcast.description ||

                    podcast.summary ||

                    "";


                }









                /*
                =================================
                DURATION
                =================================
                */


                const duration =
                card.querySelector(
                    ".duration"
                );


                if(duration){


                    duration.innerHTML =

                    `
                    <i class="fa-solid fa-clock"></i>

                    ${this.formatTime(
                        podcast.duration_seconds
                    )}
                    `;


                }









                /*
                =================================
                LISTEN COUNT
                =================================
                */


                const listen =
                card.querySelector(
                    ".listen-count"
                );


                if(listen){


                    listen.textContent =

                    podcast.listen_count ||

                    0;


                }









                /*
                =================================
                EPISODE
                =================================
                */


                const episode =
                card.querySelector(
                    ".episode-number"
                );


                if(episode){


                    episode.textContent =

                    podcast.episode_number

                    ?

                    `قسمت ${podcast.episode_number}`

                    :

                    "";


                }









                /*
                =================================
                TAGS
                =================================
                */


                const tags =
                card.querySelector(
                    ".podcast-tags"
                );


                if(tags){


                    tags.textContent =

                    podcast.tags ||

                    "";


                }










                /*
                =================================
                BUTTON DATA
                =================================
                */


                const buttons =

                card.querySelectorAll(
                    "button"
                );



                buttons.forEach(
                    btn=>{


                        btn.dataset.id =
                        podcast.id;


                        btn.dataset.title =
                        podcast.title || "";


                        btn.dataset.audio =
                        podcast.audio_url || "";


                        btn.dataset.cover =
                        podcast.cover_url || "";


                    }

                );









                this.grid.appendChild(
                    fragment
                );


            }

        );


    },

        /* ==========================================
       EVENTS
    ========================================== */


    bindEvents(){


        if(!this.grid){

            return;

        }





        this.grid.addEventListener(

            "click",

            event=>{


                const button =

                event.target.closest(
                    "button"
                );




                if(!button){

                    return;

                }






                const id =

                button.dataset.id;






                if(!id){

                    return;

                }







                const podcast =

                this.getPodcastById(
                    id
                );






                if(!podcast){

                    console.warn(
                        "Podcast data missing"
                    );

                    return;

                }









                /*
                ==============================
                PLAY
                ==============================
                */


                if(

                    button.classList.contains(
                        "play-button"
                    )

                ){


                    this.playPodcast(
                        podcast
                    );


                }









                /*
                ==============================
                FAVORITE
                ==============================
                */


                if(

                    button.classList.contains(
                        "favorite-button"
                    )

                ){


                    this.favoritePodcast(
                        podcast,
                        button
                    );


                }









                /*
                ==============================
                DOWNLOAD
                ==============================
                */


                if(

                    button.classList.contains(
                        "download-button"
                    )

                ){


                    this.downloadPodcast(
                        podcast
                    );


                }









                /*
                ==============================
                COMMENT
                ==============================
                */


                if(

                    button.classList.contains(
                        "comment-button"
                    )

                ){


                    this.openComments(
                        podcast
                    );


                }



            }

        );


    },









    /* ==========================================
       FIND PODCAST
    ========================================== */


    getPodcastById(id){


        return this.items.find(

            item=>

            String(item.id)

            ===

            String(id)

        );


    },









    /* ==========================================
       PLAY CONNECT
    ========================================== */


    playPodcast(podcast){



        if(
            window.NightCastPlayer
        ){



            NightCastPlayer.play(
                podcast
            );



        }



    },









    /* ==========================================
       FAVORITE CONNECT
    ========================================== */


    favoritePodcast(
        podcast,
        button
    ){



        if(
            window.NightCastLibrary
        ){



            NightCastLibrary.toggleFavorite(

                podcast

            );




            button.classList.toggle(

                "active"

            );



        }



    },









    /* ==========================================
       DOWNLOAD CONNECT
    ========================================== */


    downloadPodcast(podcast){



        if(
            window.NightCastLibrary
        ){



            NightCastLibrary.download(

                podcast

            );



        }



    },









    /* ==========================================
       COMMENTS CONNECT
    ========================================== */


    openComments(podcast){



        window.location.href =

        "/users/podcast.html?id="

        +

        podcast.id;



    },

        /*
    ====================================
    RENDER PODCAST CARDS
    ====================================
    */


    render(items){


        const grid =
        document.getElementById(
            "podcastGrid"
        );



        if(!grid){

            console.warn(
                "podcastGrid not found"
            );

            return;

        }





        const template =
        document.getElementById(
            "podcastCardTemplate"
        );





        if(!template){

            console.warn(
                "podcastCardTemplate missing"
            );

            return;

        }





        items.forEach(
            podcast=>{


                const card =
                template.content.cloneNode(
                    true
                );




                const wrapper =
                card.querySelector(
                    ".podcast-card"
                );




                /*
                ============================
                STORE PODCAST DATA
                ============================
                */


                if(wrapper){


                    wrapper.dataset.id =
                    podcast.id;



                    wrapper.dataset.audio =
                    podcast.audio_url || "";



                    wrapper.dataset.title =
                    podcast.title || "";



                    wrapper.dataset.cover =
                    podcast.cover_url || "";



                    wrapper.dataset.author =
                    podcast.author_name || "";



                }







                /*
                ============================
                COVER
                ============================
                */


                const image =
                card.querySelector(
                    ".podcast-image"
                );



                if(image){


                    image.src =

                    podcast.cover_url ||

                    "/users/assets/images/default-cover.jpg";


                    image.alt =

                    podcast.title;


                }









                /*
                ============================
                TITLE
                ============================
                */


                const title =
                card.querySelector(
                    ".podcast-title"
                );



                if(title){


                    title.textContent =

                    podcast.title || 
                    
                    "بدون عنوان";


                }









                /*
                ============================
                AUTHOR
                ============================
                */


                const author =
                card.querySelector(
                    ".podcast-author"
                );



                if(author){


                    author.textContent =

                    podcast.author_name ||

                    "NightCast";


                }









                /*
                ============================
                DESCRIPTION
                ============================
                */


                const description =
                card.querySelector(
                    ".podcast-description"
                );



                if(description){


                    description.textContent =

                    podcast.description ||

                    podcast.summary ||

                    "";



                }









                /*
                ============================
                DURATION
                ============================
                */


                const duration =
                card.querySelector(
                    ".duration"
                );



                if(duration){


                    duration.innerHTML =

                    `

                    <i class="fa-solid fa-clock"></i>

                    ${

                    this.formatTime(

                        podcast.duration_seconds

                    )

                    }

                    `;


                }









                /*
                ============================
                PLAY BUTTON
                ============================
                */


                const play =
                card.querySelector(
                    ".play-button"
                );



                if(play){


                    play.dataset.action =
                    "play";



                    play.onclick = ()=>{


                        NightCastPlayer.play(

                            podcast

                        );


                    };


                }









                /*
                ============================
                FAVORITE BUTTON
                ============================
                */


                const favorite =
                card.querySelector(
                    ".favorite-button"
                );



                if(favorite){


                    favorite.dataset.action =
                    "favorite";



                    favorite.onclick = ()=>{


                        if(
                            window.NightCastLibrary
                        ){


                            NightCastLibrary.toggleFavorite(

                                podcast

                            );


                        }


                    };


                }









                /*
                ============================
                DOWNLOAD BUTTON
                ============================
                */


                const download =
                card.querySelector(
                    ".download-button"
                );



                if(download){


                    download.dataset.action =
                    "download";



                    download.onclick = ()=>{


                        if(
                            window.NightCastLibrary
                        ){


                            NightCastLibrary.download(

                                podcast

                            );


                        }


                    };


                }








                /*
                ============================
                COMMENT BUTTON
                ============================
                */


                const comment =
                card.querySelector(
                    ".comment-button"
                );



                if(comment){


                    comment.dataset.action =
                    "comment";



                    comment.onclick = ()=>{


                        window.location.href =

                        `/users/podcast.html?id=${podcast.id}`;


                    };


                }






                grid.appendChild(

                    card

                );



            }


        );


    },




        /*
    ====================================
    FORMAT TIME
    ====================================
    */


    formatTime(seconds){



        if(
            !seconds ||
            isNaN(seconds)
        ){

            return "00:00";

        }




        const minutes =

        Math.floor(

            seconds / 60

        );





        const second =

        Math.floor(

            seconds % 60

        );





        return (

            String(minutes)

            .padStart(2,"0")

            +

            ":"

            +

            String(second)

            .padStart(2,"0")

        );



    },









    /*
    ====================================
    EMPTY STATE
    ====================================
    */


    emptyState(){



        const grid =

        document.getElementById(

            "podcastGrid"

        );




        if(!grid)

        return;





        grid.innerHTML =



        `

        <div class="empty-state">

            <i class="fa-solid fa-microphone-slash"></i>

            <h3>

            هنوز پادکستی منتشر نشده است

            </h3>


            <p>

            به زودی محتوای جدید اضافه خواهد شد

            </p>


        </div>

        `;



    },









    /*
    ====================================
    ERROR STATE
    ====================================
    */


    errorState(message="خطا در دریافت اطلاعات"){



        const grid =

        document.getElementById(

            "podcastGrid"

        );




        if(!grid)

        return;





        grid.innerHTML =



        `

        <div class="error-state">

            <i class="fa-solid fa-triangle-exclamation"></i>


            <h3>

            ${message}

            </h3>


            <button

            class="retry-button">

            تلاش دوباره

            </button>


        </div>

        `;






        const retry =

        grid.querySelector(

            ".retry-button"

        );





        if(retry){



            retry.onclick = ()=>{


                this.page = 1;

                this.hasMore = true;


                grid.innerHTML="";


                this.load();



            };


        }



    },









    /*
    ====================================
    LOADING STATE
    ====================================
    */


    showLoading(){



        const grid =

        document.getElementById(

            "podcastGrid"

        );





        if(!grid)

        return;







        const loader =

        document.createElement(

            "div"

        );




        loader.className =

        "podcast-loader";





        loader.innerHTML =



        `

        <div class="spinner"></div>

        <span>

        در حال دریافت پادکست‌ها...

        </span>

        `;






        grid.appendChild(

            loader

        );



    },









    /*
    ====================================
    REMOVE LOADING
    ====================================
    */


    hideLoading(){



        const loader =

        document.querySelector(

            ".podcast-loader"

        );





        if(loader){


            loader.remove();


        }


    },









    /*
    ====================================
    INFINITE SCROLL
    ====================================
    */


    bindScroll(){



        const target =

        document.getElementById(

            "podcastLoadingTrigger"

        );






        if(!target){


            console.warn(

                "Loading trigger not found"

            );


            return;


        }







        const observer =

        new IntersectionObserver(

            entries=>{



                const entry =

                entries[0];





                if(

                    entry.isIntersecting &&

                    !this.loading &&

                    this.hasMore

                ){



                    this.load();


                }



            },


            {

                rootMargin:

                "300px"


            }


        );






        observer.observe(

            target

        );



    },


        /*
    ====================================
    LOAD PODCASTS FROM API
    ====================================
    */


    async load(){



        if(

            this.loading ||

            !this.hasMore

        ){

            return;

        }






        this.loading = true;



        this.showLoading();







        try{



            const result =

            await API.podcasts(

                this.page,

                this.limit

            );







            /*
            ============================
            API ERROR
            ============================
            */


            if(

                !result ||

                !result.success

            ){



                this.errorState(

                    "خطا در دریافت پادکست‌ها"

                );



                return;


            }









            /*
            ============================
            EMPTY RESULT
            ============================
            */


            if(

                !result.podcasts ||

                result.podcasts.length===0

            ){



                if(

                    this.page===1

                ){



                    this.emptyState();


                }





                this.hasMore=false;



                return;


            }









            /*
            ============================
            UPDATE PLAYER QUEUE
            ============================
            */


            if(

                window.NightCastPlayer

            ){



                NightCastPlayer.queue =

                [

                    ...

                    NightCastPlayer.queue,

                    ...

                    result.podcasts

                ];



            }









            /*
            ============================
            RENDER DATA
            ============================
            */


            this.render(

                result.podcasts

            );









            /*
            ============================
            PAGINATION
            ============================
            */


            this.hasMore =

            result.hasMore;





            this.page++;





        }

        catch(error){



            console.error(

                "Podcast Load Error",

                error

            );



            this.errorState(

                "ارتباط با سرور برقرار نشد"

            );



        }

        finally{



            this.loading=false;



            this.hideLoading();



        }



    },



        /*
    ====================================
    EVENT DELEGATION
    ====================================
    */


    bindEvents(){



        document.addEventListener(

            "click",

            event=>{





                const playButton =

                event.target.closest(

                    ".play-button"

                );





                if(playButton){



                    const card =

                    playButton.closest(

                        ".podcast-card"

                    );





                    if(

                        card &&

                        window.NightCastPlayer

                    ){



                        NightCastPlayer.play({



                            id:

                            card.dataset.id,



                            title:

                            card.dataset.title,



                            audio_url:

                            card.dataset.audio,



                            cover_url:

                            card.dataset.cover,



                            author_name:

                            card.dataset.author



                        });



                    }



                }









                const favoriteButton =

                event.target.closest(

                    ".favorite-button"

                );







                if(favoriteButton){



                    const card =

                    favoriteButton.closest(

                        ".podcast-card"

                    );







                    if(

                        card &&

                        window.NightCastLibrary

                    ){



                        NightCastLibrary.toggleFavorite({



                            id:

                            card.dataset.id,



                            title:

                            card.dataset.title,



                            cover_url:

                            card.dataset.cover



                        });



                    }



                }









                const downloadButton =

                event.target.closest(

                    ".download-button"

                );






                if(downloadButton){



                    const card =

                    downloadButton.closest(

                        ".podcast-card"

                    );






                    if(

                        card &&

                        window.NightCastLibrary

                    ){



                        NightCastLibrary.download({



                            id:

                            card.dataset.id,



                            title:

                            card.dataset.title,



                            audio_url:

                            card.dataset.audio,



                            cover_url:

                            card.dataset.cover



                        });



                    }



                }





            }


        );



    },









    /*
    ====================================
    RESET
    ====================================
    */


    reset(){



        this.page = 1;


        this.hasMore = true;


        this.loadedIds = [];





        const grid =

        document.getElementById(

            "podcastGrid"

        );





        if(grid){


            grid.innerHTML="";


        }



    },









    /*
    ====================================
    SEARCH SUPPORT
    ====================================
    */


    replace(items){



        this.loadedIds=[];



        const grid =

        document.getElementById(

            "podcastGrid"

        );





        if(grid){


            grid.innerHTML="";


        }





        this.render(

            items

        );



    }





};









/*
====================================
GLOBAL EXPORT
====================================
*/


window.NightCastPodcasts =

NightCastPodcasts;









console.log(

    "NightCast Podcasts V2 Loaded"

);
