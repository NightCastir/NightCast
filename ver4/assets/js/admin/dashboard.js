/*
=================================================

NightCast Ver4
Admin Dashboard Controller

Responsible for:
- Dashboard Statistics
- Recent Podcasts
- System Status

=================================================
*/



document.addEventListener(

"DOMContentLoaded",

()=>{


loadDashboard();



});









async function loadDashboard(){



try{


Loader.show();





await Promise.all([


loadPodcastStats(),


checkSystemStatus(),


loadUserInfo()


]);





Toast.success(

"داشبورد آماده شد"

);




}

catch(error){


console.error(

error

);



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
==============================
LOAD PODCAST DATA
==============================
*/


async function loadPodcastStats(){



const result =

await API.get(

"/podcasts"

);






if(!result.success){


throw new Error(

"دریافت پادکست‌ها ناموفق بود"

);


}






const podcasts =

result.podcasts || [];







const counter =

document.getElementById(

"totalPodcasts"

);





if(counter){


counter.innerHTML =

podcasts.length;


}







renderRecentPodcasts(

podcasts

);



}









/*
==============================
RECENT PODCASTS TABLE
==============================
*/


function renderRecentPodcasts(

podcasts

){



const table =

document.getElementById(

"recentPodcasts"

);




if(!table)

return;






if(

podcasts.length === 0

){


table.innerHTML =

`

<tr>

<td colspan="4">

هنوز پادکستی ثبت نشده است

</td>

</tr>

`;

return;


}








let html="";







podcasts

.slice(0,5)

.forEach(

podcast=>{


html +=


`

<tr>


<td>

${

podcast.title || "-"

}

</td>




<td>

${

podcast.episode_number || "-"

}

</td>




<td>

<span class="badge">

${

podcast.status || "-"

}

</span>


</td>




<td>

${

formatDate(

podcast.created_at

)

}

</td>



</tr>


`;



}

);







table.innerHTML = html;



}









/*
==============================
SYSTEM CHECK
==============================
*/


async function checkSystemStatus(){



try{



const result =

await API.get(

"/system"

);







if(result.success){



setStatus(

"apiStatus",

"🟢 Online"

);



setStatus(

"databaseStatus",

"🟢 Connected"

);



setStatus(

"storageStatus",

"🟢 Ready"

);



}



}

catch(error){



setStatus(

"apiStatus",

"🔴 Offline"

);



setStatus(

"databaseStatus",

"نامشخص"

);



setStatus(

"storageStatus",

"نامشخص"

);



}




}










function setStatus(

id,

text

){



const element =

document.getElementById(id);




if(element){


element.innerHTML = text;


}



}










/*
==============================
USER INFO
==============================
*/


async function loadUserInfo(){



try{



const result =

await API.get(

"/auth/me"

);





if(

result.success &&

result.user

){



const name =

document.getElementById(

"adminName"

);





if(name){


name.innerHTML =

result.user.full_name ||

result.user.username;


}



}



}

catch(error){



console.log(

"User info unavailable"

);



}



}









/*
==============================
DATE FORMAT
==============================
*/


function formatDate(date){



if(!date)

return "-";





try{


return new Date(date)

.toLocaleDateString(

"fa-IR"

);



}

catch{


return "-";

}



}
