/* =========================================================

NightCast Authentication Manager V4

File:
users/js/auth.js


Responsibilities:

- Session Management
- OpenID State
- Guest User
- Token Validation
- Logout
- Auth Modal Control


Compatible With:

login.js
app.js
api.js


========================================================= */


(function(){


"use strict";






const Auth = {



    version:"4.0.0",




    state:{


        user:null,


        token:null,


        authenticated:false,


        guest:true


    },








    init(){



        console.log(

            "🔐 NightCast Auth Starting..."

        );




        this.loadSession();




        this.bindEvents();




        this.checkSession();




    },









    loadSession(){



        const user =

        localStorage.getItem(

            "NightCastUser"

        );





        const token =

        localStorage.getItem(

            "NightCastToken"

        );







        if(user){



            try{



                this.state.user =

                JSON.parse(user);





            }

            catch(e){



                this.state.user=null;



            }



        }







        this.state.token = token;







        if(

            this.state.user

        ){



            this.state.authenticated=true;


            this.state.guest =

            this.state.user.provider==="guest";



        }





    },









    checkSession(){



        /*
        
        اگر کاربر مهمان باشد
        نیاز به بررسی API نیست
        
        */


        if(

            this.state.guest

        ){



            this.syncApp();



            return;



        }







        /*
        
        کاربر واقعی:

        بررسی Token
        
        */


        if(

            !this.state.token

        ){



            this.forceGuest();



            return;



        }







        this.verifyToken();



    },









    async verifyToken(){



        try{



            if(

                !window.NightCastAPI

            ){


                this.syncApp();


                return;


            }







            const response =

            await window.NightCastAPI.get(

                "/auth/me"

            );







            if(

                response &&

                response.user

            ){



                this.state.user =

                response.user;




                localStorage.setItem(

                    "NightCastUser",

                    JSON.stringify(

                        response.user

                    )

                );





                this.state.authenticated=true;


                this.state.guest=false;



            }

            else{


                this.forceGuest();


            }





        }

        catch(error){



            console.warn(

                "Auth verify failed",

                error

            );



            this.forceGuest();



        }







        this.syncApp();



    },









    forceGuest(){



        const guest = {



            id:

            "guest_"+Date.now(),



            name:

            "مهمان NightCast",



            provider:

            "guest",



            role:

            "guest"



        };







        localStorage.setItem(


            "NightCastUser",


            JSON.stringify(guest)


        );







        localStorage.removeItem(

            "NightCastToken"

        );







        this.state.user=guest;


        this.state.token=null;


        this.state.guest=true;


        this.state.authenticated=false;



    },









    syncApp(){



        if(

            window.NightCastApp &&

            typeof window.NightCastApp.syncUserState === "function"

        ){



            window.NightCastApp.syncUserState();



        }



        console.log(

            "Auth State Synced ✔"

        );



    },    /* =====================================================
       EVENT BINDING
    ===================================================== */


    bindEvents(){



        /*
        Open Login Modal
        
        */


        const loginButton =

        document.getElementById(

            "loginButton"

        );





        if(loginButton){



            loginButton.addEventListener(

                "click",

                ()=>{


                    this.open();



                }


            );


        }








        /*
        Close Auth Modal

        */


        const closeButton =

        document.getElementById(

            "closeAuth"

        );





        if(closeButton){



            closeButton.addEventListener(

                "click",

                ()=>{


                    this.close();



                }


            );



        }








        /*
        Skip Login
        
        */


        const skip =

        document.getElementById(

            "skipLogin"

        );





        if(skip){



            skip.addEventListener(

                "click",

                e=>{


                    e.preventDefault();


                    this.guestLogin();



                }


            );



        }








        /*
        Logout Button
        
        */


        const logout =

        document.getElementById(

            "logoutButton"

        );





        if(logout){



            logout.addEventListener(

                "click",

                ()=>{


                    this.logout();



                }


            );



        }




    },









    /* =====================================================
       MODAL CONTROL
    ===================================================== */



    open(){



        const modal =

        document.getElementById(

            "authModal"

        );





        if(!modal){

            return;

        }







        modal.classList.remove(

            "hidden"

        );





        document.body.classList.add(

            "no-scroll"

        );




    },









    close(){



        const modal =

        document.getElementById(

            "authModal"

        );





        if(!modal){

            return;

        }






        modal.classList.add(

            "hidden"

        );






        document.body.classList.remove(

            "no-scroll"

        );



    },









    /* =====================================================
       GUEST LOGIN
    ===================================================== */



    guestLogin(){



        const guestUser = {



            id:

            "guest_"+Date.now(),



            name:

            "مهمان NightCast",



            provider:

            "guest",



            role:

            "listener"



        };








        localStorage.setItem(

            "NightCastUser",

            JSON.stringify(

                guestUser

            )

        );








        localStorage.removeItem(

            "NightCastToken"

        );







        this.state.user = guestUser;


        this.state.token=null;


        this.state.guest=true;


        this.state.authenticated=false;








        this.close();





        this.syncApp();








        this.message(

            "ورود به عنوان مهمان انجام شد"

        );



    },









    /* =====================================================
       OPENID SUCCESS HANDLER

    ===================================================== */


    loginSuccess(
        user,
        token
    ){



        if(!user){

            return false;

        }







        localStorage.setItem(

            "NightCastUser",

            JSON.stringify(

                user

            )

        );






        if(token){



            localStorage.setItem(

                "NightCastToken",

                token

            );


        }








        this.state.user=user;


        this.state.token=token;


        this.state.guest=false;


        this.state.authenticated=true;






        this.close();






        this.syncApp();






        this.message(

            "خوش آمدید "+

            (user.name || "کاربر")

        );






        return true;



    },








    message(text){



        if(

            window.NightCastUI &&

            typeof window.NightCastUI.toast==="function"

        ){



            window.NightCastUI.toast(

                text

            );



            return;

        }







        console.log(

            text

        );



    }, id="q0m8u1"
/* =====================================================
   LOGOUT MANAGEMENT
===================================================== */


    logout(){



        const token =

        localStorage.getItem(

            "NightCastToken"

        );






        /*
        
        اطلاع به سرور
        
        */

        if(

            token &&

            window.NightCastAPI

        ){



            try{



                window.NightCastAPI.post(

                    "/auth/logout",

                    {}

                );



            }

            catch(e){



                console.warn(

                    "Server logout failed"

                );



            }



        }








        /*
        
        پاک کردن اطلاعات محلی
        
        */



        localStorage.removeItem(

            "NightCastUser"

        );





        localStorage.removeItem(

            "NightCastToken"

        );







        const guest={



            id:

            "guest_"+Date.now(),



            name:

            "مهمان NightCast",



            provider:

            "guest",



            role:

            "listener"



        };








        localStorage.setItem(

            "NightCastUser",

            JSON.stringify(

                guest

            )

        );









        this.state.user=guest;


        this.state.token=null;


        this.state.guest=true;


        this.state.authenticated=false;







        this.syncApp();







        this.message(

            "از حساب کاربری خارج شدید"

        );






    },









/* =====================================================
   AUTH STATUS
===================================================== */



    isLoggedIn(){



        return (

            this.state.authenticated &&

            !this.state.guest

        );



    },









    isGuest(){



        return this.state.guest;



    },









    getUser(){



        return this.state.user;



    },









    getToken(){



        return this.state.token;



    },









/* =====================================================
   LOGIN REQUIREMENT
===================================================== */


    requireLogin(){



        if(

            this.isGuest()

        ){



            this.open();




            this.message(

                "برای انجام این عملیات وارد شوید"

            );




            return false;



        }







        return true;



    },









/* =====================================================
   DOWNLOAD SECURITY
===================================================== */



    canDownload(){



        if(

            this.isGuest()

        ){



            const modal =

            document.getElementById(

                "downloadLoginModal"

            );







            if(modal){



                modal.classList.remove(

                    "hidden"

                );



            }






            return false;



        }








        return true;



    },









    protectDownloads(){



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

                    !this.canDownload()

                ){



                    e.preventDefault();


                    e.stopPropagation();



                }






            },

            true



        );



    },









