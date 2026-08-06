/* ==================================================

NightCast Audio Player V2

File:
users/js/player.js

Responsibility:
- Audio control
- Play / Pause
- Progress
- Volume
- Speed
- Queue
- Podcast integration

================================================== */


(function(){

"use strict";


// ================================
// PLAYER STATE
// ================================

const Player = {


audio:null,

current:null,

queue:[],

index:0,

speed:1,

isPlaying:false



};




// ================================
// DOM READY
// ================================

document.addEventListener(
"DOMContentLoaded",
initPlayer
);





function initPlayer(){


Player.audio =
document.getElementById(
"nightcastAudio"
);



if(!Player.audio){

console.error(
"NightCast Player: Audio element not found"
);

return;

}



bindEvents();


console.log(
"NightCast Player Ready"
);



}






// ================================
// EVENTS
// ================================


function bindEvents(){



const playBtn =
document.getElementById(
"playerPlayBtn"
);



if(playBtn){

playBtn.addEventListener(
"click",
togglePlay
);

}





const volume =
document.getElementById(
"playerVolume"
);



if(volume){

volume.addEventListener(
"input",
()=>{

Player.audio.volume =
volume.value;

}

);

}






const progress =
document.getElementById(
"playerProgressContainer"
);



if(progress){

progress.addEventListener(
"click",
seek
);

}





const speed =
document.getElementById(
"speedButton"
);



if(speed){

speed.addEventListener(
"click",
changeSpeed
);

}





Player.audio.addEventListener(
"timeupdate",
updateProgress
);




Player.audio.addEventListener(
"loadedmetadata",
()=>{

updateDuration();

}
);



Player.audio.addEventListener(
"ended",
playNext
);



}







// ================================
// LOAD PODCAST
// ================================


function loadPodcast(podcast){


if(!podcast || !podcast.audio_url){

console.error(
"Invalid podcast"
);

return;

}



Player.current =
podcast;



Player.audio.src =
podcast.audio_url;



const cover =
document.getElementById(
"playerCover"
);



if(cover){

cover.src =
podcast.cover_url ||
"/users/assets/images/default-cover.jpg";

}




const title =
document.getElementById(
"playerTitle"
);



if(title){

title.textContent =
podcast.title || "NightCast";

}




const author =
document.getElementById(
"playerAuthor"
);



if(author){

author.textContent =
podcast.author_name ||
"NightCast";

}



Player.audio.load();


play();



}







// ================================
// PLAY
// ================================


function play(){


Player.audio.play()
.then(()=>{


Player.isPlaying =
true;


updatePlayButton();


})
.catch(error=>{

console.log(
"Play blocked:",
error
);


});



}







// ================================
// PAUSE
// ================================


function pause(){


Player.audio.pause();


Player.isPlaying =
false;


updatePlayButton();



}







// ================================
// TOGGLE
// ================================


function togglePlay(){



if(!Player.current){

return;

}



if(Player.audio.paused){

play();

}

else{

pause();

}



}







// ================================
// BUTTON ICON
// ================================


function updatePlayButton(){



const icon =
document.getElementById(
"playerPlayIcon"
);



if(!icon){

return;

}



if(Player.isPlaying){

icon.className =
"fa-solid fa-pause";

}

else{

icon.className =
"fa-solid fa-play";

}



}








// ================================
// TIME FORMAT
// ================================


function formatTime(seconds){



if(!seconds || isNaN(seconds)){

return "00:00";

}



const min =
Math.floor(seconds / 60);



const sec =
Math.floor(seconds % 60);



return (

String(min)
.padStart(2,"0")

+

":"

+

String(sec)
.padStart(2,"0")

);


}







// ================================
// UPDATE PROGRESS
// ================================


function updateProgress(){



const current =
document.getElementById(
"playerCurrentTime"
);



if(current){

current.textContent =
formatTime(
Player.audio.currentTime
);

}




const percent =

(Player.audio.currentTime /
Player.audio.duration)
*
100;



const bar =
document.getElementById(
"playerProgressBar"
);



if(bar){

bar.style.width =
(percent || 0)
+
"%";

}




}







// ================================
// DURATION
// ================================


function updateDuration(){


const duration =
document.getElementById(
"playerDuration"
);



if(duration){

duration.textContent =
formatTime(
Player.audio.duration
);

}


}







// ================================
// SEEK
// ================================


function seek(e){


const box =
e.currentTarget;



const width =
box.clientWidth;



const click =
e.offsetX;



const percent =
click / width;



Player.audio.currentTime =

Player.audio.duration *
percent;



}







// ================================
// SPEED
// ================================


function changeSpeed(){


Player.speed += 0.5;


if(Player.speed > 2){

Player.speed = 0.5;

}



Player.audio.playbackRate =
Player.speed;



const btn =
document.getElementById(
"speedButton"
);



if(btn){

btn.textContent =
Player.speed+"x";

}



}







// ================================
// NEXT
// ================================


function playNext(){


if(
Player.queue.length === 0
){

pause();

return;

}



Player.index++;



if(
Player.index >= Player.queue.length
){

Player.index=0;

}



loadPodcast(

Player.queue[
Player.index
]

);



}






// ================================
// PREVIOUS
// ================================


function playPrevious(){



if(
Player.audio.currentTime > 5
){

Player.audio.currentTime=0;

return;

}



Player.index--;



if(Player.index < 0){

Player.index =
Player.queue.length-1;

}



if(Player.queue.length){

loadPodcast(
Player.queue[Player.index]
);

}



}






// ================================
// PUBLIC API
// ================================


window.NightCastPlayer = {


playPodcast:
loadPodcast,


play,
pause,


setQueue:function(list){


Player.queue =
list || [];


Player.index=0;


},


getCurrent:function(){

return Player.current;

}


};





})();
