/* ==================================================

NightCast User Podcasts Manager V1

File:

/users/js/features/podcasts.js


Responsibility:

- Load podcasts from Worker API
- Render podcast cards
- Connect player actions


Depends:

api.js
auth.js
player.js


================================================== */


const NightCastPodcasts = {



    page:1,


    limit:5,


    loading:false,


    hasMore:true,






    /*
    ====================================
    INIT
    ====================================
    */


    init(){



        this.load();

        this.bindScroll();



        console.log(

            "NightCast Podcasts Ready"

        );


    },









    /*
    ====================================
    LOAD PODCASTS
    ====================================
    */


    async load(){



        if(this.loading || !this.hasMore)

        return;





        this.loading = true;






        const result =

        await API.podcasts(


            this.page,


            this.limit


        );






        if(

            result.success &&

            result.podcasts

        ){



            this.render(

                result.podcasts

            );






            this.hasMore =

            result.hasMore;





            this.page++;




        }

        else{



            console.error(

                "Podcast API Error",

                result

            );


        }






        this.loading=false;





    },









    /*
    ====================================
    RENDER
    ====================================
    */


    render(items){



        const grid =

        document.getElementById(

            "podcastGrid"

        );






        if(!grid)

        return;






        const template =

        document.getElementById(

            "podcastCardTemplate"

        );







        if(!template)

        return;








        // حذف skeleton ها

        const skeletons =

        grid.querySelectorAll(

            ".skeleton"

        );



        skeletons.forEach(

            el=>el.remove()

        );









        items.forEach(

            podcast=>{



                const card =

                template.content.cloneNode(true);







                const img =

                card.querySelector(

                    ".podcast-image"

                );






                if(img){



                    img.src =

                    podcast.cover_url ||

                    "/users/assets/images/default-cover.jpg";


                }









                const title =

                card.querySelector(

                    ".podcast-title"

                );




                if(title){



                    title.textContent =

                    podcast.title;


                }









                const author =

                card.querySelector(

                    ".podcast-author"

                );




                if(author){



                    author.textContent =

                    podcast.author_name ||

                    "NightCast";


                }









                const desc =

                card.querySelector(

                    ".podcast-description"

                );




                if(desc){



                    desc.textContent =

                    podcast.description ||

                    podcast.summary ||

                    "";


                }









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









                const play =

                card.querySelector(

                    ".play-button"

                );






                if(play){



                    play.onclick=()=>{



                        if(window.NightCastPlayer){



                            NightCastPlayer.play(


                                podcast


                            );


                        }



                    };



                }









                const download =

                card.querySelector(

                    ".download-button"

                );






                if(download){



                    download.onclick=()=>{



                        if(

                            NightCastAuth &&

                            NightCastAuth.requireLogin()

                        ){



                            window.open(


                                podcast.audio_url,


                                "_blank"


                            );


                        }



                    };


                }








                grid.appendChild(card);





            }



        );



    },









    /*
    ====================================
    TIME FORMAT
    ====================================
    */


    formatTime(seconds){



        if(!seconds)

        return "00:00";





        const min =

        Math.floor(

            seconds / 60

        );





        const sec =

        seconds % 60;






        return (

            String(min).padStart(2,"0")

            +

            ":"

            +

            String(sec).padStart(2,"0")

        );



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






        if(!target)

        return;






        const observer =

        new IntersectionObserver(

            entries=>{



                if(

                    entries[0].isIntersecting

                ){



                    this.load();



                }


            }



        );






        observer.observe(target);



    }




};









window.NightCastPodcasts =

NightCastPodcasts;






console.log(

"NightCast Podcasts V1 Loaded"

);
