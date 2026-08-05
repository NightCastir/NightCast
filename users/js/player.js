/* ==================================================

NightCast Audio Player V1

File:

/users/js/player.js


Responsibility:

- Audio Control
- Play Podcast
- Progress
- Volume
- Speed


Depends:

api.js


================================================== */


const NightCastPlayer = {



    audio:null,


    current:null,






    /*
    ====================================
    INIT
    ====================================
    */


    init(){



        this.audio =

        document.getElementById(

            "audioElement"

        );






        if(!this.audio){

            console.warn(

                "Audio element not found"

            );

            return;

        }






        this.bindEvents();




        console.log(

            "NightCast Player Ready"

        );



    },









    /*
    ====================================
    PLAY PODCAST
    ====================================
    */


    play(podcast){



        if(!podcast.audio_url){



            if(window.NightCastUI){


                NightCastUI.toast(

                    "فایل صوتی موجود نیست",

                    "error"

                );


            }



            return;


        }






        this.current = podcast;






        this.audio.src =

        podcast.audio_url;






        this.audio.play();






        this.updateInfo();






        this.show();



    },









    /*
    ====================================
    UPDATE PLAYER INFO
    ====================================
    */


    updateInfo(){



        const title =

        document.getElementById(

            "playerTitle"

        );



        const author =

        document.getElementById(

            "playerAuthor"

        );



        const cover =

        document.getElementById(

            "playerCover"

        );








        if(title){



            title.textContent =

            this.current.title || "NightCast";


        }






        if(author){



            author.textContent =

            this.current.author_name ||

            "NightCast";


        }






        if(cover){



            cover.src =

            this.current.cover_url ||

            "/users/assets/images/default-cover.jpg";


        }



    },









    /*
    ====================================
    CONTROLS
    ====================================
    */


    bindEvents(){



        const playBtn =

        document.getElementById(

            "playButton"

        );





        if(playBtn){



            playBtn.onclick=()=>{



                if(this.audio.paused){



                    this.audio.play();



                }

                else{



                    this.audio.pause();



                }



            };



        }








        this.audio.addEventListener(

            "play",

            ()=>{


                this.updatePlayIcon(true);


            }

        );






        this.audio.addEventListener(

            "pause",

            ()=>{


                this.updatePlayIcon(false);


            }

        );








        this.audio.addEventListener(

            "timeupdate",

            ()=>{


                this.updateProgress();


            }

        );








        const volume =

        document.getElementById(

            "volumeControl"

        );





        if(volume){



            volume.oninput=()=>{



                this.audio.volume =

                volume.value;



            };



        }








        const speed =

        document.getElementById(

            "speedButton"

        );





        if(speed){



            speed.onclick=()=>{



                const values =

                [

                    1,

                    1.25,

                    1.5,

                    2

                ];





                let index =

                values.indexOf(

                    this.audio.playbackRate

                );





                index++;





                if(index>=values.length)

                index=0;





                this.audio.playbackRate =

                values[index];






                speed.textContent =

                values[index]+"x";



            };



        }







        const progress =

        document.getElementById(

            "progressContainer"

        );





        if(progress){



            progress.onclick=(e)=>{



                const rect =

                progress.getBoundingClientRect();





                const percent =

                (

                    e.clientX -

                    rect.left

                )

                /

                rect.width;






                this.audio.currentTime =

                this.audio.duration *

                percent;



            };



        }



    },









    /*
    ====================================
    PROGRESS
    ====================================
    */


    updateProgress(){



        if(!this.audio.duration)

        return;






        const bar =

        document.getElementById(

            "progressBar"

        );






        if(bar){



            bar.style.width =


            (

                this.audio.currentTime /

                this.audio.duration *

                100

            )

            +

            "%";



        }






        const current =

        document.getElementById(

            "currentTime"

        );







        if(current){



            current.textContent =

            this.formatTime(

                this.audio.currentTime

            );


        }



    },









    /*
    ====================================
    ICON
    ====================================
    */


    updatePlayIcon(state){



        const btn =

        document.querySelector(

            "#playButton i"

        );






        if(!btn)

        return;






        btn.className = state

        ?

        "fa-solid fa-pause"

        :

        "fa-solid fa-play";



    },









    /*
    ====================================
    SHOW PLAYER
    ====================================
    */


    show(){



        const player =

        document.getElementById(

            "nightcastPlayer"

        );





        if(player){



            player.classList.add(

                "active"

            );



        }



    },









    /*
    ====================================
    TIME FORMAT
    ====================================
    */


    formatTime(seconds){



        if(!seconds || isNaN(seconds))

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

            String(min).padStart(2,"0")

            +

            ":"

            +

            String(sec).padStart(2,"0")

        );



    }




};







window.NightCastPlayer =

NightCastPlayer;






console.log(

"NightCast Player V1 Loaded"

);
