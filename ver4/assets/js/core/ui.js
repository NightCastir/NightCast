/*
=================================================

NightCast Ver4
UI Manager

Responsible for:
- Toast
- Loader
- Confirm Dialog
- Global UI Helpers

=================================================
*/


"use strict";







const UI = {





    /*
    ==========================
    TOAST
    ==========================
    */


    toast(

        message,

        type="success"

    ){



        let container =

        document.getElementById(

            "toastContainer"

        );







        if(!container){



            container =

            document.createElement(

                "div"

            );



            container.id =

            "toastContainer";



            document.body.appendChild(

                container

            );



        }








        const toast =

        document.createElement(

            "div"

        );








        toast.className =

        `toast ${type}`;








        toast.textContent =

        message;








        container.appendChild(

            toast

        );








        setTimeout(

            ()=>{


                toast.remove();



            },

            4000

        );



    },









    success(message){



        this.toast(

            message,

            "success"

        );


    },









    error(message){



        this.toast(

            message,

            "error"

        );


    },









    warning(message){



        this.toast(

            message,

            "warning"

        );


    },







    /*
    ==========================
    LOADER
    ==========================
    */


    showLoader(

        text="لطفاً صبر کنید..."

    ){



        let loader =

        document.getElementById(

            "globalLoader"

        );








        if(!loader){



            loader =

            document.createElement(

                "div"

            );



            loader.id =

            "globalLoader";








            loader.innerHTML = `

                <div class="loader-box">

                    <div class="loader-spinner"></div>

                    <p>${text}</p>

                </div>

            `;








            document.body.appendChild(

                loader

            );



        }







        loader.style.display =

        "flex";



    },









    hideLoader(){



        const loader =

        document.getElementById(

            "globalLoader"

        );








        if(loader){



            loader.style.display =

            "none";



        }



    },









    /*
    ==========================
    CONFIRM
    ==========================
    */


    confirm(

        message

    ){



        return window.confirm(

            message

        );



    },









    /*
    ==========================
    FORMAT DATE
    ==========================
    */


    formatDate(

        date

    ){



        if(!date)

            return "";








        return new Date(

            date

        ).toLocaleDateString(

            "fa-IR"

        );



    }






};









/*
=================================================

GLOBAL EXPORT

=================================================
*/


window.UI = UI;







// Compatibility

window.Toast = {



    success:

    UI.success.bind(UI),





    error:

    UI.error.bind(UI),





    warning:

    UI.warning.bind(UI)



};







window.Loader = {



    show:

    UI.showLoader.bind(UI),





    hide:

    UI.hideLoader.bind(UI)



};

  
