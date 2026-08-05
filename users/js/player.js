/* ==================================================
   NightCast Audio Player Engine
   File: /users/js/player.js
   Version: 2.0
================================================== */


const NightCastPlayer = {


audio:null,

current:null,



init(){


this.audio = document.getElementById(
"nightcastAudio"
);


if(!this.audio){

console.error(
"NightCast Audio element not found"
);

return;

}


this.bindEvents();


},




play(podcast){


if(!this.audio || !podcast){

return;

}


if(!podcast.audio_url){

NightCastUI.showToast(
"فایل صوتی موجود نیست"
);

return;

}


this.current = podcast;


this.audio.src =
podcast.audio_url;


this.audio.load();


this.audio.play()

.then(()=>{


this.updateInfo();


})

.catch(error=>{


console.error(
"Audio Play Error:",
error
);


NightCastUI.showToast(
"پخش صوت امکان‌پذیر نیست"
);


});


},





pause(){


if(this.audio){

this.audio.pause();

}


},





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





stop(){


if(this.audio){

this.audio.pause();

this.audio.currentTime=0;

}


},






updateInfo(){


if(!this.current){

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

title.textContent =
this.current.title || "NightCast";

}



if(author){

author.textContent =
this.current.author_name || "رادیو NightCast";

}



if(cover){

cover.src =
this.current.cover_url ||

"/users/assets/default-cover.jpg";

}



},







bindEvents(){



const playBtn =
document.getElementById(
"playerPlayBtn"
);



const pauseBtn =
document.getElementById(
"playerPauseBtn"
);




if(playBtn){

playBtn.onclick=()=>{

this.toggle();

};

}




if(pauseBtn){

pauseBtn.onclick=()=>{

this.pause();

};

}







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







updateProgress(){



if(
!this.audio ||
!this.audio.duration
){

return;

}




const percent =
(
this.audio.currentTime /
this.audio.duration
)*100;



const bar =
document.getElementById(
"playerProgressBar"
);



if(bar){

bar.style.width =
percent+"%";

}




},







seek(event){


if(!this.audio){

return;

}


const width =
event.currentTarget.offsetWidth;


const click =
event.offsetX;


this.audio.currentTime =
(click / width) *
this.audio.duration;



},






volume(value){


if(this.audio){

this.audio.volume=value;

}


},






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
