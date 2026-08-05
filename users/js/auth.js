/* ==================================================
   NightCast Authentication Manager V2

   File:
   /users/js/core/auth.js

   Responsibility:
   User Identity Management

================================================== */


const NightCastAuth = {


    user:null,


    initialized:false,





    /*
    ====================================
    INIT
    ====================================
    */


    async init(){


        if(this.initialized){

            return;

        }



        this.initialized = true;




        if(!NightCastAPI.isLoggedIn()){


            this.updateUI();


            return;


        }






        const result =

        await this.getCurrentUser();





        if(result.success){


            this.user = result.user;


        }

        else{


            NightCastAPI.removeToken();


            this.user = null;


        }





        this.updateUI();



    },









    /*
    ====================================
    GET CURRENT USER
    ====================================
    */


    async getCurrentUser(){



        return await NightCastAPI.me();



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

        await NightCastAPI.login(

            username,

            password

        );






        if(

            result.success

        ){



            this.user = result.user;



            this.updateUI();



        }






        return result;



    },









    /*
    ====================================
    LOGOUT
    ====================================
    */


    async logout(){



        await NightCastAPI.logout();




        this.user = null;




        this.updateUI();





        if(window.NightCastUI){



            NightCastUI.showMessage(

                "از حساب کاربری خارج شدید"

            );



        }





    },









    /*
    ====================================
    CHECK LOGIN
    ====================================
    */


    isLoggedIn(){



        return NightCastAPI.isLoggedIn();



    },









    /*
    ====================================
    GET USER
    ====================================
    */


    getUser(){



        return this.user;



    },









    /*
    ====================================
    UPDATE HEADER UI

    Login Button

    ====================================
    */


    updateUI(){



        const loginBtn =

        document.getElementById(

            "loginBtn"

        );





        if(!loginBtn){

            return;

        }






        if(this.user){



            loginBtn.innerHTML =


            `

            👤

            ${

                this.user.full_name ||

                this.user.username

            }

            `;





            loginBtn.dataset.logged =

            "true";




        }

        else{



            loginBtn.innerHTML =

            "ورود";



            loginBtn.dataset.logged =

            "false";



        }



    },









    /*
    ====================================
    REQUIRE LOGIN

    For protected actions

    ====================================
    */


    requireLogin(){



        if(this.isLoggedIn()){


            return true;


        }






        if(window.NightCastUI){



            NightCastUI.showMessage(

                "برای ادامه ابتدا وارد حساب شوید"

            );


        }





        return false;



    },









    /*
    ====================================
    OPENID READY

    Future:

    Google
    Facebook
    Apple

    ====================================
    */


    providers:{


        google:false,


        facebook:false,


        apple:false



    }





};






window.NightCastAuth = NightCastAuth;






document.addEventListener(

"DOMContentLoaded",

()=>{


    NightCastAuth.init();



});



console.log(

"NightCast Auth V2 Loaded"

);
