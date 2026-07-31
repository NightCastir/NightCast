/*
──────────────────────────────────────────────
NightCast V2
Feed Component
──────────────────────────────────────────────
*/


const Feed = {


    container: null,


    async init(){


        this.container =
            document.getElementById(
                "podcast-feed"
            );


        if(!this.container){

            console.error(
                "Feed container not found"
            );

            return;

        }



        const episodes =
            await FeedService.getEpisodes();



        this.render(episodes);


    },





    render(episodes){


        if(!episodes || episodes.length === 0){


            this.container.innerHTML = `

                <div class="empty-message">

                    هنوز پادکستی منتشر نشده است.

                </div>

            `;


            return;

        }





        this.container.innerHTML = "";




        episodes.forEach(
            episode => {



                const card =
                    document.createElement(
                        "article"
                    );



                card.className =
                    "podcast-card";




                card.innerHTML = `


                    <img

                    class="podcast-cover"

                    src="${episode.cover}"

                    alt="${episode.title}"

                    loading="lazy"

                    >




                    <div class="podcast-info">


                        <h2>

                            ${episode.title}

                        </h2>




                        <p>

                            ${episode.description}

                        </p>




                        <div class="episode-meta">


                            <span>

                                ${episode.published || ""}

                            </span>


                        </div>




                        <button

                        class="play-btn"

                        data-audio="${episode.audio}"

                        >

                            <i class="fa-solid fa-play"></i>

                            پخش


                        </button>



                    </div>


                `;




                this.container.appendChild(card);



            }

        );



        this.bindEvents();


    },






    bindEvents(){



        const buttons =
            document.querySelectorAll(
                ".play-btn"
            );



        buttons.forEach(
            button => {


                button.addEventListener(
                    "click",
                    ()=>{


                        const audio =
                            button.dataset.audio;



                        Player.play(
                            audio
                        );


                    }
                );


            }
        );



    }




};
