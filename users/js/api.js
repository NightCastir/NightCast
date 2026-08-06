/* ==================================================

NightCast User API Client V1

File:
users/assets/js/core/api.js

Responsibility:
- HTTP Communication Layer
- Worker API Requests
- Token Injection
- Error Handling

Compatible With:
Cloudflare Worker API V5

================================================== */


const API = {


    BASE_URL :

    "https://nightcast-api.tomasgermany2580.workers.dev/api/v1",



    TOKEN_KEY :

    "NightCastUserToken",




    // ==========================================
    // GET TOKEN
    // ==========================================

    getToken(){


        return localStorage.getItem(

            this.TOKEN_KEY

        );


    },






    // ==========================================
    // BUILD HEADERS
    // ==========================================

    headers(custom={}){


        const headers = {


            "Content-Type":

            "application/json",


            ...custom


        };



        const token = this.getToken();



        if(token){


            headers["Authorization"] =

            "Bearer " + token;


        }



        return headers;


    },







    // ==========================================
    // CORE REQUEST
    // ==========================================

    async request(

        endpoint,

        options={}

    ){



        try{


            const response =

            await fetch(

                this.BASE_URL + endpoint,

                {


                    ...options,


                    headers:

                    this.headers(

                        options.headers || {}

                    )


                }

            );




            const data =

            await response.json();





            if(!response.ok){



                return {


                    success:false,


                    status:

                    response.status,


                    message:

                    data.message

                    ||

                    "Request failed",


                    data:data


                };


            }




            return data;



        }

        catch(error){



            return {


                success:false,


                message:error.message,


                network_error:true


            };



        }



    },









    // ==========================================
    // GET
    // ==========================================

    async get(endpoint){



        return await this.request(

            endpoint,

            {

                method:"GET"

            }

        );


    },









    // ==========================================
    // POST
    // ==========================================

    async post(

        endpoint,

        body={}

    ){



        return await this.request(

            endpoint,

            {


                method:"POST",


                body:

                JSON.stringify(body)


            }

        );



    },









    // ==========================================
    // PUT
    // ==========================================

    async put(

        endpoint,

        body={}

    ){



        return await this.request(

            endpoint,

            {


                method:"PUT",


                body:

                JSON.stringify(body)


            }

        );


    },









    // ==========================================
    // DELETE
    // ==========================================

    async delete(endpoint){



        return await this.request(

            endpoint,

            {


                method:"DELETE"


            }

        );


    },









    // ==========================================
    // PUBLIC PODCASTS
    // ==========================================

    async podcasts(

        page=1,

        limit=5

    ){


        return await this.get(

            `/public/podcasts?page=${page}&limit=${limit}`

        );


    },









    // ==========================================
    // SINGLE PODCAST
    // ==========================================

    async podcast(id){


        return await this.get(

            `/podcasts/${id}`

        );


    },









    // ==========================================
    // DOWNLOAD PODCAST
    // ==========================================

    async download(id){


        return await this.get(

            `/public/download/${id}`

        );


    },









    // ==========================================
    // USER PROFILE
    // ==========================================

    async me(){


        return await this.get(

            "/auth/me"

        );


    },








    // ==========================================
    // LOGIN
    // ==========================================

    async login(

        username,

        password

    ){


        return await this.post(

            "/public/login",

            {


                username,

                password


            }

        );


    },









    // ==========================================
    // REGISTER
    // ==========================================

    async register(data){


        return await this.post(

            "/public/register",

            data


        );


    }






};





// ==========================================
// GLOBAL EXPORT
// ==========================================

window.API = API;



console.log(

"NightCast User API Loaded"

);
