/* ==================================================

NightCast Login Controller V5

File:
users/js/login.js

Connect:
Cloudflare Worker API

================================================== */


(function(){

"use strict";



const API_URL =

"https://nightcast-api.tomasgermany2580.workers.dev/api/v1";



const GOOGLE_CLIENT_ID =

"242292157493-km4c11qgkf0lr3e6pv9paspkn95jbf3a.apps.googleusercontent.com";





const Login = {



    googleReady:false,





    init(){


        console.log(
            "NightCast Login Loaded"
        );


        this.bindEvents();

        this.initGoogle();

        this.checkExistingSession();


    },









    bindEvents(){








        const guestButton =

        document.getElementById(
            "guestLogin"
        );



        if(guestButton){


            guestButton.addEventListener(

                "click",

                ()=>{

                    this.guestLogin();

                }

            );


        }



    },









/* ==========================================
   GOOGLE INITIALIZE
========================================== */



    initGoogle(){



        if(

            window.google &&

            google.accounts

        ){


            this.setupGoogle();


            return;


        }





        const checker = setInterval(()=>{


            if(

                window.google &&

                google.accounts

            ){


                clearInterval(checker);


                this.setupGoogle();


            }


        },200);




        setTimeout(()=>{


            clearInterval(checker);


            if(!this.googleReady){


                console.error(

                    "Google Identity timeout"

                );


            }


        },10000);



    },









    setupGoogle(){



        google.accounts.id.initialize({


            client_id:GOOGLE_CLIENT_ID,


            callback:(response)=>{


                console.log(

                    "Google Token Received"

                );


                this.googleCallback(response);



            }


        });




        this.googleReady = true;



        console.log(

            "Google Identity Ready"

        );



    },









/* ==========================================
   GOOGLE LOGIN
========================================== */




    async googleCallback(response){



        try{



            const result = await fetch(


                API_URL +

                "/public/openid/google",


                {


                    method:"POST",


                    headers:{


                        "Content-Type":

                        "application/json"


                    },


                    body:JSON.stringify({


                        idToken:

                        response.credential


                    })


                }


            );





            const data = await result.json();





            if(!data.success){


                throw new Error(

                    data.message ||

                    "Google Login Failed"

                );


            }






            this.saveSession(


                data.token,


                data.user


            );





            window.location.href =

            "index.html";




        }

        catch(error){



            this.hideLoader();



            this.showError(

                error.message

            );


        }



    },









/* ==========================================
   GUEST LOGIN
========================================== */



    async guestLogin(){

    try{

        this.showLoader();

        /*
        ==========================================
        GUEST USER
        ==========================================

        مهمان کاربر لاگین‌شده نیست.
        بنابراین هیچ Token یا User Session
        برای او ذخیره نمی‌کنیم.
        */

        localStorage.removeItem(
            "NightCastToken"
        );

        localStorage.removeItem(
            "NightCastUser"
        );


        /*
        ==========================================
        GO TO INDEX
        ==========================================
        */

        window.location.href =
        "index.html";

    }

    catch(error){

        this.hideLoader();

        this.showError(
            error.message
        );

    }

},









/* ==========================================
   SESSION
========================================== */



    saveSession(token,user){



        localStorage.setItem(


            "NightCastToken",


            token


        );




        localStorage.setItem(


            "NightCastUser",


            JSON.stringify(user)


        );



    },









    checkExistingSession(){



        const token =

        localStorage.getItem(

            "NightCastToken"

        );



        if(token){



            console.log(

                "Existing session found"

            );



            /*
              فعلاً غیرفعال است
              تا صفحه Login همیشه دیده شود
            */


            // window.location.href="index.html";


        }



    },









/* ==========================================
   UI
========================================== */



    showLoader(){



        const loader =

        document.getElementById(

            "authLoader"

        );



        if(loader){


            loader.classList.remove(

                "hidden"

            );


        }



    },









    hideLoader(){



        const loader =

        document.getElementById(

            "authLoader"

        );



        if(loader){


            loader.classList.add(

                "hidden"

            );


        }



    },









    showError(message){



        const box =

        document.getElementById(

            "loginMessage"

        );



        if(box){


            box.innerHTML =

            message;



        }

        else{


            alert(message);


        }



    }





};







window.NightCastLogin = Login;







document.addEventListener(

"DOMContentLoaded",

()=>{


    Login.init();


}

);



})();
