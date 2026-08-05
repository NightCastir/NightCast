/*
=================================================

NightCast Ver7
Admin Podcasts Manager

Professional Stable Version

Responsible for:
- Podcast Management
- Upload Cover
- Upload Audio
- CRUD
- Search
- Filter

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
SAVE PODCAST
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







    const result =

    await API.get(

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

                b.title || ""

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



    });


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






    formData.append(

        "type",

        "cover"

    );








    if(window.Loader){


        Loader.show(

            "در حال آپلود کاور..."

        );


    }








    const result =

    await API.upload(

        "/media/upload",

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

    result.url;








    const coverURL =

    document.getElementById(

        "cover_url"

    );







    if(coverURL){


        coverURL.value = url;


    }








    const preview =

    document.getElementById(

        "coverPreview"

    );







    if(preview){



        preview.src = url;


        preview.style.display =

        "block";



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







    const file =

    input.files[0];








    if(

        file.type !== "audio/mpeg"

        &&

        !file.name.toLowerCase()

        .endsWith(".mp3")

    ){



        this.showError(

            "فقط فایل MP3 مجاز است"

        );


        return;


    }









    const formData =

    new FormData();








    formData.append(

        "file",

        file

    );







    formData.append(

        "type",

        "audio"

    );








    if(window.Loader){


        Loader.show(

            "در حال آپلود فایل صوتی..."

        );


    }








    const result =

    await API.upload(

        "/media/upload",

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

    result.url;








    const audioURL =

    document.getElementById(

        "audio_url"

    );







    if(audioURL){


        audioURL.value = url;


    }








    const audio =

    document.getElementById(

        "audioPreview"

    );








    if(audio){



        audio.src = url;


        audio.style.display =

        "block";



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

            ||

            1

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

            ||

            0

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








    if(

        !data.audio_url

    ){



        this.showError(

            "فایل صوتی پادکست انتخاب نشده است"

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



        result =

        await API.put(

            "/podcasts/" + id,

            data

        );



    }

    else{



        result =

        await API.post(

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

            "ذخیره پادکست انجام نشد"

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

            "در حال دریافت اطلاعات پادکست..."

        );


    }








    const result =

    await API.get(

        "/podcasts/" + id

    );








    if(

        !result ||

        !result.success

    ){



        throw new Error(

            result?.message ||

            "اطلاعات پادکست دریافت نشد"

        );



    }








    const item =

    result.podcast ||

    result.data ||

    result;








    document

    .getElementById(

        "podcastId"

    )

    .value =

    item.id || "";








    document

    .getElementById(

        "title"

    )

    .value =

    item.title || "";








    document

    .getElementById(

        "book_name"

    )

    .value =

    item.book_name || "";








    document

    .getElementById(

        "author_name"

    )

    .value =

    item.author_name || "";








    document

    .getElementById(

        "category_name"

    )

    .value =

    item.category_name || "";








    document

    .getElementById(

        "episode_number"

    )

    .value =

    item.episode_number || 1;








    document

    .getElementById(

        "status"

    )

    .value =

    item.status || "inactive";








    document

    .getElementById(

        "description"

    )

    .value =

    item.description || "";








    document

    .getElementById(

        "summary"

    )

    .value =

    item.summary || "";








    document

    .getElementById(

        "transcript"

    )

    .value =

    item.transcript || "";








    document

    .getElementById(

        "duration_seconds"

    )

    .value =

    item.duration_seconds || 0;








    document

    .getElementById(

        "tags"

    )

    .value =

    item.tags || "";








    document

    .getElementById(

        "cover_url"

    )

    .value =

    item.cover_url || "";








    document

    .getElementById(

        "audio_url"

    )

    .value =

    item.audio_url || "";









    /*
    ==========================
    COVER PREVIEW
    ==========================
    */


    if(item.cover_url){



        const img =

        document

        .getElementById(

            "coverPreview"

        );





        if(img){



            img.src =

            item.cover_url;



            img.style.display =

            "block";



        }



    }









    /*
    ==========================
    AUDIO PREVIEW
    ==========================
    */


    if(item.audio_url){



        const audio =

        document

        .getElementById(

            "audioPreview"

        );





        if(audio){



            audio.src =

            item.audio_url;



            audio.style.display =

            "block";



        }



    }









    this.openModal();







}

