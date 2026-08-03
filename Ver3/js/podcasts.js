/*
====================================================
 NightCast CMS
 Podcast Manager
 Professional Version 3.0
====================================================
*/


const PodcastManager = {


    API_URL:
    "https://nightcast-api.tomasgermany2580.workers.dev/api/v1",



    token(){


        return localStorage.getItem(
            "NightCastToken"
        );


    },



    // ==========================
    // UI HELPERS
    // ==========================


    loading(status,message=""){


        if(
            typeof App !== "undefined"
            &&
            App.loading
        ){

            App.loading(status);

        }


        if(message){

            console.log(
                message
            );

        }

    },




    toast(message,type="success"){


        if(
            typeof App !== "undefined"
            &&
            App.toast
        ){

            App.toast(
                message,
                type
            );

        }
        else{

            console.log(
                message
            );

        }

    },





    // ==========================
    // API REQUEST
    // ==========================


    async request(
        endpoint,
        method="GET",
        body=null
    ){


        const options={


            method,


            headers:{


                "Authorization":
                "Bearer "+
                this.token()


            }


        };




        if(body){


            options.headers[
                "Content-Type"
            ] =
            "application/json";



            options.body =
            JSON.stringify(body);


        }






        let response;



        try{


            response =
            await fetch(

                this.API_URL+
                endpoint,

                options

            );


        }

        catch(error){


            throw new Error(
                "ارتباط با سرور برقرار نشد"
            );


        }






        const data =
        await response.json();





        if(!data.success){


            throw new Error(
                data.message ||
                "خطای ناشناخته"
            );


        }





        return data;


    },






    // ==========================
    // MEDIA UPLOAD
    // مشابه test-upload.html
    // ==========================


    async uploadMedia(
        file,
        type
    ){



        if(!file){


            throw new Error(

                type==="audio"
                ?
                "فایل صوتی انتخاب نشده است"
                :
                "تصویر کاور انتخاب نشده است"

            );


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






        let response;



        try{


            response =
            await fetch(

                this.API_URL+
                "/media/upload",

                {

                    method:"POST",


                    headers:{


                        "Authorization":
                        "Bearer "+
                        this.token()


                    },


                    body:form

                }

            );


        }

        catch(error){


            throw new Error(
                "خطا در ارتباط هنگام آپلود فایل"
            );


        }






        const data =
        await response.json();






        if(!data.success){


            throw new Error(

                "خطا در آپلود "
                +
                type
                +
                ": "
                +
                data.message

            );


        }





        return data.url;


    }



};

// ====================================================
// LOAD PODCASTS
// ====================================================


PodcastManager.loadPodcasts = async function(){


    const area =
    document.getElementById(
        "contentArea"
    );



    try{


        this.loading(
            true,
            "در حال دریافت پادکست‌ها..."
        );



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





        const data =
        await this.request(
            "/podcasts"
        );





        let rows = "";




        data.podcasts.forEach(
            podcast => {


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
            ${podcast.episode_number || "-"}
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

            class="btn btn-primary btn-sm"

            onclick="
            PodcastManager.edit(${podcast.id})
            "

            >

            ✏️

            </button>





            <button

            class="btn btn-danger btn-sm"

            onclick="
            PodcastManager.delete(${podcast.id})
            "

            >

            🗑

            </button>


            </td>



            </tr>


            `;


        });







        area.innerHTML = `



        <div class="card">


        <div class="page-header">


        <h2>
        🎙 مدیریت پادکست‌ها
        </h2>




        <button

        class="btn btn-primary"

        onclick="
        PodcastManager.openCreate()
        "

        >

        ➕ پادکست جدید

        </button>



        </div>





        <div class="table-wrapper">


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


        </div>



        `;



    }



    catch(error){



        console.error(
            "LOAD PODCAST ERROR:",
            error
        );



        this.toast(
            error.message,
            "error"
        );



    }



    finally{


        this.loading(false);


    }


};







// ====================================================
// CREATE FORM
// ====================================================


PodcastManager.openCreate = function(){



const area =
document.getElementById(
    "contentArea"
);



area.innerHTML = `



<div class="card">


<h2>
➕ ثبت پادکست جدید
</h2>





<div class="form-grid">



<div class="form-group">

<label>
عنوان *
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
دسته‌بندی
</label>

<input id="category_name">

</div>



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






<div class="form-group">

<label>
خلاصه
</label>


<textarea

id="summary"

rows="5"

></textarea>


</div>







<div class="form-group">

<label>
متن کامل
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
وضعیت
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
تصویر کاور *
</label>


<input

id="cover_file"

type="file"

accept="image/*"

>


</div>






<div class="form-group">


<label>
فایل صوتی *
</label>


<input

id="audio_file"

type="file"

accept="audio/*"

>


</div>








<button

class="btn btn-primary"

onclick="
PodcastManager.save()
"

>

💾 ذخیره پادکست

</button>





</div>



`;



};



// ====================================================
// SAVE PODCAST
// ====================================================


PodcastManager.save = async function(){



try{


    // ==========================
    // VALIDATION
    // ==========================


    const title =
    document.getElementById("title").value.trim();



    const coverFile =
    document.getElementById("cover_file").files[0];



    const audioFile =
    document.getElementById("audio_file").files[0];





    if(!title){


        throw new Error(
            "عنوان پادکست الزامی است"
        );


    }




    if(!coverFile){


        throw new Error(
            "لطفاً تصویر کاور را انتخاب کنید"
        );


    }




    if(!audioFile){


        throw new Error(
            "لطفاً فایل صوتی را انتخاب کنید"
        );


    }





    // ==========================
    // FILE CHECK
    // ==========================


    if(
        coverFile.size >
        5 * 1024 * 1024
    ){


        throw new Error(
            "حجم کاور بیشتر از ۵ مگابایت است"
        );


    }





    if(
        audioFile.size >
        10 * 1024 * 1024
    ){


        throw new Error(
            "حجم فایل صوتی بیشتر از ۱۰ مگابایت است"
        );


    }






    this.loading(
        true,
        "شروع ثبت پادکست..."
    );





    // ==========================
    // UPLOAD COVER
    // ==========================


    this.toast(
        "در حال آپلود کاور...",
        "info"
    );



    const cover_url =
    await this.uploadMedia(
        coverFile,
        "cover"
    );







    // ==========================
    // UPLOAD AUDIO
    // ==========================


    this.toast(
        "در حال آپلود فایل صوتی...",
        "info"
    );



    const audio_url =
    await this.uploadMedia(
        audioFile,
        "audio"
    );









    // ==========================
    // BUILD DATA
    // ==========================



    const body = {



        title,


        book_name:
        document
        .getElementById("book_name")
        .value.trim(),



        author_name:
        document
        .getElementById("author_name")
        .value.trim(),




        category_name:
        document
        .getElementById("category_name")
        .value.trim(),




        tags:
        document
        .getElementById("tags")
        .value.trim(),





        episode_number:
        Number(
            document
            .getElementById("episode_number")
            .value
        ),




        summary:
        document
        .getElementById("summary")
        .value,




        transcript:
        document
        .getElementById("transcript")
        .value,





        duration_seconds:
        Number(
            document
            .getElementById("duration_seconds")
            .value
        ),





        status:
        document
        .getElementById("status")
        .value,





        cover_url,


        audio_url



    };








    // ==========================
    // SAVE DATABASE
    // ==========================


    this.toast(
        "در حال ذخیره اطلاعات...",
        "info"
    );





    await this.request(

        "/podcasts",

        "POST",

        body

    );







    this.toast(
        "پادکست با موفقیت ثبت شد",
        "success"
    );





    this.loadPodcasts();






}



catch(error){



    console.error(
        "SAVE PODCAST ERROR:",
        error
    );



    this.toast(
        error.message,
        "error"
    );



}



finally{


    this.loading(false);


}



};





// ====================================================
// EDIT PODCAST
// ====================================================


PodcastManager.edit = async function(id){



const area =
document.getElementById(
    "contentArea"
);




try{



    this.loading(
        true,
        "در حال دریافت اطلاعات پادکست..."
    );




    const data =
    await this.request(
        "/podcasts/"+id
    );




    const p =
    data.podcast;






    area.innerHTML = `



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
    نام کتاب
    </label>


    <input

    id="edit_book_name"

    value="${p.book_name || ""}"

    >

    </div>







    <div class="form-group">

    <label>
    نویسنده
    </label>


    <input

    id="edit_author_name"

    value="${p.author_name || ""}"

    >

    </div>







    <div class="form-group">

    <label>
    دسته بندی
    </label>


    <input

    id="edit_category_name"

    value="${p.category_name || ""}"

    >

    </div>







    <div class="form-group">

    <label>
    تگ‌ها
    </label>


    <input

    id="edit_tags"

    value="${p.tags || ""}"

    >

    </div>








    <div class="form-group">

    <label>
    شماره قسمت
    </label>


    <input

    id="edit_episode_number"

    type="number"

    value="${p.episode_number || 1}"

    >

    </div>








    <div class="form-group">

    <label>
    خلاصه
    </label>


    <textarea

    id="edit_summary"

    rows="5"

    >${p.summary || ""}</textarea>


    </div>








    <div class="form-group">

    <label>
    متن کامل
    </label>


    <textarea

    id="edit_transcript"

    rows="10"

    >${p.transcript || ""}</textarea>


    </div>








    <div class="form-group">

    <label>
    وضعیت
    </label>



    <select id="edit_status">


    <option value="active"

    ${p.status==="active" ? "selected" : ""}

    >

    فعال

    </option>





    <option value="inactive"

    ${p.status==="inactive" ? "selected" : ""}

    >

    غیرفعال

    </option>


    </select>



    </div>









    <div class="form-group">

    <label>
    تغییر کاور (اختیاری)
    </label>


    <input

    id="edit_cover_file"

    type="file"

    accept="image/*"

    >

    </div>








    <div class="form-group">

    <label>
    تغییر فایل صوتی (اختیاری)
    </label>


    <input

    id="edit_audio_file"

    type="file"

    accept="audio/*"

    >

    </div>









    <button

    class="btn btn-primary"

    onclick="
    PodcastManager.update(${id})
    "

    >

    💾 ذخیره تغییرات

    </button>






    </div>



    `;



}




catch(error){



    console.error(
        "EDIT ERROR:",
        error
    );



    this.toast(
        error.message,
        "error"
    );


}



finally{


    this.loading(false);


}




};









// ====================================================
// UPDATE PODCAST
// ====================================================


PodcastManager.update = async function(id){



try{



    this.loading(
        true,
        "در حال بروزرسانی..."
    );







    let cover_url = null;

    let audio_url = null;






    const newCover =
    document
    .getElementById("edit_cover_file")
    .files[0];






    const newAudio =
    document
    .getElementById("edit_audio_file")
    .files[0];






    if(newCover){


        this.toast(
            "در حال آپلود کاور جدید...",
            "info"
        );


        cover_url =
        await this.uploadMedia(
            newCover,
            "cover"
        );


    }








    if(newAudio){


        this.toast(
            "در حال آپلود فایل صوتی جدید...",
            "info"
        );


        audio_url =
        await this.uploadMedia(
            newAudio,
            "audio"
        );


    }









    const body = {



        title:
        document
        .getElementById("edit_title")
        .value,




        book_name:
        document
        .getElementById("edit_book_name")
        .value,




        author_name:
        document
        .getElementById("edit_author_name")
        .value,




        category_name:
        document
        .getElementById("edit_category_name")
        .value,




        tags:
        document
        .getElementById("edit_tags")
        .value,




        episode_number:
        Number(
            document
            .getElementById("edit_episode_number")
            .value
        ),





        summary:
        document
        .getElementById("edit_summary")
        .value,





        transcript:
        document
        .getElementById("edit_transcript")
        .value,





        status:
        document
        .getElementById("edit_status")
        .value



    };







    if(cover_url){

        body.cover_url =
        cover_url;

    }






    if(audio_url){

        body.audio_url =
        audio_url;

    }








    await this.request(

        "/podcasts/"+id,

        "PUT",

        body

    );








    this.toast(
        "تغییرات با موفقیت ذخیره شد",
        "success"
    );





    this.loadPodcasts();






}



catch(error){



    console.error(
        "UPDATE ERROR:",
        error
    );



    this.toast(
        error.message,
        "error"
    );



}



finally{


    this.loading(false);


}



};




// ====================================================
// DELETE PODCAST
// ====================================================


PodcastManager.delete = async function(id){



try{



    const confirmDelete =
    confirm(
        "آیا از حذف این پادکست مطمئن هستید؟"
    );




    if(!confirmDelete){

        return;

    }






    this.loading(
        true,
        "در حال حذف پادکست..."
    );






    await this.request(

        "/podcasts/"+id,

        "DELETE"

    );






    this.toast(
        "پادکست حذف شد",
        "success"
    );






    this.loadPodcasts();





}



catch(error){



    console.error(
        "DELETE ERROR:",
        error
    );



    this.toast(
        error.message,
        "error"
    );



}



finally{


    this.loading(false);


}



};







// ====================================================
// GLOBAL CONNECTION
// برای سازگاری با dashboard.html
// ====================================================


window.loadPodcasts = function(){


    PodcastManager.loadPodcasts();


};





window.createPodcast = function(){


    PodcastManager.openCreate();


};

