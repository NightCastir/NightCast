/* =====================================
   NightCast v1.0
   Aparat Dynamic Episode
===================================== */


document.addEventListener("DOMContentLoaded", ()=>{


    const container = document.getElementById("aparat-video");


    if(!container) return;



    fetch("data/aparat.json")


    .then(response=>response.json())


    .then(data=>{


        if(!data || !data.title){

            container.innerHTML =
            `
            <div class="loading">
            هنوز اپیزودی ثبت نشده است.
            </div>
            `;

            return;

        }



        container.innerHTML =

        `

        <div class="aparat-content">


            <div class="aparat-icon">

                🎙️

            </div>


            <div>


                <h3>
                    ${data.title}
                </h3>


                <p>

                ${data.description || "آخرین خلاصه کتاب منتشر شده در NightCast"}

                </p>


                <small>

                ${data.date || ""}

                </small>


                <br>


                <a 
                class="btn"
                href="${data.url}"
                target="_blank">

                مشاهده در آپارات

                </a>


            </div>



        </div>

        `;



    })


    .catch(error=>{


        console.error(
            "Aparat feed error:",
            error
        );


        container.innerHTML=

        `

        <div class="loading">

        خطا در دریافت اپیزود جدید

        </div>

        `;


    });



});
