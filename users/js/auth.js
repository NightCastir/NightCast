/* ==================================================

NightCast Authentication Manager V2


File:

/users/js/core/auth.js


Responsibility:

ONLY USER AUTH


Features:

- Login
- Register
- Guest Mode
- Session Check
- Permission Control


================================================== */


const NightCastAuth = {



    currentUser:null,


    mode:"guest",







    /*
    ====================================
    INIT
    ====================================
    */


    async init(){


        await this.checkSession();



        console.log(

            "NightCast Auth Ready"

        );


    },









    /*
    ====================================
    CHECK SESSION
    ====================================
    */


    async checkSession(){



        if(

            !NightCastAPI.isLoggedIn()

        ){


            this.setGuest();


            return false;


        }








        const result =

        await NightCastAPI.me();








        if(

            result.success

        ){



            this.setUser(

                result.user ||

                result.data

            );



            return true;



        }







        this.logoutLocal();



        this.setGuest();



        return false;



    },









    /*
    ====================================
    LOGIN
    ====================================
    */


    async login(

        username,

        password

    ){



        const result =

        await NightCastAPI.login(

            username,

            password

        );







        if(

            result.success

            &&

            result.token

        ){



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



        return await NightCastAPI.register(

            data

        );



    },









    /*
    ====================================
    LOGOUT
    ====================================
    */


    async logout(){



        try{



            await NightCastAPI.logout();



        }

        catch(e){



            console.warn(e);



        }






        this.logoutLocal();



        this.setGuest();



    },









    /*
    ====================================
    REMOVE LOCAL SESSION
    ====================================
    */


    logoutLocal(){



        NightCastAPI.removeToken();



        this.currentUser=null;



    },









    /*
    ====================================
    GUEST
    ====================================
    */


    setGuest(){



        this.mode="guest";



        this.currentUser={



            id:null,


            username:"guest",


            role:"guest"



        };




    },









    /*
    ====================================
    USER
    ====================================
    */


    setUser(user){



        this.mode="user";


        this.currentUser=user;



    },









    /*
    ====================================
    STATUS
    ====================================
    */


    isLoggedIn(){


        return (

            this.mode==="user"

        );



    },









    isGuest(){


        return (

            this.mode==="guest"

        );



    },









    /*
    ====================================
    PERMISSIONS
    ====================================
    */



    canDownload(){


        return this.isLoggedIn();



    },





    canComment(){


        return this.isLoggedIn();



    },





    canSave(){


        return this.isLoggedIn();



    },









    /*
    ====================================
    OPEN LOGIN

    Called from:

    Download
    Comment
    Save

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



    },









    closeLogin(){



        const modal =

        document.getElementById(

            "authModal"

        );



        if(modal){



            modal.classList.add(

                "hidden"

            );


        }



    },









    /*
    ====================================
    USER DATA
    ====================================
    */


    getUser(){



        return this.currentUser;



    }





};









window.NightCastAuth =

NightCastAuth;
