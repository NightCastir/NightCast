/* ==================================================

   NightCast User UI Manager V1


   File:

   /users/js/core/ui.js


   Responsibility:

   ONLY USER INTERFACE CONTROL


================================================== */





const NightCastUI = {





    /*
    ====================================
    INIT
    ====================================
    */


    init(){



        this.initTheme();



        this.initMobileMenu();



        this.initModals();



        this.hideLoader();



    },









    /*
    ====================================
    LOADER
    ====================================
    */


    showLoader(message="در حال آماده‌سازی..."){



        const loader =

        document.getElementById(

            "globalLoader"

        );





        if(!loader)

            return;







        const text =

        loader.querySelector("p");





        if(text)

            text.innerText = message;





        loader.classList.remove(

            "hidden"

        );



    },








    hideLoader(){



        const loader =

        document.getElementById(

            "globalLoader"

        );





        if(loader){



            loader.classList.add(

                "hidden"

            );



        }



    },









    /*
    ====================================
    TOAST SYSTEM
    ====================================
    */


    toast(

        message,

        type="info"

    ){



        const container =

        document.getElementById(

            "toastContainer"

        );





        if(!container)

            return;







        const item =

        document.createElement(

            "div"

        );






        item.className =

        "toast toast-"+type;







        item.innerHTML =



        `

        <span>

        ${message}

        </span>

        `;







        container.appendChild(

            item

        );








        setTimeout(()=>{



            item.classList.add(

                "show"

            );



        },50);









        setTimeout(()=>{



            item.classList.remove(

                "show"

            );





            setTimeout(()=>{


                item.remove();


            },300);




        },3000);





    },









    /*
    ====================================
    THEME SYSTEM

    Day / Night

    ====================================
    */


    initTheme(){



        const saved =

        localStorage.getItem(

            "NightCastTheme"

        );





        if(saved==="light"){



            document.body.classList.add(

                "light-mode"

            );



        }








        const button =

        document.getElementById(

            "themeButton"

        );







        if(button){



            button.addEventListener(

                "click",

                ()=>{


                    this.toggleTheme();


                }


            );



        }



    },









    toggleTheme(){



        document.body.classList.toggle(

            "light-mode"

        );





        const light =

        document.body.classList.contains(

            "light-mode"

        );






        localStorage.setItem(

            "NightCastTheme",

            light

            ?

            "light"

            :

            "dark"


        );



    },









    /*
    ====================================
    MOBILE MENU
    ====================================
    */


    initMobileMenu(){



        const open =

        document.getElementById(

            "mobileMenuButton"

        );





        const close =

        document.getElementById(

            "closeMenu"

        );





        const overlay =

        document.getElementById(

            "menuOverlay"

        );






        if(open){



            open.onclick = ()=>{


                this.openMenu();



            };



        }






        if(close){



            close.onclick = ()=>{


                this.closeMenu();



            };


        }






        if(overlay){



            overlay.onclick = ()=>{


                this.closeMenu();



            };


        }



    },









    openMenu(){



        document.body.classList.add(

            "menu-open"

        );



    },









    closeMenu(){



        document.body.classList.remove(

            "menu-open"

        );



    },









    /*
    ====================================
    MODALS
    ====================================
    */


    initModals(){



        const closeButtons =

        document.querySelectorAll(

            "[data-close-modal]"

        );






        closeButtons.forEach(btn=>{



            btn.addEventListener(

                "click",

                ()=>{


                    const modal =

                    btn.closest(

                        ".modal"

                    );



                    if(modal)

                        this.closeModal(

                            modal.id

                        );



                }


            );



        });



    },









    openModal(id){



        const modal =

        document.getElementById(

            id

        );





        if(modal){



            modal.classList.remove(

                "hidden"

            );



        }



    },









    closeModal(id){



        const modal =

        document.getElementById(

            id

        );





        if(modal){



            modal.classList.add(

                "hidden"

            );



        }



    }






};









/*
====================================

GLOBAL ACCESS

====================================
*/


window.NightCastUI = NightCastUI;









/*
====================================

AUTO START

====================================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{


    NightCastUI.init();


}

);






console.log(

"NightCast UI V1 Loaded"

);
