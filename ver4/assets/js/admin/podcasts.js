
/*
========================================================

NightCast Ver4
Podcast Manager

Author : NightCast
Architecture : Modular
Version : 4.0

========================================================
*/

"use strict";

class PodcastManager {

    constructor() {

        this.podcasts = [];

        this.filtered = [];

        this.currentPodcast = null;

        this.coverUrl = "";

        this.audioUrl = "";

        this.coverUploading = false;

        this.audioUploading = false;

        this.init();

    }






    /*
    ========================================
    START
    ========================================
    */

    async init() {

        this.cacheDOM();

        this.bindEvents();

        await this.loadCurrentUser();

        await this.loadPodcasts();

    }






    /*
    ========================================
    CACHE DOM
    ========================================
    */

    cacheDOM() {

        this.table =
        document.getElementById("podcastsTable");

        this.counter =
        document.getElementById("podcastCount");

        this.modal =
        document.getElementById("podcastModal");

        this.form =
        document.getElementById("podcastForm");

        this.search =
        document.getElementById("searchInput");

        this.status =
        document.getElementById("statusFilter");

        this.sort =
        document.getElementById("sortBy");

        this.btnSave =
        document.getElementById("btnSavePodcast");

        this.btnNew =
        document.getElementById("btnNewPodcast");

        this.btnRefresh =
        document.getElementById("btnRefresh");

        this.btnCancel =
        document.getElementById("btnCancel");

        this.btnClose =
        document.getElementById("closeModal");

        this.btnUploadCover =
        document.getElementById("btnUploadCover");

        this.btnUploadAudio =
        document.getElementById("btnUploadAudio");

        this.coverFile =
        document.getElementById("coverFile");

        this.audioFile =
        document.getElementById("audioFile");

        this.coverPreview =
        document.getElementById("coverPreview");

        this.audioPreview =
        document.getElementById("audioPreview");

    }






    /*
    ========================================
    EVENTS
    ========================================
    */

