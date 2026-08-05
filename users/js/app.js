/* ==================================================

NightCast User Application Core V2

File:
 /users/js/app.js

Responsibility:
Application Bootstrap

================================================== */


const NightCastApp = {



    async init(){


        console.log(
            "🚀 NightCast Starting..."
        );



        try{



            /*
            UI
            */

            if(window.NightCastUI){

                NightCastUI.init();

            }







            /*
            AUTH

            Guest allowed

            */

            if(window.NightCastAuth){

                await NightCastAuth.init();

            }








            /*
            FEATURES
            */



            const modules = [


                "NightCastPodcasts",


                "NightCastSearch",


                "NightCastLibrary",


                "NightCastProfile",


                "NightCastComments"


            ];







            modules.forEach(
                
                module=>{


                    if(
                        window[module]
                        &&
                        typeof window[module].init === "function"
                    ){

                        window[module].init();

                    }


                }

            );








            /*
            PLAYER

            only once

            */

            if(

                window.NightCastPlayer

                &&

                !window.NightCastPlayer.started

            ){


                NightCastPlayer.init();


                NightCastPlayer.started=true;


            }










            document.body.classList.add(
                "app-ready"
            );




            this.hideLoader();



            console.log(
                "✅ NightCast Ready"
            );





        }

        catch(error){



            console.error(
                "NightCast Init Error:",
                error
            );



            this.hideLoader();



            if(window.NightCastUI){

                NightCastUI.toast(
                    "خطا در آماده‌سازی برنامه",
                    "error"
                );

            }



        }



    },








    hideLoader(){



        const loader =

        document.getElementById(
            "globalLoader"
        );




        if(loader){


            loader.classList.add(
                "hidden"
            );


        }


    }



};








window.NightCastApp = NightCastApp;





document.addEventListener(

"DOMContentLoaded",

()=>{


    NightCastApp.init();


}

);
