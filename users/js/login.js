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
this.setupRedirectButton();

    /*
    ==========================================
    CHECK EXISTING LOGIN
    ==========================================
    */

    const token =
        localStorage.getItem(
            "NightCastToken"
        );

    const user =
        localStorage.getItem(
            "NightCastUser"
        );


    /*
    اگر کاربر قبلاً با Google
    وارد شده است، Login را دوباره نشان نده.
    */

 if(token && user){



    window.location.replace(
        "index.html"
    );


    return;

}



    /*
    کاربر Login نیست.
    بنابراین صفحه Login را آماده کن.
    */

    this.bindEvents();

    this.initGoogle();

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

const container =
    document.getElementById(
        "googleLoginButton"
    );


if(!container){

    console.error(
        "Google login button container not found"
    );

    return;

}


google.accounts.id.renderButton(

    container,

    {

        type:"standard",

        theme:"outline",

        size:"large",

        text:"continue_with",

        shape:"rectangular",

        width:320,

        logo_alignment:"left"

    }

);


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

        this.showLoader();


        /*
        ==========================================
        GOOGLE TOKEN CHECK
        ==========================================
        */

        if(
            !response ||
            !response.credential
        ){

            throw new Error(
                "Google Token دریافت نشد."
            );

        }


        /*
        ==========================================
        SEND GOOGLE TOKEN TO NIGHTCAST API
        ==========================================
        */

        const result =
            await fetch(

                API_URL +
                "/public/openid/google",

                {

                    method:"POST",

                    headers:{

                        "Content-Type":
                        "application/json"

                    },

                    body:
                    JSON.stringify({

                        idToken:
                        response.credential

                    })

                }

            );


        /*
        ==========================================
        READ API RESPONSE
        ==========================================
        */

        const data =
            await result.json();


        /*
        ==========================================
        API ERROR
        ==========================================
        */

        if(
            !result.ok ||
            !data.success
        ){

            throw new Error(

                data.message ||
                "ورود Google در NightCast ناموفق بود."

            );

        }


        /*
        ==========================================
        CHECK SESSION DATA
        ==========================================
        */

        if(!data.token){

            throw new Error(
                "NightCast Token از سرور دریافت نشد."
            );

        }


        if(!data.user){

            throw new Error(
                "اطلاعات کاربر از سرور دریافت نشد."
            );

        }


        /*
        ==========================================
        SAVE NIGHTCAST SESSION
        ==========================================
        */

        this.saveSession(
            data.token,
            data.user
        );


        /*
        ==========================================
        VERIFY LOCAL SESSION
        ==========================================
        */

        const savedToken =
            localStorage.getItem(
                "NightCastToken"
            );


        const savedUser =
            localStorage.getItem(
                "NightCastUser"
            );


        if(
            !savedToken ||
            !savedUser
        ){

            throw new Error(
                "Session در NightCast ذخیره نشد."
            );

        }


        /*
        ==========================================
        LOGIN SUCCESS
        ==========================================
        */

        window.location.replace(
            "index.html"
        );

    }

    catch(error){

        this.hideLoader();

        this.showError(
            error.message
        );

        console.error(
            "NightCast Google Login Error:",
            error
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

       window.location.replace("index.html");
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

    if(!token){

        throw new Error(
            "Token خالی است."
        );

    }


    if(!user){

        throw new Error(
            "اطلاعات کاربر خالی است."
        );

    }


    localStorage.setItem(
        "NightCastToken",
        token
    );


    localStorage.setItem(
        "NightCastUser",
        JSON.stringify(user)
    );


    console.log(
        "NightCast Session Saved"
    );

},

/* ==================================================
   REDIRECT FALLBACK
================================================== */

setupRedirectButton(){

    const help =
        document.getElementById(
            "redirectHelp"
        );


    const button =
        document.getElementById(
            "goToIndexButton"
        );


    if(!help || !button){

        return;

    }


  button.addEventListener(
    "click",
    ()=>{

        const token =
            localStorage.getItem(
                "NightCastToken"
            );

        const user =
            localStorage.getItem(
                "NightCastUser"
            );


        if(token && user){

            window.location.replace(
                "index.html"
            );

            return;

        }


     /*   
         alert(
            "ورود Google هنوز در NightCast ثبت نشده است."
        );
     */
    }
);

    /*
    بعد از 3 ثانیه اگر هنوز
    روی login.html هستیم،
    دکمه کمکی نمایش داده شود.
    */

    setTimeout(()=>{

        help.classList.remove(
            "hidden"
        );

    },3000);

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
