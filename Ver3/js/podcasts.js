/*
NightCast CMS
Podcast Manager
Version 2.0
*/


const PODCAST_API =

"https://nightcast-api.tomasgermany2580.workers.dev/api/v1";




async function loadPodcasts(){


const area =

document.getElementById("contentArea");



area.innerHTML = `

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



const response = await fetch(

PODCAST_API + "/podcasts",

{

method:"GET",

headers:{

"Authorization":

"Bearer "+token

}

}

);



const data = await response.json();




if(!data.success){


area.innerHTML = `

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



data.podcasts.forEach(podcast=>{


rows += `

<tr>

<td>
${podcast.id}
</td>


<td>
${podcast.title || "-"}
</td>


<td>
${podcast.book_name || "-"}
</td>


<td>
${podcast.episode_number || 1}
</td>


<td>

${
podcast.status==="active"

?

"فعال"

:

"غیرفعال"

}

</td>


<td>

<button

class="btn-primary"

onclick="editPodcast(${podcast.id})"

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


<div class="page-header">


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
شناسه
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
خطای ارتباط با سرور
</h3>


<p>
${error.message}
</p>


</div>


`;

}


}






// =============================
// CREATE FORM
// =============================


function createPodcast(){


const area =

document.getElementById("contentArea");



area.innerHTML =

`

<div class="card">


<h2>
➕ ثبت پادکست جدید
</h2>


<br>



<div class="form-grid">



<div class="form-group">

<label>
عنوان پادکست
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
نام نویسنده
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

<br>


<div class="form-group">

<label>
خلاصه پادکست
</label>


<textarea

id="summary"

rows="5"

></textarea>


</div>




<div class="form-group">

<label>
متن پیاده‌سازی شده
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





<br>



<div class="form-group">


<label>

کاور پادکست

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





// =============================
// EDIT FORM
// =============================


async function editPodcast(id){


const area =

document.getElementById("contentArea");



area.innerHTML =

`

<div class="card">

<h2>

ویرایش پادکست شماره ${id}

</h2>


<p>

در حال دریافت اطلاعات...

</p>


</div>

`;




try{


const response = await fetch(

PODCAST_API +

"/podcasts/" +

id

);



const data =

await response.json();




if(!data.success){


throw new Error(data.message);


}



const p = data.podcast;



area.innerHTML =

`

<div class="card">


<h2>

✏️ ویرایش:

${p.title}

</h2>


<br>


<div class="form-group">

<label>
عنوان
</label>

<input

id="edit_title"

value="${p.title || ''}"

>

</div>



<div class="form-group">

<label>
خلاصه
</label>


<textarea

id="edit_summary"

rows="5"

>${p.summary || ''}</textarea>


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




<br>



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







// =============================
// SAVE NEW PODCAST
// =============================


async function savePodcast(){



const token =

localStorage.getItem("NightCastToken");



const body = {


title:

document.getElementById("title").value,


book_name:

document.getElementById("book_name").value,


author_name:

document.getElementById("author_name").value,


category_name:

document.getElementById("category_name").value,


tags:

document.getElementById("tags").value,


episode_number:

document.getElementById("episode_number").value,


summary:

document.getElementById("summary").value,


transcript:

document.getElementById("transcript").value,


duration_seconds:

document.getElementById("duration_seconds").value,


status:

document.getElementById("status").value


};




const response = await fetch(

PODCAST_API+"/podcasts",

{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":

"Bearer "+token

},

body:

JSON.stringify(body)

}

);




const data = await response.json();



if(data.success){


alert("پادکست ثبت شد");


loadPodcasts();



}

else{


alert(data.message);


}



}







// =============================
// UPDATE PODCAST
// =============================


async function updatePodcast(id){


const token =

localStorage.getItem("NightCastToken");



const body = {


title:

document.getElementById("edit_title").value,


summary:

document.getElementById("edit_summary").value,


status:

document.getElementById("edit_status").value


};





const response = await fetch(

PODCAST_API+"/podcasts/"+id,

{

method:"PUT",

headers:{

"Content-Type":"application/json",

"Authorization":

"Bearer "+token

},

body:

JSON.stringify(body)

}

);




const data = await response.json();



if(data.success){


alert("ویرایش انجام شد");


loadPodcasts();


}

else{


alert(data.message);


}



}
