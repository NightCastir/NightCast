/*
====================================================
NightCast CMS
Podcast Manager
Version 2.1
====================================================
*/

const API_URL =
"https://nightcast-api.tomasgermany2580.workers.dev/api/v1";


function getToken() {
    return localStorage.getItem("NightCastToken");
}


// ==========================
// REQUEST
// ==========================

async function apiRequest(url, method = "GET", body = null) {

    const options = {
        method,
        headers: {
            "Authorization": "Bearer " + getToken()
        }
    };

    if (body) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    const response = await fetch(API_URL + url, options);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.message || "Unknown Error");
    }

    return data;
}



// ==========================
// Upload Media
// ==========================

async function uploadMedia(file, type) {

    if (!file) {
        return null;
    }

    const form = new FormData();

    form.append("file", file);
    form.append("type", type);

    const response = await fetch(
        API_URL + "/media/upload",
        {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + getToken()
            },
            body: form
        }
    );

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.message);
    }

    return data.url;
      }


// ==========================
// LOAD PODCASTS
// ==========================

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


    try {


        const data =
        await apiRequest("/podcasts");


        let rows = "";


        data.podcasts.forEach(p => {


            rows += `

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
                    p.status === "active"
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

                    ✏️ ویرایش

                    </button>


                    <button

                    class="btn-danger"

                    onclick="deletePodcast(${p.id})"

                    >

                    🗑 حذف

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

                class="btn-primary"

                onclick="createPodcast()"

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


        area.innerHTML = `


        <div class="card">


            <h3>
            خطا
            </h3>


            <p>
            ${error.message}
            </p>


        </div>


        `;


        console.error(
            "LOAD PODCAST ERROR:",
            error
        );


    }

}



// ==========================
// CREATE PODCAST FORM
// ==========================

function createPodcast(){


const area =
document.getElementById("contentArea");



area.innerHTML = `


<div class="card">


<h2>
➕ ثبت پادکست جدید
</h2>



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
// SAVE PODCAST
// ==========================

async function savePodcast(){


try{


    const coverInput =
    document.getElementById("cover_file");


    const audioInput =
    document.getElementById("audio_file");



    const cover =
    coverInput && coverInput.files.length
    ?
    coverInput.files[0]
    :
    null;



    const audio =
    audioInput && audioInput.files.length
    ?
    audioInput.files[0]
    :
    null;




    let cover_url = null;
    let audio_url = null;



    if(cover){

        cover_url =
        await uploadMedia(
            cover,
            "cover"
        );

    }



    if(audio){

        audio_url =
        await uploadMedia(
            audio,
            "audio"
        );

    }





    const body = {


        title:
        document.getElementById("title").value.trim(),



        book_name:
        document.getElementById("book_name").value.trim(),



        author_name:
        document.getElementById("author_name").value.trim(),



        category_name:
        document.getElementById("category_name").value.trim(),



        tags:
        document.getElementById("tags").value.trim(),



        episode_number:
        Number(
            document.getElementById("episode_number").value
        ),



        summary:
        document.getElementById("summary").value,



        transcript:
        document.getElementById("transcript").value,



        duration_seconds:
        Number(
            document.getElementById("duration_seconds").value
        ),



        status:
        document.getElementById("status").value,



        cover_url,

        audio_url

    };





    if(!body.title){

        throw new Error(
            "عنوان پادکست الزامی است"
        );

    }





    const data =
    await apiRequest(
        "/podcasts",
        "POST",
        body
    );





    alert(
        "✅ پادکست با موفقیت ثبت شد"
    );



    loadPodcasts();



}



catch(error){


    console.error(
        "SAVE PODCAST ERROR:",
        error
    );


    alert(
        "خطا در ثبت پادکست:\n"
        +
        error.message
    );


}


}




// ==========================
// EDIT PODCAST
// ==========================

async function editPodcast(id){


const area =
document.getElementById("contentArea");



area.innerHTML = `

<div class="card">

<h3>
در حال دریافت اطلاعات...
</h3>

</div>

`;



try{


const data =
await apiRequest(
"/podcasts/" + id
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

rows="6"

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


area.innerHTML = `

<div class="card">

<h3>
خطا
</h3>

<p>
${error.message}
</p>

</div>

`;



console.error(
"EDIT PODCAST ERROR:",
error
);


}


}






// ==========================
// UPDATE PODCAST
// ==========================

async function updatePodcast(id){


try{


const body = {


title:
document.getElementById("edit_title").value,


book_name:
document.getElementById("edit_book_name").value,


author_name:
document.getElementById("edit_author_name").value,


category_name:
document.getElementById("edit_category_name").value,


tags:
document.getElementById("edit_tags").value,


episode_number:
Number(
document.getElementById("edit_episode_number").value
),


summary:
document.getElementById("edit_summary").value,


transcript:
document.getElementById("edit_transcript").value,


status:
document.getElementById("edit_status").value


};





await apiRequest(

"/podcasts/" + id,

"PUT",

body

);





alert(
"✅ تغییرات ذخیره شد"
);



loadPodcasts();



}


catch(error){


console.error(
"UPDATE PODCAST ERROR:",
error
);


alert(
"خطا در ویرایش:\n"
+
error.message
);


}


}





// ==========================
// DELETE PODCAST
// ==========================

async function deletePodcast(id){


const confirmDelete =
confirm(
"آیا از حذف این پادکست مطمئن هستید؟"
);



if(!confirmDelete){

    return;

}



try{


await apiRequest(

"/podcasts/" + id,

"DELETE"

);




alert(
"✅ پادکست حذف شد"
);



loadPodcasts();



}


catch(error){


console.error(
"DELETE PODCAST ERROR:",
error
);



alert(

"خطا در حذف:\n"
+
error.message

);


}


}

