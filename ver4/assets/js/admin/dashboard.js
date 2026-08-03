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
