/* ==================================================
   NightCast User Podcasts Manager
   File: /users/js/podcasts.js

   Version: 2.0
   Production Ready
================================================== */


const NightCastPodcasts = {


    page: 1,


    limit: 5,


    podcasts: [],


    hasMore: true,


    loading: false,



    /*
    ====================================
    INIT
    ====================================
    */


    async init(){


        await this.load(true);


    },





    /*
    ====================================
    LOAD PODCASTS

    append:
    true  = اضافه کردن
    false = جایگزینی
    ====================================
    */


    async load(reset=false){



        if(this.loading){

            return;

        }



        if(!this.hasMore && !reset){

            NightCastUI.toast(

                "پادکست دیگری وجود ندارد",

                "info"

            );

            return;

        }




        this.loading = true;



        NightCastUI.showLoader();





        try{



            const result =

            await NightCastAPI.getPodcasts(

                this.page,

                this.limit

            );






            if(!result || !result.success){



                throw new Error(

                    result?.message ||

                    "خطا در دریافت پادکست‌ها"

                );


            }






            const items =

            result.podcasts || [];






            if(reset){


                this.podcasts = items;


            }

            else{


                this.podcasts.push(

                    ...items

                );


            }






            this.hasMore =

            result.hasMore !== undefined

            ?

            result.hasMore

            :

            items.length === this.limit;






            this.render();






        }

        catch(error){



            console.error(

                "Podcast Load Error:",

                error

            );




            NightCastUI.error(

                error.message

                ||

                "خطا در دریافت اطلاعات"

            );



        }

        finally{



            this.loading=false;



            NightCastUI.hideLoader();



        }




    },
   

    /*
    ====================================
    RENDER PODCAST CARDS
    ====================================
    */


    render(){



        const container =

        document.getElementById(

            "podcastList"

        );



        if(!container){

            console.warn(

                "podcastList not found"

            );

            return;

        }






        if(this.podcasts.length===0){



            container.innerHTML = `

            <div class="empty-state">

                هنوز پادکستی منتشر نشده است

            </div>

            `;



            return;

        }







        container.innerHTML =

        this.podcasts

        .map(

            podcast =>

            this.card(podcast)

        )

        .join("");







        this.updateLoadMore();




    },








    /*
    ====================================
    UPDATE LOAD MORE BUTTON
    ====================================
    */


    updateLoadMore(){



        const btn =

        document.getElementById(

            "loadMoreBtn"

        );



        if(!btn){

            return;

        }






        if(this.hasMore){



            btn.style.display="inline-block";

            btn.disabled=false;



            btn.innerHTML=

            "نمایش پادکست‌های بیشتر";



        }

        else{



            btn.style.display="none";


        }



    },









    /*
    ====================================
    ESCAPE HTML

    Security
    ====================================
    */


    escape(value){



        if(value===null || value===undefined){

            return "";

        }



        return String(value)

        .replace(

            /&/g,

            "&amp;"

        )

        .replace(

            /</g,

            "&lt;"

        )

        .replace(

            />/g,

            "&gt;"

        )

        .replace(

            /"/g,

            "&quot;"

        )

        .replace(

            /'/g,

            "&#039;"

        );



    },









    /*
    ====================================
    CARD TEMPLATE
    ====================================
    */


    card(p){



        const title =

        this.escape(

            p.title || "بدون عنوان"

        );




        const summary =

        this.escape(

            p.summary ||

            "بدون توضیحات"

        );





        const cover =

        p.cover_url ||

        "/users/assets/default-cover.jpg";







        return `



        <article class="podcast-card">






            <div class="cover-wrapper">



                <img

                class="podcast-cover"

                src="${cover}"

                loading="lazy"

                onerror="this.src='/users/assets/default-cover.jpg'"

                >






                <span class="episode-badge">

                قسمت ${

                    p.episode_number || 1

                }

                </span>



            </div>









            <div class="podcast-info">





                <h3 class="podcast-title">

                    ${title}

                </h3>







                <div class="meta">



                    <span>

                    🎧 ${

                        p.listen_count || 0

                    }

                    </span>





                    <span>

                    ⏱ ${

                    NightCastUI.formatTime(

                        p.duration_seconds || 0

                    )

                    }

                    </span>



                </div>









                <p class="podcast-summary">

                    ${summary}

                </p>









                <div class="podcast-actions">





                    <button

                    class="play-btn"

                    onclick="NightCastPodcasts.play(${p.id})"

                    >

                    ▶ پخش

                    </button>








                    <button

                    class="download-btn"

                    onclick="NightCastPodcasts.download(${p.id})"

                    >

                    ⬇ دانلود

                    </button>





                </div>







            </div>





        </article>



        `;



    },









    /*
    ====================================
    PLAY PODCAST
    ====================================
    */


    play(id){



        const podcast =

        this.podcasts.find(

            item =>

            item.id == id

        );





        if(!podcast){



            NightCastUI.error(

                "پادکست پیدا نشد"

            );


            return;

        }






        if(window.NightCastPlayer){



            NightCastPlayer.play(

                podcast

            );


        }

        else{



            NightCastUI.error(

                "Player آماده نیست"

            );


        }



    },









    /*
    ====================================
    DOWNLOAD PODCAST
    ====================================
    */


    async download(id){



        try{



            NightCastUI.showLoader();




            const result =

            await NightCastAPI.downloadPodcast(

                id

            );






            if(

                result.success &&

                result.download &&

                result.download.audio_url

            ){



                window.open(

                    result.download.audio_url,

                    "_blank"

                );




                NightCastUI.success(

                    "دانلود شروع شد"

                );



            }

            else{



                NightCastUI.error(

                    result.message ||

                    "دانلود امکان پذیر نیست"

                );


            }



        }

        catch(error){



            NightCastUI.error(

                "خطا در دانلود"

            );


        }

        finally{


            NightCastUI.hideLoader();


        }



    },

    /*
    ====================================
    NEXT PAGE
    ====================================
    */


    async nextPage(){



        if(

            this.loading ||

            !this.hasMore

        ){

            return;

        }






        this.page++;




        await this.load(false);



    },









    /*
    ====================================
    RESET LIST
    ====================================
    */


    async reset(){



        this.page = 1;



        this.hasMore = true;



        this.podcasts = [];



        await this.load(true);



    },









    /*
    ====================================
    INFINITE SCROLL READY

    فعال سازی در آینده
    ====================================
    */


    enableInfiniteScroll(){



        window.addEventListener(

            "scroll",

            ()=>{



                if(this.loading){

                    return;

                }






                const scrollPosition =

                window.innerHeight +

                window.scrollY;





                const pageHeight =

                document.body.offsetHeight;






                if(

                    scrollPosition >=

                    pageHeight - 300

                ){



                    this.nextPage();



                }





            }

        );



    }





};








/*
====================================
GLOBAL ACCESS
====================================
*/


window.NightCastPodcasts =

NightCastPodcasts;









/*
====================================
START APPLICATION
====================================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{


    NightCastPodcasts.init();


    // فعلا خاموش است
    // بعد از تست فعال می‌کنیم

    // NightCastPodcasts.enableInfiniteScroll();


});
