/*
=================================================

NightCast Ver4
Authentication Manager

Responsible for:
- Token Checking
- Admin Protection
- Login State
- Logout

Token:
NightCastToken

=================================================
*/


"use strict";







class AuthManager {



    constructor(){



        this.tokenKey =

        "NightCastToken";





        this.user = null;





    }









    /*
    ==========================
    GET TOKEN
    ==========================
    */



    getToken(){



        return localStorage.getItem(

            this.tokenKey

        );


    }









    /*
    ==========================
    CHECK LOGIN
    ==========================
    */


    isLoggedIn(){



        const token =

        this.getToken();





        return !!token;



    }









    /*
    ==========================
    REQUIRE AUTH
    ==========================
    */


    requireAuth(){



        if(

            !this.isLoggedIn()

        ){



            window.location.href =
"/ver4/admin/login.html";


            return false;


        }





        return true;



    }









    /*
    ==========================
    GET CURRENT USER
    ==========================
    */


    async loadUser(){



        try{



            const result =

            await API.get(

                "/auth/me"

            );








            if(

                !result.success

            ){



                throw new Error(

                    "کاربر معتبر نیست"

                );


            }








            this.user =

            result.user;








            this.updateUserUI();








            return this.user;



        }

        catch(error){



            console.error(

                error

            );



            this.logout();



        }



    }





        /*
    ==========================
    UPDATE USER UI
    ==========================
    */


    updateUserUI(){



        if(

            !this.user

        ){

            return;

        }








        const nameElements =

        document.querySelectorAll(

            "[data-user-name]"

        );








        nameElements.forEach(

            el=>{


                el.textContent =

                this.user.name ||

                this.user.username ||

                "Admin";


            }

        );








        const emailElements =

        document.querySelectorAll(

            "[data-user-email]"

        );








        emailElements.forEach(

            el=>{


                el.textContent =

                this.user.email ||

                "";


            }

        );



    }









    /*
    ==========================
    LOGOUT
    ==========================
    */


    logout(){



        localStorage.removeItem(

            this.tokenKey

        );





        this.user = null;








        window.location.href =
"/ver4/admin/login.html";


    }









    /*
    ==========================
    INIT AUTH
    ==========================
    */


    async init(){



        if(

            !this.requireAuth()

        ){

            return;

        }








        await this.loadUser();



    }



}









/*
=================================================

GLOBAL AUTH INSTANCE

=================================================
*/


window.Auth =

new AuthManager();









document.addEventListener(

"DOMContentLoaded",

()=>{


    if(

        document.body.dataset.auth

        ===

        "required"

    ){



        Auth.init();



    }



});









