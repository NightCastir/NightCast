/* ==================================================

NightCast User API Manager V1

File:
/users/js/api.js


Connected To:

Cloudflare Worker API
D1 Database


Responsibility:

ONLY API COMMUNICATION


================================================== */


const NightCastAPI = {



    API_URL:

    "https://nightcast-api.tomasgermany2580.workers.dev/api/v1",






    TOKEN_KEY:

    "NightCastUserToken",







    /*
    ====================================
    BUILD URL
    ====================================
    */


    buildURL(endpoint){


        return this.API_URL + endpoint;


    },









    /*
    ====================================
    GET TOKEN
    ====================================
    */


    getToken(){


        return localStorage.getItem(

            this.TOKEN_KEY

        );


    },









    /*
    ====================================
    SAVE TOKEN
    ====================================
    */


    saveToken(token){



        if(token){


            localStorage.setItem(

                this.TOKEN_KEY,

                token

            );


        }


    },









    /*
    ====================================
    REMOVE TOKEN
    ====================================
    */


    removeToken(){



        localStorage.removeItem(

            this.TOKEN_KEY

        );


    },









    /*
    ====================================
    LOGIN STATUS
    ====================================
    */


    isLoggedIn(){



        return !!this.getToken();



    },









    /*
    ====================================
    REQUEST CORE

    Same Logic As Test Console

    ====================================
    */


    async request(

        endpoint,

        options={}

    ){



        try{



            const config = {


                method:

                options.method || "GET",


                headers:{


                    "Content-Type":

                    "application/json"


                }



            };





            const token =

            this.getToken();







            if(token){



                config.headers.Authorization =


                "Bearer " + token;



            }








            if(options.body){



                config.body =


                JSON.stringify(

                    options.body

                );


            }








            const response =


            await fetch(


                this.buildURL(endpoint),


                config


            );








            const data =


            await response.json();








            return data;





        }

        catch(error){



            console.error(

                "NightCast API Error",

                error

            );





            return {


                success:false,


                error:error.message


            };



        }



    },









    /*
    ====================================
    TEST WORKER
    ====================================
    */


    async test(){



        return await this.request(

            "/test"

        );


    },


    /*
====================================
PUBLIC PODCAST API

Connected To:

/public/podcasts

====================================
*/







    async getPodcasts(

        page = 1,

        limit = 5

    ){



        return await this.request(



            `/public/podcasts?page=${page}&limit=${limit}`



        );



    },









    async getPodcast(

        id

    ){



        if(!id){



            return {


                success:false,


                message:"Podcast ID required"



            };


        }






        return await this.request(



            "/public/podcasts/" + id



        );



    },









    async getLatestPodcasts(){



        return await this.request(



            "/public/podcasts/latest"



        );



    },









    async getPopularPodcasts(){



        return await this.request(



            "/public/podcasts/popular"



        );



    },









    /*
    ====================================
    SEARCH API

    ====================================
    */







    async search(

        keyword,

        page = 1,

        limit = 10

    ){



        if(!keyword){



            return {


                success:false,


                message:
                "Search keyword required"



            };



        }







        return await this.request(



            `/public/search?q=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`



        );



    },









    /*
    ====================================
    CATEGORY API

    ====================================
    */







    async getCategories(){



        return await this.request(



            "/public/categories"



        );



    },









    async getAuthors(){



        return await this.request(



            "/public/authors"



        );



    },









    async getTags(){



        return await this.request(



            "/public/tags"



        );



    },




    /*
====================================
AUTH API

Register
Login
Me
Logout

====================================
*/







    async register(

        data

    ){



        return await this.request(



            "/public/register",



            {

                method:"POST",



                body:{



                    username:

                    data.username,



                    password:

                    data.password,



                    full_name:

                    data.full_name || ""



                }



            }



        );



    },









    async login(

        username,

        password

    ){



        const result =

        await this.request(



            "/public/login",



            {

                method:"POST",



                body:{



                    username:


                    username,



                    password:


                    password



                }



            }



        );








        if(



            result.success &&

            result.token



        ){



            this.saveToken(



                result.token



            );



        }







        return result;



    },









    async me(){



        return await this.request(



            "/public/me"



        );



    },









    async logout(){



        const result =

        await this.request(



            "/public/logout",



            {

                method:"POST"

            }



        );







        this.removeToken();







        return result;



    },









    /*
    ====================================
    USER SESSION CHECK

    ====================================
    */







    async checkSession(){



        if(!this.isLoggedIn()){



            return {



                success:false,

                guest:true



            };



        }







        return await this.me();



    },





/*
====================================
USER PERSONAL DATA API

Favorites
Library
History
Saved

====================================
*/







    async getFavorites(){



        return await this.request(



            "/public/favorites"



        );



    },









    async addFavorite(

        podcastId

    ){



        return await this.request(



            "/public/favorites",



            {

                method:"POST",



                body:{



                    podcast_id:

                    podcastId



                }



            }



        );



    },









    async removeFavorite(

        podcastId

    ){



        return await this.request(



            "/public/favorites/" + podcastId,



            {

                method:"DELETE"



            }



        );



    },









    async getLibrary(){



        return await this.request(



            "/public/library"



        );



    },









    async savePodcast(

        podcastId

    ){



        return await this.request(



            "/public/library",



            {

                method:"POST",



                body:{



                    podcast_id:

                    podcastId



                }



            }



        );



    },









    async removeSaved(

        podcastId

    ){



        return await this.request(



            "/public/library/" + podcastId,



            {

                method:"DELETE"



            }



        );



    },









    async getHistory(){



        return await this.request(



            "/public/history"



        );



    },









    async addHistory(

        podcastId

    ){



        return await this.request(



            "/public/history",



            {

                method:"POST",



                body:{



                    podcast_id:

                    podcastId



                }



            }



        );



    },





/*
====================================
DOWNLOAD API

Download requires login

====================================
*/







    async download(

        podcastId

    ){



        if(!this.isLoggedIn()){



            return {


                success:false,


                message:

                "Login required"



            };



        }







        return await this.request(



            "/public/download/" + podcastId



        );



    },









    /*
    ====================================
    COMMENTS API

    ====================================
    */







    async getComments(

        podcastId

    ){



        return await this.request(



            "/public/comments/" + podcastId



        );



    },









    async addComment(

        podcastId,

        text

    ){



        if(!this.isLoggedIn()){



            return {


                success:false,


                message:

                "Login required"



            };



        }







        return await this.request(



            "/public/comments",



            {

                method:"POST",



                body:{



                    podcast_id:

                    podcastId,



                    comment:

                    text



                }



            }



        );



    },









    async deleteComment(

        id

    ){



        return await this.request(



            "/public/comments/" + id,



            {

                method:"DELETE"



            }



        );



    },









    /*
    ====================================
    PROFILE API

    ====================================
    */







    async updateProfile(

        data

    ){



        return await this.request(



            "/public/profile",



            {

                method:"PUT",



                body:data



            }



        );



    },









    async getProfile(){



        return await this.request(



            "/public/profile"



        );



    },






/*
====================================
SETTINGS API

====================================
*/







    async getSettings(){



        return await this.request(



            "/public/settings"



        );



    },









    /*
    ====================================
    STATISTICS

    ====================================
    */







    async getStats(){



        return await this.request(



            "/public/stats"



        );



    },









    /*
    ====================================
    GENERIC HELPERS

    ====================================
    */







    async upload(

        endpoint,

        formData

    ){



        try{



            const headers = {};



            const token =

            this.getToken();





            if(token){



                headers.Authorization =


                "Bearer " + token;



            }







            const response =


            await fetch(



                this.buildURL(endpoint),



                {



                    method:"POST",



                    headers:headers,



                    body:formData



                }



            );








            return await response.json();



        }

        catch(error){



            return {



                success:false,


                error:error.message



            };



        }



    },









    /*
    ====================================
    HANDLE RESPONSE

    ====================================
    */







    normalizeResponse(

        response

    ){



        if(!response){



            return {



                success:false,


                message:

                "Empty response"



            };



        }







        if(response.success === undefined){



            response.success = true;



        }







        return response;



    },









    /*
    ====================================
    DEBUG

    ====================================
    */







    debug(){



        console.log(



            "NightCast API URL:",



            this.API_URL



        );





        console.log(



            "Token:",



            this.getToken()



        );



    },






    
    
    /*
====================================
END API OBJECT

====================================
*/







};









