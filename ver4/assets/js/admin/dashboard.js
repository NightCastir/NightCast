/*
=================================================

NightCast Ver4
Admin Dashboard Manager

Responsible for:
- Dashboard Statistics
- Latest Podcasts
- Activity Feed
- Dashboard Refresh

=================================================
*/


"use strict";





class DashboardManager {



    constructor(){


        this.init();


    }









    /*
    ==========================
    INIT
    ==========================
    */


    async init(){



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



            UI.showLoader(

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

                    "خطا در دریافت آمار"

                );


            }








            this.renderStats(

                result.data

            );



        }

        catch(error){



            console.error(

                "Dashboard Stats Error:",

                error

            );



            UI.error(

                error.message

            );



        }

        finally{



            UI.hideLoader();



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








        const podcasts =

        document.getElementById(

            "totalPodcasts"

        );








        const books =

        document.getElementById(

            "totalBooks"

        );








        const users =

        document.getElementById(

            "totalUsers"

        );








        const plays =

        document.getElementById(

            "totalPlays"

        );








        if(podcasts){



            podcasts.textContent =

            data.podcasts ||

            0;



        }








        if(books){



            books.textContent =

            data.books ||

            0;



        }








        if(users){



            users.textContent =

            data.users ||

            0;



        }








        if(plays){



            plays.textContent =

            data.plays ||

            data.views ||

            0;



        }



    }



    /*
    ==========================
    LOAD LATEST DATA
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

                "Latest Data Error:",

                error

            );



        }



    }









    /*
    ==========================
    RENDER LATEST PODCASTS
    ==========================
    */


    renderLatest(data){



        const container =

        document.getElementById(

            "recentPodcasts"

        );








        if(

            !container

        ){

            return;

        }








        container.innerHTML = "";








        if(

            !data ||

            data.length === 0

        ){



            container.innerHTML = `

                <tr>

                    <td colspan="3">

                        پادکستی ثبت نشده است

                    </td>

                </tr>

            `;



            return;



        }








        data.forEach(

            item=>{



                const title =

                item.title ||

                "بدون عنوان";








                const status =

                item.status ||

                "منتشر نشده";








                const date =

                item.created_at

                ?

                UI.formatDate(

                    item.created_at

                )

                :

                "-";








                container.innerHTML += `

                
                <tr>


                    <td>

                        ${title}

                    </td>



                    <td>

                        <span class="badge badge-success">

                            ${status}

                        </span>

                    </td>



                    <td>

                        ${date}

                    </td>



                </tr>


                `;



            }



        );



    }









    /*
    ==========================
    REFRESH
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


let dashboardManager = null;








document.addEventListener(

"DOMContentLoaded",

()=>{



    dashboardManager =

    new DashboardManager();








    const logoutBtn =

    document.getElementById(

        "logoutBtn"

    );








    if(logoutBtn){



        logoutBtn.addEventListener(

            "click",

            ()=>{



                Auth.logout();



            }



        );



    }



});







/*
=================================================

GLOBAL EXPORT

=================================================
*/


window.DashboardManager =

DashboardManager;
