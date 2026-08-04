/*
=================================================

NightCast Ver5
Admin Dashboard Manager

Professional Final Version

Compatible With:
- /dashboard
- /dashboard/latest
- /activity
- /podcasts

Responsible for:
- Dashboard Statistics
- Podcast Overview
- Latest Podcasts
- Activity Feed

=================================================
*/


"use strict";



class DashboardManager {



constructor(){


    this.statistics = {

        podcasts:0,

        books:0,

        users:0,

        plays:0

    };


    this.podcasts = [];


    this.activities = [];


    this.initialized = false;



    this.init();


}







/*
==========================
INIT
==========================
*/


async init(){


    try{


        if(

            window.Auth &&

            !Auth.requireAuth()

        ){


            return;


        }





        await this.loadDashboard();



        this.initialized = true;



    }

    catch(error){


        console.error(

            "DASHBOARD INIT ERROR:",

            error

        );


        this.showError(

            "خطا در راه‌اندازی داشبورد"

        );



    }



}







/*
==========================
LOAD DASHBOARD
==========================
*/


async loadDashboard(){


    try{


        this.showLoading();




        await Promise.all([


            this.loadSummary(),


            this.loadLatest(),


            this.loadActivity()


        ]);





        this.renderStatistics();


        this.renderLatestPodcasts();


        this.renderActivities();



    }

    catch(error){


        console.error(

            "DASHBOARD LOAD ERROR:",

            error

        );



        this.showError(

            error.message

        );



    }

    finally{


        this.hideLoading();


    }



}







/*
==========================
LOAD SUMMARY
==========================
*/


async loadSummary(){


    try{


        const result =

        await API.get(

            "/dashboard"

        );




        if(

            result &&

            result.success

        ){


            this.statistics =

            result.statistics ||

            this.statistics;


        }



    }

    catch(error){


        console.warn(

            "SUMMARY API ERROR",

            error

        );


    }



}
    /*
==========================
LOAD LATEST PODCASTS
==========================
*/


async loadLatest(){


    try{


        const result =

        await API.get(

            "/dashboard/latest"

        );




        if(

            result &&

            result.success

        ){


            this.podcasts =

            result.podcasts ||

            [];



        }

        else{


            this.podcasts = [];

        }



    }

    catch(error){


        console.warn(

            "LATEST PODCAST API ERROR",

            error

        );


        this.podcasts = [];


    }



}








/*
==========================
LOAD ACTIVITY
==========================
*/


async loadActivity(){


    try{


        const result =

        await API.get(

            "/activity"

        );




        if(

            result &&

            result.success

        ){


            this.activities =

            result.activities ||

            [];



        }

        else{


            this.activities = [];

        }



    }

    catch(error){


        console.warn(

            "ACTIVITY API ERROR",

            error

        );


        this.activities = [];


    }



}








/*
==========================
LOADING
==========================
*/


showLoading(){


    if(

        window.UI &&

        UI.showLoader

    ){


        UI.showLoader(

            "در حال دریافت اطلاعات داشبورد..."

        );


    }



}







hideLoading(){


    if(

        window.UI &&

        UI.hideLoader

    ){


        UI.hideLoader();


    }



}







showError(message){


    if(

        window.UI &&

        UI.error

    ){


        UI.error(

            message

        );


    }

    else{


        console.error(

            message

        );


    }



}








/*
==========================
STATISTICS RENDER
==========================
*/


renderStatistics(){



    const totalPodcasts =

    document.getElementById(

        "totalPodcasts"

    );




    const totalBooks =

    document.getElementById(

        "totalBooks"

    );




    const totalUsers =

    document.getElementById(

        "totalUsers"

    );




    const totalPlays =

    document.getElementById(

        "totalPlays"

    );







    if(totalPodcasts){


        totalPodcasts.textContent =

        this.statistics.podcasts || 0;



    }






    if(totalBooks){


        totalBooks.textContent =

        this.statistics.books || 0;



    }






    if(totalUsers){


        totalUsers.textContent =

        this.statistics.users || 0;



    }






    if(totalPlays){


        totalPlays.textContent =

        this.statistics.plays || 0;



    }



}

/*
==========================
LATEST PODCAST TABLE
==========================
*/


renderLatestPodcasts(){



    const table =

    document.getElementById(

        "recentPodcasts"

    );




    if(!table){


        console.warn(

            "recentPodcasts element not found"

        );


        return;


    }






    table.innerHTML = "";







    if(

        this.podcasts.length === 0

    ){



        table.innerHTML = `

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

            this.escapeHTML(

                podcast.title ||

                "بدون عنوان"

            );





            const status =

            podcast.status === "active"

            ?

            "فعال"

            :

            "غیرفعال";






            let date = "-";





            if(

                podcast.created_at

            ){



                if(

                    window.UI &&

                    UI.formatDate

                ){



                    date =

                    UI.formatDate(

                        podcast.created_at

                    );



                }

                else{



                    date =

                    podcast.created_at;



                }



            }








            const badgeClass =

            podcast.status === "active"

            ?

            "badge-success"

            :

            "badge-secondary";








            table.innerHTML += `


            <tr>


                <td>

                    ${title}

                </td>



                <td>

                    <span class="badge ${badgeClass}">

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
ACTIVITY FEED
==========================
*/


renderActivities(){



    const container =

    document.getElementById(

        "activityList"

    );







    if(!container){


        return;


    }







    if(

        this.activities.length === 0

    ){



        container.innerHTML = `


        <div class="empty-state">

            هنوز فعالیتی ثبت نشده است

        </div>


        `;



        return;


    }







    container.innerHTML = "";







    this.activities

    .slice(0,5)

    .forEach(

        item=>{



            const action =

            this.escapeHTML(

                item.action ||

                "فعالیت جدید"

            );





            const description =

            this.escapeHTML(

                item.description ||

                ""

            );






            let date = "";






            if(

                item.created_at

            ){



                if(

                    window.UI &&

                    UI.formatDate

                ){


                    date =

                    UI.formatDate(

                        item.created_at

                    );


                }

                else{


                    date =

                    item.created_at;


                }


            }







            container.innerHTML += `


            <div class="notification">


                <div class="notification-icon">

                    🎙

                </div>



                <div>


                    <strong>

                        ${action}

                    </strong>



                    <br>



                    <small>

                        ${description}

                        ${date}

                    </small>


                </div>



            </div>


            `;



        }

    );



            }

/*
==========================
HELPERS
==========================
*/


escapeHTML(value){


    return String(value)

    .replace(

        /&/g,

        "&amp;"

    )

    .replace(

        /</g,

        "&lt;"

    )

    .replace(

        />/g,

        "&gt;"

    )

    .replace(

        /"/g,

        "&quot;"

    )

    .replace(

        /'/g,

        "&#039;"

    );


}







/*
==========================
REFRESH
==========================
*/


async refresh(){


    await this.loadDashboard();


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








    /*
    ==========================
    LOGOUT
    ==========================
    */


    const logoutBtn =

    document.getElementById(

        "logoutBtn"

    );






    if(logoutBtn){



        logoutBtn.addEventListener(

            "click",

            ()=>{



                if(

                    window.Auth &&

                    Auth.logout

                ){



                    Auth.logout();



                }

                else{



                    localStorage.removeItem(

                        "NightCastToken"

                    );



                    window.location.href =

                    "login.html";



                }



            }

        );



    }






}

);






/*
=================================================

GLOBAL EXPORT

=================================================
*/


window.DashboardManager =

DashboardManager;





window.dashboardManager =

dashboardManager;
