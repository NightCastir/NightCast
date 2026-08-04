/*
=================================================

NightCast Ver4
Admin Dashboard Manager

Professional Version

Responsible for:
- Dashboard Statistics
- Podcast Statistics
- Latest Podcasts
- User Info
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



        console.log(
            "NightCast Dashboard Started"
        );




        await this.loadUser();

        await this.loadDashboard();

        await this.loadLatestPodcasts();



    }









    /*
    ==========================
    LOAD USER
    ==========================
    */


    async loadUser(){



        try{



            if(

                window.Auth

            ){


                await Auth.loadUser();



            }



        }


        catch(error){



            console.error(

                "USER LOAD ERROR",

                error

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



            UI.showLoader(

                "در حال دریافت اطلاعات..."

            );







            /*
            ======================
            LOAD PODCASTS
            ======================
            */


            const podcastResult =

            await API.get(

                "/podcasts"

            );





            console.log(

                "PODCAST RESULT:",

                podcastResult

            );







            if(

                podcastResult.success

            ){


                this.podcasts =

                podcastResult.podcasts || [];



            }






            this.renderStatistics();




        }



        catch(error){



            console.error(

                "DASHBOARD ERROR:",

                error

            );




            UI.error(

                error.message ||

                "خطا در دریافت اطلاعات"

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


    renderStatistics(){



        const podcastCount =

        this.podcasts.length;








        const totalPodcasts =

        document.getElementById(

            "totalPodcasts"

        );








        if(totalPodcasts){



            totalPodcasts.innerText =

            podcastCount;



        }








        /*
        Books

        فعلاً Route ندارد
        */

        const totalBooks =

        document.getElementById(

            "totalBooks"

        );



        if(totalBooks){



            totalBooks.innerText =

            0;



        }








        /*
        Users

        فعلاً Route ندارد
        */


        const totalUsers =

        document.getElementById(

            "totalUsers"

        );



        if(totalUsers){



            totalUsers.innerText =

            0;



        }








        /*
        Plays
        */


        let plays = 0;



        this.podcasts.forEach(

            item=>{


                plays +=

                Number(

                    item.listen_count || 0

                );


            }


        );





        const totalPlays =

        document.getElementById(

            "totalPlays"

        );





        if(totalPlays){



            totalPlays.innerText =

            plays;



        }





    }





    /*
    ==========================
    LOAD LATEST PODCASTS
    ==========================
    */


    async loadLatestPodcasts(){



        try{



            this.renderLatestPodcasts();



        }


        catch(error){



            console.error(

                "LATEST PODCAST ERROR:",

                error

            );



        }



    }









    /*
    ==========================
    RENDER PODCAST TABLE
    ==========================
    */


    renderLatestPodcasts(){



        const container =

        document.getElementById(

            "recentPodcasts"

        );








        if(!container){



            console.warn(

                "recentPodcasts container not found"

            );


            return;


        }








        container.innerHTML = "";








        if(

            !this.podcasts ||

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








        /*
        نمایش ۵ پادکست آخر
        */


        const latest =

        this.podcasts.slice(

            0,

            5

        );








        latest.forEach(

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








                const badge =

                podcast.status === "active"

                ?

                "badge-success"

                :

                "badge-danger";








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

                        <span class="badge ${badge}">

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
    LOAD ACTIVITY
    ==========================
    */


    loadActivity(){



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



            return;


        }








        container.innerHTML = "";








        this.podcasts

        .slice(

            0,

            5

        )

        .forEach(

            item=>{



                container.innerHTML += `


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


        await this.loadLatestPodcasts();


        this.loadActivity();



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
    LOAD ACTIVITY AFTER DATA
    ==========================
    */


    setTimeout(()=>{


        dashboardManager.loadActivity();



    },500);








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

                    window.Auth

                ){



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





