
/* ==================================================
   NightCast User Authentication Manager
   File: /users/js/auth.js
   Version: 2.0 Professional
================================================== */


const NightCastAuth = {


    user:null,





    /*
    ====================================
    INIT
    ====================================
    */


    async init(){


        if(

            !NightCastAPI.isLoggedIn()

        ){


            this.guest();


            return;


        }






        const result =

        await NightCastAPI.me();





        if(

            result.success &&

            result.user

        ){


            this.user =

            result.user;



            this.logged();



        }

        else{


            NightCastAPI.removeToken();


            this.guest();


        }



    },









    /*
    ====================================
    GUEST MODE
    ====================================
    */


    guest(){



        const btn =

        document.getElementById(

            "loginBtn"

        );



        if(btn){


            btn.textContent =

            "ورود";


        }




    },









    /*
    ====================================
    LOGGED MODE
    ====================================
    */


    logged(){



        const btn =

        document.getElementById(

            "loginBtn"

        );



        if(btn){


            btn.textContent =

            this.user.full_name ||

            "حساب کاربری";


        }




    },









    /*
    ====================================
    LOGIN PROCESS
    ====================================
    */


    async login(){



        const username =

        document.getElementById(

            "userLoginUsername"

        ).value.trim();





        const password =

        document.getElementById(

            "userLoginPassword"

        ).value;






        if(

            !username ||

            !password

        ){



            NightCastUI.error(

                "نام کاربری و رمز عبور را وارد کنید"

            );


            return;


        }








        NightCastUI.showLoader();





        const result =

        await NightCastAPI.login(

            username,

            password

        );





        NightCastUI.hideLoader();








        if(

            result.success

        ){



            this.user =

            result.user;





            this.logged();





            NightCastUI.success(

                "ورود موفق بود"

            );






            const popup =

            document.getElementById(

                "loginPopup"

            );



            if(popup){


                popup.classList.add(

                    "hidden"

                );


            }






        }

        else{


            NightCastUI.error(

                result.message ||

                "ورود ناموفق بود"

            );



        }





    },









    /*
    ====================================
    REGISTER
    ====================================
    */


    async register(data){


        return await NightCastAPI.register(data);


    },









    /*
    ====================================
    LOGOUT
    ====================================
    */


    async logout(){



        await NightCastAPI.logout();



        this.user=null;



        this.guest();



        location.reload();



    }





};










window.NightCastAuth =

NightCastAuth;









/*
====================================
EVENT CONNECTION
====================================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{





    NightCastAuth.init();





    const loginSubmit =

    document.getElementById(

        "userLoginSubmit"

    );





    if(loginSubmit){



        loginSubmit.addEventListener(

            "click",

            ()=>{


                NightCastAuth.login();



            }


        );



    }







});
