/*
=================================================

NightCast Ver4
Admin Dashboard Manager

Production Version

Based on real API:
GET /podcasts

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



            if(

                window.Auth

                &&

                !Auth.requireAuth()

            ){


                return;


            }







            await this.loadData();



        }

        catch(error){



            console.error(

                "DASHBOARD INIT ERROR",

                error

            );



            this.showError(

                error.message

            );


        }



    }









    /*
    ==========================
    LOAD DATA
    ==========================
    */


    async loadData(){



        try{



            UI.showLoader(

                "در حال دریافت اطلاعات..."

            );







            const result =

            await API.get(

                "/podcasts"

            );








            console.log(

                "DASHBOARD DATA",

                result

            );








            if(

                !result

                ||

                !result.success

            ){



                throw new Error(

                    result.message

                    ||

                    "دریافت اطلاعات ناموفق بود"

                );


            }








            this.podcasts =

            Array.isArray(

                result.podcasts

            )

            ?

            result.podcasts

            :

            [];








            this.renderStats();







            this.renderLatest();







            this.renderActivity();






        }

        catch(error){



            console.error(

                "LOAD DATA ERROR",

                error

            );



            this.showError(

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


    renderStats(){



        const podcastElement =

        document.getElementById(

            "totalPodcasts"

        );





        const playsElement =

        document.getElementById(

            "totalPlays"

        );





        const booksElement =

        document.getElementById(

            "totalBooks"

        );





        const usersElement =

        document.getElementById(

            "totalUsers"

        );








        if(podcastElement){



            podcastElement.textContent =

            this.podcasts.length;



        }








        let totalPlays = 0;





        this.podcasts.forEach(

            item=>{



                totalPlays +=

                Number(

                    item.listen_count ||

                    0

                );



            }

        );








        if(playsElement){



            playsElement.textContent =

            totalPlays;



        }








        /*
        ======================
        هنوز API نداریم
        ======================
        */


        if(booksElement){



            booksElement.textContent =

            "0";



        }








        if(usersElement){



            usersElement.textContent =

            "0";



        }



    }









    /*
    ==========================
    RENDER LATEST PODCASTS
    ==========================
    */


    renderLatest(){



        const table =

        document.getElementById(

            "recentPodcasts"

        );








        if(!table){



            console.warn(

                "recentPodcasts not found"

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





                let date = "-";







                if(

                    podcast.created_at

                ){



                    try{



                        date =

                        UI.formatDate

                        ?

                        UI.formatDate(

                            podcast.created_at

                        )

                        :

                        podcast.created_at;



                    }

                    catch(e){



                        date =

                        podcast.created_at;



                    }



                }









                const status =

                podcast.status === "active"

                ?

                "فعال"

                :

                "غیرفعال";









                table.innerHTML += `

                

                <tr>



                    <td>

                    ${

                    podcast.title ||

                    "بدون عنوان"

                    }

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
    RENDER ACTIVITY
    ==========================
    */


    renderActivity(){



        const area =

        document.getElementById(

            "activityList"

        );








        if(!area){



            return;



        }








        if(

            this.podcasts.length===0

        ){



            area.innerHTML = `

            
            <div class="empty-state">

            هنوز فعالیتی ثبت نشده است

            </div>


            `;



            return;



        }








        area.innerHTML = "";








        this.podcasts

        .slice(0,5)

        .forEach(

            item=>{



                area.innerHTML += `


                <div class="notification">


                    <div class="notification-icon">

                    🎙

                    </div>



                    <div>


                        <strong>

                        ${

                        item.title ||

                        "پادکست"

                        }

                        </strong>



                        <br>



                        <small>

                        ثبت شده در سیستم

                        </small>


                    </div>



                </div>


                `;



            }



        );



    }









    /*
    ==========================
    ERROR HANDLER
    ==========================
    */


    showError(message){



        console.error(

            message

        );



        if(window.UI){



            UI.error(

                message

            );



        }



            }













    /*
    ==========================
    REFRESH DASHBOARD
    ==========================
    */


    async refresh(){



        await this.loadData();



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
    LOGOUT BUTTON
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
