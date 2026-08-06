
/* =========================================================

   NightCast App Core

   File:
   /users/js/app.js

   Version:
   4.1.0

   Main Application Controller

========================================================= */


(function(){

"use strict";





const App = {



    version:"4.1.0",





    state:{


        ready:false,


        user:null,


        theme:"dark",


        guest:true


    },






    modules:{},






    init(){


        try{


            console.log(
                "🌙 NightCast Starting..."
            );



            this.cache();



            this.loadModules();



            this.connectModules();



            this.restoreState();



            this.bindEvents();



            this.initializeUI();



            this.registerPWA();




        }

        catch(error){



            console.error(

                "NightCast Init Error:",

                error

            );



        }

        finally{


            this.finish();



        }



    },









    cache(){



        this.loader =

        document.getElementById(

            "globalLoader"

        );





        this.toastContainer =

        document.getElementById(

            "toastContainer"

        );





        this.loginEntry =

        document.getElementById(

            "loginEntry"

        );





        this.stateBox =

        document.getElementById(

            "nightcastState"

        );





        this.mobileMenu =

        document.getElementById(

            "mobileMenu"

        );





        this.mobileOverlay =

        document.getElementById(

            "mobileOverlay"

        );



    },









    loadModules(){



        this.modules = {



            api:

            window.NightCastAPI || null,




            auth:

            window.NightCastAuth || null,




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




    },    connectModules(){



        if(window.NightCastAuth){


            this.modules.auth =

            window.NightCastAuth;


            console.log(
                "Auth Connected ✔"
            );


        }







        if(window.NightCastPlayer){


            this.modules.player =

            window.NightCastPlayer;


            console.log(
                "Player Connected ✔"
            );


        }







        if(window.NightCastPodcasts){


            this.modules.podcasts =

            window.NightCastPodcasts;


            console.log(
                "Podcasts Connected ✔"
            );


        }







        if(window.NightCastSearch){


            this.modules.search =

            window.NightCastSearch;


            console.log(
                "Search Connected ✔"
            );


        }







        if(window.NightCastLibrary){


            this.modules.library =

            window.NightCastLibrary;


            console.log(
                "Library Connected ✔"
            );


        }







        if(window.NightCastProfile){


            this.modules.profile =

            window.NightCastProfile;


            console.log(
                "Profile Connected ✔"
            );


        }







        if(window.NightCastComments){


            this.modules.comments =

            window.NightCastComments;


            console.log(
                "Comments Connected ✔"
            );


        }



    },









    restoreState(){



        const savedUser =

        localStorage.getItem(

            "NightCastUser"

        );





        if(savedUser){



            try{


                this.state.user =

                JSON.parse(

                    savedUser

                );



                this.state.guest=false;



            }

            catch(error){



                console.warn(

                    "User State Error",

                    error

                );



                this.state.user=null;


                this.state.guest=true;



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
        
        Global Actions
        
        تمام data-action ها
        
        */




        document.addEventListener(

            "click",

            this.handleActions.bind(this)

        );







        /*
        
        Keyboard Player Control
        
        Space
        
        */




        document.addEventListener(

            "keydown",

            (event)=>{



                if(


                    event.code==="Space" &&


                    !this.isTyping(

                        event.target

                    )


                ){



                    event.preventDefault();






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



            this.mobileOverlay.addEventListener(

                "click",

                ()=>{


                    this.closeMobileMenu();



                }


            );


        }





    },









    handleActions(event){



        const element =

        event.target.closest(

            "[data-action]"

        );





        if(!element){


            return;


        }





        const action =

        element.dataset.action;







        switch(action){



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






            case "toggle-theme":



                this.toggleTheme();


            break;






            case "open-mobile-menu":



                this.openMobileMenu();


            break;






            case "close-mobile-menu":



                this.closeMobileMenu();


            break;






            case "open-search":



                if(

                    this.modules.search &&

                    typeof this.modules.search.open === "function"

                ){


                    this.modules.search.open();


                }


            break;






            case "close-search":



                if(

                    this.modules.search &&

                    typeof this.modules.search.close === "function"

                ){


                    this.modules.search.close();


                }


            break;



        }



    },





    toggleTheme(){



        const nextTheme =

        this.state.theme === "dark"

        ?

        "light"

        :

        "dark";





        this.state.theme =

        nextTheme;






        document.body.dataset.theme =

        nextTheme;






        localStorage.setItem(

            "NightCastTheme",

            nextTheme

        );






        this.toastMessage(

            nextTheme === "dark"

            ?

            "حالت تاریک فعال شد"

            :

            "حالت روشن فعال شد"

        );



    },









    openMobileMenu(){



        if(this.mobileMenu){



            this.mobileMenu.classList.add(

                "active"

            );


        }






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
        
        اعمال تم
        
        */




        document.body.dataset.theme =

        this.state.theme;







        /*
        
        نمایش یا مخفی کردن Login Entry
        
        */




        this.updateLoginEntry();







        /*
        
        وضعیت کلی سیستم
        
        */




        this.updateStateBox();








        /*
        
        Init Module ها
        
        */




        Object.keys(

            this.modules

        )

        .forEach(

            key=>{



                const module =

                this.modules[key];






                if(


                    module &&

                    typeof module.init === "function"


                ){



                    try{



                        module.init();



                        console.log(

                            key,

                            "initialized ✔"

                        );



                    }

                    catch(error){



                        console.error(

                            "Module Error:",

                            key,

                            error

                        );



                    }



                }



            }


        );






    },









    updateLoginEntry(){



        const entry =

        this.loginEntry;






        const loginButton =

        document.getElementById(

            "loginButton"

        );






        if(this.state.user){



            this.state.guest=false;






            if(entry){



                entry.classList.add(

                    "hidden"

                );



            }






            if(loginButton){



                loginButton.innerHTML = `

                <i class="fa-solid fa-user-check"></i>

                <span>

                ${

                this.state.user.name ||

                "پروفایل"

                }

                </span>

                `;



            }



        }

        else{



            this.state.guest=true;







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

        ?

        "authenticated"

        :

        "guest";







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


            typeof this.modules.profile.open === "function"


        ){



            this.modules.profile.open();



        }



    },









    openLibrary(){



        if(


            this.modules.library &&


            typeof this.modules.library.open === "function"


        ){



            this.modules.library.open();



        }



    },









    toastMessage(message,type="info"){



        /*
        
        استفاده از UI Module
        
        اگر موجود بود
        
        */




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








        /*
        
        Fallback Toast
        
        */




        if(!this.toastContainer){



            return;


        }







        const toast =

        document.createElement(

            "div"

        );







        toast.className =

        "toast " + type;







        toast.textContent =

        message;








        this.toastContainer.appendChild(

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









    requireLogin(callback){



        if(this.state.guest){



            const modal =

            document.getElementById(

                "authModal"

            );






            if(modal){



                modal.classList.remove(

                    "hidden"

                );



            }






            this.toastMessage(

                "برای ادامه ابتدا وارد شوید"

            );






            return false;



        }








        if(

            typeof callback === "function"

        ){



            callback();



        }






        return true;



    },









    syncUserState(){



        const savedUser =

        localStorage.getItem(

            "NightCastUser"

        );







        if(savedUser){



            try{



                this.state.user =

                JSON.parse(

                    savedUser

                );





                this.state.guest=false;



            }

            catch(error){



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

                            "PWA Ready ✔"

                        );



                    })

                    .catch(error=>{



                        console.warn(

                            "PWA Error:",

                            error

                        );



                    });



                }

            );



        }



    },    syncUserState(){


        const user =
        localStorage.getItem(
            "NightCastUser"
        );


        if(user){


            try{


                this.state.user =
                JSON.parse(user);


                this.state.guest = false;


            }
            catch(error){


                this.state.user = null;

                this.state.guest = true;


            }


        }
        else{


            this.state.user = null;

            this.state.guest = true;


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



        this.state.user = null;

        this.state.guest = true;



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
            typeof callback === "function"
        ){

            callback();

        }



        return true;


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
                            "PWA Ready ✔"
                        );


                    })
                    .catch(error=>{


                        console.warn(
                            "PWA Error:",
                            error
                        );


                    });


                }

            );


        }


    },









    finish(){


        this.state.ready = true;



        if(this.loader){


            setTimeout(()=>{


                this.loader.classList.add(
                    "hidden"
                );


            },700);


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
   EXPORT GLOBAL
===================================================== */


window.NightCastApp = App;







/* =====================================================
   START
===================================================== */


document.addEventListener(

    "DOMContentLoaded",

    ()=>{


        App.init();


    }

);







})();