/*
====================================
GLOBAL ACCESS

Used By:

auth.js
podcasts.js
search.js
library.js
profile.js
player.js

====================================
*/







window.NightCastAPI =

NightCastAPI;









/*
====================================
AUTO DEBUG

====================================
*/







console.log(

    "✅ NightCast API Loaded"

);









/*
====================================
OPTIONAL START CHECK

Only when DOM ready

====================================
*/







document.addEventListener(

    "DOMContentLoaded",

    ()=>{



        if(window.NightCastAPI){



            console.log(



                "API Ready:",



                NightCastAPI.API_URL



            );



        }



    }

);



/*
====================================
FINAL API TEST HELPERS

Compatible With:

Worker:
https://nightcast-api.tomasgermany2580.workers.dev

Routes:

/test

/public/podcasts

====================================
*/







NightCastAPI.testConnection = async function(){



    return await this.request(



        "/test"



    );



};









NightCastAPI.getPublicPodcasts = async function(

    page = 1,

    limit = 5

){



    return await this.request(



        `/public/podcasts?page=${page}&limit=${limit}`



    );



};









/*
====================================
PODCAST DATA MAPPER

Matches Worker JSON:

title
author_name
cover_url
audio_url
duration_seconds

====================================
*/







NightCastAPI.mapPodcast = function(

    item

){



    return {



        id:

        item.id,



        title:

        item.title || "بدون عنوان",



        author:

        item.author_name || "NightCast",



        book:

        item.book_name || "",



        category:

        item.category_name || "",



        description:

        item.description || item.summary || "",



        audio_url:

        item.audio_url || "",



        cover_url:

        item.cover_url || "",



        duration:

        item.duration_seconds || 0,



        episode:

        item.episode_number || 0,



        created_at:

        item.created_at



    };



};









/*
====================================
SAFE API CHECK

====================================
*/







NightCastAPI.healthCheck = async function(){



    try{



        const result =

        await this.testConnection();







        return {



            online:

            result.success === true,



            data:

            result



        };



    }



    catch(error){



        return {



            online:false,



            error:error.message



        };



    }



};









console.log(

    "🚀 NightCast API Final Layer Loaded"

);

    
