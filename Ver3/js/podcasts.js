/*
NightCast CMS
Podcast Manager
Version 1.0
*/


const API_URL =

"https://nightcast-api.tomasgermany2580.workers.dev/api/v1";





async function loadPodcasts(){


const area =

document.getElementById("contentArea");



area.innerHTML =

`

<div class="card">

<h2>
🎙 مدیریت پادکست‌ها
</h2>


<p>
در حال دریافت اطلاعات...
</p>


</div>

`;




try{


const token =

localStorage.getItem("NightCastToken");



const response =

await fetch(

API_URL + "/podcasts",

{

method:"GET",

headers:{

"Authorization":

"Bearer "+token

}

}

);



const data =

await response.json();





if(!data.success){


area.innerHTML=

`

<div class="card">

<h3>
خطا
</h3>

<p>
${data.message}
</p>

</div>

`;


return;


}





let rows="";




data.podcasts.forEach(item=>{


rows +=


`

<tr>


<td>
${item.id}
</td>



<td>
${item.title || ""}
</td>



<td>
${item.book_name || "-"}
</td>



<td>
${item.episode_number || 1}
</td>



<td>

${

item.status==="active"

?

"فعال"

:

"غیرفعال"

}

</td>



<td>

<button

class="btn-primary"

onclick="editPodcast(${item.id})"

>

ویرایش

</button>


</td>



</tr>


`;



});





area.innerHTML =

`

<div class="card">


<div style="display:flex;justify-content:space-between;align-items:center">


<h2>
🎙 پادکست‌ها
</h2>



<button

class="btn-primary"

onclick="createPodcast()"

>

➕ پادکست جدید

</button>



</div>


<br>



<table>


<thead>

<tr>

<th>
ID
</th>


<th>
عنوان
</th>


<th>
کتاب
</th>


<th>
قسمت
</th>


<th>
وضعیت
</th>


<th>
عملیات
</th>


</tr>

</thead>


<tbody>

${rows}

</tbody>


</table>



</div>

`;



}

catch(error){


area.innerHTML=

`

<div class="card">

<h3>
خطای سرور
</h3>


<p>
${error.message}
</p>

</div>

`;


}



}






function createPodcast(){


document.getElementById("contentArea").innerHTML=

`

<div class="card">


<h2>
➕ ثبت پادکست جدید
</h2>


<p>

فرم ثبت در مرحله بعد ساخته می‌شود.

</p>


</div>

`;



}






function editPodcast(id){


document.getElementById("contentArea").innerHTML=

`

<div class="card">

<h2>

ویرایش پادکست شماره ${id}

</h2>


<p>

فرم ویرایش در مرحله بعد ساخته می‌شود.

</p>


</div>

`;



}
