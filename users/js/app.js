/* ==================================================

   NightCast User Application Controller V2

   File:
   /users/js/app.js

   Responsibility:

   ONLY:
   - Application Startup
   - Module Initialization
   - Global Events

================================================== */



const NightCastApp = {



    /*
    ====================================
    INIT
    ====================================
    */


    async init(){


        console.log(
            "NightCast App Starting..."
        );



        this.bindGlobalEvents();



        await this.checkSession();



        this.hideLoader();



        console.log(
            "NightCast App Ready"
        );



    },






    /*
    ====================================
    GLOBAL EVENTS
    ====================================
    */


    bindGlobalEvents(){



        /*
        Start Listening Button
        */


        const startButton =

        document.getElementById(
            "startListeningButton"
        );



        if(startButton){


            startButton.addEventListener(
                "click",

                ()=>{


                    const section =

                    document.getElementById(
                        "podcastSection"
                    );


                    if(section){

                        section.scrollIntoView({

                            behavior:"smooth"

                        });

                    }


                }

            );


        }






        /*
        Explore Button
        */


        const exploreButton =

        document.getElementById(
            "exploreButton"
        );



        if(exploreButton){


            exploreButton.addEventListener(

                "click",

                ()=>{


                    window.scrollTo({

                        top:0,

                        behavior:"smooth"

                    });


                }

            );


        }






        /*
        Login Button

        handled by Auth module

        */


        const loginButton =

        document.getElementById(
            "loginButton"
        );



        if(loginButton){


            loginButton.addEventListener(

                "click",

                ()=>{


                    if(
                        window.NightCastAuth
                    ){

                        NightCastAuth.openLogin();


                    }


                }


            );


        }





    },









    /*
    ====================================
    SESSION CHECK
    ====================================
    */


    async checkSession(){



        if(
            !window.NightCastAuth
        ){

            return;


        }




        if(
            NightCastAuth.isLoggedIn()
        ){



            const user =

            await NightCastAuth.getCurrentUser();





            if(user.success){



                console.log(

                    "User Active:",

                    user.data

                );


            }


        }

        else{


            console.log(

                "Guest Mode"

            );


        }



    },









    /*
    ====================================
    LOADER
    ====================================
    */


    hideLoader(){



        const loader =

        document.getElementById(

            "globalLoader"

        );




        if(loader){



            setTimeout(()=>{


                loader.classList.add(

                    "hidden"

                );


            },500);



        }



    }






};









/*
====================================
AUTO START
====================================
*/


document.addEventListener(

    "DOMContentLoaded",

    ()=>{


        NightCastApp.init();


    }


);





window.NightCastApp = NightCastApp;



console.log(

"NightCast app.js Loaded"

);
