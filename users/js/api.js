/* ==================================================

   NightCast User API Manager V3

   File:
   /users/js/core/api.js


   Responsibility:

   ONLY API Communication


================================================== */



const NightCastAPI = {



    /*
    ====================================
    BASE URL
    ====================================
    */


    baseURL:

    "https://nightcast-api.tomasgermany2580.workers.dev/api/v1",





    /*
    ====================================
    USER TOKEN KEY

    Separate from Admin Panel

    ====================================
    */


    tokenKey:

    "NightCastUserToken",







    /*
    ====================================
    TOKEN METHODS
    ====================================
    */



    getToken(){


        return localStorage.getItem(

            this.tokenKey

        );


    },






    setToken(token){


        if(!token){

            return false;

        }



        localStorage.setItem(

            this.tokenKey,

            token

        );



        return true;


    },






    removeToken(){


        localStorage.removeItem(

            this.tokenKey

        );


    },






    isLoggedIn(){


        return !!this.getToken();


    },









    /*
    ====================================
    REQUEST HEADERS
    ====================================
    */


    headers(auth=false){



        const headers = {



            "Content-Type":

            "application/json"



        };





        if(auth){



            const token =

            this.getToken();





            if(token){



                headers.Authorization =


                "Bearer " + token;



            }


        }





        return headers;



    },









    /*
    ====================================
    MAIN REQUEST ENGINE
    ====================================
    */


    async request(

        endpoint,

        options={}

    ){



        try{



            const response =

            await fetch(


                this.baseURL + endpoint,


                options


            );







            let data;







            try{



                data =

                await response.json();



            }

            catch(e){



                data={


                    success:false,


                    message:

                    "Invalid JSON response"


                };


            }









            if(!response.ok){



                return {


                    success:false,


                    status:

                    response.status,



                    message:

                    data.message ||

                    "API Request Failed"



                };



            }







            return data;





        }

        catch(error){





            return {



                success:false,



                message:

                "Network Error",



                error:

                error.message



            };



        }



    },









    /*
    ====================================
    TEST WORKER
    ====================================
    */


    async test(){



        return this.request(


            "/test",


            {

                method:"GET"

            }


        );



    },









    /*
    ====================================
    PUBLIC PODCASTS
    ====================================
    */


    async getPodcasts(

        page=1,

        limit=5


    ){



        return this.request(


            `/public/podcasts?page=${page}&limit=${limit}`,


            {

                method:"GET"

            }


        );



    },









    /*
    ====================================
    REGISTER USER
    ====================================
    */


    async register(data){



        return this.request(


            "/public/register",


            {



                method:"POST",




                headers:


                this.headers(),




                body:


                JSON.stringify(data)



            }


        );



    },









    /*
    ====================================
    LOGIN USER
    ====================================
    */


    async login(

        username,

        password


    ){





        const result =

        await this.request(


            "/public/login",


            {



                method:"POST",




                headers:


                this.headers(),





                body:


                JSON.stringify({


                    username,

                    password


                })




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









    /*
    ====================================
    CURRENT USER
    ====================================
    */


    async me(){



        return this.request(



            "/public/me",




            {



                method:"GET",




                headers:


                this.headers(true)



            }



        );



    },









    /*
    ====================================
    DOWNLOAD PODCAST
    ====================================
    */


    async download(id){



        return this.request(



            "/public/download/" + id,




            {



                method:"GET",




                headers:


                this.headers(true)



            }



        );



    }



};









/*
====================================
GLOBAL ACCESS

Used by:

auth.js
podcasts.js
player.js
library.js

====================================
*/


window.NightCastAPI = NightCastAPI;






console.log(

"NightCast User API V3 Loaded"

);
