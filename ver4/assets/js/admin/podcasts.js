/*
=================================================

NightCast Ver5
Admin Podcasts Manager

Professional Version

Responsible for:
- Podcast List
- Create Podcast
- Edit Podcast
- Delete Podcast
- Upload Audio
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

        this.total = 0;

        this.editingId = null;


        this.init();



    }









    /*
    ==========================
    INIT
    ==========================
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



            Toast.error(

                "خطا در راه‌اندازی مدیریت پادکست‌ها"

            );



        }



    }









    /*
    ==========================
    EVENTS
    ==========================
    */


    bindEvents(){



        /*
        New Podcast
        */


        document

        .getElementById(

            "btnNewPodcast"

        )

        ?.addEventListener(

            "click",

            ()=>{

                this.openCreate();

            }

        );








        /*
        Save
        */


        document

        .getElementById(

            "btnSavePodcast"

        )

        ?.addEventListener(

            "click",

            ()=>{

                this.save();

            }

        );








        /*
        Cancel Modal
        */


        document

        .getElementById(

            "btnCancel"

        )

        ?.addEventListener(

            "click",

            ()=>{

                this.closeModal();

            }

        );








        /*
        Close Modal X
        */


        document

        .getElementById(

            "closeModal"

        )

        ?.addEventListener(

            "click",

            ()=>{

                this.closeModal();

            }

        );








        /*
        Refresh
        */


        document

        .getElementById(

            "btnRefresh"

        )

        ?.addEventListener(

            "click",

            ()=>{

                this.load();

            }

        );








        /*
        Search

        */


        document

        .getElementById(

            "searchInput"

        )

        ?.addEventListener(

            "input",

            ()=>{


                this.render(

                    this.filterData()

                );


            }

        );








        /*
        Status Filter
        */


        document

        .getElementById(

            "statusFilter"

        )

        ?.addEventListener(

            "change",

            ()=>{


                this.render(

                    this.filterData()

                );


            }

        );








        /*
        Sort

        */


        document

        .getElementById(

            "sortBy"

        )

        ?.addEventListener(

            "change",

            ()=>{


                this.render(

                    this.filterData()

                );


            }

        );



    }
    /*
=================================================

NightCast Ver5
Admin Podcasts Manager

Part 2

Responsible for:
- Load Podcasts
- Render Table
- Search
- Filter
- Sort

=================================================
*/


/*
==========================
LOAD PODCASTS
==========================
*/


