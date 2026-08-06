/*
=================================================

NightCast Comments Module

File:
users/js/comments.js


Responsibilities:

- Podcast comments
- Load comments
- Submit comments
- Comments modal


Dependencies:

- api.js
- auth.js
- ui.js


=================================================
*/


(function(){

"use strict";



window.NightCast =
window.NightCast || {};






const Comments = {





/*
=================================================
CONFIG
=================================================
*/


config:{


endpoint:"/comments",


guestMessage:
"برای ثبت نظر ابتدا وارد حساب شوید"



},







state:{


podcastId:null,


comments:[],


isOpen:false


},







elements:{},







/*
=================================================
INIT
=================================================
*/


init(){



this.cacheElements();



this.bindEvents();



console.log(
"NightCast Comments Initialized"
);



},







/*
=================================================
CACHE DOM
=================================================
*/


cacheElements(){



/*
Old modal
*/


this.elements.modal =
document.getElementById(
"commentsModal"
);




this.elements.list =
document.getElementById(
"commentsList"
);




this.elements.form =
document.getElementById(
"commentForm"
);




this.elements.text =
document.getElementById(
"commentText"
);






/*
Full page modal
*/


this.elements.pageModal =
document.getElementById(
"commentPageModal"
);




this.elements.pageInfo =
document.getElementById(
"commentPodcastInfo"
);




this.elements.items =
document.getElementById(
"commentItems"
);




this.elements.pageForm =
document.getElementById(
"newCommentForm"
);




this.elements.pageText =
document.getElementById(
"newCommentText"
);



},







/*
=================================================
EVENTS
=================================================
*/


bindEvents(){





/*
Close buttons
*/


document
.querySelectorAll(
'[data-action="close-comments"]'
)
.forEach(btn=>{



btn.addEventListener(
"click",
()=>{


this.close();


});


});







if(this.elements.form){


this.elements.form.addEventListener(
"submit",
(e)=>{


e.preventDefault();


this.submit(
this.elements.text.value
);


});


}







if(this.elements.pageForm){


this.elements.pageForm.addEventListener(
"submit",
(e)=>{


e.preventDefault();


this.submit(
this.elements.pageText.value
);


});


}





},
 /* =========================================================
   NightCast Comments System
   File:
   /users/js/comments.js

   Compatible:
   index.html V4
   api.js
   auth.js
========================================================= */


(function(){

"use strict";



const Comments = {

    currentPodcastId: null,

    currentPodcastTitle: null,



    elements:{},



    init(){

        this.cache();

        this.bindEvents();

    },




    cache(){


        this.elements.closeButton =
            document.getElementById(
                "closeCommentPage"
            );



        this.elements.modal =
            document.getElementById(
                "commentPageModal"
            );



        this.elements.items =
            document.getElementById(
                "commentItems"
            );



        this.elements.info =
            document.getElementById(
                "commentPodcastInfo"
            );



        this.elements.form =
            document.getElementById(
                "newCommentForm"
            );



        this.elements.text =
            document.getElementById(
                "newCommentText"
            );


    },





    bindEvents(){



        if(this.elements.closeButton){

            this.elements.closeButton
            .addEventListener(
                "click",
                ()=>this.close()
            );

        }




        if(this.elements.form){

            this.elements.form
            .addEventListener(
                "submit",
                e=>{

                    e.preventDefault();

                    this.submit();

                }
            );

        }



    },







    open(id,title){


        this.currentPodcastId = id;

        this.currentPodcastTitle = title;



        if(this.elements.info){

            this.elements.info.innerHTML = `

            <div class="comment-podcast-title">

                <h3>
                ${title || "پادکست"}
                </h3>

            </div>

            `;

        }




        if(this.elements.modal){

            this.elements.modal
            .classList
            .remove("hidden");

        }



        this.load(id);



    },






    close(){


        if(this.elements.modal){

            this.elements.modal
            .classList
            .add("hidden");

        }


        this.currentPodcastId=null;


    },






    async load(id){


        if(!id){

            return;

        }




        this.showLoading();



        try{



            const result =
            await NightCastAPI.get(
                `/podcasts/${id}/comments`
            );



            const comments =
            result.data ||
            result.comments ||
            [];



            this.render(
                comments
            );



        }
        catch(error){


            console.error(
                "Comments Load Error:",
                error
            );



            this.showEmpty(
                "دریافت نظرات امکان‌پذیر نیست"
            );


        }


    },






    render(comments){



        if(!this.elements.items){

            return;

        }





        if(
            !comments ||
            comments.length===0
        ){


            this.showEmpty(
                "هنوز نظری ثبت نشده است"
            );


            return;

        }





        this.elements.items.innerHTML = "";





        comments.forEach(
            comment=>{


                const item =
                document.createElement(
                    "div"
                );



                item.className =
                "comment-item";



                item.innerHTML = `


                <div class="comment-header">


                    <strong>

                    ${
                    comment.username ||
                    comment.user ||
                    "کاربر NightCast"
                    }

                    </strong>



                    <span>

                    ${
                    this.formatDate(
                        comment.created_at
                    )
                    }

                    </span>



                </div>





                <p>

                ${
                comment.text ||
                comment.comment ||
                ""
                }

                </p>


                `;



                this.elements.items
                .appendChild(item);



            }
        );



    },







    showLoading(){


        if(this.elements.items){

            this.elements.items.innerHTML = `

            <p>
            در حال دریافت نظرات...
            </p>

            `;

        }


    },






    showEmpty(message){


        if(this.elements.items){

            this.elements.items.innerHTML = `

            <p class="empty-comments">

            ${message}

            </p>

            `;

        }


    },







    async submit(){


        if(
            !this.currentPodcastId
        ){

            return;

        }



        const text =
        this.elements.text.value.trim();



        if(!text){


            this.toast(
                "لطفاً متن نظر را وارد کنید"
            );


            return;

        }







        try{



            await NightCastAPI.post(

                `/podcasts/${this.currentPodcastId}/comments`,

                {

                    text:text

                }

            );





            this.elements.text.value="";



            this.toast(
                "نظر شما ثبت شد"
            );



            this.load(
                this.currentPodcastId
            );




        }
        catch(error){


            console.error(
                error
            );


            this.toast(
                "ثبت نظر انجام نشد"
            );


        }


    },







    formatDate(date){


        if(!date){

            return "";

        }



        try{


            return new Date(date)
            .toLocaleDateString(
                "fa-IR"
            );


        }
        catch{

            return "";

        }


    },







    toast(message){



        if(
            window.UI &&
            UI.toast
        ){

            UI.toast(
                message
            );


        }
        else{


            console.log(
                message
            );


        }



    }






};






window.NightCastComments =
Comments;




document.addEventListener(
"DOMContentLoaded",
()=>{


    Comments.init();


});





})();
 /* =========================================================
   Comments Integration Layer

   Connect:
   podcasts.js
   podcast cards
   data-action="comments"

========================================================= */



(function(){


"use strict";





function bindPodcastCommentButtons(){



    document.addEventListener(
        "click",
        function(e){



            const button =
            e.target.closest(
                '[data-action="comments"]'
            );



            if(!button){

                return;

            }





            e.preventDefault();





            const card =
            button.closest(
                ".podcast-card"
            );



            if(!card){

                console.warn(
                    "Podcast card not found"
                );

                return;

            }






            /*
              استخراج اطلاعات پادکست
              از template index.html
            */



            const id =
            card.dataset.id ||
            card.getAttribute(
                "data-id"
            );




            const titleElement =
            card.querySelector(
                ".podcast-title"
            );



            const title =
            titleElement
            ?
            titleElement.textContent.trim()
            :
            "پادکست NightCast";








            if(
                window.NightCastComments
            ){



                NightCastComments.open(
                    id,
                    title
                );



            }



        }
    );


}









/*
=========================================================

  Hook after podcast rendering

  چون podcast.js کارت‌ها را
  داینامیک ایجاد می‌کند

=========================================================
*/



function observePodcastGrid(){



    const grid =
    document.getElementById(
        "podcastGrid"
    );



    if(!grid){

        return;

    }





    const observer =
    new MutationObserver(
        ()=>{


            console.log(
                "NightCast comments ready"
            );


        }
    );




    observer.observe(

        grid,

        {

            childList:true,

            subtree:true

        }

    );



}








/*
=========================================================

  Login Check Before Comment

=========================================================
*/



function protectCommentSubmit(){



    document.addEventListener(

        "click",

        function(e){


            const submit =
            e.target.closest(
                "#newCommentForm button"
            );



            if(!submit){

                return;

            }





            const user =
            localStorage.getItem(
                "NightCastUser"
            );




            /*
             اگر سیاست شما این باشد
             که مهمان هم بتواند نظر بدهد
             این قسمت حذف می‌شود
            */


            if(
                !user
            ){


                console.log(
                    "Guest comment mode"
                );


            }




        }

    );


}








document.addEventListener(

"DOMContentLoaded",

()=>{


    bindPodcastCommentButtons();


    observePodcastGrid();


    protectCommentSubmit();



});


})();
