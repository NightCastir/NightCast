/*
=================================================

NightCast Ver4
Toast Notification System

Responsible for:
- Success Messages
- Error Messages
- Warning Messages
- Information Messages

=================================================
*/


const Toast = {



    container:null,





    /*
    ==========================
    INIT
    ==========================
    */


    init(){



        this.createContainer();



    },








    /*
    ==========================
    CREATE CONTAINER
    ==========================
    */


    createContainer(){



        let box =

        document.getElementById(

            "toastContainer"

        );





        if(box)

            return;







        box =

        document.createElement(

            "div"

        );




        box.id =

        "toastContainer";





        document.body.appendChild(

            box

        );




        this.container = box;



    },









    /*
    ==========================
    SHOW MESSAGE
    ==========================
    */



    show(

        message,

        type="info",

        duration=3500

    ){



        if(!this.container){


            this.createContainer();


        }





        const toast =

        document.createElement(

            "div"

        );





        toast.className =

        `toast toast-${type}`;







        let icon="ℹ️";




        if(type==="success")

            icon="✅";



        if(type==="error")

            icon="❌";



        if(type==="warning")

            icon="⚠️";







        toast.innerHTML =



        `

        <span class="toast-icon">

        ${icon}

        </span>


        <span class="toast-text">

        ${message}

        </span>


        `;









        this.container.appendChild(

            toast

        );







        setTimeout(()=>{


            toast.classList.add(

                "show"

            );


        },50);








        setTimeout(()=>{


            toast.classList.remove(

                "show"

            );




            setTimeout(()=>{


                toast.remove();


            },300);




        },duration);





    },









    /*
    ==========================
    SHORTCUTS
    ==========================
    */



    success(message){



        this.show(

            message,

            "success"

        );



    },








    error(message){



        this.show(

            message,

            "error"

        );



    },








    warning(message){



        this.show(

            message,

            "warning"

        );



    },








    info(message){



        this.show(

            message,

            "info"

        );



    }



};








document.addEventListener(

"DOMContentLoaded",

()=>{


    Toast.init();


});
