/*
──────────────────────────────────────────────
NightCast V2
Global Audio Player
──────────────────────────────────────────────
*/


const Player = {


    audio: null,


    current: null,



    init(){


        this.audio =
            document.getElementById(
                "audio-player"
            );



        if(!this.audio){

            console.error(
                "Audio player not found"
            );

            return;

        }


    },






    play(url){



        if(!url){

            return;

        }



        if(this.current !== url){


            this.audio.src = url;


            this.current = url;


        }



        this.audio.play();



    },





    pause(){


        if(this.audio){

            this.audio.pause();

        }


    },





    stop(){


        if(this.audio){


            this.audio.pause();

            this.audio.currentTime = 0;


        }


    }



};



