/*
========================================
NightCast Feed Service
Load Episodes From GitHub JSON
========================================
*/

const FeedService = {

    url: "v2/data/episodes.json",

    async getEpisodes(){

        try {

            const response =
                await fetch(this.url);

            if(!response.ok){

                throw new Error(
                    "Episodes file not found"
                );

            }

            const data =
                await response.json();

            return data.data || [];

        }

        catch(error){

            console.error(
                "Feed Error:",
                error
            );

            return [];

        }

    }

};
