/*
=================================================

NightCast Ver4
Admin Dashboard Manager

Responsible for:
- Dashboard Statistics
- Podcast Statistics
- Latest Podcasts
- Activity Feed
- Dashboard Refresh

Worker Compatible Version

=================================================
*/


"use strict";





class DashboardManager {





    constructor(){


        this.podcasts = [];


        this.init();


    }









    /*
    ==========================
    INIT
    ==========================
    */


    async init(){



        try{



            if(window.Auth){



                if(!Auth.isLoggedIn()){


                    return;


                }


            }







            await this.loadDashboard();




        }


        catch(error){



            console.error(

                "Dashboard Init Error:",

                error

            );


            UI.error(

                error.message

            );


        }



    }









    /*
    ==========================
    LOAD DASHBOARD DATA
    ==========================
    */


    async loadDashboard(){



        try{



            UI.showLoader(

                "در حال دریافت اطلاعات..."

            );







            await this.loadPodcasts();







            this.renderStats();







            this.renderLatestPodcasts();





        }


        catch(error){



            console.error(

                "Dashboard Load Error:",

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
    LOAD PODCASTS
    ==========================
    */


    async loadPodcasts(){



        const result =

        await API.get(

            "/podcasts"

        );








        if(

            !result.success

        ){


            throw new Error(

                result.message ||

                "خطا در دریافت پادکست‌ها"

            );


        }








        this.podcasts =

        result.podcasts || [];



    }




    /*
    ==========================
    RENDER STATISTICS
    ==========================
    */


    renderStats(){



        const totalPodcasts =

        this.podcasts.length;








        const totalBooks =

        0;








        const totalUsers =

        0;








        const totalPlays =

        this.podcasts.reduce(

            (sum,item)=>{


                return sum +

                Number(

                    item.listen_count || 0

                );


            },

            0

        );









        this.updateElement(

            "totalPodcasts",

            totalPodcasts

        );








        this.updateElement(

            "totalBooks",

            totalBooks

        );








        this.updateElement(

            "totalUsers",

            totalUsers

        );








        this.updateElement(

            "totalPlays",

            totalPlays

        );



    }









    /*
    ==========================
    UPDATE ELEMENT
    ==========================
    */


    updateElement(

        id,

        value

    ){



        const element =

        document.getElementById(

            id

        );







        if(element){



            element.textContent =

            value;



        }



    }









    /*
    ==========================
    RENDER LATEST PODCASTS
    ==========================
    */


    renderLatestPodcasts(){



        const container =

        document.getElementById(

            "recentPodcasts"

        );








        if(!container){



            return;


        }








        container.innerHTML = "";








        if(

            this.podcasts.length === 0

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








        this.podcasts

        .slice(0,5)

        .forEach(

            podcast=>{



                const title =

                podcast.title ||

                "بدون عنوان";








                const status =

                podcast.status === "active"

                ?

                "فعال"

                :

                "غیرفعال";








                const date =

                podcast.created_at

                ?

                UI.formatDate(

                    podcast.created_at

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
    REFRESH DASHBOARD
    ==========================
    */


    async refresh(){



        await this.loadDashboard();



    }








    /*
    ==========================
    LOGOUT
    ==========================
    */


    bindEvents(){



        const logoutBtn =

        document.getElementById(

            "logoutBtn"

        );








        if(logoutBtn){



            logoutBtn.addEventListener(

                "click",

                ()=>{



                    if(window.Auth){



                        Auth.logout();



                    }


                }


            );



        }



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





    dashboardManager.bindEvents();




});









/*
=================================================

GLOBAL EXPORT

=================================================
*/


window.DashboardManager =

DashboardManager;
