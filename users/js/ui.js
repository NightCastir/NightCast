/* ==================================================
   NightCast User Interface Manager
   File: /users/js/ui.js
   Version: 2.0 Professional
================================================== */


const NightCastUI = {



    /*
    ====================================
    LOADER
    ====================================
    */


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
    TOAST MESSAGE
    ====================================
    */


    toast(

        message,

        type="success"

    ){



        let toast =

        document.getElementById(

            "nightToast"

        );





        if(!toast){



            toast =

            document.createElement(

                "div"

            );



            toast.id =

            "nightToast";



            toast.className =

            "toast";



            document.body.appendChild(

                toast

            );



        }







        toast.textContent =

        message;





        toast.classList.remove(

            "success",

            "error"

        );





        toast.classList.add(

            type

        );





        toast.classList.remove(

            "hidden"

        );







        clearTimeout(

            this.toastTimer

        );





        this.toastTimer =

        setTimeout(()=>{



            toast.classList.add(

                "hidden"

            );



        },3500);





    },









    /*
    ====================================
    SUCCESS
    ====================================
    */


    success(message){



        this.toast(

            message,

            "success"

        );



    },









    /*
    ====================================
    ERROR
    ====================================
    */


    error(message){



        this.toast(

            message,

            "error"

        );


    },









    /*
    ====================================
    CONFIRM
    ====================================
    */


    confirm(message){


        return window.confirm(

            message

        );


    },









    /*
    ====================================
    FORMAT TIME
    ====================================
    */


    formatTime(seconds){



        if(

            !seconds ||

            isNaN(seconds)

        ){


            return "00:00";


        }







        seconds =

        Math.floor(

            seconds

        );





        const min =

        Math.floor(

            seconds / 60

        );





        const sec =

        seconds % 60;







        return (

            String(min)

            .padStart(

                2,

                "0"

            )

            +

            ":"

            +

            String(sec)

            .padStart(

                2,

                "0"

            )

        );



    },









    /*
    ====================================
    EMPTY STATE
    ====================================
    */


    empty(

        container,

        message

    ){



        if(container){


            container.innerHTML =


            `

            <div class="empty-state">

            ${message}

            </div>

            `;



        }


    },









    /*
    ====================================
    SAFE HTML
    ====================================
    */


    escape(text){



        if(!text){

            return "";

        }



        return text

        .toString()

        .replace(

            /[&<>"']/g,

            function(char){



                return {

                    "&":"&amp;",

                    "<":"&lt;",

                    ">":"&gt;",

                    '"':"&quot;",

                    "'":"&#039;"

                }[char];



            }

        );


    }








};








window.NightCastUI =

NightCastUI;
