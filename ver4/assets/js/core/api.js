/*
=================================================

NightCast Ver4
Core API Manager

Responsible for:
- Workers API Communication
- Authentication Token
- Request Handling
- Error Management

=================================================
*/


const API_CONFIG = {


    BASE_URL:

    "https://nightcast-api.tomasgermany2580.workers.dev/api/v1",


    TOKEN_KEY:

    "NightCastToken"


};





const API = {



    /*
    ==========================
    GET TOKEN
    ==========================
    */


    getToken(){


        return localStorage.getItem(

            API_CONFIG.TOKEN_KEY

        );


    },







    /*
    ==========================
    SAVE TOKEN
    ==========================
    */


    setToken(token){


        localStorage.setItem(

            API_CONFIG.TOKEN_KEY,

            token

        );


    },







    /*
    ==========================
    REMOVE TOKEN
    ==========================
    */


    removeToken(){


        localStorage.removeItem(

            API_CONFIG.TOKEN_KEY

        );


    },








    /*
    ==========================
    MAIN REQUEST ENGINE
    ==========================
    */


    async request(

        endpoint,

        options = {}

    ){



        try{


            const config = {


                method:

                options.method || "GET",


                headers:{


                    "Content-Type":

                    "application/json"


                }


            };





            const token = this.getToken();




            if(token){


                config.headers.Authorization =

                "Bearer " + token;


            }






            /*
            اگر ارسال فایل باشد
            Content-Type نباید تنظیم شود
            مرورگر خودش تعیین می‌کند
            */


            if(options.body instanceof FormData){


                delete config.headers[
                    "Content-Type"
                ];


                config.body = options.body;


            }

            else if(options.body){


                config.body =

                JSON.stringify(

                    options.body

                );


            }







            const response =

            await fetch(


                API_CONFIG.BASE_URL +

                endpoint,


                config


            );








            let data;



            try{


                data =

                await response.json();


            }

            catch{


                throw new Error(

                    "پاسخ نامعتبر از سرور دریافت شد"

                );


            }









            if(!response.ok){



                throw new Error(


                    data.message ||

                    "خطا در ارتباط با سرور"


                );


            }






            return data;



        }


        catch(error){



            console.error(

                "API ERROR:",

                error

            );



            throw error;



        }



    },









    /*
    ==========================
    SHORT METHODS
    ==========================
    */






    async get(url){


        return this.request(

            url,

            {

                method:"GET"

            }

        );


    },







    async post(

        url,

        body

    ){



        return this.request(

            url,

            {

                method:"POST",

                body:body


            }

        );


    },







    async put(

        url,

        body

    ){


        return this.request(

            url,

            {


                method:"PUT",

                body:body


            }


        );


    },








    async delete(url){



        return this.request(

            url,

            {


                method:"DELETE"


            }


        );


    }






};
