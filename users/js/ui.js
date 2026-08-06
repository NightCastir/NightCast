
/* ==================================================

NightCast UI Manager V1

File:
users/assets/js/components/ui.js

Responsibility:
- Toast Messages
- Loading State
- Modal Control
- UI Helpers
- Empty / Error States

No API Logic
No Authentication Logic

================================================== */


const UI = {



    // ==========================================
    // SHOW TOAST
    // ==========================================

    toast(

        message,

        type="info",

        duration=3000

    ){



        let container =

        document.getElementById(

            "nc-toast-container"

        );



        if(!container){


            container =

            document.createElement(

                "div"

            );


            container.id =

            "nc-toast-container";



            document.body.appendChild(

                container

            );


        }




        const toast =

        document.createElement(

            "div"

        );



        toast.className =

        "nc-toast nc-toast-"+type;



        toast.textContent =

        message;



        container.appendChild(

            toast

        );





        setTimeout(()=>{


            toast.classList.add(

                "show"

            );


        },20);






        setTimeout(()=>{


            toast.classList.remove(

                "show"

            );



            setTimeout(()=>{


                toast.remove();



            },300);



        },duration);



    },









    // ==========================================
    // SUCCESS MESSAGE
    // ==========================================

    success(message){


        this.toast(

            message,

            "success"

        );


    },






    // ==========================================
    // ERROR MESSAGE
    // ==========================================

    error(message){


        this.toast(

            message,

            "error"

        );


    },






    // ==========================================
    // WARNING
    // ==========================================

    warning(message){


        this.toast(

            message,

            "warning"

        );


    },







    // ==========================================
    // LOADING
    // ==========================================

    showLoading(

        element

    ){



        if(!element)

        return;



        element.dataset.oldContent =

        element.innerHTML;



        element.innerHTML =


        `

        <div class="nc-loading">

            <span></span>

            <span></span>

            <span></span>

        </div>

        `;



        element.classList.add(

            "loading"

        );


    },









    hideLoading(

        element

    ){



        if(!element)

        return;



        if(

            element.dataset.oldContent

        ){



            element.innerHTML =

            element.dataset.oldContent;



            delete element.dataset.oldContent;


        }



        element.classList.remove(

            "loading"

        );



    },









    // ==========================================
    // SET TEXT
    // ==========================================

    text(

        selector,

        value

    ){



        const el =

        document.querySelector(

            selector

        );



        if(el){


            el.textContent =

            value ?? "";

        }


    },









    // ==========================================
    // SET HTML
    // ==========================================

    html(

        selector,

        value

    ){



        const el =

        document.querySelector(

            selector

        );



        if(el){


            el.innerHTML =

            value ?? "";


        }


    },









    // ==========================================
    // SHOW ELEMENT
    // ==========================================

    show(selector){



        const el =

        document.querySelector(

            selector

        );



        if(el){


            el.style.display="";


        }



    },









    // ==========================================
    // HIDE ELEMENT
    // ==========================================

    hide(selector){



        const el =

        document.querySelector(

            selector

        );



        if(el){


            el.style.display="none";


        }



    },









    // ==========================================
    // EMPTY STATE
    // ==========================================

    empty(

        container,

        message="موردی یافت نشد"

    ){



        if(!container)

        return;



        container.innerHTML =


        `

        <div class="nc-empty">


            <div class="nc-empty-icon">

                🎙

            </div>


            <p>

                ${message}

            </p>


        </div>

        `;



    },









    // ==========================================
    // ERROR STATE
    // ==========================================

    errorBox(

        container,

        message="خطایی رخ داده است"

    ){



        if(!container)

        return;



        container.innerHTML =


        `

        <div class="nc-error">


            <div>

                ⚠️

            </div>


            <p>

                ${message}

            </p>


            <button

            onclick="location.reload()">

                تلاش دوباره

            </button>


        </div>


        `;



    },









    // ==========================================
    // MODAL OPEN
    // ==========================================

    openModal(

        id

    ){



        const modal =

        document.getElementById(

            id

        );



        if(!modal)

        return;



        modal.classList.add(

            "active"

        );



        document.body.classList.add(

            "modal-open"

        );



    },









    // ==========================================
    // MODAL CLOSE
    // ==========================================

    closeModal(

        id

    ){



        const modal =

        document.getElementById(

            id

        );



        if(!modal)

        return;



        modal.classList.remove(

            "active"

        );



        document.body.classList.remove(

            "modal-open"

        );



    },









    // ==========================================
    // FORMAT TIME
    // ==========================================

    formatTime(

        seconds

    ){



        if(

            !seconds

            ||

            isNaN(seconds)

        )

        return "00:00";



        const min =

        Math.floor(

            seconds / 60

        );



        const sec =

        Math.floor(

            seconds % 60

        );



        return (

            min < 10

            ?

            "0"+min

            :

            min

        )

        +

        ":"+

        (

            sec < 10

            ?

            "0"+sec

            :

            sec

        );


    },









    // ==========================================
    // FORMAT DATE
    // ==========================================

    formatDate(

        date

    ){



        if(!date)

        return "-";



        try{


            return new Date(

                date

            ).toLocaleDateString(

                "fa-IR"

            );


        }

        catch(e){


            return date;


        }


    }







};







window.UI = UI;



console.log(

"NightCast UI Loaded"

);
