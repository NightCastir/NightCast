/* ==================================================

NightCast Login Controller V2

File:
users/js/login.js


Responsibilities:

- OpenID Authentication
- Guest Login
- Token Storage
- User State
- Redirect


================================================== */


(function(){


"use strict";





const Login = {



    config:{


        redirect:"/users/",


        openidEndpoint:
        "/api/v1/auth/openid"


    },








    init(){


        console.log(
            "NightCast Login Ready"
        );



        this.bind();



    },









    bind(){



        const openIdButton =

        document.getElementById(
            "openIdLogin"
        );





        const guestButton =

        document.getElementById(
            "guestLogin"
        );







        if(openIdButton){



            openIdButton.addEventListener(

                "click",

                ()=>{


                    this.openID();


                }

            );



        }








        if(guestButton){



            guestButton.addEventListener(

                "click",

                ()=>{


                    this.guest();


                }

            );



        }



    },









    openID(){



        this.loading(true);





        /*
        
        مرحله اول:

        انتقال به سرویس OpenID
        
        مثال:

        Google OAuth
        Apple Sign In
        Auth0
        
        */


        const url =

        this.config.openidEndpoint;






        /*
        
        در نسخه واقعی:

        window.location.href=url;


        فعلا حالت آماده تست
        
        */





        setTimeout(()=>{



            this.fakeOpenID();



        },1200);




    },









    fakeOpenID(){



        /*
        
        شبیه سازی پاسخ OpenID
        
        بعدا با Worker API جایگزین می‌شود
        
        */





        const user = {



            id:

            "openid_user_001",



            name:

            "NightCast User",



            provider:

            "openid",



            role:

            "listener"

        };








        const token =



        "NC_" +

        Date.now();








        this.saveSession(

            user,

            token

        );







        this.redirect();



    },









    guest(){



        const guestUser = {



            id:

            "guest_" + Date.now(),



            name:

            "مهمان NightCast",



            provider:

            "guest",



            role:

            "guest"


        };








        this.saveSession(


            guestUser,


            null


        );






        this.redirect();



    },









    saveSession(
        user,
        token
    ){





        localStorage.setItem(


            "NightCastUser",


            JSON.stringify(user)


        );






        if(token){



            localStorage.setItem(


                "NightCastToken",


                token


            );



        }





        else{


            localStorage.removeItem(

                "NightCastToken"

            );


        }








    },









    redirect(){



        setTimeout(()=>{



            window.location.href =

            this.config.redirect;



        },500);



    },









    loading(status){



        const loader =

        document.getElementById(

            "authLoader"

        );





        if(!loader){

            return;

        }







        if(status){



            loader.classList.remove(

                "hidden"

            );


        }

        else{



            loader.classList.add(

                "hidden"

            );


        }




    }







};







window.NightCastLogin = Login;






document.addEventListener(

"DOMContentLoaded",

()=>{


    Login.init();


});







})();
