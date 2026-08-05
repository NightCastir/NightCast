/* ==================================================

   NightCast User Authentication Manager V1


   File:

   /users/js/core/auth.js


   Responsibility:

   ONLY USER AUTHENTICATION


================================================== */





const NightCastAuth = {





    /*
    ====================================
    INIT
    ====================================
    */


    init(){


        this.checkSession();



    },









    /*
    ====================================
    CHECK USER SESSION

    Called on startup

    ====================================
    */


    async checkSession(){



        if(!NightCastAPI.isLoggedIn()){



            this.setGuest();



            return {


                loggedIn:false


            };



        }








        const result =

        await NightCastAPI.me();







        if(result.success){



            this.currentUser =

            result.user || result.data;



            this.setUser(

                this.currentUser

            );



            return {


                loggedIn:true,


                user:this.currentUser



            };



        }







        else{



            this.logoutLocal();



            this.setGuest();



            return {


                loggedIn:false


            };



        }





    },









    /*
    ====================================
    CURRENT USER
    ====================================
    */


    currentUser:null,









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

        await NightCastAPI.login(


            username,


            password


        );







        if(


            result.success &&

            result.token


        ){



            await this.checkSession();



        }






        return result;



    },









    /*
    ====================================
    REGISTER

    ====================================
    */


    async register(data){



        return NightCastAPI.register(

            data

        );



    },









    /*
    ====================================
    LOGOUT

    ====================================
    */


    logout(){



        this.logoutLocal();



        this.setGuest();



    },









    /*
    ====================================
    LOCAL LOGOUT

    ====================================
    */


    logoutLocal(){



        NightCastAPI.removeToken();



        this.currentUser = null;



    },









    /*
    ====================================
    GUEST MODE

    User can browse

    ====================================
    */


    setGuest(){



        this.currentUser = {


            id:null,


            username:"guest",


            role:"guest"



        };



    },









    /*
    ====================================
    SET USER

    ====================================
    */


    setUser(user){



        this.currentUser = user;



    },









    /*
    ====================================
    STATUS

    ====================================
    */


    isLoggedIn(){



        return NightCastAPI.isLoggedIn();



    },






    isGuest(){



        return !this.isLoggedIn();



    },









    /*
    ====================================
    DOWNLOAD PERMISSION

    ====================================
    */


    canDownload(){



        return this.isLoggedIn();



    },









    /*
    ====================================
    REQUIRE LOGIN

    Used before:

    Download
    Save
    Favorite

    ====================================
    */


    requireLogin(){



        if(this.isLoggedIn()){



            return true;



        }







        return false;



    },









    /*
    ====================================
    GET USER

    ====================================
    */


    getUser(){



        return this.currentUser;



    }



};









/*
====================================

GLOBAL ACCESS

====================================
*/


window.NightCastAuth = NightCastAuth;





/*
====================================

AUTO START

====================================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{


    NightCastAuth.init();



}

);






console.log(

"NightCast Auth V1 Loaded"

);
