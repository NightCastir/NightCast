/*
=================================================

NightCast Ver4
Admin Dashboard

Responsible for:
- Statistics
- Latest Data
- Dashboard Widgets

=================================================
*/


"use strict";





class DashboardManager {



    constructor(){


        this.init();



    }









    async init(){



        if(

            !Auth.requireAuth()

        ){

            return;

        }







        await this.loadStats();


        await this.loadLatest();




    }









    /*
    ==========================
    LOAD STATISTICS
    ==========================
    */


    async loadStats(){



        try{



            Loader.show(

                "در حال دریافت آمار..."

            );








            const result =

            await API.get(

                "/admin/dashboard"

            );








            if(

                !result.success

            ){



                throw new Error(

                    result.message ||

                    "خطا در دریافت اطلاعات"

                );



            }








            this.renderStats(

                result.data

            );







        }

        catch(error){



            Toast.error(

                error.message

            );



        }

        finally{



            Loader.hide();



        }



    }



    /*
    ==========================
    RENDER STATISTICS
    ==========================
    */


    renderStats(data){



        if(!data){

            return;

        }








        const elements = {



            podcasts:

            document.querySelector(

                "[data-stat-podcasts]"

            ),






            books:

            document.querySelector(

                "[data-stat-books]"

            ),






            users:

            document.querySelector(

                "[data-stat-users]"

            ),






            views:

            document.querySelector(

                "[data-stat-views]"

            )



        };








        if(elements.podcasts)

        elements.podcasts.textContent =

        data.podcasts || 0;







        if(elements.books)

        elements.books.textContent =

        data.books || 0;







        if(elements.users)

        elements.users.textContent =

        data.users || 0;







        if(elements.views)

        elements.views.textContent =

        data.views || 0;



    }









    /*
    ==========================
    LOAD LATEST ITEMS
    ==========================
    */


    async loadLatest(){



        try{



            const result =

            await API.get(

                "/admin/dashboard/latest"

            );








            if(

                !result.success

            ){

                return;

            }








            this.renderLatest(

                result.data

            );





        }

        catch(error){



            console.error(

                error

            );



        }



    }









    /*
    ==========================
    RENDER LATEST
    ==========================
    */


    renderLatest(data){



        const container =

        document.querySelector(

            "#latestActivities"

        );








        if(

            !container ||

            !data

        ){

            return;

        }








        container.innerHTML = "";








        data.forEach(

            item=>{


                container.innerHTML += `

                    <div class="notification">

                        <div class="notification-icon">

                            🎧

                        </div>

                        <div>

                            <strong>

                            ${item.title}

                            </strong>

                            <small>

                            ${UI.formatDate(item.created_at)}

                            </small>

                        </div>

                    </div>

                `;



            }

        );



    }




    /*
    ==========================
    REFRESH DASHBOARD
    ==========================
    */


    async refresh(){



        await this.loadStats();


        await this.loadLatest();



    }





}









/*
=================================================

START DASHBOARD

=================================================
*/


let dashboardManager;







document.addEventListener(

"DOMContentLoaded",

()=>{


    dashboardManager =

    new DashboardManager();



});
    
    
