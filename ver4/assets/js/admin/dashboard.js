/*
=================================================

NightCast Ver4
Admin Dashboard Controller

Responsible for:
- Dashboard Data
- API Connection
- Statistics
- Recent Podcasts
- Mobile Menu

=================================================
*/



document.addEventListener(
"DOMContentLoaded",
async function(){



    initDashboard();



    initMobileMenu();



});






/*
==========================
INIT DASHBOARD
==========================
*/


async function initDashboard(){


    try{


        Loader.show();



        await loadStatistics();


        await loadRecentPodcasts();


        await loadSystemStatus();



    }


    catch(error){


        Toast.error(

            error.message ||

            "خطا در دریافت اطلاعات داشبورد"

        );


    }


    finally{


        Loader.hide();


    }



}








/*
==========================
STATISTICS
==========================
*/


async function loadStatistics(){



    const response =

    await API.get(

        "/podcasts"

    );




    if(response.success){



        const podcasts =

        response.podcasts || [];




        document.getElementById(

            "totalPodcasts"

        ).innerText = podcasts.length;



    }



}






/*
==========================
RECENT PODCASTS
==========================
*/


async function loadRecentPodcasts(){



    const table =

    document.getElementById(

        "recentPodcasts"

    );




    const response =

    await API.get(

        "/podcasts"

    );





    if(

        !response.success

    ){


        throw new Error(

            "دریافت پادکست‌ها ناموفق بود"

        );


    }






    const podcasts =

    response.podcasts || [];





    if(

        podcasts.length === 0

    ){



        table.innerHTML =

        `

        <tr>

        <td colspan="3">

        هنوز پادکستی ثبت نشده است

        </td>

        </tr>

        `;


        return;


    }







    table.innerHTML =

    podcasts

    .slice(0,5)

    .map(

        item =>


        `

        <tr>


        <td>

        ${item.title || "-"}

        </td>



        <td>

        ${item.status || "-"}

        </td>



        <td>

        ${

        item.created_at ?

        item.created_at :

        "-"

        }

        </td>



        </tr>

        `


    )

    .join("");



}
/*
==========================
SYSTEM STATUS
==========================
*/


async function loadSystemStatus(){



    try{



        const response =

        await API.get(

            "/system"

        );





        if(response.success){


            addActivity(

                "اتصال به سرور Worker برقرار است"

            );


        }



    }


    catch(error){



        Toast.warning(

            "وضعیت سیستم قابل دریافت نیست"

        );



    }



}









/*
==========================
ACTIVITY LOG
==========================
*/


function addActivity(message){



    const container =

    document.getElementById(

        "activityList"

    );




    if(!container)

    return;





    const item =

    document.createElement(

        "div"

    );





    item.className =

    "activity-item";





    item.innerHTML =



    `

    <div>

    ${message}

    </div>


    <small>

    همین الان

    </small>

    `;







    if(

        container.querySelector(

        ".empty-state"

        )

    ){


        container.innerHTML = "";

    }







    container.prepend(item);



}









/*
==========================
MOBILE MENU
==========================
*/


function initMobileMenu(){



    const button =

    document.getElementById(

        "menuToggle"

    );




    const sidebar =

    document.getElementById(

        "sidebar"

    );




    const overlay =

    document.getElementById(

        "overlay"

    );






    if(!button)

    return;






    button.addEventListener(

        "click",

        function(){



            sidebar.classList.toggle(

                "open"

            );



            overlay.classList.toggle(

                "show"

            );



        }

    );








    overlay.addEventListener(

        "click",

        function(){



            sidebar.classList.remove(

                "open"

            );



            overlay.classList.remove(

                "show"

            );



        }

    );



}








/*
==========================
LOGOUT
==========================
*/


document.addEventListener(

"click",

function(event){



    if(

        event.target.id ===

        "logoutBtn"

    ){



        logoutUser();



    }



}

);







async function logoutUser(){



    try{



        Loader.show();



        await API.post(

            "/auth/logout"

        );



        API.removeToken();





        window.location.href =

        "index.html";



    }


    catch(error){



        Toast.error(

            "خطا در خروج از حساب"

        );


    }


    finally{


        Loader.hide();


    }



        }

/*
==========================
CURRENT USER
==========================
*/


async function loadCurrentUser(){



    try{



        const response =

        await API.get(

            "/auth/me"

        );





        if(

            response.success &&

            response.user

        ){



            const username =

            document.getElementById(

                "username"

            );





            if(username){


                username.innerText =

                response.user.full_name ||

                response.user.username;


            }



        }



    }


    catch(error){



        console.error(

            "USER LOAD ERROR:",

            error

        );



    }



}









/*
==========================
GLOBAL ERROR HANDLER
==========================
*/


window.addEventListener(

"unhandledrejection",

function(event){



    console.error(

        "Unhandled Error:",

        event.reason

    );



    if(

        typeof Toast !== "undefined"

    ){


        Toast.error(

            "خطای غیرمنتظره رخ داد"

        );


    }



}

);








/*
==========================
START USER LOAD
==========================
*/


document.addEventListener(

"DOMContentLoaded",

function(){


    loadCurrentUser();


});
