/* ==================================================
   NightCast User API Manager V2

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
    TOKEN KEY

    IMPORTANT:
    User Authentication Only

    ====================================
    */


    tokenKey:

    "NightCastUserToken",







    /*
    ====================================
    GET TOKEN
    ====================================
    */


    getToken(){


        return localStorage.getItem(

            this.tokenKey

        );


    },









    /*
    ====================================
    SAVE TOKEN
    ====================================
    */


    setToken(token){


        if(!token){

            return;

        }


        localStorage.setItem(

            this.tokenKey,

            token

        );


    },









    /*
    ====================================
    REMOVE TOKEN
    ====================================
    */


    removeToken(){


        localStorage.removeItem(

            this.tokenKey

        );


    },









    /*
    ====================================
    CHECK LOGIN
    ====================================
    */


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
    REQUEST ENGINE
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

            catch(error){


                data={

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



            console.error(

                "NightCast API Error:",

                error

            );





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
    TEST API
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
    PODCAST LIST
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
    REGISTER
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
    LOGIN
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






window.NightCastAPI = NightCastAPI;





console.log(

"NightCast API V2 Loaded"

);
