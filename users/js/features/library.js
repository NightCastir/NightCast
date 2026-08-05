/* ==================================================

NightCast Library Manager V1

File:

/users/js/features/library.js


Responsibility:

- Favorites
- Downloads
- Listening History


Depends:

api.js


================================================== */


const NightCastLibrary = {



    favorites:[],


    downloads:[],


    history:[],





    /*
    ====================================
    INIT
    ====================================
    */


    init(){



        this.loadLocal();

        this.bindEvents();




        console.log(

            "NightCast Library Ready"

        );



    },









    /*
    ====================================
    LOCAL DATA
    ====================================
    */


    loadLocal(){



        this.favorites =

        JSON.parse(

            localStorage.getItem(

                "NightCastFavorites"

            )

        )

        ||

        [];






        this.downloads =

        JSON.parse(

            localStorage.getItem(

                "NightCastDownloads"

            )

        )

        ||

        [];







        this.history =

        JSON.parse(

            localStorage.getItem(

                "NightCastHistory"

            )

        )

        ||

        [];



    },









    save(){



        localStorage.setItem(

            "NightCastFavorites",

            JSON.stringify(

                this.favorites

            )

        );






        localStorage.setItem(

            "NightCastDownloads",

            JSON.stringify(

                this.downloads

            )

        );






        localStorage.setItem(

            "NightCastHistory",

            JSON.stringify(

                this.history

            )

        );



    },









    /*
    ====================================
    FAVORITE
    ====================================
    */


    toggleFavorite(podcast){



        const index =

        this.favorites.findIndex(

            item=>item.id===podcast.id

        );






        if(index>-1){



            this.favorites.splice(

                index,

                1

            );




            if(window.NightCastUI){



                NightCastUI.toast(

                    "از علاقه‌مندی‌ها حذف شد",

                    "info"

                );



            }




        }

        else{



            this.favorites.push(

                podcast

            );






            if(window.NightCastUI){



                NightCastUI.toast(

                    "به علاقه‌مندی‌ها اضافه شد",

                    "success"

                );



            }



        }






        this.save();



    },









    /*
    ====================================
    DOWNLOAD
    ====================================
    */


    async download(podcast){



        if(!podcast.audio_url){



            NightCastUI.toast(

                "فایل صوتی موجود نیست",

                "error"

            );


            return;



        }








        const token =

        localStorage.getItem(

            "NightCastToken"

        );







        if(!token){



            if(window.NightCastAuth){



                NightCastAuth.openLogin();



            }



            NightCastUI.toast(

                "برای دانلود وارد شوید",

                "warning"

            );



            return;



        }









        const result =

        await API.get(

            "/public/download/" +

            podcast.id

        );







        if(result.success){



            this.downloads.push(

                podcast

            );



            this.save();





            window.open(

                podcast.audio_url,

                "_blank"

            );




        }

        else{



            NightCastUI.toast(

                result.message ||

                "دانلود امکان پذیر نیست",

                "error"

            );



        }



    },









    /*
    ====================================
    HISTORY
    ====================================
    */


    addHistory(podcast){



        this.history =

        this.history.filter(

            item=>item.id!==podcast.id

        );






        this.history.unshift(

            podcast

        );






        this.history =

        this.history.slice(

            0,

            50

        );






        this.save();



    },









    /*
    ====================================
    EVENTS
    ====================================
    */


    bindEvents(){





        document.addEventListener(

            "click",

            e=>{





                const download =

                e.target.closest(

                    ".download-button"

                );





                if(download){



                    const card =

                    download.closest(

                        ".podcast-card"

                    );



                    if(card && card.dataset.id){



                        this.download({

                            id:card.dataset.id,

                            audio_url:card.dataset.audio,

                            title:card.dataset.title

                        });



                    }



                }








                const favorite =

                e.target.closest(

                    ".favorite-button"

                );






                if(favorite){



                    const card =

                    favorite.closest(

                        ".podcast-card"

                    );






                    if(card){



                        this.toggleFavorite({

                            id:card.dataset.id,

                            title:card.dataset.title

                        });



                    }



                }





            }

        );



    }




};







window.NightCastLibrary =

NightCastLibrary;






console.log(

"NightCast Library V1 Loaded"

);
