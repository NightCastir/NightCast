/*
NightCast CMS

File:
podcasts.js

Version:
1.0.0
*/


async function loadPodcasts(){


const area =
document.getElementById("contentArea");



area.innerHTML =
`
<h2>🎙 پادکست‌ها</h2>

<p>
در حال دریافت اطلاعات...
</p>
`;



try{


const token =
localStorage.getItem("NightCastToken");



const response = await fetch(

"https://nightcast-api.tomasgermany2580.workers.dev/api/v1/podcasts",

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


area.innerHTML =
`
<h3>
خطا در دریافت پادکست‌ها
</h3>
<p>
${data.message}
</p>
`;

return;

}




let rows="";



data.podcasts.forEach(p=>{


rows +=

`
<tr>

<td>${p.id}</td>

<td>${p.title || ""}</td>

<td>${p.book_name || ""}</td>

<td>${p.author_name || ""}</td>

<td>${p.status || ""}</td>

<td>

<button onclick="editPodcast(${p.id})">

ویرایش

</button>

</td>

</tr>

`;

});





area.innerHTML =

`

<h2>
🎙 مدیریت پادکست‌ها
</h2>


<br>


<button onclick="newPodcast()">

➕ پادکست جدید

</button>


<br><br>



<table border="1" width="100%" cellpadding="10">


<thead>

<tr>

<th>ID</th>

<th>عنوان</th>

<th>کتاب</th>

<th>نویسنده</th>

<th>وضعیت</th>

<th>عملیات</th>

</tr>

</thead>



<tbody>

${rows}

</tbody>


</table>


`;



}


catch(error){


area.innerHTML =

`

<h3>
خطای ارتباط با سرور
</h3>

<p>
${error.message}
</p>

`;

}



}



function newPodcast(){


document.getElementById("contentArea").innerHTML=

`

<h2>
➕ پادکست جدید
</h2>


<p>
فرم ثبت در مرحله بعد اضافه می‌شود.
</p>

`;

}



function editPodcast(id){


document.getElementById("contentArea").innerHTML=

`

<h2>
ویرایش پادکست شماره ${id}
</h2>


<p>
فرم ویرایش در مرحله بعد اضافه می‌شود.
</p>

`;

}
