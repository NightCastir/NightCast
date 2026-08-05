/* ==================================================

NightCast User Profile Manager V1

File:

/users/js/features/profile.js


Responsibility:

- User Profile UI
- Login Button
- Profile Panel
- Logout


Depends:

auth.js
api.js


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



        this.update();





        console.log(

            "NightCast Profile Ready"

        );



    },









    /*
    ====================================
    UPDATE PROFILE UI
    ====================================
    */


    update(){



        const user =

        NightCastAuth.getUser();






        const name =

        document.getElementById(

            "profileName"

        );






        const username =

        document.getElementById(

            "profileUsername"

        );






        if(!user)

        return;








        if(name){



            name.textContent =

            user.full_name ||

            user.username ||

            "کاربر NightCast";


        }






        if(username){



            username.textContent =

            user.username

            ?

            "@"+user.username

            :

            "@guest";


        }





    },









    /*
    ====================================
    EVENTS
    ====================================
    */


    bindEvents(){





        const loginButton =

        document.getElementById(

            "loginButton"

        );







        if(loginButton){



            loginButton.onclick=()=>{





                if(

                    NightCastAuth.isLoggedIn()

                ){



                    this.open();



                }

                else{



                    this.openLogin();



                }



            };



        }









        const logoutButton =

        document.getElementById(

            "logoutButton"

        );







        if(logoutButton){



            logoutButton.onclick=()=>{



                NightCastAuth.logout();





                this.close();





                if(window.NightCastUI){



                    NightCastUI.toast(

                        "با موفقیت خارج شدید",

                        "success"

                    );



                }



            };



        }









        const profileLink =

        document.querySelector(

            'a[href="#profile"]'

        );





        if(profileLink){



            profileLink.onclick=(e)=>{



                e.preventDefault();



                this.open();



            };



        }





    },









    /*
    ====================================
    OPEN PANEL
    ====================================
    */


    open(){



        if(!this.panel)

        return;





        this.update();





        this.panel.classList.remove(

            "hidden"

        );



        this.panel.classList.add(

            "active"

        );



    },









    /*
    ====================================
    CLOSE PANEL
    ====================================
    */


    close(){



        if(!this.panel)

        return;





        this.panel.classList.remove(

            "active"

        );



        this.panel.classList.add(

            "hidden"

        );



    },









    /*
    ====================================
    LOGIN MODAL
    ====================================
    */


    openLogin(){



        const modal =

        document.getElementById(

            "authModal"

        );






        if(modal){



            modal.classList.remove(

                "hidden"

            );



        }



    }





};








window.NightCastProfile =

NightCastProfile;






console.log(

"NightCast Profile V1 Loaded"

);
