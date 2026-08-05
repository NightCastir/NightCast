/* ==================================================

NightCast Profile Manager V1

File:
 /users/js/features/profile.js


Responsibility:

- User Profile Panel
- Current User Info
- Logout UI


Depends:

auth.js
ui.js


================================================== */


const NightCastProfile = {



    panel:null,





    /*
    ====================================
    INIT
    ====================================
    */


    init(){


        this.panel =

        document.getElementById(

            "profilePanel"

        );





        this.bindEvents();

        this.loadUser();





        console.log(

            "NightCast Profile Loaded"

        );



    },









    /*
    ====================================
    EVENTS
    ====================================
    */


    bindEvents(){



        const logoutButton =

        document.getElementById(

            "logoutButton"

        );





        if(logoutButton){



            logoutButton.onclick = ()=>{


                this.logout();


            };


        }







        const loginButton =

        document.getElementById(

            "loginButton"

        );





        if(loginButton){


            loginButton.onclick = ()=>{


                if(window.NightCastAuth){


                    NightCastAuth.openLogin();


                }


            };


        }



    },









    /*
    ====================================
    LOAD USER
    ====================================
    */


    async loadUser(){



        if(

            !window.NightCastAuth

            ||

            !NightCastAuth.isLoggedIn()

        ){


            this.showGuest();


            return;


        }







        const result =

        await NightCastAuth.me();







        if(

            !result.success

        ){


            this.showGuest();


            return;


        }







        const user =

        result.user ||

        result.data;







        this.renderUser(

            user

        );



    },









    /*
    ====================================
    RENDER USER
    ====================================
    */


    renderUser(user){



        if(!user){

            return;

        }





        const name =

        document.getElementById(

            "profileName"

        );





        const username =

        document.getElementById(

            "profileUsername"

        );







        if(name){


            name.innerText =

            user.full_name ||

            user.name ||

            "کاربر NightCast";


        }






        if(username){


            username.innerText =

            "@"+

            (

                user.username ||

                "user"

            );


        }






        this.updateLoginButton(

            true

        );



    },









    /*
    ====================================
    GUEST
    ====================================
    */


    showGuest(){



        this.updateLoginButton(

            false

        );



    },









    /*
    ====================================
    LOGIN BUTTON
    ====================================
    */


    updateLoginButton(state){



        const button =

        document.getElementById(

            "loginButton"

        );





        if(!button){

            return;

        }






        if(state){



            button.innerHTML =


            `

            <i class="fa-solid fa-user-check"></i>

            حساب من

            `;



        }

        else{


            button.innerHTML =


            `

            <i class="fa-solid fa-user"></i>

            ورود

            `;



        }




    },









    /*
    ====================================
    OPEN PROFILE
    ====================================
    */


    open(){



        if(this.panel){



            this.panel.classList.add(

                "active"

            );


        }


    },









    /*
    ====================================
    CLOSE PROFILE
    ====================================
    */


    close(){



        if(this.panel){



            this.panel.classList.remove(

                "active"

            );


        }


    },









    /*
    ====================================
    LOGOUT
    ====================================
    */


    async logout(){



        if(window.NightCastAuth){



            await NightCastAuth.logout();



        }






        this.showGuest();






        if(window.NightCastUI){


            NightCastUI.toast(

                "با موفقیت خارج شدید",

                "success"

            );


        }






        this.close();



    }





};







window.NightCastProfile =

NightCastProfile;
