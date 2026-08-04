/*
=================================================

NightCast Ver4
API Connector

Responsible for:
- Worker Connection
- HTTP Requests
- Authentication Header
- Error Handling

=================================================
*/


"use strict";





const API = {



    /*
    ==========================
    CONFIG
    ==========================
    */


    baseURL:


    "https://YOUR-WORKER-DOMAIN.workers.dev/api",







    token:


    localStorage.getItem(

        "nightcast_token"

    ),







    /*
    ==========================
    REQUEST
    ==========================
    */



    async request(

        endpoint,

        options={}

    ){



        try{



            const headers = {



                "Content-Type":

                "application/json"

            };








            const token =

            localStorage.getItem(

                "nightcast_token"

            );








            if(token){



                headers.Authorization =

                "Bearer " + token;



            }








            const response =

            await fetch(

                this.baseURL + endpoint,

                {



                    method:

                    options.method ||

                    "GET",





                    headers:

                    headers,





                    body:

                    options.body

                    ?

                    JSON.stringify(

                        options.body

                    )

                    :

                    null



                }

            );








            const data =

            await response.json();







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
    GET
    ==========================
    */



    get(

        endpoint

    ){



        return this.request(

            endpoint

        );


    },



      /*
    ==========================
    POST
    ==========================
    */


    post(

        endpoint,

        data

    ){



        return this.request(

            endpoint,

            {


                method:

                "POST",


                body:

                data



            }

        );


    },









    /*
    ==========================
    PUT
    ==========================
    */


    put(

        endpoint,

        data

    ){



        return this.request(

            endpoint,

            {


                method:

                "PUT",


                body:

                data



            }

        );


    },









    /*
    ==========================
    DELETE
    ==========================
    */


    delete(

        endpoint

    ){



        return this.request(

            endpoint,

            {


                method:

                "DELETE"



            }

        );


    },









    /*
    ==========================
    FILE UPLOAD
    ==========================
    */


    async upload(

        endpoint,

        formData

    ){



        try{



            const token =

            localStorage.getItem(

                "nightcast_token"

            );







            const headers = {};







            if(token){



                headers.Authorization =

                "Bearer " + token;



            }








            const response =

            await fetch(

                this.baseURL + endpoint,

                {


                    method:

                    "POST",




                    headers:

                    headers,




                    body:

                    formData



                }

            );








            const data =

            await response.json();








            if(!response.ok){



                throw new Error(

                    data.message ||

                    "آپلود فایل ناموفق بود"

                );


            }








            return data;




        }



        catch(error){



            console.error(

                "UPLOAD ERROR:",

                error

            );



            throw error;



        }



    }






};









/*
=================================================

GLOBAL API EXPORT

=================================================
*/


window.API = API;





