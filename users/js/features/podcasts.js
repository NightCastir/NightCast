/* ==================================================

NightCast Podcast Manager V2

File:
 /users/js/features/podcasts.js


Responsibility:

- Fetch podcasts
- Render cards
- Infinite scroll
- Play
- Download permission
- Favorite
- Comments


Depends:

api.js
auth.js
ui.js
player.js
library.js


================================================== */


const NightCastPodcasts = {



    page:1,

    limit:12,

    loading:false,

    finished:false,

    podcasts:[],

    container:null,





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

                "Podcast list not found"

            );

            return;

        }





        this.load();

        this.bindScroll();




        console.log(

            "NightCast Podcast Manager Ready"

        );


    },









    /*
    ====================================
    LOAD DATA
    ====================================
    */


    async load(){



        if(

            this.loading ||

            this.finished

        ){

            return;

        }






        this.loading=true;







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



            NightCastUI.toast(

                "دریافت پادکست‌ها ناموفق بود",

                "error"

            );



            return;

        }







        const items =


        result.data?.items ||

        result.data ||

        result.podcasts ||

        [];







        if(

            items.length===0

        ){


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



    },









    /*
    ====================================
    RENDER
    ====================================
    */


    render(items){



        items.forEach(

            podcast=>{


                this.container.appendChild(

                    this.createCard(

                        podcast

                    )

                );


            }

        );



    },









    /*
    ====================================
    CARD
    ====================================
    */


    createCard(podcast){



        const card =

        document.createElement(

            "article"

        );





        card.className =

        "podcast-card";








        card.innerHTML =



`

<div class="podcast-cover">


<img

src="${

podcast.cover ||

"/users/assets/images/default-cover.jpg"

}"

alt="${podcast.title || ""}"

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



<button class="play-btn">

<i class="fa-solid fa-play"></i>

پخش

</button>





<button class="download-btn">

<i class="fa-solid fa-download"></i>

دانلود

</button>





<button class="comment-btn">

<i class="fa-solid fa-comment"></i>

نظر

</button>





<button class="favorite-btn">

<i class="fa-regular fa-heart"></i>

</button>




</div>




</div>

`;









this.events(

    card,

    podcast

);





return card;



},

 









    /*
    ====================================
    EVENTS
    ====================================
    */


    events(card,podcast){





        card
        .querySelector(".play-btn")
        .onclick=()=>{


            this.play(

                podcast

            );


        };








        card
        .querySelector(".download-btn")
        .onclick=()=>{


            this.download(

                podcast

            );


        };








        card
        .querySelector(".comment-btn")
        .onclick=()=>{


            window.location.href =

            "/users/comments.html?id="

            +

            podcast.id;



        };








        card
        .querySelector(".favorite-btn")
        .onclick=(e)=>{


            this.favorite(

                podcast.id,

                e.currentTarget

            );


        };



    },









    /*
    ====================================
    PLAY
    ====================================
    */


    play(podcast){



        if(

            !window.NightCastPlayer

        ){

            return;

        }







        NightCastPlayer.load(

            podcast

        );



        NightCastPlayer.play();





    },









    /*
    ====================================
    DOWNLOAD

    Login Required

    ====================================
    */


    async download(podcast){



        if(

            !NightCastAuth.isLoggedIn()

        ){



            NightCastUI.toast(

                "برای دانلود ابتدا وارد شوید",

                "warning"

            );



            NightCastAuth.openLogin();



            return;

        }








        const result =

        await NightCastAPI.download(

            podcast.id

        );







        if(result.success){


            window.location.href =

            result.url;



        }

        else{


            NightCastUI.toast(

                result.message ||

                "دانلود امکان پذیر نیست",

                "error"

            );


        }




    },









    /*
    ====================================
    FAVORITE

    Local First

    ====================================
    */


    favorite(id,button){



        let list =

        JSON.parse(

            localStorage.getItem(

                "NightCastFavorites"

            )

            ||

            "[]"

        );






        if(

            list.includes(id)

        ){



            list =

            list.filter(

                x=>x!==id

            );



            button.innerHTML =

            `<i class="fa-regular fa-heart"></i>`;



        }

        else{


            list.push(id);



            button.innerHTML =

            `<i class="fa-solid fa-heart"></i>`;



        }





        localStorage.setItem(

            "NightCastFavorites",

            JSON.stringify(list)

        );



    },









    /*
    ====================================
    INFINITE SCROLL
    ====================================
    */


    bindScroll(){



        window.addEventListener(

            "scroll",

            ()=>{


                if(

                    window.innerHeight +

                    window.scrollY

                    >=

                    document.body.offsetHeight - 600

                ){


                    this.load();


                }



            }


        );



    }



};








window.NightCastPodcasts =

NightCastPodcasts;
