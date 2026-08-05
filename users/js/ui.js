/* ==================================================

NightCast User UI Manager V3

File:
/users/js/core/ui.js

Responsibility:
ONLY UI

================================================== */


const NightCastUI = {


    init(){


        this.initTheme();

        this.bindGlobalEvents();

        this.updateUserUI();


        console.log(
            "NightCast UI Ready"
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








    toast(
        message,
        type="info"
    ){


        const container =
        document.getElementById(
            "toastContainer"
        );



        if(!container){

            console.log(message);

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
        <span>${message}</span>
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




        const btn =
        document.getElementById(
            "themeButton"
        );



        if(btn){


            btn.onclick=()=>{

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









    bindGlobalEvents(){


        this.bindMobileMenu();





        const login =
        document.getElementById(
            "loginButton"
        );



        if(login){


            login.onclick=()=>{


                this.openModal(
                    "authModal"
                );


            };


        }







        const closeAuth =
        document.getElementById(
            "closeAuth"
        );



        if(closeAuth){


            closeAuth.onclick=()=>{


                this.closeModal(
                    "authModal"
                );


            };


        }




    },









    bindMobileMenu(){


        const open =
        document.getElementById(
            "mobileMenuButton"
        );



        const close =
        document.getElementById(
            "closeMobileMenu"
        );



        const menu =
        document.getElementById(
            "mobileMenu"
        );



        const overlay =
        document.getElementById(
            "mobileOverlay"
        );





        if(open && menu && overlay){


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









    updateUserUI(){



        const btn =
        document.getElementById(
            "loginButton"
        );



        if(!btn){

            return;

        }




        if(
            window.NightCastAuth
            &&
            NightCastAuth.isLoggedIn()
        ){


            btn.innerHTML =
            `
            <i class="fa-solid fa-user"></i>
            حساب کاربری
            `;


        }
        else{


            btn.innerHTML =
            `
            <i class="fa-solid fa-right-to-bracket"></i>
            ورود
            `;


        }


    },









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