async load(){


    try{


        Loader.show(
            "در حال دریافت پادکست‌ها..."
        );



        const result = await API.get(
            "/dashboard/latest"
        );



        if(
            !result ||
            !result.success
        ){

            throw new Error(
                result.message ||
                "خطا در دریافت پادکست‌ها"
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


        Toast.error(
            error.message
        );


    }


    finally{


        Loader.hide();


    }


}







/*
==========================
FILTER PROCESS
==========================
*/


applyFilters(){



    let list = [

        ...this.podcasts

    ];





    const search =

    document.getElementById(

        "searchInput"

    )?.value.trim();







    const status =

    document.getElementById(

        "statusFilter"

    )?.value;








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

    document.getElementById(

        "sortBy"

    )?.value;








    if(sort==="newest"){



        list.sort(

            (a,b)=>

            new Date(b.created_at)

            -

            new Date(a.created_at)

        );


    }






    else if(sort==="oldest"){



        list.sort(

            (a,b)=>

            new Date(a.created_at)

            -

            new Date(b.created_at)

        );


    }






    else if(sort==="title"){



        list.sort(

            (a,b)=>

            a.title.localeCompare(

                b.title

            )

        );


    }








    this.render(list);



}









/*
==========================
RENDER TABLE
==========================
*/


render(list){



    const tbody =

    document.getElementById(

        "podcastsTable"

    );




    if(!tbody){

        return;

    }






    tbody.innerHTML="";







    const count =

    document.getElementById(

        "podcastCount"

    );



    if(count){


        count.innerHTML =

        `${list.length} پادکست`;


    }









    if(list.length===0){



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

            ${index+1}

            </td>




            <td>


            ${

            this.escapeHTML(

                podcast.title ||

                "-"

            )

            }


            </td>






            <td>


            ${

            podcast.book_name ||

            "-"

            }


            </td>






            <td>


            ${

            podcast.episode_number ||

            1

            }


            </td>






            <td>


            <span class="badge ${
            
            podcast.status==="active"

            ?

            "badge-success"

            :

            "badge-secondary"

            }">


            ${

            podcast.status==="active"

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
==========================
DATE FORMAT
==========================
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

document.getElementById(
"podcastId"
).value;





const data = {


title:

document.getElementById(
"title"
).value.trim(),



book_name:

document.getElementById(
"book_name"
).value.trim(),



author_name:

document.getElementById(
"author_name"
).value.trim(),



category_name:

document.getElementById(
"category_name"
).value.trim(),



episode_number:

Number(

document.getElementById(
"episode_number"
).value

|| 1

),



status:

document.getElementById(
"status"
).value,



description:

document.getElementById(
"description"
).value.trim(),



summary:

document.getElementById(
"summary"
).value.trim(),



transcript:

document.getElementById(
"transcript"
).value.trim(),



duration_seconds:

Number(

document.getElementById(
"duration_seconds"
).value

|| 0

),



tags:

document.getElementById(
"tags"
).value.trim(),



cover_url:

document.getElementById(
"cover_url"
).value,



audio_url:

document.getElementById(
"audio_url"
).value



};






if(!data.title){


Toast.error(

"عنوان پادکست الزامی است"

);


return;


}






Loader.show(

"در حال ذخیره پادکست..."

);






let result;






/*
==========================
EDIT
==========================
*/


if(id){



result =

await API.put(

"/podcasts/"+id,

data

);



}


/*
==========================
CREATE
==========================
*/

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








Toast.success(

"پادکست با موفقیت ذخیره شد"

);







this.closeModal();



await this.load();







}

catch(error){



console.error(

"SAVE PODCAST ERROR:",

error

);



Toast.error(

error.message

);



}

finally{


Loader.hide();


}



}









/*
=================================================
EDIT PODCAST
=================================================
*/


async edit(id){



try{



Loader.show(

"در حال دریافت اطلاعات..."

);







const result =

await API.get(

"/podcasts/"+id

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

result.podcast ||

result.data;








document.getElementById(

"podcastId"

).value =

item.id;






document.getElementById(

"title"

).value =

item.title || "";






document.getElementById(

"book_name"

).value =

item.book_name || "";






document.getElementById(

"author_name"

).value =

item.author_name || "";






document.getElementById(

"category_name"

).value =

item.category_name || "";






document.getElementById(

"episode_number"

).value =

item.episode_number || 1;






document.getElementById(

"status"

).value =

item.status || "inactive";






document.getElementById(

"description"

).value =

item.description || "";






document.getElementById(

"summary"

).value =

item.summary || "";






document.getElementById(

"transcript"

).value =

item.transcript || "";






document.getElementById(

"duration_seconds"

).value =

item.duration_seconds || 0;






document.getElementById(

"tags"

).value =

item.tags || "";






document.getElementById(

"cover_url"

).value =

item.cover_url || "";






document.getElementById(

"audio_url"

).value =

item.audio_url || "";








if(item.cover_url){


const img =

document.getElementById(

"coverPreview"

);


img.src = item.cover_url;


img.style.display="block";


}








if(item.audio_url){


const audio =

document.getElementById(

"audioPreview"

);


audio.src = item.audio_url;


audio.style.display="block";


}








this.openModal();






}

catch(error){



Toast.error(

error.message

);



}

finally{


Loader.hide();


}



}
    /*
=================================================
DELETE PODCAST
=================================================
*/


async remove(id){



try{



if(

!confirm(

"آیا از حذف این پادکست مطمئن هستید؟"

)

){

return;

}






Loader.show(

"در حال حذف پادکست..."

);







const result =

await API.delete(

"/podcasts/"+id

);








if(

!result ||

!result.success

){



throw new Error(

result?.message ||

"حذف پادکست ناموفق بود"

);



}








Toast.success(

"پادکست حذف شد"

);







await this.load();






}

catch(error){



console.error(

"DELETE PODCAST ERROR:",

error

);



Toast.error(

error.message

);



}

finally{


Loader.hide();


}



}









/*
=================================================
UPLOAD COVER
=================================================
*/


async uploadCover(){



const fileInput =

document.getElementById(

"coverFile"

);







if(

!fileInput.files.length

){


Toast.error(

"ابتدا فایل کاور را انتخاب کنید"

);


return;


}







try{



const formData =

new FormData();







formData.append(

"file",

fileInput.files[0]

);







Loader.show(

"در حال آپلود کاور..."

);







const result =

await API.upload(

"/upload/image",

formData

);








if(

!result ||

!result.success

){



throw new Error(

result?.message ||

"آپلود کاور انجام نشد"

);



}







const url =

result.url ||

result.data?.url;








document.getElementById(

"cover_url"

).value =

url;







const preview =

document.getElementById(

"coverPreview"

);



preview.src = url;


preview.style.display="block";







Toast.success(

"کاور آپلود شد"

);







}

catch(error){



Toast.error(

error.message

);



}

finally{


Loader.hide();


}



}









/*
=================================================
UPLOAD AUDIO
=================================================
*/


async uploadAudio(){



const fileInput =

document.getElementById(

"audioFile"

);







if(

!fileInput.files.length

){


Toast.error(

"ابتدا فایل صوتی را انتخاب کنید"

);


return;


}







try{



const formData =

new FormData();







formData.append(

"file",

fileInput.files[0]

);







Loader.show(

"در حال آپلود فایل صوتی..."

);







const result =

await API.upload(

"/upload/audio",

formData

);








if(

!result ||

!result.success

){



throw new Error(

result?.message ||

"آپلود فایل صوتی انجام نشد"

);



}








const url =

result.url ||

result.data?.url;








document.getElementById(

"audio_url"

).value =

url;








const audio =

document.getElementById(

"audioPreview"

);



audio.src=url;


audio.style.display="block";







Toast.success(

"فایل صوتی آپلود شد"

);







}

catch(error){



Toast.error(

error.message

);



}

finally{


Loader.hide();


}



}









/*
=================================================
MODAL
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









resetForm(){



const form =

document.getElementById(

"podcastForm"

);







if(form){


form.reset();


}







document.getElementById(

"podcastId"

).value="";







document.getElementById(

"coverPreview"

).style.display="none";







document.getElementById(

"audioPreview"

).style.display="none";







document.getElementById(

"cover_url"

).value="";







document.getElementById(

"audio_url"

).value="";



}









/*
=================================================
HELPERS
=================================================
*/


escapeHTML(value){



return String(value)



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









formatDate(date){



if(

!date

){

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









}



/*
=================================================
GLOBAL INSTANCE
=================================================
*/


let podcastsManager = null;







document.addEventListener(

"DOMContentLoaded",

()=>{



podcastsManager =

new PodcastsManager();






});
