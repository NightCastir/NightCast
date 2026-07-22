/* =====================================
   NightCast v1.0
   Main JavaScript
===================================== */


document.addEventListener("DOMContentLoaded", () => {


    // سال خودکار فوتر

    const footerYear = document.querySelector("#year");


    if (footerYear) {

        footerYear.textContent = new Date().getFullYear();

    }



    // انیمیشن ورود عناصر

    const elements = document.querySelectorAll(
        ".category, .episode-card, .about"
    );


    const observer = new IntersectionObserver(
        (entries)=>{


            entries.forEach(entry=>{


                if(entry.isIntersecting){


                    entry.target.classList.add("show");


                    observer.unobserve(entry.target);


                }


            });


        },
        {
            threshold:.15
        }
    );



    elements.forEach(el=>{


        el.classList.add("hidden");

        observer.observe(el);


    });



});
