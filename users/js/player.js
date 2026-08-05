/* ==================================================
   NightCast Audio Player Engine
   File: /users/js/player.js
   Version: 1.0
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

"nightcastAudio"

);





if(!this.audio){

return;

}





this.bindEvents();



},







/*
====================================
PLAY PODCAST
====================================
*/


play(podcast){



if(!this.audio){

return;

}




this.current = podcast;




this.audio.src =

podcast.audio_url;






this.audio.play();





this.updateInfo();



},







/*
====================================
PAUSE
====================================
*/


pause(){



if(this.audio){



this.audio.pause();



}



},








/*
====================================
TOGGLE
====================================
*/


toggle(){



if(!this.audio){

return;

}





if(this.audio.paused){



this.audio.play();



}

else{


this.audio.pause();


}



},







/*
====================================
STOP
====================================
*/


stop(){



if(this.audio){



this.audio.pause();


this.audio.currentTime=0;



}



},








/*
====================================
CHANGE SPEED
====================================
*/


speed(value){



if(this.audio){



this.audio.playbackRate =

value;



}



},







/*
====================================
UPDATE INFO
====================================
*/


updateInfo(){



if(!this.current){

return;

}




const title =

document.getElementById(

"playerTitle"

);





const cover =

document.getElementById(

"playerCover"

);





if(title){



title.textContent =

this.current.title;



}




if(cover){



cover.src =

this.current.cover_url ||

"/users/assets/default-cover.jpg";



}




},







/*
====================================
EVENTS
====================================
*/


bindEvents(){



this.audio.addEventListener(

"timeupdate",

()=>{


this.updateProgress();



});






this.audio.addEventListener(

"ended",

()=>{


this.stop();



});





},







/*
====================================
PROGRESS
====================================
*/


updateProgress(){



const bar =

document.getElementById(

"playerProgress"

);



const time =

document.getElementById(

"playerTime"

);





if(!this.audio.duration){

return;

}





const percent =

(

this.audio.currentTime /

this.audio.duration

)

*

100;






if(bar){



bar.style.width =

percent+"%";



}






if(time){



time.textContent =



NightCastUI.formatTime(

this.audio.currentTime

)

+

" / "

+

NightCastUI.formatTime(

this.audio.duration

);



}





},







/*
====================================
SEEK
====================================
*/


seek(event){



if(!this.audio){

return;

}




const width =

event.currentTarget.offsetWidth;




const clickX =

event.offsetX;




const duration =

this.audio.duration;




this.audio.currentTime =

(

clickX / width

)

*

duration;



},







/*
====================================
VOLUME
====================================
*/


volume(value){



if(this.audio){



this.audio.volume =

value;



}



},







/*
====================================
DOWNLOAD CURRENT
====================================
*/


download(){



if(

this.current &&

this.current.audio_url

){



window.open(

this.current.audio_url,

"_blank"

);



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
