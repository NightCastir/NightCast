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



    init(){


        console.log(
            "NightCast Login Loaded"
        );


        this.bindEvents();
        this.initGoogle();

        this.checkExistingSession();


    },







    bindEvents(){



        const openIdButton =

        document.getElementById(
            "openIdLogin"
        );



        if(openIdButton){


            openIdButton.addEventListener(

                "click",

                ()=>{

                    this.googleLogin();

                }

            );


        }





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









    async guestLogin(){


        try{


            this.showLoader();



            const response =

            await fetch(

                API_URL +

                "/public/guest",

                {


                    method:"POST",


                    headers:{


                        "Content-Type":
                        "application/json"


                    }


                }

            );




            const data =

            await response.json();





            if(

                data.success &&

                data.token

            ){



                this.saveSession(

                    data.token,

                    data.user

                );



                window.location.href =

                "index.html";



                return;


            }





            throw new Error(

                data.message ||

                "Guest login failed"

            );



        }

        catch(error){


            this.hideLoader();


            this.showError(

                error.message

            );


        }



    },








initGoogle(){

    google.accounts.id.initialize({

        client_id: GOOGLE_CLIENT_ID,

        callback: (response)=>{

            this.googleCallback(response);

        }

    });

},
    async googleLogin(){

    this.showLoader();

    try{

        google.accounts.id.prompt();

    }
    catch(error){

        this.hideLoader();

        this.showError(
            "Google Identity بارگذاری نشده است."
        );

    }

},
    async googleCallback(response){

    try{

        const res = await fetch(

            API_URL + "/public/openid/google",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    idToken:response.credential

                })

            }

        );

        const data = await res.json();

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

        window.location.href = "index.html";

    }

    catch(error){

        this.hideLoader();

        this.showError(error.message);

    }

},








    saveSession(

        token,

        user

    ){



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



            /*
            اگر قبلاً وارد شده

            مستقیم وارد برنامه شود

            */


            // فعلاً فعال نمی‌کنیم
            // تا کاربر بتواند صفحه ورود را ببیند


        }



    },









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



        alert(message);



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
