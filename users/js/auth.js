/* ==================================================

NightCast User Auth Manager V1

File:
users/assets/js/core/auth.js

Responsibility:
- User authentication
- Token management
- Session check
- Logout
- User state

API:
Cloudflare Worker V5

================================================== */


const AuthManager = {


    TOKEN_KEY : "NightCastUserToken",


    USER_KEY : "NightCastUser",



    API_URL :

    "https://nightcast-api.tomasgermany2580.workers.dev/api/v1",



    // ==========================================
    // SAVE LOGIN SESSION
    // ==========================================

    saveSession(data){


        if(!data || !data.token){

            return false;

        }



        localStorage.setItem(

            this.TOKEN_KEY,

            data.token

        );



        if(data.user){

            localStorage.setItem(

                this.USER_KEY,

                JSON.stringify(data.user)

            );

        }


        return true;

    },




    // ==========================================
    // GET TOKEN
    // ==========================================

    getToken(){


        return localStorage.getItem(

            this.TOKEN_KEY

        );


    },





    // ==========================================
    // GET CURRENT USER FROM STORAGE
    // ==========================================

    getUser(){


        const user =

        localStorage.getItem(

            this.USER_KEY

        );


        try{

            return user

            ?

            JSON.parse(user)

            :

            null;


        }

        catch(e){

            return null;

        }

    },





    // ==========================================
    // CHECK LOGIN STATE
    // ==========================================

    isLoggedIn(){


        return !!this.getToken();


    },





    // ==========================================
    // AUTH HEADER
    // ==========================================

    headers(){


        const token = this.getToken();



        const headers = {


            "Content-Type":

            "application/json"


        };



        if(token){


            headers["Authorization"] =

            "Bearer " + token;


        }


        return headers;


    },






    // ==========================================
    // LOGIN
    // ==========================================

    async login(username,password){


        try{


            const response =

            await fetch(

                this.API_URL +

                "/public/login",

                {

                    method:"POST",


                    headers:{


                        "Content-Type":

                        "application/json"


                    },


                    body:JSON.stringify({

                        username,

                        password

                    })


                }

            );



            const data =

            await response.json();



            if(

                data.success

                &&

                data.token

            ){


                this.saveSession(data);


            }



            return data;



        }

        catch(error){



            return {

                success:false,

                message:error.message


            };


        }



    },






    // ==========================================
    // REGISTER
    // ==========================================

    async register(payload){


        try{


            const response =

            await fetch(

                this.API_URL +

                "/public/register",

                {

                    method:"POST",


                    headers:{


                        "Content-Type":

                        "application/json"


                    },


                    body:

                    JSON.stringify(payload)


                }

            );



            return await response.json();



        }

        catch(error){


            return {


                success:false,

                message:error.message


            };


        }



    },







    // ==========================================
    // GET CURRENT USER FROM SERVER
    // ==========================================

    async me(){


        const token = this.getToken();



        if(!token){


            return {


                success:false,

                message:"No token"


            };


        }





        try{


            const response =

            await fetch(

                this.API_URL +

                "/auth/me",

                {

                    method:"GET",


                    headers:

                    this.headers()


                }

            );



            const data =

            await response.json();





            if(

                data.success

                &&

                data.user

            ){


                localStorage.setItem(

                    this.USER_KEY,

                    JSON.stringify(data.user)

                );


            }



            return data;



        }

        catch(error){


            return {


                success:false,

                message:error.message


            };


        }


    },







    // ==========================================
    // CHECK SERVER SESSION
    // ==========================================

    async status(){


        try{


            const response =

            await fetch(

                this.API_URL +

                "/auth/status",

                {

                    method:"GET",


                    headers:

                    this.headers()


                }

            );



            return await response.json();


        }

        catch(error){


            return {

                success:false,

                message:error.message

            };


        }



    },








    // ==========================================
    // LOGOUT
    // ==========================================

    async logout(){


        try{


            await fetch(

                this.API_URL +

                "/auth/logout",

                {

                    method:"POST",

                    headers:

                    this.headers()


                }

            );


        }

        catch(e){}



        localStorage.removeItem(

            this.TOKEN_KEY

        );



        localStorage.removeItem(

            this.USER_KEY

        );



        return {


            success:true,

            message:"Logged out"


        };


    },







    // ==========================================
    // REQUIRE LOGIN
    // برای صفحات محافظت شده
    // ==========================================

    async requireLogin(){



        if(!this.isLoggedIn()){


            return false;


        }




        const result =

        await this.status();




        if(

            !result.authenticated

        ){


            this.logout();


            return false;


        }




        return true;


    }



};




// ==========================================
// GLOBAL EXPORT
// ==========================================

window.AuthManager = AuthManager;



console.log(

"NightCast User Auth Loaded"

);
