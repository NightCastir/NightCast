/*
=================================================

NightCast Ver4
Authentication Manager

Responsible for:
- Login
- Session
- Current User
- Logout
- Route Protection

=================================================
*/



const Auth = {



    user:null,





    /*
    ==========================
    LOGIN
    ==========================
    */


    async login(

        username,

        password

    ){


        try{



            const result =

            await API.post(

                "/auth/login",

                {


                    username,

                    password


                }

            );






            if(!result.success){


                throw new Error(

                    result.message

                );


            }






            API.setToken(

                result.token

            );






            this.user =

            result.user;







            return result;



        }


        catch(error){



            console.error(

                "LOGIN ERROR",

                error

            );



            throw error;



        }



    },








    /*
    ==========================
    CHECK SESSION
    ==========================
    */



    async check(){



        try{


            const result =

            await API.get(

                "/auth/me"

            );





            if(

                result.success

            ){



                this.user =

                result.user;



                return true;


            }




            return false;



        }


        catch(error){



            API.removeToken();



            this.user=null;



            return false;



        }



    },









    /*
    ==========================
    GET USER
    ==========================
    */


    getUser(){



        return this.user;



    },








    /*
    ==========================
    LOGOUT
    ==========================
    */



    async logout(){



        try{


            await API.post(

                "/auth/logout",

                {}

            );



        }

        catch(error){



            console.warn(

                "Logout API failed"

            );


        }

        finally{


            API.removeToken();


            this.user=null;



            location.href =

            "/ver4/admin/login.html";



        }


    },









    /*
    ==========================
    REQUIRE LOGIN
    ==========================
    */



    async requireLogin(){



        const valid =

        await this.check();




        if(!valid){



            location.href =

            "/ver4/admin/login.html";


            return false;


        }





        return true;



    }






};
