/* ==================================================

NightCast User Audio Player V1

File:
 /users/js/player.js

Responsibility:
 ONLY AUDIO PLAYER

Depends on:
 api.js
 auth.js
 ui.js

================================================== */


const NightCastPlayer = {


    audio:null,

    currentPodcast:null,





    init(){


        this.audio =
        document.getElementById(
            "nightcastAudio"
        );



        if(!this.audio){

            console.warn(
                "Audio element not found"
            );

            return;

        }



        this.bindEvents();


        console.log(
            "NightCast Player Loaded"
        );


    },









    bindEvents(){



        const playBtn =
        document.getElementById(
            "playerPlayBtn"
        );



        if(playBtn){


            playBtn.onclick = ()=>{

                this.toggle();

            };


        }







        const volume =
        document.getElementById(
            "playerVolume"
        );



        if(volume){


            volume.oninput = ()=>{


                this.audio.volume =
                volume.value;


            };


        }








        const speed =
        document.getElementById(
            "speedButton"
        );



        if(speed){


            speed.onclick = ()=>{


                this.changeSpeed();


            };


        }







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



    },









    load(podcast){



        if(!podcast){

            return;

        }





        this.currentPodcast =
        podcast;





        this.audio.src =
        podcast.audio_url ||
        podcast.audio ||
        "";





        this.updateInfo();





    },









    play(){



        if(!this.audio.src){


            if(window.NightCastUI){

                NightCastUI.toast(
                    "فایل صوتی موجود نیست",
                    "error"
                );

            }


            return;

        }




        this.audio.play();

        this.updateButton(true);


    },









    pause(){


        this.audio.pause();


        this.updateButton(false);


    },









    toggle(){



        if(this.audio.paused){


            this.play();


        }

        else{


            this.pause();


        }


    },









    updateButton(state){



        const btn =
        document.getElementById(
            "playerPlayBtn"
        );



        if(!btn){

            return;

        }



        btn.innerHTML = state

        ?

        `<i class="fa-solid fa-pause"></i>`

        :

        `<i class="fa-solid fa-play"></i>`;


    },









    updateInfo(){



        if(!this.currentPodcast){

            return;

        }





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

            title.innerText =
            this.currentPodcast.title ||
            "NightCast";

        }





        if(author){

            author.innerText =
            this.currentPodcast.author ||
            "NightCast";

        }





        if(cover){


            cover.src =

            this.currentPodcast.cover ||

            "/users/assets/images/default-cover.jpg";


        }



    },









    updateProgress(){



        const bar =
        document.getElementById(
            "playerProgressBar"
        );



        const current =
        document.getElementById(
            "playerCurrentTime"
        );





        if(!bar){

            return;

        }





        const percent =

        (

            this.audio.currentTime /

            this.audio.duration

        )

        *

        100;





        bar.style.width =

        percent + "%";





        if(current){


            current.innerText =
            this.formatTime(
                this.audio.currentTime
            );


        }


    },









    updateDuration(){



        const duration =
        document.getElementById(
            "playerDuration"
        );



        if(duration){


            duration.innerText =

            this.formatTime(
                this.audio.duration
            );


        }


    },









    seek(percent){



        if(!this.audio.duration){

            return;

        }




        this.audio.currentTime =

        this.audio.duration *

        percent;


    },









    changeSpeed(){



        const speeds = [

            1,

            1.25,

            1.5,

            2

        ];




        let current =

        this.audio.playbackRate;





        let index =

        speeds.indexOf(current);





        index++;





        if(index >= speeds.length){

            index=0;

        }





        this.audio.playbackRate =

        speeds[index];





        const btn =
        document.getElementById(
            "speedButton"
        );



        if(btn){

            btn.innerText =
            speeds[index]+"x";

        }



    },









    download(){



        if(
            !window.NightCastAuth ||
            !NightCastAuth.isLoggedIn()
        ){


            if(window.NightCastUI){

                NightCastUI.toast(
                    "برای دانلود ابتدا وارد شوید",
                    "warning"
                );

            }


            return;


        }






        if(!this.currentPodcast){

            return;

        }





        window.location.href =

        this.currentPodcast.download_url ||

        "/api/download/"+this.currentPodcast.id;



    },









    formatTime(seconds){



        if(
            !seconds ||
            isNaN(seconds)
        ){

            return "00:00";

        }




        let min =

        Math.floor(
            seconds / 60
        );



        let sec =

        Math.floor(
            seconds % 60
        );





        return (

            min < 10
            ?

            "0"+min

            :

            min

        )

        +

        ":"


        +

        (

            sec < 10

            ?

            "0"+sec

            :

            sec

        );


    }




};






window.NightCastPlayer =
NightCastPlayer;





document.addEventListener(

"DOMContentLoaded",

()=>{


    NightCastPlayer.init();


}

);
