/* ==================================================

NightCast User Authentication Manager V2

File:

/users/js/auth.js


Responsibility:

ONLY USER AUTHENTICATION


Depends:

api.js


================================================== */


const NightCastAuth = {


    currentUser:null,





    /*
    ====================================
    INIT
    ====================================
    */


    async init(){


        const result =

        await this.checkSession();



        this.bindGuestLogin();



        return result;


    },









    /*
    ====================================
    CHECK SESSION
    ====================================
    */


    async checkSession(){



        /*
        ================================
        GUEST MODE
        ================================
        */


        if(

            localStorage.getItem(

                "NightCastGuest"

            )

        ){


            this.setGuest();


            this.updateUI();



            return {


                success:true,


                loggedIn:false,


                guest:true


            };


        }









        if(!API.isLoggedIn()){



            this.setGuest();



            this.updateUI();



            return {


                success:true,


                loggedIn:false,


                guest:true


            };


        }







        const result =

        await API.me();







        if(result.success){



            this.currentUser =

            result.user || result.data;



            this.updateUI();



            return {


                success:true,


                loggedIn:true,


                user:this.currentUser


            };



        }







        this.logout();




        return {


            success:false,


            loggedIn:false


        };



    },









    /*
    ====================================
    LOGIN
    ====================================
    */


    async login(username,password){



        const result =

        await API.login(

            username,

            password

        );







        if(result.success){



            localStorage.removeItem(

                "NightCastGuest"

            );



            await this.checkSession();



        }







        return result;



    },









    /*
    ====================================
    REGISTER
    ====================================
    */


    async register(data){



        return await API.register(data);



    },









    /*
    ====================================
    LOGOUT
    ====================================
    */


    logout(){



        API.removeToken();



        localStorage.removeItem(

            "NightCastGuest"

        );



        this.setGuest();



        this.updateUI();



    },









    /*
    ====================================
    GUEST
    ====================================
    */


    setGuest(){



        this.currentUser = {


            id:null,


            username:"guest",


            role:"guest"



        };



    },









    /*
    ====================================
    STATUS
    ====================================
    */


    isLoggedIn(){



        return API.isLoggedIn();



    },








    isGuest(){



        return !this.isLoggedIn();



    },









    /*
    ====================================
    DOWNLOAD PERMISSION
    ====================================
    */


    canDownload(){



        return this.isLoggedIn();



    },









    /*
    ====================================
    REQUIRE LOGIN
    ====================================
    */


    requireLogin(){



        if(this.isLoggedIn()){



            return true;



        }






        if(window.NightCastUI){



            NightCastUI.toast(


                "برای دانلود ابتدا وارد حساب شوید",


                "warning"


            );


        }






        return false;



    },









    /*
    ====================================
    GET USER
    ====================================
    */


    getUser(){



        return this.currentUser;



    },









    /*
    ====================================
    UPDATE HEADER UI
    ====================================
    */


    updateUI(){



        const button =

        document.getElementById(

            "loginButton"

        );






        if(!button)

        return;







        if(this.isLoggedIn()){



            button.innerHTML =


            `

            <i class="fa-solid fa-user"></i>

            حساب کاربری

            `;



        }

        else{



            button.innerHTML =


            `

            <i class="fa-solid fa-right-to-bracket"></i>

            ورود

            `;



        }



    },









    /*
    ====================================
    GUEST LOGIN BUTTON
    ====================================
    */


    bindGuestLogin(){



        const button =

        document.getElementById(

            "skipLoginButton"

        );







        if(button){



            button.onclick = ()=>{



                localStorage.setItem(

                    "NightCastGuest",

                    "true"

                );






                const loginEntry =

                document.getElementById(

                    "loginEntry"

                );






                if(loginEntry){



                    loginEntry.style.display="none";


                }






                this.setGuest();



                this.updateUI();





                console.log(

                    "Guest Mode Activated"

                );



            };


        }









        const skipLink =

        document.getElementById(

            "skipLogin"

        );








        if(skipLink){



            skipLink.onclick=(e)=>{



                e.preventDefault();





                localStorage.setItem(

                    "NightCastGuest",

                    "true"

                );





                const modal =

                document.getElementById(

                    "authModal"

                );






                if(modal){



                    modal.classList.add(

                        "hidden"

                    );


                }





            };


        }



    }





};








window.NightCastAuth = NightCastAuth;






console.log(

"NightCast Auth V2 Loaded"

);
