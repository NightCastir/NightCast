/* ==================================================

NightCast Audio Player V2

File:

users/js/player.js


Compatible With:

users/index.html


Features:

- Audio Control
- Play / Pause
- Progress
- Seek
- Volume
- Speed
- Queue Ready
- Local Storage History
- Mobile Bottom Player Sync
- Error Handling

================================================== */


const NightCastPlayer = {



    audio:null,

    current:null,

    queue:[],

    currentIndex:-1,





    /* ==========================================
    INIT
    ========================================== */


    init(){



        this.audio =

        document.getElementById(

            "nightcastAudio"

        );





        if(!this.audio){


            console.warn(

                "NightCast audio element not found"

            );


            return;


        }





        this.bindEvents();


        this.restoreVolume();


        console.log(

            "NightCast Player V2 Ready"

        );



    },









    /* ==========================================
    LOAD PODCAST
    ========================================== */


    play(podcast){



        if(!podcast){

            return;

        }






        if(!podcast.audio_url){



            this.toast(

                "فایل صوتی موجود نیست",

                "error"

            );


            return;


        }







        this.current = podcast;






        this.audio.src =

        podcast.audio_url;






        this.audio.load();






        this.audio.play()

        .catch(()=>{});






        this.updateInfo();


        this.saveHistory();



        this.show();



    },









    /* ==========================================
    UPDATE UI
    ========================================== */


    updateInfo(){



        if(!this.current)

        return;





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






        if(title)

        title.textContent =

        this.current.title ||

        "NightCast";







        if(author)

        author.textContent =

        this.current.author_name ||

        "NightCast";








        if(cover)

        cover.src =

        this.current.cover_url ||

        "/users/assets/images/default-cover.jpg";



    },









    /* ==========================================
    EVENTS
    ========================================== */


    bindEvents(){



        const playButton =

        document.getElementById(

            "playerPlayBtn"

        );





        if(playButton){



            playButton.onclick=()=>{


                this.toggle();


            };


        }







        const bottomPlay =

        document.getElementById(

            "bottomPlayButton"

        );






        if(bottomPlay){



            bottomPlay.onclick=()=>{


                this.toggle();


            };


        }







        this.audio.addEventListener(

            "play",

            ()=>{


                this.updatePlayState(true);


            }

        );








        this.audio.addEventListener(

            "pause",

            ()=>{


                this.updatePlayState(false);


            }

        );









        this.audio.addEventListener(

            "timeupdate",

            ()=>{


                this.updateProgress();


            }

        );








        this.audio.addEventListener(

            "loadedmetadata",

            ()=>{


                this.updateDuration();


            }

        );







        this.audio.addEventListener(

            "ended",

            ()=>{


                this.next();


            }

        );









        this.audio.addEventListener(

            "error",

            ()=>{


                this.toast(

                    "خطا در پخش فایل صوتی",

                    "error"

                );


            }

        );









        const progress =

        document.getElementById(

            "playerProgressContainer"

        );





        if(progress){



            progress.onclick=(event)=>{


                this.seek(event,progress);


            };


        }








        const volume =

        document.getElementById(

            "playerVolume"

        );






        if(volume){



            volume.oninput=()=>{


                this.audio.volume =

                volume.value;



                localStorage.setItem(

                    "NightCastVolume",

                    volume.value

                );


            };


        }








        const speed =

        document.getElementById(

            "speedButton"

        );







        if(speed){



            speed.onclick=()=>{


                this.changeSpeed(speed);


            };


        }








        const next =

        document.getElementById(

            "nextButton"

        );





        if(next){



            next.onclick=()=>{


                this.next();


            };


        }







        const previous =

        document.getElementById(

            "previousButton"

        );





        if(previous){



            previous.onclick=()=>{


                this.previous();


            };


        }


    },









    /* ==========================================
    TOGGLE
    ========================================== */


    toggle(){



        if(!this.audio.src)

        return;






        if(this.audio.paused){


            this.audio.play();


        }

        else{


            this.audio.pause();


        }


    },









    /* ==========================================
    PLAY ICON
    ========================================== */


    updatePlayState(state){



        const icon =

        document.querySelector(

            "#playerPlayBtn i"

        );





        const bottomIcon =

        document.querySelector(

            "#bottomPlayButton i"

        );







        const className = state

        ?

        "fa-solid fa-pause"

        :

        "fa-solid fa-play";






        if(icon)

        icon.className = className;






        if(bottomIcon)

        bottomIcon.className = className;



    },









    /* ==========================================
    PROGRESS
    ========================================== */


    updateProgress(){



        if(!this.audio.duration)

        return;





        const percent =

        (

            this.audio.currentTime /

            this.audio.duration

        ) * 100;







        const bar =

        document.getElementById(

            "playerProgressBar"

        );






        if(bar)

        bar.style.width =

        percent+"%";








        const current =

        document.getElementById(

            "playerCurrentTime"

        );





        if(current)

        current.textContent =

        this.formatTime(

            this.audio.currentTime

        );



    },








    updateDuration(){



        const duration =

        document.getElementById(

            "playerDuration"

        );





        if(duration)

        duration.textContent =

        this.formatTime(

            this.audio.duration

        );


    },









    seek(event,element){



        if(!this.audio.duration)

        return;






        const rect =

        element.getBoundingClientRect();





        const percent =

        (

            event.clientX -

            rect.left

        )

        /

        rect.width;







        this.audio.currentTime =

        this.audio.duration *

        percent;



    },









    /* ==========================================
    SPEED
    ========================================== */


    changeSpeed(button){



        const speeds =

        [

            1,

            1.25,

            1.5,

            2

        ];






        let index =

        speeds.indexOf(

            this.audio.playbackRate

        );





        index++;






        if(index>=speeds.length)

        index=0;







        this.audio.playbackRate =

        speeds[index];





        button.textContent =

        speeds[index]+"x";


    },









    /* ==========================================
    NEXT / PREVIOUS
    ========================================== */


    next(){



        if(

            this.currentIndex <

            this.queue.length-1

        ){



            this.currentIndex++;


            this.play(

                this.queue[this.currentIndex]

            );


        }


    },






    previous(){



        if(

            this.audio.currentTime > 5

        ){


            this.audio.currentTime=0;


            return;


        }






        if(this.currentIndex>0){



            this.currentIndex--;


            this.play(

                this.queue[this.currentIndex]

            );


        }


    },









    /* ==========================================
    STORAGE
    ========================================== */


    saveHistory(){



        if(!this.current)

        return;






        localStorage.setItem(

            "NightCastLastPodcast",

            JSON.stringify(

                this.current

            )

        );


    },






    restoreVolume(){



        const volume =

        localStorage.getItem(

            "NightCastVolume"

        );





        if(volume)

        this.audio.volume = volume;


    },









    /* ==========================================
    SHOW
    ========================================== */


    show(){



        const player =

        document.getElementById(

            "nightcastPlayer"

        );





        if(player)

        player.classList.add(

            "active"

        );


    },









    formatTime(seconds){



        if(

            !seconds ||

            isNaN(seconds)

        )

        return "00:00";






        const m =

        Math.floor(

            seconds/60

        );





        const s =

        Math.floor(

            seconds%60

        );






        return (

            String(m).padStart(2,"0")

            +

            ":"

            +

            String(s).padStart(2,"0")

        );


    },









    toast(message,type){



        if(window.NightCastUI){


            NightCastUI.toast(

                message,

                type

            );


        }

        else{


            console.log(message);


        }


    }




};







window.NightCastPlayer =

NightCastPlayer;





document.addEventListener(

"DOMContentLoaded",

()=>{


    NightCastPlayer.init();


});





console.log(

"NightCast Player V2 Loaded"

);
