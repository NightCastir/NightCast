/*
NightCast CMS
Podcast Manager
Final Version
*/


const API_URL =

"https://nightcast-api.tomasgermany2580.workers.dev/api/v1";





function getToken(){

return localStorage.getItem(
"NightCastToken"
);

}







// ==========================
// LOAD PODCASTS
// ==========================


async function loadPodcasts(){


const area =

document.getElementById(
"contentArea"
);



area.innerHTML =

`

<div class="card">

<h2>
🎙 پادکست‌ها
</h2>

<p>
در حال دریافت اطلاعات...
</p>

</div>

`;



try{


const response =

await fetch(

API_URL + "/podcasts",

{

headers:{

"Authorization":

"Bearer "+getToken()

}

}

);



const data =

await response.json();



if(!data.success){

throw new Error(data.message);

}



let rows="";



data.podcasts.forEach(p=>{


rows +=

`

<tr>

<td>
${p.id}
</td>


<td>
${p.title || "-"}
</td>


<td>
${p.book_name || "-"}
</td>


<td>
${p.episode_number || "-"}
</td>


<td>

${
p.status==="active"

?

"فعال"

:

"غیرفعال"

}

</td>


<td>

<button

class="btn-primary"

onclick="editPodcast(${p.id})"

>

✏️

</button>


</td>


</tr>

`;



});




area.innerHTML =

`

<div class="card">


<div class="page-header">


<h2>
🎙 مدیریت پادکست‌ها
</h2>


<button

class="btn-primary"

onclick="createPodcast()"

>

➕ جدید

</button>


</div>



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


area.innerHTML =

`

<div class="card">

<h3>
خطا
</h3>


<p>
${error.message}
</p>


</div>

`;



}



}






// ==========================
// CREATE FORM START
// ==========================


function createPodcast(){


const area =

document.getElementById(
"contentArea"
);



area.innerHTML =

`

<div class="card">


<h2>
➕ ثبت پادکست جدید
</h2>



<div class="form-grid">



<div class="form-group">

<label>
عنوان
</label>

<input id="title">

</div>



<div class="form-group">

<label>
نام کتاب
</label>

<input id="book_name">

</div>



<div class="form-group">

<label>
نویسنده
</label>

<input id="author_name">

</div>



<div class="form-group">

<label>
دسته بندی
</label>

<input id="category_name">

</div>



<div class="form-group">

<label>
تگ‌ها
</label>

<input id="tags">

</div>



<div class="form-group">

<label>
شماره قسمت
</label>

<input

id="episode_number"

type="number"

value="1"

>

</div>


</div>




<div class="form-group">

<label>
خلاصه پادکست
</label>


<textarea

id="summary"

rows="6"

></textarea>


</div>





<div class="form-group">

<label>
متن کامل پیاده‌سازی شده
</label>


<textarea

id="transcript"

rows="10"

></textarea>


</div>





<div class="form-grid">


<div class="form-group">

<label>
مدت زمان (ثانیه)
</label>


<input

id="duration_seconds"

type="number"

value="0"

>


</div>



<div class="form-group">

<label>
وضعیت انتشار
</label>


<select id="status">


<option value="active">

فعال

</option>



<option value="inactive">

غیرفعال

</option>


</select>


</div>


</div>





<div class="form-group">

<label>
تصویر کاور
</label>


<input

id="cover_file"

type="file"

accept="image/*"

>


</div>





<div class="form-group">

<label>
فایل صوتی
</label>


<input

id="audio_file"

type="file"

accept="audio/*"

>


</div>






<br>



<button

class="btn-primary"

onclick="savePodcast()"

>

💾 ذخیره پادکست

</button>




</div>


`;



}







// ==========================
// UPLOAD MEDIA
// ==========================



async function uploadMedia(file,type){



if(!file){

return null;

}



const form =

new FormData();



form.append(
"file",
file
);



form.append(
"type",
type
);






const response =

await fetch(

API_URL+"/media/upload",

{

method:"POST",


headers:{


"Authorization":

"Bearer "+getToken()


},


body:form


}

);






const data =

await response.json();






if(!data.success){


throw new Error(
data.message
);


}





return data.url;



}






// ==========================
// SAVE PODCAST
// ==========================



async function savePodcast(){



try{
async function savePodcast(){

try{


const cover =

document.getElementById(
"cover_file"
).files[0];


const audio =

document.getElementById(
"audio_file"
).files[0];
const cover =

document.getElementById(
"cover_file"
).files[0];



const audio =

document.getElementById(
"audio_file"
).files[0];






const cover_url =

await uploadMedia(
cover,
"cover"
);




const audio_url =

await uploadMedia(
audio,
"audio"
);








const body = {


title:

document.getElementById(
"title"
).value,


book_name:

document.getElementById(
"book_name"
).value,


author_name:

document.getElementById(
"author_name"
).value,


category_name:

document.getElementById(
"category_name"
).value,


tags:

document.getElementById(
"tags"
).value,


episode_number:

document.getElementById(
"episode_number"
).value,


summary:

document.getElementById(
"summary"
).value,


transcript:

document.getElementById(
"transcript"
).value,


duration_seconds:

document.getElementById(
"duration_seconds"
).value,


status:

document.getElementById(
"status"
).value,


cover_url,

audio_url


};





const response =

await fetch(

API_URL+"/podcasts",

{

method:"POST",


headers:{


"Content-Type":

"application/json",


"Authorization":

"Bearer "+getToken()


},



body:

JSON.stringify(body)


}

);







const data =

await response.json();





if(!data.success){


throw new Error(
data.message
);


}





alert(
"پادکست با موفقیت ثبت شد"
);



loadPodcasts();



}



catch(error){



alert(
"خطا: "+error.message
);



}



}








// ==========================
// EDIT PODCAST
// ==========================



async function editPodcast(id){



const area =

document.getElementById(
"contentArea"
);




area.innerHTML =

`

<div class="card">

<h3>
در حال دریافت اطلاعات...
</h3>

</div>

`;





try{


const response =

await fetch(

API_URL+

"/podcasts/"+id

);



const data =

await response.json();



if(!data.success){

throw new Error(
data.message
);

}



const p = data.podcast;





area.innerHTML =

`

<div class="card">


<h2>

✏️ ویرایش پادکست

</h2>



<div class="form-group">

<label>
عنوان
</label>


<input

id="edit_title"

value="${p.title || ""}"

>


</div>





<div class="form-group">

<label>
خلاصه
</label>



<textarea

id="edit_summary"

rows="6"

>${p.summary || ""}</textarea>


</div>





<div class="form-group">

<label>
وضعیت
</label>


<select id="edit_status">


<option value="active"

${p.status==="active"?"selected":""}

>

فعال

</option>



<option value="inactive"

${p.status==="inactive"?"selected":""}

>

غیرفعال

</option>



</select>


</div>





<button

class="btn-primary"

onclick="updatePodcast(${id})"

>

💾 ذخیره تغییرات

</button>



</div>

`;



}



catch(error){


area.innerHTML =

`

<div class="card">

<p>

${error.message}

</p>

</div>

`;

}



}

// ==========================
// UPDATE PODCAST
// ==========================


async function updatePodcast(id){


try{


const body = {


title:

document.getElementById(
"edit_title"
).value,


summary:

document.getElementById(
"edit_summary"
).value,


status:

document.getElementById(
"edit_status"
).value


};





const response =

await fetch(

API_URL+

"/podcasts/"+id,

{

method:"PUT",


headers:{


"Content-Type":

"application/json",


"Authorization":

"Bearer "+getToken()


},


body:

JSON.stringify(body)


}

);






const data =

await response.json();





if(!data.success){


throw new Error(
data.message
);


}



alert(
"ویرایش انجام شد"
);



loadPodcasts();



}



catch(error){


alert(
"خطا: "+error.message
);


}



}







// ==========================
// DELETE PODCAST
// ==========================


async function deletePodcast(id){



if(

!confirm(
"آیا مطمئن هستید؟"
)

){

return;

}




try{



const response =

await fetch(

API_URL+

"/podcasts/"+id,

{

method:"DELETE",


headers:{


"Authorization":

"Bearer "+getToken()


}

}

);





const data =

await response.json();





if(!data.success){


throw new Error(
data.message
);


}



alert(
"حذف شد"
);



loadPodcasts();



}



catch(error){


alert(
error.message
);


}



}
