/*
=================================================

NightCast Ver4
Loading Manager

Responsible for:
- Global Loading Screen
- Operation Status
- User Feedback

=================================================
*/


const Loader = {



    element:null,





    /*
    ==========================
    INIT
    ==========================
    */


    init(){



        this.element =

        document.getElementById(

            "globalLoader"

        );



    },









    /*
    ==========================
    SHOW FULL PAGE LOADER
    ==========================
    */



    show(

        message = "لطفاً صبر کنید..."

    ){



        if(!this.element){



            this.create();



        }





        const text =

        this.element.querySelector(

            ".loader-message"

        );




        if(text){


            text.innerHTML = message;


        }





        this.element.classList.add(

            "active"

        );



    },









    /*
    ==========================
    HIDE LOADER
    ==========================
    */



    hide(){



        if(this.element){


            this.element.classList.remove(

                "active"

            );


        }



    },









    /*
    ==========================
    CREATE LOADER
    ==========================
    */



    create(){



        const div =

        document.createElement(

            "div"

        );




        div.id =

        "globalLoader";





        div.innerHTML =



        `

        <div class="loader-box">


            <div class="spinner"></div>


            <div class="loader-message">

                لطفاً صبر کنید...

            </div>


        </div>

        `;







        document.body.appendChild(

            div

        );





        this.element = div;



    },









    /*
    ==========================
    BUTTON LOADING
    ==========================
    */



    buttonStart(

        button,

        text="در حال انجام..."

    ){



        if(!button)

            return;




        button.dataset.oldText =

        button.innerHTML;





        button.disabled=true;




        button.innerHTML =

        `


        <span class="btn-spinner"></span>

        ${text}


        `;



    },









    buttonStop(button){



        if(!button)

            return;





        button.disabled=false;



        button.innerHTML =

        button.dataset.oldText ||

        "ذخیره";



    }





};





document.addEventListener(

"DOMContentLoaded",

()=>{


    Loader.init();


});
