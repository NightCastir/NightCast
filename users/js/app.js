/* ==================================================

NightCast User Application Core V1

File:
 /users/js/app.js


Responsibility:

- Application Bootstrap
- Module Initialization


Modules:

api.js
auth.js
ui.js
podcasts.js
search.js
library.js
profile.js
player.js
comments.js


================================================== */


const NightCastApp = {



    /*
    ====================================
    INIT APPLICATION
    ====================================
    */


    async init(){



        console.log(

            "🚀 NightCast Starting..."

        );







        /*
        ================================
        GLOBAL SYSTEM
        ================================
        */


        this.hideLoader();









        /*
        ================================
        UI CORE
        ================================
        */


        if(

            window.NightCastUI

        ){


            NightCastUI.init();


        }









        /*
        ================================
        AUTH SYSTEM
        ================================
        */


        if(

            window.NightCastAuth

        ){


            await NightCastAuth.init();


        }









        /*
        ================================
        PODCASTS
        ================================
        */


        if(

            window.NightCastPodcasts

        ){


            NightCastPodcasts.init();


        }









        /*
        ================================
        SEARCH
        ================================
        */


        if(

            window.NightCastSearch

        ){


            NightCastSearch.init();


        }









        /*
        ================================
        LIBRARY
        ================================
        */


        if(

            window.NightCastLibrary

        ){


            NightCastLibrary.init();


        }









        /*
        ================================
        PROFILE
        ================================
        */


        if(

            window.NightCastProfile

        ){


            NightCastProfile.init();


        }









        /*
        ================================
        PLAYER
        ================================
        */


        if(

            window.NightCastPlayer

        ){


            NightCastPlayer.init();


        }









        /*
        ================================
        COMMENTS

        فقط صفحات مربوط به نظر

        ================================
        */


        if(

            window.NightCastComments

            &&

            document.getElementById(

                "commentsList"

            )

        ){


            NightCastComments.init();


        }









        /*
        ================================
        READY
        ================================
        */


        document.body.classList.add(

            "app-ready"

        );





        console.log(

            "✅ NightCast Ready"

        );



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





        if(!loader){

            return;

        }







        setTimeout(()=>{


            loader.classList.add(

                "hidden"

            );



        },500);



    }






};








/*
====================================
START
====================================
*/


document.addEventListener(

    "DOMContentLoaded",

    ()=>{


        NightCastApp.init();


    }


);






window.NightCastApp =

NightCastApp;
