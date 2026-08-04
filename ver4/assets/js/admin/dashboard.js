/*
=================================================

NightCast Ver5
Admin Dashboard Manager

Professional Version

Compatible With:
- /dashboard
- /dashboard/latest
- /activity

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


        this.podcasts = [];

        this.statistics = {};

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







            const dashboard =

            await API.get(

                "/dashboard"

            );







            if(

                !dashboard ||

                !dashboard.success

            ){


                throw new Error(

                    dashboard.message ||

                    "Dashboard API Error"

                );


            }







            this.statistics =

            dashboard.statistics ||

            {};







            const latest =

            await API.get(

                "/dashboard/latest"

            );







            if(

                latest &&

                latest.success

            ){


                this.podcasts =

                latest.podcasts || [];


            }

            else{



                this.podcasts = [];



            }







            const activity =

            await API.get(

                "/activity"

            );







            if(

                activity &&

                activity.success

            ){


                this.activities =

                activity.activities || [];



            }

            else{


                this.activities = [];



            }







            this.renderStatistics();



            this.renderLatestPodcasts();



            this.renderActivities();




        }

        catch(error){



            console.error(

                "LOAD DASHBOARD ERROR:",

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
    /*
=================================================

NightCast Ver4
Admin Dashboard Manager

Professional Final Version

Compatible With:
- /dashboard
- /dashboard/latest
- /activity
- /podcasts
- /books
- /users

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



}

catch(error){


console.error(

"DASHBOARD INIT ERROR:",

error

);



this.error(

"خطا در بارگذاری داشبورد"

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


this.loading();



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

"DASHBOARD LOAD ERROR",

error

);


this.error(

error.message

);



}

finally{


this.loaded();


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

"Dashboard summary unavailable",

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



}

catch(error){


console.warn(

"Latest podcasts unavailable",

error

);



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



}

catch(error){


console.warn(

"Activity unavailable",

error

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







table.innerHTML += `


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



container.innerHTML += `


<div class="notification">


<div class="notification-icon">

🎙

</div>



<div>


<strong>

${

this.escapeHTML(

item.action ||

"فعالیت جدید"

)

}

</strong>


<br>


<small>

${

this.escapeHTML(

item.description ||

""

)

}

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
    LATEST PODCASTS TABLE
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





                table.innerHTML += `


                <tr>


                    <td>

                        ${title}

                    </td>



                    <td>

                        <span class="badge ${
                        
                        podcast.status === "active"

                        ?

                        "badge-success"

                        :

                        "badge-secondary"

                        }">

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

            this.podcasts.length === 0

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

            podcast=>{



                let date = "";




                if(

                    podcast.created_at

                ){


                    date =

                    window.UI && UI.formatDate

                    ?

                    UI.formatDate(

                        podcast.created_at

                    )

                    :

                    podcast.created_at;


                }





                container.innerHTML += `


                <div class="notification">


                    <div class="notification-icon">

                        🎙

                    </div>



                    <div>


                        <strong>

                            ${
                            
                            this.escapeHTML(

                                podcast.title ||

                                "پادکست"

                            )

                            }

                        </strong>



                        <br>



                        <small>

                            ثبت پادکست جدید

                            ${

                            date

                            }


                        </small>



                    </div>



                </div>


                `;



            }

        );



    }






    /*
    ==========================
    SAFE HTML
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
    LOADING
    ==========================
    */


    loading(){



        if(

            window.UI &&

            UI.showLoader

        ){


            UI.showLoader(

                "در حال دریافت اطلاعات داشبورد..."

            );


        }


    }









    loaded(){



        if(

            window.UI &&

            UI.hideLoader

        ){


            UI.hideLoader();


        }


    }









    error(message){



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





});
/*
=================================================

GLOBAL EXPORT

=================================================
*/


window.DashboardManager =

DashboardManager;



window.dashboardManager =

dashboardManager;