/* =====================================================
   OPENID HANDLER
===================================================== */


    startOpenID(){



        console.log(

            "Starting OpenID Flow..."

        );






        /*
        
        Login.js مسئول
        redirect واقعی است
        
        */


        if(

            window.NightCastLogin &&

            typeof window.NightCastLogin.openid==="function"

        ){



            window.NightCastLogin.openid();



            return;



        }







        this.message(

            "سیستم ورود آماده نیست"

        );



    },









    receiveOpenID(
        data
    ){



        if(

            !data

        ){

            return;

        }







        const user =

        data.user;






        const token =

        data.token;






        return this.loginSuccess(

            user,

            token

        );



    },/* =====================================================
   TOKEN MANAGEMENT
===================================================== */


    saveToken(token){



        if(!token){

            return;

        }




        localStorage.setItem(

            "NightCastToken",

            token

        );



        this.state.token = token;



    },









    clearToken(){



        localStorage.removeItem(

            "NightCastToken"

        );



        this.state.token=null;



    },









    refreshToken(){



        /*
        
        آماده برای JWT Refresh
        
        در نسخه بعدی API
        
        */

        if(

            !this.state.token

        ){



            return false;



        }






        console.log(

            "Token refresh requested"

        );





        return true;



    },









/* =====================================================
   USER PROFILE SYNC
===================================================== */



    updateUser(user){



        if(!user){

            return;

        }





        this.state.user=user;






        localStorage.setItem(

            "NightCastUser",

            JSON.stringify(

                user

            )

        );






        this.state.guest =

        user.provider==="guest";






        this.state.authenticated =

        !this.state.guest;






        this.syncApp();



    },









    updateUI(){



        const user =

        this.state.user;






        const name =

        document.getElementById(

            "profileName"

        );






        const username =

        document.getElementById(

            "profileUsername"

        );







        if(name && user){



            name.textContent =

            user.name ||

            "کاربر NightCast";



        }







        if(username && user){



            username.textContent =

            user.username ?

            "@"+user.username

            :

            "@guest";



        }





    },









