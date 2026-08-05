/* ==================================================

NightCast User API Manager V1

File:

/users/js/api.js


Responsibility:

ONLY API COMMUNICATION


Worker:

nightcast-api.tomasgermany2580.workers.dev


================================================== */


const API = {


    /*
    ====================================
    BASE URL
    ====================================
    */


    base:

    "https://nightcast-api.tomasgermany2580.workers.dev/api/v1",






    /*
    ====================================
    TOKEN
    ====================================
    */


    token(){


        return localStorage.getItem(

            "NightCastUserToken"

        );


    },







    /*
    ====================================
    HEADERS
    ====================================
    */


    headers(json=false){


        const headers = {};



        if(json){


            headers[

                "Content-Type"

            ] = "application/json";


        }






        const token = this.token();




        if(token){


            headers[

                "Authorization"

            ] =

            "Bearer " + token;


        }






        return headers;


    },








    /*
    ====================================
    GET REQUEST
    ====================================
    */


    async get(endpoint){



        try{


            const response =

            await fetch(


                this.base + endpoint,


                {

                    method:"GET",

                    headers:this.headers()

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
    POST REQUEST
    ====================================
    */


    async post(endpoint,data){



        try{



            const response =

            await fetch(


                this.base + endpoint,


                {


                    method:"POST",


                    headers:this.headers(true),


                    body:

                    JSON.stringify(data)


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
    PUT REQUEST
    ====================================
    */


    async put(endpoint,data){



        try{



            const response =

            await fetch(


                this.base + endpoint,


                {


                    method:"PUT",


                    headers:this.headers(true),


                    body:

                    JSON.stringify(data)


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
    DELETE REQUEST
    ====================================
    */


    async delete(endpoint){



        try{



            const response =

            await fetch(


                this.base + endpoint,


                {


                    method:"DELETE",


                    headers:this.headers()


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
    LOGIN
    ====================================
    */


    async login(username,password){



        const result =

        await this.post(


            "/public/login",


            {


                username,


                password


            }


        );






        if(


            result.success &&

            result.token


        ){



            localStorage.setItem(


                "NightCastUserToken",


                result.token


            );


        }






        return result;



    },









    /*
    ====================================
    REGISTER
    ====================================
    */


    async register(data){



        return await this.post(


            "/public/register",


            data


        );



    },









    /*
    ====================================
    CURRENT USER
    ====================================
    */


    async me(){



        return await this.get(


            "/public/me"


        );


    },









    /*
    ====================================
    PODCASTS
    ====================================
    */


    async podcasts(page=1,limit=5){



        return await this.get(


            `/public/podcasts?page=${page}&limit=${limit}`


        );


    },









    /*
    ====================================
    LOGOUT LOCAL
    ====================================
    */


    removeToken(){



        localStorage.removeItem(


            "NightCastUserToken"


        );


    },









    /*
    ====================================
    LOGIN STATUS
    ====================================
    */


    isLoggedIn(){



        return !!this.token();



    }



};








window.API = API;






console.log(

    "NightCast API V1 Loaded"

);
