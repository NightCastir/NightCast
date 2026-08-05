/* ==================================================

NightCast Search Manager V1

File:
 /users/js/features/search.js


Responsibility:

- Header Search
- Local Search
- Search Result UI


Depends:

ui.js
podcasts.js


================================================== */


const NightCastSearch = {



    input:null,


    resultBox:null,





    /*
    ====================================
    INIT
    ====================================
    */


    init(){



        this.input =

        document.getElementById(

            "searchInput"

        );





        if(!this.input){


            console.warn(

                "Search input not found"

            );


            return;


        }





        this.createResultBox();



        this.bindEvents();





        console.log(

            "NightCast Search Loaded"

        );



    },









    /*
    ====================================
    CREATE RESULT BOX
    ====================================
    */


    createResultBox(){



        this.resultBox =

        document.createElement(

            "div"

        );





        this.resultBox.className =

        "search-results";





        this.input.parentElement.appendChild(

            this.resultBox

        );



    },









    /*
    ====================================
    EVENTS
    ====================================
    */


    bindEvents(){



        this.input.addEventListener(

            "input",

            ()=>{


                this.search(

                    this.input.value.trim()

                );


            }


        );





        document.addEventListener(

            "click",

            (e)=>{



                if(

                    !this.resultBox.contains(e.target)

                    &&

                    e.target !== this.input

                ){


                    this.hide();


                }



            }


        );



    },









    /*
    ====================================
    SEARCH ENGINE
    ====================================
    */


    search(keyword){



        if(!keyword){


            this.hide();


            return;


        }





        if(

            !window.NightCastPodcasts

        ){


            return;


        }







        const data =

        NightCastPodcasts.podcasts;








        const results =

        data.filter(

            item=>{


                const title =

                (

                    item.title ||

                    ""

                ).toLowerCase();





                const author =

                (

                    item.author ||

                    ""

                ).toLowerCase();





                const text =

                keyword.toLowerCase();





                return (

                    title.includes(text)

                    ||

                    author.includes(text)

                );



            }


        );







        this.render(results);



    },









    /*
    ====================================
    RENDER RESULTS
    ====================================
    */


    render(results){



        this.resultBox.innerHTML = "";






        if(results.length===0){



            this.resultBox.innerHTML =

            `

            <div class="search-empty">

            نتیجه‌ای پیدا نشد

            </div>

            `;



            this.show();


            return;


        }








        results.slice(0,5)

        .forEach(

            podcast=>{





                const item =

                document.createElement(

                    "div"

                );






                item.className =

                "search-item";






                item.innerHTML =


                `

                <img

                src="${

                podcast.cover ||

                '/users/assets/images/default-cover.jpg'

                }">



                <div>


                <strong>

                ${podcast.title}

                </strong>


                <small>

                ${podcast.author || "NightCast"}

                </small>


                </div>

                `;








                item.onclick = ()=>{


                    if(

                        window.NightCastPlayer

                    ){



                        NightCastPlayer.load(

                            podcast

                        );


                        NightCastPlayer.play();



                    }



                    this.hide();



                };






                this.resultBox.appendChild(

                    item

                );



            }


        );







        this.show();



    },









    /*
    ====================================
    SHOW / HIDE
    ====================================
    */


    show(){



        this.resultBox.classList.add(

            "active"

        );



    },








    hide(){



        if(this.resultBox){


            this.resultBox.classList.remove(

                "active"

            );


        }


    }






};








window.NightCastSearch =

NightCastSearch;
