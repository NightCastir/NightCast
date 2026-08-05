/* ==================================================

NightCast User API SDK V2

File:
/users/js/api.js

Responsibility:
تمام ارتباط Frontend با Worker API

================================================== */

const NightCastAPI = {

    API_URL:
    "https://nightcast-api.tomasgermany2580.workers.dev/api/v1",

    TOKEN_KEY:
    "NightCastUserToken",

    DEFAULT_HEADERS: {
        "Content-Type": "application/json"
    },

    /* =====================================
       TOKEN
    ===================================== */

    getToken() {

        return localStorage.getItem(
            this.TOKEN_KEY
        );

    },

    setToken(token) {

        localStorage.setItem(
            this.TOKEN_KEY,
            token
        );

    },

    removeToken() {

        localStorage.removeItem(
            this.TOKEN_KEY
        );

    },

    isLoggedIn() {

        return !!this.getToken();

    },

    /* =====================================
       HEADERS
    ===================================== */

    getHeaders(extra = {}) {

        const headers = {
            ...this.DEFAULT_HEADERS,
            ...extra
        };

        const token = this.getToken();

        if (token) {

            headers.Authorization =
                "Bearer " + token;

        }

        return headers;

    },

    /* =====================================
       URL Builder
    ===================================== */

    buildURL(endpoint) {

        if (
            endpoint.startsWith("/")
        ) {

            return this.API_URL + endpoint;

        }

        return this.API_URL + "/" + endpoint;

    },



       /* =====================================
       MAIN REQUEST HANDLER

       تمام درخواست‌های API
       از اینجا عبور می‌کنند

    ===================================== */

    async request(
        endpoint,
        options = {}
    ) {

        try {


            const response =

            await fetch(

                this.buildURL(endpoint),

                {

                    method:
                    options.method || "GET",


                    headers:
                    this.getHeaders(
                        options.headers || {}
                    ),


                    body:
                    options.body
                    ?

                    JSON.stringify(
                        options.body
                    )

                    :

                    undefined

                }

            );





            const text =

            await response.text();





            let data = {};





            try {


                data =
                JSON.parse(text);


            }

            catch(e){


                data = {

                    success:
                    response.ok,


                    message:
                    text

                };


            }








            if(!response.ok){


                return {

                    success:false,


                    status:
                    response.status,


                    message:
                    data.message ||

                    "API Error",


                    data:data

                };


            }







            return data;





        }

        catch(error){



            console.error(

                "NightCast API Error:",

                error

            );





            return {


                success:false,


                message:
                "خطا در ارتباط با سرور",


                error:
                error.message


            };


        }


    },






    /* =====================================
       HEALTH CHECK

       تست اتصال Worker

    ===================================== */


    async test(){


        return await this.request(

            "/test"

        );


    },



   /* =====================================
   AUTH API

   Login
   Register
   Logout
   Current User

===================================== */


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


            this.setToken(

                result.token

            );


        }





        return result;


    },









    async register(data){


        return await this.request(

            "/public/register",

            {

                method:"POST",

                body:data

            }

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









    async me(){


        return await this.request(

            "/public/me",

            {

                method:"GET"

            }

        );


    },









    async refreshSession(){


        if(

            !this.isLoggedIn()

        ){

            return {

                success:false,

                message:
                "No token"

            };

        }





        return await this.me();


    },




   /* =====================================
   PODCAST API

   Public Podcasts
   Single Podcast
   Latest
   Categories

===================================== */





    async getPodcasts(

        page = 1,

        limit = 12

    ){



        return await this.request(


            `/public/podcasts?page=${page}&limit=${limit}`


        );


    },









    async getPodcast(id){



        if(!id){


            return {


                success:false,


                message:
                "Podcast ID required"


            };


        }






        return await this.request(


            `/public/podcast/${id}`


        );



    },









    async getLatestPodcasts(

        limit = 6

    ){



        return await this.request(


            `/public/podcasts/latest?limit=${limit}`


        );


    },









    async getPopularPodcasts(

        limit = 6

    ){



        return await this.request(


            `/public/podcasts/popular?limit=${limit}`


        );


    },









    async getPodcastsByCategory(

        categoryId,

        page = 1,

        limit = 12

    ){



        return await this.request(


            `/public/podcasts/category/${categoryId}?page=${page}&limit=${limit}`


        );


    },









    async getCategories(){



        return await this.request(


            "/public/categories"


        );


    },





   /* =====================================
   SEARCH + CONTENT API

   Search
   Books
   Authors
   Tags

===================================== */







    async search(

        query,

        page = 1,

        limit = 12

    ){



        if(!query){


            return {


                success:false,


                message:
                "Search query required"


            };


        }






        return await this.request(


            `/public/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`


        );



    },









    async searchPodcasts(

        query

    ){



        return await this.search(

            query

        );


    },









    async getBooks(

        page = 1,

        limit = 12

    ){



        return await this.request(


            `/public/books?page=${page}&limit=${limit}`


        );


    },









    async getBook(id){



        if(!id){


            return {


                success:false,


                message:
                "Book ID required"


            };


        }





        return await this.request(


            `/public/book/${id}`


        );


    },









    async getAuthors(){



        return await this.request(


            "/public/authors"


        );


    },









    async getAuthor(id){



        return await this.request(


            `/public/author/${id}`


        );


    },









    async getTags(){



        return await this.request(


            "/public/tags"


        );


    },




   /* =====================================
   USER LIBRARY API

   Favorites
   History
   Saved Items

===================================== */







    async getLibrary(){



        return await this.request(


            "/user/library"


        );



    },









    async getFavorites(){



        return await this.request(


            "/user/favorites"


        );



    },









    async addFavorite(

        podcastId

    ){



        if(!podcastId){


            return {


                success:false,


                message:
                "Podcast ID required"


            };


        }







        return await this.request(


            "/user/favorite",


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


            "/user/favorite/" + podcastId,


            {

                method:"DELETE"

            }


        );


    },









    async getHistory(){



        return await this.request(


            "/user/history"


        );


    },









    async addHistory(

        podcastId

    ){



        return await this.request(


            "/user/history",


            {

                method:"POST",


                body:{


                    podcast_id:
                    podcastId


                }


            }


        );


    },









    async getSaved(){



        return await this.request(


            "/user/saved"


        );


    },









    async savePodcast(

        podcastId

    ){



        return await this.request(


            "/user/save",


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


            "/user/save/" + podcastId,


            {

                method:"DELETE"

            }


        );


    },




   /* =====================================
   COMMENTS + DOWNLOAD API

   Comments
   Downloads
   User Actions

===================================== */







    async getComments(

        podcastId,

        page = 1,

        limit = 20

    ){



        if(!podcastId){


            return {


                success:false,


                message:
                "Podcast ID required"


            };


        }





        return await this.request(


            `/public/comments/${podcastId}?page=${page}&limit=${limit}`


        );



    },









    async addComment(

        podcastId,

        text

    ){



        if(!podcastId || !text){


            return {


                success:false,


                message:
                "Comment data required"


            };


        }





        return await this.request(


            "/user/comment",


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

        commentId

    ){



        return await this.request(


            "/user/comment/" + commentId,


            {

                method:"DELETE"

            }


        );


    },









    /* =====================================
       DOWNLOAD

       Requires Login

    ===================================== */







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


            "/user/download",


            {

                method:"POST",


                body:{


                    podcast_id:
                    podcastId


                }


            }


        );



    },









    async getDownloadLink(

        podcastId

    ){



        return await this.request(


            `/user/download/${podcastId}`


        );



    },









    async report(

        type,

        id,

        reason

    ){



        return await this.request(


            "/user/report",


            {

                method:"POST",


                body:{


                    type:type,


                    id:id,


                    reason:reason


                }


            }


        );


    },



/* =====================================
   API HELPERS

   Utilities

===================================== */







    async upload(

        endpoint,

        formData

    ){



        try {



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


                message:
                error.message


            };



        }


    },









    async ping(){



        return await this.test();


    },









    handleError(error){



        console.error(

            "NightCast API Error",

            error

        );



        return {


            success:false,


            message:
            "خطا در ارتباط با سرور"


        };


    }



};









/* =====================================
   GLOBAL EXPORT

===================================== */


window.NightCastAPI = NightCastAPI;









console.log(

    "✅ NightCast API Loaded"

);
   
