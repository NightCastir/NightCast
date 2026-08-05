/* ==================================================

NightCast Podcasts Manager V1

File:
 /users/js/features/podcasts.js


Responsibility:

- Load podcasts
- Render cards
- Play
- Download
- Comments
- Favorites
- Infinite Scroll


Depends:

api.js
auth.js
ui.js
player.js


================================================== */


const NightCastPodcasts = {



    page:1,


    limit:10,


    loading:false,


    finished:false,


    container:null,


    podcasts:[],







    /*
    ====================================
    INIT
    ====================================
    */


    init(){



        this.container =

        document.getElementById(
            "podcastList"
        );





        if(!this.container){

            console.warn(
                "Podcast container not found"
            );

            return;

        }





        this.load();

        this.infiniteScroll();





        console.log(
            "NightCast Podcasts Loaded"
        );


    },









    /*
    ====================================
    LOAD PODCASTS
    ====================================
    */


    async load(){



        if(

            this.loading ||

            this.finished

        ){

            return;

        }





        this.loading = true;





        if(window.NightCastUI){

            NightCastUI.showLoader();

        }






        const result =

        await NightCastAPI.getPodcasts(

            this.page,

            this.limit

        );







        if(

            !result ||

            !result.success

        ){


            this.loading=false;


            if(window.NightCastUI){

                NightCastUI.toast(
                    "خطا در دریافت پادکست‌ها",
                    "error"
                );

            }


            return;

        }








        const items =

        result.data ||

        result.podcasts ||

        [];







        if(items.length === 0){


            this.finished=true;


            this.loading=false;


            return;


        }







        this.podcasts.push(

            ...items

        );





        this.render(items);





        this.page++;





        this.loading=false;




        if(window.NightCastUI){

            NightCastUI.hideLoader();

        }



    },









    /*
    ====================================
    RENDER
    ====================================
    */


    render(items){



        items.forEach(

            podcast=>{


                const card =

                this.createCard(
                    podcast
                );



                this.container.appendChild(
                    card
                );



            }


        );



    },









    /*
    ====================================
    CREATE CARD
    ====================================
    */


    createCard(podcast){



        const card =

        document.createElement(
            "article"
        );





        card.className =

        "podcast-card";





        const cover =

        podcast.cover ||

        "/users/assets/images/default-cover.jpg";







        card.innerHTML =


        `

        <div class="podcast-cover">


            <img

            src="${cover}"

            alt="${podcast.title || ''}"

            loading="lazy">


        </div>





        <div class="podcast-content">



            <h3>

            ${podcast.title || "بدون عنوان"}

            </h3>





            <p class="podcast-author">

            ${podcast.author || "NightCast"}

            </p>






            <div class="podcast-actions">





                <button

                class="play-btn">

                <i class="fa-solid fa-play"></i>

                پخش

                </button>






                <button

                class="download-btn">

                <i class="fa-solid fa-download"></i>

                دانلود

                </button>






                <button

                class="comment-btn">

                <i class="fa-solid fa-comment"></i>

                نظر

                </button>






                <button

                class="favorite-btn">

                <i class="fa-regular fa-heart"></i>

                </button>






            </div>




        </div>



        `;








        /*
        ================================
        EVENTS
        ================================
        */






        card
        .querySelector(".play-btn")
        .onclick = ()=>{


            this.play(
                podcast
            );


        };







        card
        .querySelector(".download-btn")
        .onclick = ()=>{


            this.download(
                podcast
            );


        };







        card
        .querySelector(".comment-btn")
        .onclick = ()=>{


            this.comments(
                podcast.id
            );


        };







        card
        .querySelector(".favorite-btn")
        .onclick = (e)=>{


            this.favorite(
                podcast.id,
                e.currentTarget
            );


        };






        return card;



    },









    /*
    ====================================
    PLAY
    ====================================
    */


    play(podcast){



        if(

            window.NightCastPlayer

        ){



            NightCastPlayer.load(

                podcast

            );



            NightCastPlayer.play();



        }



    },









    /*
    ====================================
    DOWNLOAD
    ====================================
    */


    download(podcast){





        if(

            !window.NightCastAuth ||

            !NightCastAuth.isLoggedIn()

        ){



            if(window.NightCastUI){


                NightCastUI.toast(

                    "برای دانلود ابتدا وارد شوید",

                    "warning"

                );


            }



            return;


        }








        if(window.NightCastPlayer){


            NightCastPlayer.currentPodcast =

            podcast;


            NightCastPlayer.download();



        }



    },









    /*
    ====================================
    COMMENTS
    ====================================
    */


    comments(id){



        window.location.href =

        "/users/comments.html?id="

        +

        id;



    },









    /*
    ====================================
    FAVORITE
    ====================================
    */


    favorite(id,button){



        let favorites =

        JSON.parse(

            localStorage.getItem(
                "NightCastFavorites"
            )

            ||

            "[]"

        );






        if(

            favorites.includes(id)

        ){


            favorites =

            favorites.filter(

                item=>item!==id

            );


            button.innerHTML =

            `<i class="fa-regular fa-heart"></i>`;


        }

        else{


            favorites.push(id);


            button.innerHTML =

            `<i class="fa-solid fa-heart"></i>`;



        }






        localStorage.setItem(

            "NightCastFavorites",

            JSON.stringify(
                favorites
            )

        );



    },









    /*
    ====================================
    INFINITE SCROLL
    ====================================
    */


    infiniteScroll(){



        window.addEventListener(

            "scroll",

            ()=>{



                const bottom =


                window.innerHeight +

                window.scrollY >=


                document.body.offsetHeight - 500;





                if(bottom){


                    this.load();


                }





            }


        );



    }




};









window.NightCastPodcasts =

NightCastPodcasts;
