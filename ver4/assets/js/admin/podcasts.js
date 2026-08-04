
/*
=================================================

NightCast Ver6
Admin Podcasts Manager

Professional Stable Version

Responsible for:
- Podcast List
- Create Podcast
- Edit Podcast
- Delete Podcast
- Upload Cover
- Upload Audio
- Search
- Filter
- Messages

=================================================
*/


"use strict";





class PodcastsManager {



constructor(){


    this.podcasts = [];

    this.currentPage = 1;

    this.limit = 20;

    this.editingId = null;


    this.init();


}








/*
=================================================
INIT
=================================================
*/


async init(){


try{


    if(
        window.Auth &&
        !Auth.requireAuth()
    ){

        return;

    }




    this.bindEvents();



    await this.load();



}

catch(error){


    console.error(
        "PODCAST INIT ERROR:",
        error
    );


    this.showError(
        "خطا در راه‌اندازی مدیریت پادکست‌ها"
    );


}



}









/*
=================================================
EVENTS
=================================================
*/


bindEvents(){



/*
---------------------------------
NEW PODCAST
---------------------------------
*/


document
.getElementById("btnNewPodcast")
?.addEventListener(
"click",
()=>{

    this.openCreate();

}

);








/*
---------------------------------
SAVE
---------------------------------
*/


document
.getElementById("btnSavePodcast")
?.addEventListener(
"click",
()=>{

    this.save();

}

);








/*
---------------------------------
CANCEL
---------------------------------
*/


document
.getElementById("btnCancel")
?.addEventListener(
"click",
()=>{

    this.closeModal();

}

);








/*
---------------------------------
CLOSE MODAL
---------------------------------
*/


document
.getElementById("closeModal")
?.addEventListener(
"click",
()=>{

    this.closeModal();

}

);








/*
---------------------------------
REFRESH
---------------------------------
*/


document
.getElementById("btnRefresh")
?.addEventListener(
"click",
()=>{

    this.load();

}

);








/*
---------------------------------
SEARCH
---------------------------------
*/


document
.getElementById("searchInput")
?.addEventListener(
"input",
()=>{

    this.applyFilters();

}

);








/*
---------------------------------
STATUS FILTER
---------------------------------
*/


document
.getElementById("statusFilter")
?.addEventListener(
"change",
()=>{

    this.applyFilters();

}

);








/*
---------------------------------
SORT
---------------------------------
*/


document
.getElementById("sortBy")
?.addEventListener(
"change",
()=>{

    this.applyFilters();

}

);








/*
---------------------------------
UPLOAD COVER
---------------------------------
*/


document
.getElementById("btnUploadCover")
?.addEventListener(
"click",
()=>{

    this.uploadCover();

}

);








/*
---------------------------------
UPLOAD AUDIO
---------------------------------
*/


document
.getElementById("btnUploadAudio")
?.addEventListener(
"click",
()=>{

    this.uploadAudio();

}

);



}









/*
=================================================
OPEN CREATE
=================================================
*/


openCreate(){



this.resetForm();




this.openModal();




this.showSuccess(
"فرم ثبت پادکست آماده است"
);



}








/*
=================================================
OPEN MODAL
=================================================
*/


openModal(){



const modal =

document.getElementById(
"podcastModal"
);




if(modal){


    modal.classList.add(
        "show"
    );


}



}









/*
=================================================
CLOSE MODAL
=================================================
*/


closeModal(){



const modal =

document.getElementById(
"podcastModal"
);




if(modal){


    modal.classList.remove(
        "show"
    );


}



}

/*
=================================================
LOAD PODCASTS
=================================================
*/


async load(){


try{


    if(window.Loader){

        Loader.show(
            "در حال دریافت پادکست‌ها..."
        );

    }





    const result = await API.get(
        "/dashboard/latest"
    );






    if(
        !result ||
        !result.success
    ){


        throw new Error(

            result?.message ||

            "دریافت پادکست‌ها ناموفق بود"

        );


    }






    this.podcasts =

    result.podcasts || [];






    this.applyFilters();





}

catch(error){


    console.error(
        "LOAD PODCAST ERROR:",
        error
    );



    this.showError(
        error.message
    );



}

finally{


    if(window.Loader){

        Loader.hide();

    }


}



}









/*
=================================================
FILTER
=================================================
*/


applyFilters(){



let list = [

    ...this.podcasts

];







const search =

document
.getElementById(
"searchInput"
)
?.value
.trim();







const status =

document
.getElementById(
"statusFilter"
)
?.value;








if(search){



list = list.filter(

item =>

item.title &&

item.title.includes(search)

);



}








if(status){



list = list.filter(

item =>

item.status === status

);



}









const sort =

document
.getElementById(
"sortBy"
)
?.value;







if(sort === "newest"){



list.sort(

(a,b)=>

new Date(b.created_at)

-

new Date(a.created_at)

);



}







if(sort === "oldest"){



list.sort(

(a,b)=>

new Date(a.created_at)

-

new Date(b.created_at)

);



}







if(sort === "title"){



list.sort(

(a,b)=>

(a.title || "")
.localeCompare(
(b.title || "")
)

);



}






this.render(list);



}









/*
=================================================
RENDER TABLE
=================================================
*/


render(list){



const tbody =

document.getElementById(
"podcastsTable"
);






if(!tbody){

    return;

}






tbody.innerHTML = "";








const count =

document.getElementById(
"podcastCount"
);






if(count){



count.innerHTML =

`${list.length} پادکست`;



}








if(list.length === 0){



tbody.innerHTML = `


<tr>

<td colspan="7"

class="empty-state">


پادکستی یافت نشد


</td>


</tr>


`;



return;


}









list.forEach(

(podcast,index)=>{



tbody.innerHTML += `


<tr>


<td>

${index + 1}

</td>





<td>

${

this.escapeHTML(

podcast.title || "-"

)

}

</td>






<td>

${

podcast.book_name || "-"

}

</td>






<td>

${

podcast.episode_number || 1

}

</td>






<td>


<span class="badge

${

podcast.status === "active"

?

"badge-success"

:

"badge-secondary"

}

">


${

podcast.status === "active"

?

"منتشر شده"

:

"پیش‌نویس"

}


</span>


</td>








<td>


${

this.formatDate(

podcast.created_at

)

}


</td>








<td>


<div class="action-group">



<button

class="action-btn action-edit"

onclick="podcastsManager.edit(${podcast.id})"

>

✏️

</button>






<button

class="action-btn action-delete"

onclick="podcastsManager.remove(${podcast.id})"

>

🗑️

</button>



</div>


</td>




</tr>


`;




}


);



}








/*
=================================================
DATE FORMAT
=================================================
*/


formatDate(date){



if(!date){

return "-";

}



if(
window.UI &&
UI.formatDate
){

return UI.formatDate(date);


}



return date;



    }



/*
=================================================
SAVE PODCAST
=================================================
*/


async save(){



try{



const id =

document
.getElementById(
"podcastId"
)
?.value;







const data = {



title:

document
.getElementById("title")
.value
.trim(),




book_name:

document
.getElementById("book_name")
.value
.trim(),




author_name:

document
.getElementById("author_name")
.value
.trim(),




category_name:

document
.getElementById("category_name")
.value
.trim(),




episode_number:

Number(

document
.getElementById("episode_number")
.value

|| 1

),




status:

document
.getElementById("status")
.value,






description:

document
.getElementById("description")
.value
.trim(),




summary:

document
.getElementById("summary")
.value
.trim(),




transcript:

document
.getElementById("transcript")
.value
.trim(),




duration_seconds:

Number(

document
.getElementById("duration_seconds")
.value

|| 0

),




tags:

document
.getElementById("tags")
.value
.trim(),




cover_url:

document
.getElementById("cover_url")
.value,




audio_url:

document
.getElementById("audio_url")
.value



};








if(!data.title){



this.showError(

"عنوان پادکست الزامی است"

);



return;


}








if(window.Loader){


Loader.show(

"در حال ذخیره پادکست..."

);


}








let result;








if(id){



result = await API.put(

"/podcasts/" + id,

data

);



}

else{



result = await API.post(

"/podcasts",

data

);



}








if(

!result ||

!result.success

){



throw new Error(

result?.message ||

"ثبت پادکست انجام نشد"

);



}








this.showSuccess(

id

?

"پادکست با موفقیت ویرایش شد"

:

"پادکست با موفقیت ثبت شد"

);








this.closeModal();








this.resetForm();








await this.load();







}

catch(error){



console.error(

"SAVE ERROR:",

error

);





this.showError(

error.message

);



}

finally{



if(window.Loader){

Loader.hide();

}



}



}









/*
=================================================
EDIT PODCAST
=================================================
*/


async edit(id){



try{



if(window.Loader){


Loader.show(

"در حال دریافت اطلاعات..."

);


}








const result = await API.get(

"/podcasts/" + id

);








if(

!result ||

!result.success

){



throw new Error(

"اطلاعات پادکست دریافت نشد"

);



}








const item =

result.data ||

result.podcast ||

result;








document
.getElementById("podcastId")
.value =

item.id || "";








document
.getElementById("title")
.value =

item.title || "";








document
.getElementById("book_name")
.value =

item.book_name || "";








document
.getElementById("author_name")
.value =

item.author_name || "";








document
.getElementById("category_name")
.value =

item.category_name || "";








document
.getElementById("episode_number")
.value =

item.episode_number || 1;








document
.getElementById("status")
.value =

item.status || "inactive";








document
.getElementById("description")
.value =

item.description || "";








document
.getElementById("summary")
.value =

item.summary || "";








document
.getElementById("transcript")
.value =

item.transcript || "";








document
.getElementById("duration_seconds")
.value =

item.duration_seconds || 0;








document
.getElementById("tags")
.value =

item.tags || "";








document
.getElementById("cover_url")
.value =

item.cover_url || "";








document
.getElementById("audio_url")
.value =

item.audio_url || "";









if(item.cover_url){



const img =

document.getElementById(

"coverPreview"

);



if(img){



img.src = item.cover_url;

img.style.display="block";



}



}








if(item.audio_url){



const audio =

document.getElementById(

"audioPreview"

);



if(audio){



audio.src = item.audio_url;

audio.style.display="block";



}



}








this.openModal();






}

catch(error){



this.showError(

error.message

);



}

finally{



if(window.Loader){

Loader.hide();

}


}



    }



/*
=================================================
DELETE PODCAST
=================================================
*/


async remove(id){



try{



const confirmDelete = confirm(

"آیا از حذف این پادکست مطمئن هستید؟"

);







if(!confirmDelete){

    return;

}








if(window.Loader){


Loader.show(

"در حال حذف پادکست..."

);


}








const result = await API.delete(

"/podcasts/" + id

);








if(

!result ||

!result.success

){



throw new Error(

result?.message ||

"حذف پادکست انجام نشد"

);



}








this.showSuccess(

"پادکست با موفقیت حذف شد"

);








await this.load();






}

catch(error){



console.error(

"DELETE ERROR:",

error

);



this.showError(

error.message

);



}

finally{



if(window.Loader){

Loader.hide();

}



}



}









/*
=================================================
UPLOAD COVER
=================================================
*/


async uploadCover(){



try{



const input =

document.getElementById(

"coverFile"

);








if(

!input ||

!input.files.length

){



this.showError(

"ابتدا فایل کاور را انتخاب کنید"

);



return;


}








const formData =

new FormData();







formData.append(

"file",

input.files[0]

);








if(window.Loader){



Loader.show(

"در حال آپلود کاور..."

);



}








const result = await API.upload(

"/upload/image",

formData

);








if(

!result ||

!result.success

){



throw new Error(

result?.message ||

"آپلود کاور ناموفق بود"

);



}








const url =

result.url ||

result.data?.url;








document
.getElementById(
"cover_url"
)
.value =

url;








const preview =

document.getElementById(

"coverPreview"

);








if(preview){



preview.src = url;

preview.style.display="block";



}








this.showSuccess(

"کاور با موفقیت آپلود شد"

);






}

catch(error){



console.error(

"COVER UPLOAD ERROR:",

error

);



this.showError(

error.message

);



}

finally{



if(window.Loader){

Loader.hide();

}



}



}









/*
=================================================
UPLOAD AUDIO
=================================================
*/


async uploadAudio(){



try{



const input =

document.getElementById(

"audioFile"

);








if(

!input ||

!input.files.length

){



this.showError(

"ابتدا فایل صوتی را انتخاب کنید"

);



return;


}








const formData =

new FormData();








formData.append(

"file",

input.files[0]

);








if(window.Loader){



Loader.show(

"در حال آپلود فایل صوتی..."

);



}








const result = await API.upload(

"/upload/audio",

formData

);








if(

!result ||

!result.success

){



throw new Error(

result?.message ||

"آپلود فایل صوتی ناموفق بود"

);



}








const url =

result.url ||

result.data?.url;








document
.getElementById(
"audio_url"
)
.value =

url;








const audio =

document.getElementById(

"audioPreview"

);








if(audio){



audio.src = url;

audio.style.display="block";



}








this.showSuccess(

"فایل صوتی با موفقیت آپلود شد"

);






}

catch(error){



console.error(

"AUDIO UPLOAD ERROR:",

error

);



this.showError(

error.message

);



}

finally{



if(window.Loader){

Loader.hide();

}



}



}








/*
=================================================
RESET FORM
=================================================
*/


resetForm(){



const form =

document.getElementById(

"podcastForm"

);








if(form){



form.reset();



}








const id =

document.getElementById(

"podcastId"

);








if(id){



id.value="";



}








const cover =

document.getElementById(

"coverPreview"

);








if(cover){



cover.src="";

cover.style.display="none";



}








const audio =

document.getElementById(

"audioPreview"

);








if(audio){



audio.src="";

audio.style.display="none";



}








const coverUrl =

document.getElementById(

"cover_url"

);








if(coverUrl){



coverUrl.value="";



}








const audioUrl =

document.getElementById(

"audio_url"

);








if(audioUrl){



audioUrl.value="";



}



}



/*
=================================================
HELPERS
=================================================
*/


escapeHTML(value){



return String(value || "")

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
=================================================
TOAST SUCCESS
=================================================
*/


showSuccess(message){



if(
window.Toast &&
Toast.success
){


Toast.success(message);


}

else{


alert(message);


}



}









/*
=================================================
TOAST ERROR
=================================================
*/


showError(message){



if(
window.Toast &&
Toast.error
){


Toast.error(message);


}

else{


alert(message);


}



}









/*
=================================================
GLOBAL INSTANCE
=================================================
*/


}





let podcastsManager = null;








document.addEventListener(

"DOMContentLoaded",

()=>{


    podcastsManager =

    new PodcastsManager();



});
