/*
========================================
NightCast Feed Component
========================================
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
                "podcast-feed not found"
            );

            return;

        }


        const episodes =
            await FeedService.getEpisodes();


        this.render(episodes);

    },


    render(episodes){


        if(episodes.length === 0){

            this.container.innerHTML = `

                <p class="empty-message">
                    هنوز پادکستی منتشر نشده است.
                </p>

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


                        <button
                            class="play-btn"
                            data-audio="${episode.audio}">

                            ▶ پخش

                        </button>

                    </div>

                `;


                this.container.appendChild(card);


            }
        );


    }

};
