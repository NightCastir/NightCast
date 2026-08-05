/* ==================================================

NightCast Comments Manager V1

File:
 /users/js/comments.js


Responsibility:

- Load comments
- Submit comment
- Render comments


Depends:

api.js
auth.js
ui.js


================================================== */


const NightCastComments = {



    podcastId:null,





    /*
    ====================================
    INIT
    ====================================
    */


    init(){


        const params =

        new URLSearchParams(

            window.location.search

        );





        this.podcastId =

        params.get("id");







        if(!this.podcastId){


            console.warn(

                "Podcast ID missing"

            );


            return;


        }





        this.bindEvents();


        this.load();





        console.log(

            "NightCast Comments Loaded"

        );



    },









    /*
    ====================================
    LOAD COMMENTS
    ====================================
    */


    async load(){



        const container =

        document.getElementById(

            "commentsList"

        );





        if(!container){

            return;

        }





        container.innerHTML =

        `

        <div class="comment-loading">

        در حال دریافت نظرات...

        </div>

        `;








        /*
        
        Future Worker API:

        /public/podcasts/{id}/comments
        
        */





        const result =

        await NightCastAPI.request(

            `/public/podcasts/${this.podcastId}/comments`,

            {

                method:"GET"

            }

        );









        if(

            !result.success

        ){


            container.innerHTML =


            `

            <p>

            هنوز نظری ثبت نشده است

            </p>

            `;



            return;


        }








        this.render(

            result.data ||

            []

        );



    },









    /*
    ====================================
    RENDER
    ====================================
    */


    render(comments){



        const container =

        document.getElementById(

            "commentsList"

        );





        if(!container){

            return;

        }





        container.innerHTML="";








        if(

            comments.length===0

        ){



            container.innerHTML =


            `

            <div class="empty-comments">

            اولین نفری باشید که نظر می‌دهد

            </div>

            `;


            return;


        }








        comments.forEach(

            comment=>{





                const item =

                document.createElement(

                    "article"

                );





                item.className =

                "comment-card";






                item.innerHTML =


                `

                <div class="comment-user">

                    <i class="fa-solid fa-user"></i>

                    <strong>

                    ${comment.username || "کاربر"}

                    </strong>

                </div>



                <p>

                ${comment.text}

                </p>



                <small>

                ${comment.created_at || ""}

                </small>


                `;







                container.appendChild(

                    item

                );



            }


        );



    },









    /*
    ====================================
    EVENTS
    ====================================
    */


    bindEvents(){



        const button =

        document.getElementById(

            "sendComment"

        );





        if(button){



            button.onclick = ()=>{


                this.submit();


            };


        }



    },









    /*
    ====================================
    SUBMIT COMMENT
    ====================================
    */


    async submit(){



        if(

            !NightCastAuth.isLoggedIn()

        ){



            if(window.NightCastUI){


                NightCastUI.toast(

                    "برای ارسال نظر ابتدا وارد شوید",

                    "warning"

                );


            }



            return;


        }







        const input =

        document.getElementById(

            "commentText"

        );







        if(

            !input ||

            !input.value.trim()

        ){



            return;


        }







        const result =

        await NightCastAPI.request(

            `/public/podcasts/${this.podcastId}/comments`,

            {

                method:"POST",

                headers:

                NightCastAPI.headers(true),

                body:JSON.stringify({

                    text:

                    input.value.trim()

                })

            }

        );







        if(

            result.success

        ){



            input.value="";





            if(window.NightCastUI){


                NightCastUI.toast(

                    "نظر شما ثبت شد",

                    "success"

                );


            }



            this.load();



        }

        else{



            if(window.NightCastUI){


                NightCastUI.toast(

                    "ثبت نظر انجام نشد",

                    "error"

                );


            }


        }



    }





};






window.NightCastComments =

NightCastComments;