    bindEvents() {

        this.btnNew?.addEventListener(

            "click",

            () => this.openCreateModal()

        );



        this.btnRefresh?.addEventListener(

            "click",

            () => this.loadPodcasts()

        );



        this.btnSave?.addEventListener(

            "click",

            () => this.savePodcast()

        );



        this.btnCancel?.addEventListener(

            "click",

            () => this.closeModal()

        );



        this.btnClose?.addEventListener(

            "click",

            () => this.closeModal()

        );



        this.search?.addEventListener(

            "input",

            () => this.filter()

        );



        this.status?.addEventListener(

            "change",

            () => this.filter()

        );



        this.sort?.addEventListener(

            "change",

            () => this.filter()

        );



        this.btnUploadCover?.addEventListener(

            "click",

            () => this.uploadCover()

        );



        this.btnUploadAudio?.addEventListener(

            "click",

            () => this.uploadAudio()

        );



        this.table?.addEventListener(

            "click",

            (e)=>this.tableEvents(e)

        );

    }

}





    /*
    ========================================
    LOAD CURRENT USER
    ========================================
    */

    async loadCurrentUser(){

        try{

            const result =

            await API.get(

                "/auth/me"

            );


            if(

                result.success &&

                result.user

            ){

                const username =

                document.getElementById(

                    "username"

                );


                if(username){

                    username.innerText =

                    result.user.full_name ||

                    result.user.username;

                }

            }


        }

        catch(error){

            console.error(

                "User Load Error:",

                error

            );

        }

    }








    /*
    ========================================
    LOAD PODCASTS
    ========================================
    */

    async loadPodcasts(){

        try{


            Loader.show(

                "در حال دریافت پادکست‌ها..."

            );



            const result =

            await API.get(

                "/podcasts"

            );



            if(!result.success){


                throw new Error(

                    result.message ||

                    "خطا در دریافت اطلاعات"

                );


            }




            this.podcasts =

            result.podcasts || [];



            this.filtered =

            [...this.podcasts];



            this.renderTable();


            this.updateCounter();



        }


        catch(error){


            console.error(

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
    ========================================
    RENDER TABLE
    ========================================
    */

    renderTable(){


        if(!this.table)

        return;





        if(

            this.filtered.length === 0

        ){


            this.table.innerHTML =

            `

            <tr>

            <td colspan="7">

            پادکستی موجود نیست

            </td>

            </tr>

            `;


            return;

        }








        this.table.innerHTML =


        this.filtered.map(

        (item,index)=>{


            return `

            <tr>


                <td>

                    ${index + 1}

                </td>



                <td>

                    ${

                    item.title || "-"

                    }

                </td>



                <td>

                    ${

                    item.book_name || "-"

                    }

                </td>



                <td>

                    ${

                    item.episode_number || 1

                    }

                </td>




                <td>

                    <span class="badge 

                    ${
                    
                    item.status==="active"

                    ?

                    "badge-success"

                    :

                    "badge-warning"

                    }

                    ">

                    ${

                    item.status==="active"

                    ?

                    "منتشر شده"

                    :

                    "پیش نویس"

                    }


                    </span>


                </td>



                <td>

                    ${

                    item.created_at || "-"

                    }

                </td>




                <td>


                <button

                class="btn btn-sm"

                data-action="edit"

                data-id="${item.id}"

                >

                ویرایش

                </button>





                <button

                class="btn btn-danger btn-sm"

                data-action="delete"

                data-id="${item.id}"

                >

                حذف

                </button>



                </td>



            </tr>

            `;


        }

        ).join("");



    }








    /*
    ========================================
    COUNTER
    ========================================
    */

    updateCounter(){


        if(this.counter){


            this.counter.innerText =


            `${this.filtered.length} پادکست`;


        }


    }




    /*
    ========================================
    FILTER / SEARCH / SORT
    ========================================
    */

    filter(){


        const keyword =

        this.search?.value

        .trim()

        .toLowerCase()

        || "";



        const status =

        this.status?.value

        || "";





        this.filtered =


        this.podcasts.filter(

        item => {


            const title =

            (

            item.title || ""

            )

            .toLowerCase();



            const matchTitle =

            title.includes(

                keyword

            );



            const matchStatus =

            status === ""

            ||

            item.status === status;



            return (

                matchTitle

                &&

                matchStatus

            );


        }

        );







        const sortType =

        this.sort?.value;






        if(sortType === "newest"){


            this.filtered.sort(

                (a,b)=>

                b.id-a.id

            );


        }






        if(sortType === "oldest"){


            this.filtered.sort(

                (a,b)=>

                a.id-b.id

            );


        }







        if(sortType === "title"){


            this.filtered.sort(

            (a,b)=>

            (

            a.title || ""

            )

            .localeCompare(

            b.title || ""

            )


            );


        }






        this.renderTable();

        this.updateCounter();


    }










    /*
    ========================================
    TABLE EVENTS
    ========================================
    */

    tableEvents(event){



        const button =

        event.target.closest(

            "button[data-action]"

        );




        if(!button)

        return;





        const action =

        button.dataset.action;



        const id =

        button.dataset.id;





        if(

            action === "edit"

        ){


            this.editPodcast(id);


        }





        if(

            action === "delete"

        ){


            this.deletePodcast(id);


        }


    }









    /*
    ========================================
    OPEN CREATE MODAL
    ========================================
    */

    openCreateModal(){


        this.currentPodcast = null;


        this.resetForm();




        this.modal.classList.add(

            "show"

        );


    }









    /*
    ========================================
    CLOSE MODAL
    ========================================
    */

    closeModal(){



        this.modal?.classList.remove(

            "show"

        );



    }









    /*
    ========================================
    RESET FORM
    ========================================
    */

    resetForm(){



        this.form?.reset();




        document.getElementById(

            "podcastId"

        ).value = "";



        document.getElementById(

            "cover_url"

        ).value = "";



        document.getElementById(

            "audio_url"

        ).value = "";



        this.coverUrl = "";

        this.audioUrl = "";





        if(this.coverPreview){


            this.coverPreview.style.display =

            "none";


        }





        if(this.audioPreview){


            this.audioPreview.style.display =

            "none";


        }



    }




    /*
    ========================================
    EDIT PODCAST
    ========================================
    */

    async editPodcast(id){


        try{


            Loader.show(

                "در حال دریافت اطلاعات..."

            );



            const result =

            await API.get(

                "/podcasts/" + id

            );



            if(!result.success){


                throw new Error(

                    result.message ||

                    "پادکست پیدا نشد"

                );

            }




            const item =

            result.podcast;




            this.currentPodcast = item;




            this.fillForm(item);




            this.modal.classList.add(

                "show"

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
    ========================================
    FILL FORM
    ========================================
    */

    fillForm(item){



        document.getElementById(

            "podcastId"

        ).value = item.id || "";



        document.getElementById(

            "title"

        ).value = item.title || "";



        document.getElementById(

            "book_name"

        ).value = item.book_name || "";



        document.getElementById(

            "author_name"

        ).value = item.author_name || "";



        document.getElementById(

            "category_name"

        ).value = item.category_name || "";



        document.getElementById(

            "episode_number"

        ).value = item.episode_number || 1;



        document.getElementById(

            "status"

        ).value = item.status || "inactive";



        document.getElementById(

            "description"

        ).value = item.description || "";



        document.getElementById(

            "summary"

        ).value = item.summary || "";



        document.getElementById(

            "transcript"

        ).value = item.transcript || "";



        document.getElementById(

            "duration_seconds"

        ).value = item.duration_seconds || 0;



        document.getElementById(

            "tags"

        ).value = item.tags || "";






        this.coverUrl =

        item.cover_url || "";



        this.audioUrl =

        item.audio_url || "";





        document.getElementById(

            "cover_url"

        ).value = this.coverUrl;




        document.getElementById(

            "audio_url"

        ).value = this.audioUrl;






        if(

            this.coverUrl &&

            this.coverPreview

        ){


            this.coverPreview.src =

            this.coverUrl;


            this.coverPreview.style.display =

            "block";


        }





        if(

            this.audioUrl &&

            this.audioPreview

        ){


            this.audioPreview.src =

            this.audioUrl;


            this.audioPreview.style.display =

            "block";


        }



    }









    /*
    ========================================
    DELETE PODCAST
    ========================================
    */

    async deletePodcast(id){


        const confirmDelete =

        confirm(

        "آیا از حذف این پادکست مطمئن هستید؟"

        );



        if(!confirmDelete)

        return;






        try{


            Loader.show(

                "در حال حذف..."

            );




            const result =

            await API.delete(

                "/podcasts/" + id

            );





            if(!result.success){


                throw new Error(

                    result.message ||

                    "حذف انجام نشد"

                );

            }





            Toast.success(

                "پادکست حذف شد"

            );




            await this.loadPodcasts();



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
    ========================================
    SAVE PODCAST
    ========================================
    */

    async savePodcast(){



        try{



            if(

                !this.validateForm()

            ){

                return;

            }







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

                )

                || 1,






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

                )

                || 0,





                tags:

                document.getElementById(

                    "tags"

                ).value.trim(),





                audio_url:

                this.audioUrl || null,





                cover_url:

                this.coverUrl || null,





                status:

                document.getElementById(

                    "status"

                ).value



            };








            Loader.show(

                "در حال ذخیره اطلاعات..."

            );







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








            if(!result.success){


                throw new Error(

                    result.message ||

                    "ذخیره انجام نشد"

                );


            }







            Toast.success(

                id

                ?

                "پادکست ویرایش شد"

                :

                "پادکست ایجاد شد"

            );






            this.closeModal();





            await this.loadPodcasts();







        }


        catch(error){



            console.error(error);



            Toast.error(

                error.message

            );



        }


        finally{


            Loader.hide();


        }



    }









    /*
    ========================================
    VALIDATION
    ========================================
    */


    validateForm(){



        const title =

        document.getElementById(

            "title"

        ).value.trim();





        if(!title){



            Toast.warning(

                "عنوان پادکست الزامی است"

            );



            return false;



        }






        if(

            !this.audioUrl

        ){



            Toast.warning(

                "فایل صوتی انتخاب نشده است"

            );



            return false;


        }







        if(

            !this.coverUrl

        ){



            Toast.warning(

                "کاور پادکست انتخاب نشده است"

            );



            return false;


        }







        return true;



    }










    /*
    ========================================
    UPLOAD COVER
    ========================================
    */


    async uploadCover(){


        if(this.coverUploading)

        return;



        const file =

        this.coverFile.files[0];



        if(!file){


            Toast.warning(

                "ابتدا فایل کاور را انتخاب کنید"

            );


            return;


        }






        if(

            !file.type.startsWith(

                "image/"

            )

        ){


            Toast.error(

                "فایل انتخاب شده تصویر نیست"

            );


            return;


        }






        try{


            this.coverUploading = true;



            this.showUploadProgress(

                "cover",

                true

            );






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








            const result =

            await API.request(

                "/media/upload",

                {


                    method:"POST",


                    body:formData


                }

            );








            if(!result.success){


                throw new Error(

                    result.message ||

                    "آپلود کاور ناموفق بود"

                );


            }







            this.coverUrl =

            result.url;





            document.getElementById(

                "cover_url"

            ).value =

            this.coverUrl;







            this.coverPreview.src =

            this.coverUrl;



            this.coverPreview.style.display =

            "block";







            Toast.success(

                "کاور با موفقیت آپلود شد"

            );




        }


        catch(error){



            Toast.error(

                error.message

            );



        }


        finally{


            this.coverUploading = false;



            this.showUploadProgress(

                "cover",

                false

            );



        }



    }









    /*
    ========================================
    UPLOAD AUDIO
    ========================================
    */


    async uploadAudio(){



        if(this.audioUploading)

        return;





        const file =

        this.audioFile.files[0];





        if(!file){



            Toast.warning(

                "فایل صوتی را انتخاب کنید"

            );



            return;


        }






        if(

            file.type !== "audio/mpeg"

            &&

            !file.name.endsWith(".mp3")

        ){


            Toast.error(

                "فقط فایل MP3 مجاز است"

            );


            return;


        }






        try{


            this.audioUploading = true;



            this.showUploadProgress(

                "audio",

                true

            );






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







            const result =

            await API.request(

                "/media/upload",

                {

                    method:"POST",

                    body:formData

                }

            );







            if(!result.success){



                throw new Error(

                    result.message ||

                    "آپلود فایل صوتی ناموفق بود"

                );



            }








            this.audioUrl =

            result.url;






            document.getElementById(

                "audio_url"

            ).value =

            this.audioUrl;








            this.audioPreview.src =

            this.audioUrl;



            this.audioPreview.style.display =

            "block";







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


            this.audioUploading = false;



            this.showUploadProgress(

                "audio",

                false

            );



        }



              }







    /*
    ========================================
    UPLOAD PROGRESS CONTROL
    ========================================
    */


    showUploadProgress(type, show){



        let progress;

        let bar;




        if(type === "cover"){


            progress =

            document.getElementById(

                "coverProgress"

            );



            bar =

            document.getElementById(

                "coverProgressBar"

            );


        }



        if(type === "audio"){


            progress =

            document.getElementById(

                "audioProgress"

            );



            bar =

            document.getElementById(

                "audioProgressBar"

            );


        }





        if(!progress || !bar)

        return;







        if(show){


            progress.style.display =

            "block";



            bar.style.width =

            "0%";



            let value = 0;



            const timer =

            setInterval(()=>{



                value += 10;



                if(value >= 90){


                    clearInterval(timer);


                }



                bar.style.width =

                value + "%";



            },300);




            progress.dataset.timer =

            timer;



        }

        else{



            clearInterval(

                progress.dataset.timer

            );



            bar.style.width =

            "100%";



            setTimeout(()=>{


                progress.style.display =

                "none";



                bar.style.width =

                "0%";



            },700);



        }



    }









    /*
    ========================================
    END CLASS
    ========================================
    */


}









/*
================================================

START PODCAST MANAGER

================================================
*/


let podcastManager;



document.addEventListener(

"DOMContentLoaded",

()=>{


    podcastManager =

    new PodcastManager();



});




