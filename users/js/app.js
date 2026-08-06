/* =========================================================
   NightCast App Core
   File:
   /users/js/app.js

   Main Controller

   Compatible With:
   api.js
   auth.js
   ui.js
   player.js
   podcasts.js
   search.js
   library.js
   profile.js
   comments.js

========================================================= */


(function(){


"use strict";





const App = {



    version:"4.0.0",



    state:{


        ready:false,

        user:null,

        theme:"dark"


    },






    init(){



        console.log(
            "NightCast App Starting..."
        );



        this.cache();



        this.bindEvents();



        this.restoreState();



        this.initializeModules();



        this.finish();



    },








    cache(){



        this.loader =
        document.getElementById(
            "globalLoader"
        );



        this.stateBox =
        document.getElementById(
            "nightcastState"
        );



    },








    bindEvents(){



        /*
        Global navigation
        */


        document.addEventListener(
            "click",
            this.handleActions.bind(this)
        );




        /*
        Keyboard shortcuts
        */


        document.addEventListener(
            "keydown",
            e=>{


                if(
                    e.code==="Space" &&
                    !this.isTyping(e.target)
                ){

                    e.preventDefault();


                    if(
                        window.NightCastPlayer
                    ){

                        NightCastPlayer.toggle();

                    }


                }


            }
        );




    },









    handleActions(e){



        const target =
        e.target.closest(
            "[data-action]"
        );



        if(!target){

            return;

        }





        const action =
        target.dataset.action;





        switch(action){



            case "home":

                this.scrollTo(
                    "home"
                );

            break;




            case "navigate":


                this.navigate(
                    target.dataset.target
                );


            break;




            case "start-listening":


                this.startListening();


            break;




            case "explore":


                this.scrollTo(
                    "podcasts"
                );


            break;



        }



    },









    initializeModules(){



        /*
          بعضی فایل‌ها
          خودشان init دارند
          اینجا فقط کنترل وجودشان
        */



        const modules = [


            "NightCastAPI",

            "Auth",

            "UI",

            "NightCastPlayer",

            "NightCastPodcasts",

            "NightCastComments"


        ];





        modules.forEach(
            module=>{


                if(
                    window[module]
                ){

                    console.log(
                        module,
                        "loaded"
                    );


                }


            }
        );



    },









    restoreState(){



        const user =
        localStorage.getItem(
            "NightCastUser"
        );




        if(user){



            try{


                this.state.user =
                JSON.parse(user);



            }
            catch{


                this.state.user=null;


            }


        }







        const theme =
        localStorage.getItem(
            "NightCastTheme"
        );



        if(theme){


            this.state.theme =
            theme;



            document.body
            .dataset.theme =
            theme;


        }




    },









    startListening(){



        const section =
        document.getElementById(
            "podcasts"
        );



        if(section){


            section.scrollIntoView({

                behavior:"smooth"

            });


        }



    },









    navigate(target){



        if(!target){

            return;

        }



        const section =
        document.getElementById(
            target
        );



        if(section){



            section.scrollIntoView({

                behavior:"smooth"

            });


        }



    },









    scrollTo(id){



        const element =
        document.getElementById(
            id
        );



        if(element){



            element.scrollIntoView({

                behavior:"smooth"

            });



        }



    },








    finish(){



        this.state.ready=true;



        if(this.loader){



            setTimeout(()=>{


                this.loader.classList.add(
                    "hidden"
                );


            },500);



        }




        console.log(

            "NightCast Ready ✔"

        );



    },









    isTyping(element){



        if(!element){

            return false;

        }



        return [

            "INPUT",

            "TEXTAREA",

            "SELECT"

        ]

        .includes(
            element.tagName
        );


    }






};







window.NightCastApp =
App;







document.addEventListener(

"DOMContentLoaded",

()=>{


    App.init();


});







})();