catch(error){



    console.error(

        "EDIT ERROR:",

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
DELETE PODCAST
=================================================
*/


async remove(id){



try{



    const confirmDelete =

    confirm(

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








    const result =

    await API.delete(

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

        !input.files ||

        !input.files.length

    ){



        this.showError(

            "ابتدا فایل کاور را انتخاب کنید"

        );



        return;


    }









    const file =

    input.files[0];








    if(

        !file.type.startsWith("image/")

    ){



        this.showError(

            "فقط فایل تصویری مجاز است"

        );



        return;


    }









    const formData =

    new FormData();








    formData.append(

        "file",

        file

    );








    formData.append(

        "type",

        "cover"

    );









    if(window.Loader){



        Loader.show(

            "در حال آپلود کاور..."

        );


    }








    const result =

    await API.upload(

        "/media/upload",

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

    result.url;









    const coverInput =

    document.getElementById(

        "cover_url"

    );







    if(coverInput){



        coverInput.value = url;


    }









    const preview =

    document.getElementById(

        "coverPreview"

    );








    if(preview){



        preview.src = url;


        preview.style.display =

        "block";


    }









    this.showSuccess(

        "کاور با موفقیت آپلود شد"

    );







}

catch(error){



    console.error(

        "UPLOAD COVER ERROR:",

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

        !input.files ||

        !input.files.length

    ){



        this.showError(

            "ابتدا فایل صوتی را انتخاب کنید"

        );



        return;


    }









    const file =

    input.files[0];









    const isMP3 =


    file.type === "audio/mpeg"

    ||

    file.name

    .toLowerCase()

    .endsWith(".mp3");








    if(!isMP3){



        this.showError(

            "فقط فایل MP3 مجاز است"

        );



        return;


    }









    /*
    ==========================
    SIZE CHECK
    ==========================
    */


    if(

        file.size >

        10 * 1024 * 1024

    ){



        this.showError(

            "حجم فایل صوتی نباید بیشتر از 10 مگابایت باشد"

        );



        return;


    }









    const formData =

    new FormData();









    formData.append(

        "file",

        file

    );








    formData.append(

        "type",

        "audio"

    );









    if(window.Loader){



        Loader.show(

            "در حال آپلود فایل صوتی..."

        );


    }









    const result =

    await API.upload(

        "/media/upload",

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

    result.url;









    const audioInput =

    document.getElementById(

        "audio_url"

    );








    if(audioInput){



        audioInput.value = url;


    }









    const audio =

    document.getElementById(

        "audioPreview"

    );








    if(audio){



        audio.src = url;


        audio.style.display =

        "block";



        audio.load();


    }









    this.showSuccess(

        "فایل صوتی با موفقیت آپلود شد"

    );







}

catch(error){



    console.error(

        "UPLOAD AUDIO ERROR:",

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



        id.value = "";


    }








    const coverURL =

    document.getElementById(

        "cover_url"

    );







    if(coverURL){



        coverURL.value = "";


    }








    const audioURL =

    document.getElementById(

        "audio_url"

    );







    if(audioURL){



        audioURL.value = "";


    }








    const coverPreview =

    document.getElementById(

        "coverPreview"

    );







    if(coverPreview){



        coverPreview.src = "";


        coverPreview.style.display =

        "none";


    }








    const audioPreview =

    document.getElementById(

        "audioPreview"

    );







    if(audioPreview){



        audioPreview.pause();


        audioPreview.src = "";


        audioPreview.style.display =

        "none";


    }








}









/*
=================================================
ESCAPE HTML
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
SUCCESS MESSAGE
=================================================
*/


showSuccess(message){



    if(

        window.Toast &&

        Toast.success

    ){



        Toast.success(

            message

        );


    }

    else{



        alert(

            message

        );


    }



}









/*
=================================================
ERROR MESSAGE
=================================================
*/


showError(message){



    if(

        window.Toast &&

        Toast.error

    ){



        Toast.error(

            message

        );


    }

    else{



        alert(

            message

        );


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



    }

);

