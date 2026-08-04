/*
=================================================

NightCast Ver4
Admin Dashboard Manager

Professional Version

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


                if(!Auth.requireAuth()){


                    return;


                }


            }







            await this.loadDashboard();



        }

        catch(error){



            console.error(

                "DASHBOARD INIT ERROR:",

                error

            );



            UI.error(

                "خطا در بارگذاری داشبورد"

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








            const result =

            await API.get(

                "/podcasts"

            );








            if(

                !result.success

            ){



                throw new Error(

                    result.message ||

                    "دریافت اطلاعات ناموفق بود"

                );


            }








            this.podcasts =

            result.podcasts ||

            [];








            this.renderStatistics();








            this.renderLatestPodcasts();








            this.renderActivities();




        }

        catch(error){



            console.error(

                "LOAD DASHBOARD ERROR:",

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
    STATISTICS
    ==========================
    */


    renderStatistics(){



        const totalPodcasts =

        document.getElementById(

            "totalPodcasts"

        );








        const totalPlays =

        document.getElementById(

            "totalPlays"

        );








        if(totalPodcasts){



            totalPodcasts.textContent =

            this.podcasts.length;



        }








        let plays = 0;





        this.podcasts.forEach(

            podcast=>{


                plays +=

                Number(

                    podcast.listen_count ||

                    0

                );


            }

        );








        if(totalPlays){



            totalPlays.textContent =

            plays;



        }



    }





    /*
    ==========================
    BOOKS / USERS PLACEHOLDER
    ==========================
    */


    renderEmptyStats(){



        const books =

        document.getElementById(

            "totalBooks"

        );





        const users =

        document.getElementById(

            "totalUsers"

        );







        if(books){



            books.textContent =

            "0";


        }







        if(users){



            users.textContent =

            "0";


        }



    }









    /*
    ==========================
    LATEST PODCASTS TABLE
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

            this.podcasts.length===0

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

                podcast.status==="active"

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
    ACTIVITY
    ==========================
    */


    renderActivities(){



        const activity =

        document.getElementById(

            "activityList"

        );








        if(!activity){



            return;


        }








        if(

            this.podcasts.length===0

        ){



            activity.innerHTML = `

            <div class="empty-state">

            هنوز فعالیتی ثبت نشده است

            </div>

            `;



            return;


        }








        activity.innerHTML = "";








        this.podcasts

        .slice(0,5)

        .forEach(

            item=>{



                activity.innerHTML += `

                
                <div class="notification">


                    <div class="notification-icon">

                    🎙

                    </div>



                    <div>


                        <strong>

                        ${item.title}

                        </strong>


                        <br>


                        <small>

                        ثبت شده در

                        ${

                        UI.formatDate(

                        item.created_at

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



                if(window.Auth){



                    Auth.logout();



                }

                else{



                    localStorage.removeItem(

                        "NightCastToken"

                    );


                    location.href =

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
