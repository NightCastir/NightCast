/*
=================================================

NightCast Ver4
Admin Podcasts Manager

Responsible for:
- Podcast List
- Create Podcast
- Edit Podcast
- Delete Podcast
- Upload Audio

=================================================
*/


"use strict";







class PodcastsManager {



    constructor(){



        this.currentPage = 1;


        this.limit = 20;


        this.init();



    }









    async init(){



        if(

            !Auth.requireAuth()

        ){

            return;

        }








        this.bindEvents();



        await this.load();



    }









    /*
    ==========================
    EVENTS
    ==========================
    */


    bindEvents(){



        document

        .getElementById(

            "addPodcast"

        )

        ?.addEventListener(

            "click",

            ()=>this.openCreate()

        );








        document

        .getElementById(

            "savePodcast"

        )

        ?.addEventListener(

            "click",

            ()=>this.save()

        );



    }









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








            const result =

            await API.get(

                `/admin/podcasts?page=${this.currentPage}&limit=${this.limit}`

            );








            if(

                !result.success

            ){



                throw new Error(

                    result.message ||

                    "خطا در دریافت پادکست‌ها"

                );



            }








            this.render(

                result.data

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
    ==========================
    RENDER PODCAST TABLE
    ==========================
    */


    render(data){



        const tbody =

        document.querySelector(

            "#podcastTableBody"

        );








        if(

            !tbody

        ){

            return;

        }








        tbody.innerHTML = "";








        const podcasts =

        data.items ||

        data;








        podcasts.forEach(

            podcast=>{



                tbody.innerHTML += `

                <tr>



                    <td>

                        ${podcast.id}

                    </td>





                    <td>

                        ${podcast.title}

                    </td>





                    <td>

                        ${

                            podcast.category ||

                            "-"

                        }

                    </td>





                    <td>

                        <span class="badge badge-success">

                            ${

                            podcast.status ||

                            "published"

                            }

                        </span>

                    </td>





                    <td>

                        ${

                        UI.formatDate(

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
    OPEN CREATE MODAL
    ==========================
    */


    openCreate(){



        const modal =

        document.getElementById(

            "podcastModal"

        );








        if(modal){



            modal.classList.add(

                "show"

            );



        }








        document.getElementById(

            "podcastId"

        ).value = "";








        document.getElementById(

            "podcastForm"

        )?.reset();



    }




        /*
    ==========================
    SAVE PODCAST
    ==========================
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

                    "podcastTitle"

                ).value,





                description:

                document.getElementById(

                    "podcastDescription"

                ).value,





                category:

                document.getElementById(

                    "podcastCategory"

                ).value,





                status:

                document.getElementById(

                    "podcastStatus"

                ).value



            };








            Loader.show(

                "در حال ذخیره..."

            );








            let result;








            if(id){



                result =

                await API.put(

                    `/admin/podcasts/${id}`,

                    data

                );



            }

            else{



                result =

                await API.post(

                    "/admin/podcasts",

                    data

                );



            }








            if(

                !result.success

            ){



                throw new Error(

                    result.message ||

                    "ذخیره ناموفق بود"

                );



            }








            Toast.success(

                "پادکست ذخیره شد"

            );








            this.closeModal();



            await this.load();







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
    ==========================
    EDIT PODCAST
    ==========================
    */


    async edit(id){



        try{



            const result =

            await API.get(

                `/admin/podcasts/${id}`

            );








            if(

                !result.success

            ){

                return;

            }








            const item =

            result.data;








            document.getElementById(

                "podcastId"

            ).value = item.id;








            document.getElementById(

                "podcastTitle"

            ).value = item.title;








            document.getElementById(

                "podcastDescription"

            ).value =

            item.description || "";








            document.getElementById(

                "podcastCategory"

            ).value =

            item.category || "";








            document.getElementById(

                "podcastStatus"

            ).value =

            item.status || "published";








            document.getElementById(

                "podcastModal"

            )

            .classList.add(

                "show"

            );



        }

        catch(error){



            Toast.error(

                error.message

            );



        }



    }




    



    /*
    ==========================
    DELETE PODCAST
    ==========================
    */


    async remove(id){



        if(

            !UI.confirm(

                "آیا از حذف این پادکست مطمئن هستید؟"

            )

        ){

            return;

        }








        try{



            Loader.show(

                "در حال حذف..."

            );








            const result =

            await API.delete(

                `/admin/podcasts/${id}`

            );








            if(

                !result.success

            ){



                throw new Error(

                    result.message ||

                    "حذف ناموفق بود"

                );



            }








            Toast.success(

                "پادکست حذف شد"

            );








            await this.load();







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
    ==========================
    UPLOAD AUDIO
    ==========================
    */


    async uploadAudio(file){



        try{



            const formData =

            new FormData();








            formData.append(

                "audio",

                file

            );








            Loader.show(

                "در حال آپلود فایل صوتی..."

            );








            const result =

            await API.upload(

                "/admin/podcasts/upload",

                formData

            );








            if(

                !result.success

            ){



                throw new Error(

                    result.message ||

                    "آپلود انجام نشد"

                );



            }








            Toast.success(

                "فایل صوتی آپلود شد"

            );








            return result.data;





        }

        catch(error){



            Toast.error(

                error.message

            );



            return null;



        }

        finally{



            Loader.hide();



        }



    }









    /*
    ==========================
    CLOSE MODAL
    ==========================
    */


    closeModal(){



        document

        .getElementById(

            "podcastModal"

        )

        ?.classList.remove(

            "show"

        );



    }



}









/*
=================================================

GLOBAL INSTANCE

=================================================
*/


let podcastsManager;







document.addEventListener(

"DOMContentLoaded",

()=>{


    podcastsManager =

    new PodcastsManager();



});



