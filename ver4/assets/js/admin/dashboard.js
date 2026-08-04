/*

NightCast Ver4
Admin Dashboard Manager

Professional Version

Responsible for:

Dashboard Statistics

Podcast Overview

Latest Podcasts

Activity Feed

API Compatible Version


=================================================
*/

"use strict";

class DashboardManager {

constructor(){  


    this.podcasts = [];  


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



        // بررسی ورود کاربر  

        if(  
            window.Auth &&  
            !Auth.requireAuth()  
        ){  

            return;  

        }  






        await this.loadData();  



        this.initialized = true;  



    }  

    catch(error){  



        console.error(  

            "Dashboard Init Error:",  

            error  

        );  



        if(window.UI){  


            UI.error(  

                "خطا در راه‌اندازی داشبورد"  

            );  


        }  



    }  



}  









/*  
==========================  
LOAD DATA  
==========================  
  
فقط بر اساس API واقعی فعلی:  
  
GET /podcasts  
  
==========================  
*/  


async loadData(){  



    try{  



        this.showLoading();  








        const result =  

        await API.get(  

            "/podcasts"  

        );  








        if(  

            !result ||  

            !result.success  

        ){  



            throw new Error(  

                result.message ||  

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








        this.renderStatistics();  



        this.renderLatestPodcasts();  



        this.renderActivities();  



    }  

    catch(error){  



        console.error(  

            "Dashboard Load Error:",  

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
STATISTICS  
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








    // تعداد پادکست‌ها  


    if(totalPodcasts){  



        totalPodcasts.textContent =  

        this.podcasts.length;  



    }  








    // فعلا API کتاب نداریم  


    if(totalBooks){  



        totalBooks.textContent =  

        "0";  



    }  








    // فعلا API کاربران نداریم  


    if(totalUsers){  



        totalUsers.textContent =  

        "0";  



    }  








    // مجموع شنیده‌ها  


    let plays = 0;  



    this.podcasts.forEach(  

        item=>{  


            plays += Number(  

                item.listen_count ||  

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

                    this.escapeHTML(  

                        podcast.title ||  

                        "بدون عنوان"  

                    )  

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








    this.podcasts  

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

                        item.title ||  

                        "پادکست"  

                    )  

                    }  

                    </strong>  



                    <br>  



                    <small>  

                    پادکست ثبت شده در سیستم  

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
REFRESH  
==========================  
*/  


async refresh(){  



    await this.loadData();  



}

}

/*

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

GLOBAL EXPORT

=================================================
*/

window.DashboardManager =

DashboardManager;
