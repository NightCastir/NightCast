
/* ==================================================
   NightCast User API Manager
   File: /users/js/api.js
   Version: 2.0 Professional
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
    TOKEN KEY
    ====================================
    */

    tokenKey:

    "NightCastUserToken",




    /*
    ====================================
    TOKEN MANAGEMENT
    ====================================
    */


    getToken(){


        return localStorage.getItem(

            this.tokenKey

        );


    },




    setToken(token){


        if(!token){

            return;

        }


        localStorage.setItem(

            this.tokenKey,

            token

        );


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
    HEADERS
    ====================================
    */


    headers(auth=false){


        const headers = {


            "Content-Type":

            "application/json",


            "Accept":

            "application/json"


        };



        if(auth){


            const token = this.getToken();



            if(token){


                headers.Authorization =

                "Bearer " + token;


            }


        }



        return headers;


    },






    /*
    ====================================
    REQUEST ENGINE
    ====================================
    */


    async request(endpoint, options={}){


        try{


            const response =

            await fetch(

                this.baseURL + endpoint,

                {


                    ...options,


                    headers:

                    options.headers || this.headers(false)


                }

            );




            let data;



            try{


                data =

                await response.json();



            }

            catch(e){


                data = {


                    success:false,


                    message:

                    "Invalid server response"


                };


            }






            if(!response.ok){


                return {


                    success:false,


                    status:

                    response.status,


                    message:

                    data.message ||

                    "Request failed"



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
    TEST
    ====================================
    */


    async test(){


        return await this.request(

            "/test",

            {

                method:"GET"

            }


        );


    },









    /*
    ====================================
    PUBLIC PODCAST LIST
    ====================================
    */


    async getPodcasts(page=1,limit=5){


        return await this.request(


            `/public/podcasts?page=${page}&limit=${limit}`,


            {


                method:"GET"


            }


        );


    },








    /*
    ====================================
    LOGIN
    ====================================
    */


    async login(username,password){



        const result =

        await this.request(


            "/public/login",


            {


                method:"POST",


                headers:

                this.headers(false),


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


        return await this.request(


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
    REGISTER
    ====================================
    */


    async register(data){


        return await this.request(


            "/public/register",


            {


                method:"POST",


                headers:

                this.headers(false),


                body:

                JSON.stringify(data)



            }



        );


    },









    /*
    ====================================
    DOWNLOAD
    ====================================
    */


    async downloadPodcast(id){


        return await this.request(


            "/public/download/" + id,


            {


                method:"GET",


                headers:

                this.headers(true)



            }


        );


    },








    /*
    ====================================
    LOGOUT
    ====================================
    */


    async logout(){



        const result =

        await this.request(


            "/public/logout",


            {


                method:"POST",


                headers:

                this.headers(true)



            }



        );



        this.removeToken();



        return result;



    }




};





window.NightCastAPI =

NightCastAPI;



console.log(

"NightCast API Core Loaded"

);
