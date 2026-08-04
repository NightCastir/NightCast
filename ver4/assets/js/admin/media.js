/*
=================================================

NightCast Ver4
Media Manager

Responsible for:
- Upload Media
- List Files
- Delete Media
- Worker Communication

=================================================
*/


"use strict";



class MediaManager {



    constructor(){


        this.files = [];


        this.init();


    }








    /*
    ========================================
    INIT
    ========================================
    */


    async init(){


        this.cacheDOM();


        this.bindEvents();


        await this.loadMedia();



    }









    /*
    ========================================
    CACHE DOM
    ========================================
    */


    cacheDOM(){



        this.type =

        document.getElementById(

            "mediaType"

        );





        this.fileInput =

        document.getElementById(

            "mediaFile"

        );





        this.uploadButton =

        document.getElementById(

            "btnUploadMedia"

        );





        this.table =

        document.getElementById(

            "mediaTable"

        );





        this.search =

        document.getElementById(

            "mediaSearch"

        );





        this.progress =

        document.getElementById(

            "mediaProgress"

        );





        this.progressBar =

        document.getElementById(

            "mediaProgressBar"

        );





        this.resultBox =

        document.getElementById(

            "uploadResult"

        );



    }









    /*
    ========================================
    EVENTS
    ========================================
    */


    bindEvents(){



        this.uploadButton?.addEventListener(

            "click",

            ()=>this.upload()

        );





        this.search?.addEventListener(

            "input",

            ()=>this.filter()

        );





        this.table?.addEventListener(

            "click",

            (e)=>this.tableEvents(e)

        );



    }



    /*
    ========================================
    LOAD MEDIA
    ========================================
    */


    async loadMedia(){


        try{


            Loader.show(

                "در حال دریافت رسانه‌ها..."

            );



            /*
            نکته:
            Worker فعلی در حال حاضر
            Route جداگانه برای Media List ندارد.
            بنابراین فعلاً لیست از داده‌های موجود
            در API استفاده نمی‌کند.
            */

            this.files = [];



            this.render();



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
    RENDER TABLE
    ========================================
    */


    render(){



        if(!this.table)

        return;





        if(

            this.files.length===0

        ){



            this.table.innerHTML =

            `

            <tr>

            <td colspan="5">

            رسانه‌ای ثبت نشده است

            </td>

            </tr>

            `;


            return;


        }







        this.table.innerHTML =



        this.files.map(

        (file,index)=>`


        <tr>



        <td>

        ${index+1}

        </td>



        <td>

        ${file.name}

        </td>



        <td>

        ${file.type}

        </td>



        <td>

        ${file.url}

        </td>



        <td>



        <button

        class="btn btn-danger btn-sm"

        data-action="delete"

        data-id="${file.id}"

        >

        حذف

        </button>



        </td>



        </tr>


        `

        )

        .join("");



    }









    /*
    ========================================
    SEARCH
    ========================================
    */


    filter(){



        const value =

        this.search.value

        .toLowerCase();






        const rows =

        this.table.querySelectorAll(

            "tr"

        );





        rows.forEach(row=>{



            row.style.display =


            row.innerText

            .toLowerCase()

            .includes(value)

            ?

            ""

            :

            "none";



        });



  }




    /*
    ========================================
    UPLOAD MEDIA
    ========================================
    */


    async upload(){



        const file =

        this.fileInput.files[0];





        if(!file){


            Toast.warning(

                "ابتدا فایل را انتخاب کنید"

            );


            return;


        }







        try{



            Loader.show(

                "در حال آپلود فایل..."

            );



            this.startProgress();







            const formData =

            new FormData();






            formData.append(

                "file",

                file

            );





            formData.append(

                "type",

                this.type.value

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

                    "آپلود ناموفق بود"

                );


            }







            this.finishProgress();





            this.resultBox.innerHTML =


            `

            <div class="alert success">


            فایل با موفقیت آپلود شد


            <br>


            <a href="${result.url}"

            target="_blank">

            مشاهده فایل

            </a>


            </div>

            `;






            Toast.success(

                "آپلود با موفقیت انجام شد"

            );







            this.fileInput.value = "";






        }


        catch(error){



            Toast.error(

                error.message

            );



            this.resetProgress();



        }


        finally{


            Loader.hide();


        }



    }









    /*
    ========================================
    PROGRESS
    ========================================
    */


    startProgress(){



        this.progress.style.display =

        "block";



        this.progressBar.style.width =

        "0%";



        this.progressTimer =

        setInterval(()=>{



            let width =

            parseInt(

            this.progressBar.style.width

            )

            ||0;





            if(width < 90){


                width += 10;


                this.progressBar.style.width =

                width+"%";


            }



        },300);



    }









    finishProgress(){



        clearInterval(

            this.progressTimer

        );



        this.progressBar.style.width =

        "100%";




        setTimeout(()=>{



            this.progress.style.display =

            "none";



            this.progressBar.style.width =

            "0%";



        },800);



    }









    resetProgress(){



        clearInterval(

            this.progressTimer

        );



        this.progress.style.display =

        "none";



        this.progressBar.style.width =

        "0%";



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

            action==="delete"

        ){



            this.deleteMedia(id);



        }



    }









    /*
    ========================================
    DELETE MEDIA
    ========================================
    */


    async deleteMedia(id){



        const confirmDelete =

        confirm(

            "آیا از حذف این فایل مطمئن هستید؟"

        );





        if(!confirmDelete)

        return;






        /*
        
        در حال حاضر Worker فقط Upload دارد.

        بعد از اضافه شدن Route:

        /media/delete

        این بخش فعال می‌شود.

        */



        Toast.warning(

            "حذف رسانه هنوز در API فعال نشده است"

        );



    }



}









/*
=================================================

START MEDIA MANAGER

=================================================
*/


let mediaManager;



document.addEventListener(

"DOMContentLoaded",

()=>{


    mediaManager =

    new MediaManager();



});








  
