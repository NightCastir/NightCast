/* =========================================================

   NightCast App Core
   File:
   /users/js/app.js

   Version:
   4.0.0

   Main Application Controller

========================================================= */


(function(){

"use strict";




const App = {



    version:"4.0.0",




    state:{


        ready:false,


        user:null,


        theme:"dark",


        guest:true


    },





    modules:{},






    init(){



        console.log(
            "🌙 NightCast Starting..."
        );




        this.cache();




        this.loadModules();




        this.restoreState();




        this.bindEvents();




        this.initializeUI();




        this.registerPWA();




        this.finish();



    },







    cache(){



        this.loader =
        document.getElementById(
            "globalLoader"
        );




        this.toast =
        document.getElementById(
            "toastContainer"
        );




        this.loginEntry =
        document.getElementById(
            "loginEntry"
        );




        this.mobileMenu =
        document.getElementById(
            "mobileMenu"
        );




        this.mobileOverlay =
        document.getElementById(
            "mobileOverlay"
        );




        this.stateBox =
        document.getElementById(
            "nightcastState"
        );



    },








    loadModules(){



        this.modules={




            api:
            window.NightCastAPI || null,




            auth:
            window.Auth || null,




            ui:
            window.NightCastUI || null,




            player:
            window.NightCastPlayer || null,




            podcasts:
            window.NightCastPodcasts || null,




            search:
            window.NightCastSearch || null,




            library:
            window.NightCastLibrary || null,




            profile:
            window.NightCastProfile || null,




            comments:
            window.NightCastComments || null





        };





        Object.keys(this.modules)
        .forEach(key=>{


            if(this.modules[key]){


                console.log(
                    "Module loaded:",
                    key
                );


            }



        });



    },








    restoreState(){



        const savedUser =
        localStorage.getItem(
            "NightCastUser"
        );




        if(savedUser){



            try{


                this.state.user =
                JSON.parse(savedUser);


                this.state.guest=false;



            }
            catch(e){


                this.state.user=null;


            }


        }






        const savedTheme =
        localStorage.getItem(
            "NightCastTheme"
        );




        if(savedTheme){


            this.state.theme =
            savedTheme;


        }





    },
       bindEvents(){



        /*
        Global Click Handler

        مدیریت تمام:
        data-action
        */


        document.addEventListener(

            "click",

            this.handleActions.bind(this)

        );






        /*
        Keyboard Shortcuts

        Space = Play/Pause

        */


        document.addEventListener(

            "keydown",

            (e)=>{



                if(

                    e.code==="Space" &&

                    !this.isTyping(e.target)

                ){



                    e.preventDefault();




                    if(

                        this.modules.player &&

                        typeof this.modules.player.toggle === "function"

                    ){


                        this.modules.player.toggle();



                    }



                }



            }


        );





        /*
        Mobile Overlay

        */


        if(this.mobileOverlay){



            this.mobileOverlay
            .addEventListener(

                "click",

                ()=>{


                    this.closeMobileMenu();


                }


            );



        }





    },









    handleActions(e){



        const element =

        e.target.closest(

            "[data-action]"

        );





        if(!element){

            return;

        }





        const action =

        element.dataset.action;







        switch(action){





            /*
            Navigation

            */


            case "home":



                this.navigate(
                    "home"
                );


            break;






            case "navigate":



                this.navigate(

                    element.dataset.target

                );



            break;









            /*
            Hero

            */


            case "start-listening":



                this.scrollTo(

                    "podcasts"

                );


            break;






            case "explore":



                this.scrollTo(

                    "podcasts"

                );


            break;









            /*
            Theme

            */


            case "toggle-theme":



                this.toggleTheme();



            break;









            /*
            Mobile Menu

            */


            case "open-mobile-menu":



                this.openMobileMenu();



            break;







            case "close-mobile-menu":



                this.closeMobileMenu();



            break;









            /*
            Search

            */


            case "open-search":



                if(

                    this.modules.search &&

                    typeof this.modules.search.open==="function"

                ){



                    this.modules.search.open();



                }



            break;









            case "close-search":



                if(

                    this.modules.search &&

                    typeof this.modules.search.close==="function"

                ){



                    this.modules.search.close();



                }



            break;






        }





    },









    toggleTheme(){



        const current =

        this.state.theme;





        const next =

        current==="dark"

        ?

        "light"

        :

        "dark";







        this.state.theme = next;





        document.body.dataset.theme = next;







        localStorage.setItem(

            "NightCastTheme",

            next

        );





        this.toastMessage(

            next==="dark"

            ?

            "حالت تاریک فعال شد"

            :

            "حالت روشن فعال شد"

        );




    },









    openMobileMenu(){



        if(!this.mobileMenu){

            return;

        }





        this.mobileMenu.classList.add(

            "active"

        );





        if(this.mobileOverlay){


            this.mobileOverlay.classList.add(

                "active"

            );


        }



    },








    closeMobileMenu(){



        if(this.mobileMenu){



            this.mobileMenu.classList.remove(

                "active"

            );



        }






        if(this.mobileOverlay){



            this.mobileOverlay.classList.remove(

                "active"

            );


        }



    },
       initializeUI(){



        /*
        Login Entry Control
        */


        this.updateLoginEntry();




        /*
        Apply Theme
        */


        document.body.dataset.theme =

        this.state.theme;






        /*
        Update Global State Box
        */


        this.updateStateBox();






        /*
        Initialize visible modules
        */


        Object.keys(this.modules)

        .forEach(key=>{



            const module =

            this.modules[key];





            if(

                module &&

                typeof module.init === "function"

            ){



                try{


                    module.init();



                }
                catch(error){



                    console.error(

                        "Module init error:",

                        key,

                        error

                    );



                }



            }





        });




    },









    updateLoginEntry(){



        if(!this.loginEntry){

            return;

        }






        if(this.state.guest){



            this.loginEntry.classList.remove(

                "hidden"

            );



        }

        else{



            this.loginEntry.classList.add(

                "hidden"

            );



        }





    },









    updateStateBox(){



        if(!this.stateBox){

            return;

        }






        this.stateBox.dataset.user =

        this.state.guest

        ?

        "guest"

        :

        "user";





        this.stateBox.dataset.theme =

        this.state.theme;





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



            this.closeMobileMenu();





            section.scrollIntoView({


                behavior:"smooth",


                block:"start"


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









    startPlayer(id){



        if(

            !this.modules.player

        ){

            return;

        }






        if(

            typeof this.modules.player.play === "function"

        ){



            this.modules.player.play(id);



        }





    },









    openProfile(){



        if(

            this.modules.profile &&

            typeof this.modules.profile.open==="function"

        ){



            this.modules.profile.open();



        }



    },









    openLibrary(){



        if(

            this.modules.library &&

            typeof this.modules.library.open==="function"

        ){



            this.modules.library.open();



        }



    },









    toastMessage(message,type="info"){



        if(!this.toast){

            return;

        }






        const item =

        document.createElement(

            "div"

        );





        item.className =

        "toast-item " + type;





        item.textContent =

        message;






        this.toast.appendChild(

            item

        );







        setTimeout(()=>{



            item.classList.add(

                "show"

            );



        },50);








        setTimeout(()=>{



            item.classList.remove(

                "show"

            );




            setTimeout(()=>{



                item.remove();



            },300);



        },3000);





    },
   

    handleError(error){



        console.error(

            "NightCast Error:",

            error

        );





        this.toastMessage(

            "خطایی رخ داده است. دوباره تلاش کنید.",

            "error"

        );



    },









    registerPWA(){



        if(

            "serviceWorker" in navigator

        ){



            window.addEventListener(

                "load",

                ()=>{



                    navigator.serviceWorker

                    .register(

                        "/service-worker.js"

                    )

                    .then(()=>{



                        console.log(

                            "PWA Service Worker Ready ✔"

                        );



                    })

                    .catch(error=>{



                        console.warn(

                            "Service Worker Error:",

                            error

                        );



                    });



                }

            );



        }



    },









    syncUserState(){



        const user =

        localStorage.getItem(

            "NightCastUser"

        );





        if(user){



            try{


                this.state.user =

                JSON.parse(user);





                this.state.guest=false;



            }

            catch(e){



                this.state.user=null;


                this.state.guest=true;



            }



        }

        else{



            this.state.user=null;


            this.state.guest=true;



        }







        this.updateLoginEntry();


        this.updateStateBox();




    },









    logout(){



        localStorage.removeItem(

            "NightCastUser"

        );



        localStorage.removeItem(

            "NightCastToken"

        );






        this.state.user=null;


        this.state.guest=true;





        this.updateLoginEntry();


        this.updateStateBox();






        if(

            this.modules.auth &&

            typeof this.modules.auth.logout === "function"

        ){



            this.modules.auth.logout();



        }






        this.toastMessage(

            "با موفقیت خارج شدید"

        );




    },









    requireLogin(callback){



        if(

            this.state.guest

        ){



            const modal =

            document.getElementById(

                "authModal"

            );





            if(modal){



                modal.classList.remove(

                    "hidden"

                );



            }




            return false;


        }







        if(

            typeof callback==="function"

        ){



            callback();



        }




        return true;




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

            "🌙 NightCast Ready ✔",

            this.version

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
   /* =====================================================
   MODULE CONNECTIONS
===================================================== */



connectModules(){



    /*
    AUTH CONNECTION
    */


    if(window.NightCastAuth){


        this.modules.auth =

        window.NightCastAuth;



        console.log(

            "Auth Connected ✔"

        );



    }








    /*
    PLAYER CONNECTION
    */


    if(window.NightCastPlayer){



        this.modules.player =

        window.NightCastPlayer;



        console.log(

            "Player Connected ✔"

        );



    }









    /*
    PODCAST CONNECTION
    */


    if(window.NightCastPodcasts){



        this.modules.podcasts =

        window.NightCastPodcasts;



        console.log(

            "Podcasts Connected ✔"

        );



    }









    /*
    SEARCH CONNECTION
    */


    if(window.NightCastSearch){



        this.modules.search =

        window.NightCastSearch;



        console.log(

            "Search Connected ✔"

        );



    }









    /*
    LIBRARY CONNECTION
    */


    if(window.NightCastLibrary){



        this.modules.library =

        window.NightCastLibrary;



        console.log(

            "Library Connected ✔"

        );



    }









    /*
    PROFILE CONNECTION
    */


    if(window.NightCastProfile){



        this.modules.profile =

        window.NightCastProfile;



        console.log(

            "Profile Connected ✔"

        );



    }









    /*
    COMMENTS CONNECTION
    */


    if(window.NightCastComments){



        this.modules.comments =

        window.NightCastComments;



        console.log(

            "Comments Connected ✔"

        );



    }




},










bindModuleEvents(){



    /*
    Login Events

    */


    const loginButton =

    document.getElementById(

        "loginButton"

    );



    if(loginButton){



        loginButton.addEventListener(

            "click",

            ()=>{



                if(this.modules.auth){



                    this.modules.auth.open();



                }



            }


        );



    }








    /*
    Logout

    */


    const logoutButton =

    document.getElementById(

        "logoutButton"

    );





    if(logoutButton){



        logoutButton.addEventListener(

            "click",

            ()=>{



                this.logout();



            }


        );



    }








    /*
    Bottom Player Button

    */


    const bottomPlay =

    document.getElementById(

        "bottomPlayButton"

    );





    if(bottomPlay){



        bottomPlay.addEventListener(

            "click",

            ()=>{



                if(this.modules.player){



                    this.modules.player.toggle();



                }



            }


        );



    }









    /*
    Download Protection

    */


    document.addEventListener(

        "click",

        e=>{



            const button =

            e.target.closest(

                "[data-action='download']"

            );





            if(!button){

                return;

            }






            if(

                !this.requireLogin()

            ){



                e.preventDefault();



            }



        }


    );





},

/* =====================================================
   HELPERS
===================================================== */



toastMessage(
    message,
    type="info"
){



    if(
        window.NightCastUI &&
        typeof window.NightCastUI.toast === "function"
    ){


        window.NightCastUI.toast(
            message,
            type
        );


        return;

    }






    const container =

    document.getElementById(

        "toastContainer"

    );





    if(!container){

        return;

    }






    const toast =

    document.createElement(

        "div"

    );





    toast.className =

    `toast ${type}`;





    toast.textContent =

    message;







    container.appendChild(

        toast

    );







    setTimeout(()=>{



        toast.classList.add(

            "show"

        );



    },50);









    setTimeout(()=>{



        toast.classList.remove(

            "show"

        );





        setTimeout(()=>{



            toast.remove();



        },300);



    },3000);





},











updateLoginEntry(){



    const entry =

    document.getElementById(

        "loginEntry"

    );



    const loginButton =

    document.getElementById(

        "loginButton"

    );





    if(

        this.state.user

    ){



        if(entry){



            entry.classList.add(

                "hidden"

            );


        }





        if(loginButton){



            loginButton.innerHTML = `

            <i class="fa-solid fa-user-check"></i>

            <span>

            ${this.state.user.name || "پروفایل"}

            </span>

            `;



        }



    }

    else{



        if(entry){



            entry.classList.remove(

                "hidden"

            );



        }







        if(loginButton){



            loginButton.innerHTML = `

            <i class="fa-solid fa-user"></i>

            <span>

            ورود

            </span>

            `;



        }



    }



},











updateStateBox(){



    if(!this.stateBox){

        return;

    }






    this.stateBox.dataset.user =

    this.state.user

    ? "authenticated"

    : "guest";






    this.stateBox.dataset.theme =

    this.state.theme;





},











destroy(){



    console.warn(

        "NightCast App Destroyed"

    );



    this.state.ready=false;



}





};








/* =====================================================
   EXPORT
===================================================== */


window.NightCastApp = App;








/* =====================================================
   START APPLICATION
===================================================== */


document.addEventListener(

    "DOMContentLoaded",

    ()=>{


        App.init();


    }

);








})();