/* =====================================================
   APP CONNECTION
===================================================== */



    syncApp(){



        this.updateUI();






        if(

            window.NightCastApp

        ){



            if(

                typeof window.NightCastApp.syncUserState === "function"

            ){



                window.NightCastApp.syncUserState();



            }



        }






        const state =

        document.getElementById(

            "nightcastState"

        );






        if(state){



            state.dataset.user =

            this.isGuest()

            ?

            "guest"

            :

            "authenticated";



        }





    },









/* =====================================================
   AUTH TAB MANAGEMENT
===================================================== */


    switchTab(tab){



        const forms =

        document.querySelectorAll(

            ".auth-form"

        );







        forms.forEach(

            form=>{


                form.classList.add(

                    "hidden"

                );


            }

        );









        const target =

        document.querySelector(

            `[data-form="${tab}"]`

        );






        if(target){



            target.classList.remove(

                "hidden"

            );



        }









        const tabs =

        document.querySelectorAll(

            "[data-auth-tab]"

        );







        tabs.forEach(

            button=>{


                button.classList.remove(

                    "active"

                );


            }

        );







        const active =

        document.querySelector(

            `[data-auth-tab="${tab}"]`

        );






        if(active){



            active.classList.add(

                "active"

            );



        }



    },









/* =====================================================
   MODAL OUTSIDE CLICK
===================================================== */


    enableOutsideClose(){



        const modal =

        document.getElementById(

            "authModal"

        );






        if(!modal){

            return;

        }







        modal.addEventListener(

            "click",

            e=>{



                if(

                    e.target===modal

                ){



                    this.close();



                }



            }



        );



    },









/* =====================================================
   INIT COMPLETE
===================================================== */


    ready(){



        this.protectDownloads();


        this.enableOutsideClose();


        this.updateUI();



        console.log(

            "🔐 Auth Ready ✔"

        );



    },/* =====================================================
   INIT
===================================================== */


    init(){



        console.log(

            "🔐 NightCast Auth Starting..."

        );





        this.loadState();





        this.bindEvents();





        this.ready();





        console.log(

            "🔐 NightCast Auth Initialized ✔"

        );



    }









/* =====================================================
   OPENID CALLBACK
===================================================== */


    handleOpenIDCallback(){



        const params =

        new URLSearchParams(

            window.location.search

        );






        const token =

        params.get(

            "token"

        );






        const user =

        params.get(

            "user"

        );








        if(

            token && user

        ){



            try{



                const decodedUser =

                JSON.parse(

                    decodeURIComponent(

                        user

                    )

                );





                this.loginSuccess(

                    decodedUser,

                    token

                );






                history.replaceState(

                    null,

                    "",

                    window.location.pathname

                );




            }

            catch(error){



                console.error(

                    "OpenID callback error",

                    error

                );



            }



        }



    },









/* =====================================================
   API LOGIN HELPER
===================================================== */


    apiLogin(
        username,
        password
    ){



        if(

            !window.NightCastAPI

        ){



            this.message(

                "ارتباط با سرور برقرار نیست"

            );



            return;



        }








        return window.NightCastAPI.post(

            "/auth/login",

            {


                username,

                password


            }


        )

        .then(

            response=>{



                if(

                    response.token

                ){



                    this.loginSuccess(

                        response.user,

                        response.token

                    );



                }



                return response;



            }


        );



    },









/* =====================================================
   STATE EXPORT
===================================================== */


    getState(){



        return {

            user:

            this.state.user,


            token:

            this.state.token,


            guest:

            this.state.guest,


            authenticated:

            this.state.authenticated


        };



    }







};








/* =====================================================
   GLOBAL EXPORT
===================================================== */


window.NightCastAuth = Auth;







/* =====================================================
   AUTO START
===================================================== */


document.addEventListener(

    "DOMContentLoaded",

    ()=>{


        Auth.init();


    }

);







})();
