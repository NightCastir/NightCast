/* ==================================================

NightCast User Application Bootstrap V2

File:

/users/js/app.js


Responsibility:

ONLY START APPLICATION


Load Order:

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
    INIT
    ====================================
    */


    async init(){



        console.log(

            "🚀 NightCast Starting..."

        );






        /*
        ================================
        UI
        ================================
        */


        if(window.NightCastUI){



            NightCastUI.init();



        }









        /*
        ================================
        AUTH
        ================================
        */


        if(window.NightCastAuth){



            await NightCastAuth.init();



        }









        /*
        ================================
        PLAYER

        اول پلیر آماده شود

        ================================
        */


        if(window.NightCastPlayer){



            NightCastPlayer.init();



        }









        /*
        ================================
        PODCASTS
        ================================
        */


        if(window.NightCastPodcasts){



            NightCastPodcasts.init();



        }









        /*
        ================================
        SEARCH
        ================================
        */


        if(window.NightCastSearch){



            NightCastSearch.init();



        }









        /*
        ================================
        LIBRARY
        ================================
        */


        if(window.NightCastLibrary){



            NightCastLibrary.init();



        }









        /*
        ================================
        PROFILE
        ================================
        */


        if(window.NightCastProfile){



            NightCastProfile.init();



        }









        /*
        ================================
        COMMENTS
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
        REMOVE LOADING
        ================================
        */


        this.ready();






        console.log(

            "✅ NightCast Ready"

        );



    },









    /*
    ====================================
    READY STATE
    ====================================
    */


    ready(){



        document.body.classList.add(

            "app-ready"

        );






        const loader =

        document.getElementById(

            "globalLoader"

        );







        if(loader){



            setTimeout(()=>{



                loader.classList.add(

                    "hidden"

                );



            },300);



        }



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





console.log(

"NightCast App V2 Loaded"

);
