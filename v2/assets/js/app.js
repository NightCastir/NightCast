/*
──────────────────────────────────────────────
NightCast V2
Main Application Controller
──────────────────────────────────────────────
*/


'use strict';



const App = {



    async init(){


        console.log(
            "NightCast V2 Started"
        );



        // Header

        if(window.Header){

            Header.init();

        }



        // Player

        if(window.Player){

            Player.init();

        }



        // Feed

        if(window.Feed){

            await Feed.init();

        }



        // Footer

        if(window.Footer){

            Footer.init();

        }



        // Router

        if(window.Router){

            Router.init();

        }



    }


};





document.addEventListener(

    "DOMContentLoaded",

    ()=>{


        App.init();


    }

);
