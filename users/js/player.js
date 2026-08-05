/* ==================================================

NightCast User Audio Player V2

File:
 /users/js/player.js


Responsibility:

ONLY AUDIO PLAYER


Depends:

api.js
auth.js
ui.js


================================================== */


const NightCastPlayer = {


    audio:null,

    currentPodcast:null,

    isReady:false,





    init(){



        this.audio =

        document.getElementById(

            "nightcastAudio"

        );





        if(!this.audio){

            console.warn(

                "Audio element missing"

            );

            return;

        }







        this.bindEvents();





        this.isReady=true;





        console.log(

            "🎧 NightCast Player Ready"

        );



    },









    bindEvents(){



        const play =

        document.getElementById(

            "playerPlayBtn"

        );





        if(play){


            play.onclick = ()=>{

                this.toggle();

            };


        }









        const progress =

        document.getElementById(

            "playerProgress"

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




                this.seek(percent);



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


            };


        }









        const speed =

        document.getElementById(

            "speedButton"

        );





        if(speed){


            speed.onclick=()=>{

                this.changeSpeed();

            };


        }









        this.audio.onplay=()=>{


            this.updateButton(true);


        };





        this.audio.onpause=()=>{


            this.updateButton(false);


        };









        this.audio.ontimeupdate=()=>{


            this.updateProgress();


        };








        this.audio.onloadedmetadata=()=>{


            this.updateDuration();


        };



    },









    load(podcast){



        if(!podcast){

            return;

        }






        this.currentPodcast=

        podcast;







        this.audio.src =

        podcast.audio_url ||

        podcast.audio ||

        "";







        this.updateInfo();



    },









    play(){



        if(!this.audio.src){



            NightCastUI.toast(

                "فایل صوتی موجود نیست",

                "error"

            );

            return;

        }






        this.audio.play();



    },









    pause(){


        this.audio.pause();


    },









    toggle(){



        if(this.audio.paused){


            this.play();


        }

        else{


            this.pause();


        }


    },









    updateButton(active){



        const btn =

        document.getElementById(

            "playerPlayBtn"

        );





        if(!btn){

            return;

        }






        btn.innerHTML = active

        ?

        `<i class="fa-solid fa-pause"></i>`

        :

        `<i class="fa-solid fa-play"></i>`;



    },









    updateInfo(){



        if(!this.currentPodcast)

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

        title.innerText =

        this.currentPodcast.title;







        if(author)

        author.innerText =

        this.currentPodcast.author ||

        "NightCast";







        if(cover)

        cover.src =

        this.currentPodcast.cover ||

        "/users/assets/images/default-cover.jpg";



    },









    updateProgress(){



        if(

            !this.audio.duration

        )

        return;







        const percent =

        (

        this.audio.currentTime /

        this.audio.duration

        )

        *

        100;







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

        current.innerText =

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

        duration.innerText =

        this.formatTime(

            this.audio.duration

        );



    },









    seek(percent){



        if(

            !this.audio.duration

        )

        return;





        this.audio.currentTime =

        this.audio.duration *

        percent;



    },









    changeSpeed(){



        const values=[

            1,

            1.25,

            1.5,

            2

        ];





        let index=

        values.indexOf(

            this.audio.playbackRate

        );





        index++;





        if(index>=values.length)

        index=0;







        this.audio.playbackRate=

        values[index];







        const btn=

        document.getElementById(

            "speedButton"

        );





        if(btn)

        btn.innerText=

        values[index]+"x";



    },









    async download(){



        if(

            !NightCastAuth.isLoggedIn()

        ){



            NightCastAuth.openLogin();

            return;


        }







        if(

            !this.currentPodcast

        )

        return;








        const result=

        await NightCastAPI.download(

            this.currentPodcast.id

        );








        if(result.success){


            window.location.href=

            result.url;


        }



    },









    formatTime(sec){



        if(

            !sec ||

            isNaN(sec)

        )

        return "00:00";







        let m=

        Math.floor(sec/60);



        let s=

        Math.floor(sec%60);






        return (

            m<10?"0"+m:m

        )

        +

        ":"+

        (

            s<10?"0"+s:s

        );



    }





};







window.NightCastPlayer=

NightCastPlayer;
