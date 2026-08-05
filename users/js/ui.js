/* ==================================================

NightCast User UI Manager V2


File:

/users/js/core/ui.js


Responsibility:

ONLY USER INTERFACE


Depends:

auth.js


================================================== */


const NightCastUI = {



    /*
    ====================================
    INIT
    ====================================
    */


    init(){



        this.initTheme();



        this.bindGlobalEvents();



        this.updateUserUI();



        console.log(

            "NightCast UI Ready"

        );



    },









    /*
    ====================================
    LOADER
    ====================================
    */


    hideLoader(){



        const loader =

        document.getElementById(

            "globalLoader"

        );




        if(!loader)

        return;






        setTimeout(()=>{


            loader.classList.add(

                "hidden"

            );


        },500);



    },









    showLoader(){



        const loader =

        document.getElementById(

            "globalLoader"

        );




        if(loader){



            loader.classList.remove(

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






        if(!container){



            alert(message);

            return;



        }








        const item =

        document.createElement(

            "div"

        );





        item.className =

        `toast toast-${type}`;







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
    THEME
    ====================================
    */


    initTheme(){



        const saved =

        localStorage.getItem(

            "NightCastTheme"

        );






        if(saved==="light"){



            document.body.classList.add(

                "light-theme"

            );


        }





        const button =

        document.getElementById(

            "themeButton"

        );





        if(button){



            button.onclick=()=>{



                this.toggleTheme();



            };



        }




    },









    toggleTheme(){



        document.body.classList.toggle(

            "light-theme"

        );






        const mode =

        document.body.classList.contains(

            "light-theme"

        )

        ?

        "light"

        :

        "dark";






        localStorage.setItem(

            "NightCastTheme",

            mode

        );



    },









    /*
    ====================================
    MOBILE MENU
    ====================================
    */


    bindMenu(){



        const open =

        document.getElementById(

            "mobileMenuButton"

        );



        const close =

        document.getElementById(

            "closeMenu"

        );



        const menu =

        document.getElementById(

            "sideMenu"

        );



        const overlay =

        document.getElementById(

            "menuOverlay"

        );








        if(open){



            open.onclick=()=>{



                menu.classList.add(

                    "active"

                );



                overlay.classList.add(

                    "active"

                );



            };


        }








        if(close){



            close.onclick=()=>{



                menu.classList.remove(

                    "active"

                );



                overlay.classList.remove(

                    "active"

                );



            };


        }








        if(overlay){



            overlay.onclick=()=>{



                close.click();



            };


        }



    },









    /*
    ====================================
    GLOBAL EVENTS
    ====================================
    */


    bindGlobalEvents(){



        this.bindMenu();







        const login =

        document.getElementById(

            "loginButton"

        );






        if(login){



            login.onclick=()=>{



                if(

                    window.NightCastAuth

                ){



                    NightCastAuth.openLogin();



                }



            };



        }






        const closeAuth =

        document.getElementById(

            "closeAuthModal"

        );





        if(closeAuth){



            closeAuth.onclick=()=>{



                NightCastAuth.closeLogin();



            };


        }





    },









    /*
    ====================================
    USER HEADER STATE
    ====================================
    */


    updateUserUI(){



        const button =

        document.getElementById(

            "loginButton"

        );





        if(!button)

        return;








        if(

            window.NightCastAuth &&

            NightCastAuth.isLoggedIn()

        ){



            button.innerHTML =



            `

            <i class="fa-solid fa-user"></i>

            حساب کاربری

            `;



        }

        else{



            button.innerHTML =



            `

            <i class="fa-solid fa-right-to-bracket"></i>

            ورود

            `;



        }



    },









    /*
    ====================================
    MODAL HELPERS
    ====================================
    */


    openModal(id){



        const el =

        document.getElementById(id);




        if(el){



            el.classList.remove(

                "hidden"

            );



        }



    },









    closeModal(id){



        const el =

        document.getElementById(id);




        if(el){



            el.classList.add(

                "hidden"

            );


        }



    }






};









window.NightCastUI =

NightCastUI;
