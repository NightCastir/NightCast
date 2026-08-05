/* ==================================================

NightCast Search Manager V1

File:

/users/js/features/search.js


Responsibility:

- Search podcasts
- Filter user content


Depends:

api.js
podcasts.js


================================================== */


const NightCastSearch = {



    input:null,



    /*
    ====================================
    INIT
    ====================================
    */


    init(){



        this.input =

        document.getElementById(

            "searchInput"

        );






        if(!this.input){

            console.warn(

                "Search input not found"

            );

            return;

        }






        this.bind();






        console.log(

            "NightCast Search Ready"

        );



    },









    /*
    ====================================
    BIND
    ====================================
    */


    bind(){



        this.input.addEventListener(


            "input",

            ()=>{


                this.search(

                    this.input.value.trim()

                );


            }


        );



    },









    /*
    ====================================
    SEARCH
    ====================================
    */


    async search(keyword){



        if(!keyword){



            if(window.NightCastPodcasts){



                const grid =

                document.getElementById(

                    "podcastGrid"

                );



                if(grid){



                    grid.innerHTML="";


                }




                NightCastPodcasts.page=1;

                NightCastPodcasts.hasMore=true;


                NightCastPodcasts.load();



            }



            return;



        }








        const result =

        await API.get(

            "/public/podcasts?search="

            +

            encodeURIComponent(keyword)

        );









        if(

            result.success &&

            result.podcasts

        ){



            this.renderResult(

                result.podcasts

            );



        }



    },









    /*
    ====================================
    RENDER SEARCH RESULT

    ====================================
    */


    renderResult(items){



        const grid =

        document.getElementById(

            "podcastGrid"

        );







        if(!grid)

        return;






        grid.innerHTML="";







        const template =

        document.getElementById(

            "podcastCardTemplate"

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









                const play =

                card.querySelector(

                    ".play-button"

                );







                if(play){



                    play.onclick=()=>{



                        NightCastPlayer.play(

                            podcast

                        );



                    };



                }







                grid.appendChild(

                    card

                );




            }


        );



    }




};








window.NightCastSearch =

NightCastSearch;






console.log(

"NightCast Search V1 Loaded"

);
