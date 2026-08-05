/* ==================================================
   NightCast User Application Controller
   File: /users/js/app.js
   Version: 1.0
================================================== */



const NightCastApp = {



version:"1.0",



ready:false,






/*
====================================
INITIALIZE APPLICATION
====================================
*/


async init(){



try{



console.log(

"🎙 NightCast User App Starting..."

);





// Start Authentication


if(

window.NightCastAuth

){


await NightCastAuth.init();


}





// Start Player


if(

window.NightCastPlayer

){


NightCastPlayer.init();


}






// Start Podcasts


if(

window.NightCastPodcasts

){



await NightCastPodcasts.init();



}







this.bindEvents();






this.ready=true;





console.log(

"✔ NightCast User App Ready"

);





}

catch(error){



console.error(

"NightCast Init Error:",

error

);



NightCastUI.error(

"خطا در راه‌اندازی برنامه"

);



}



},







/*
====================================
GLOBAL EVENTS
====================================
*/


bindEvents(){



/*
LOGIN BUTTON
*/


const loginBtn =

document.getElementById(

"loginBtn"

);




if(loginBtn){



loginBtn.onclick=()=>{


NightCastUI.openPopup(

"loginPopup"

);



};



}








/*
LOGOUT BUTTON
*/


const logoutBtn =

document.getElementById(

"logoutBtn"

);





if(logoutBtn){



logoutBtn.onclick=()=>{


NightCastAuth.logout();



};



}







/*
PLAYER CLICK
*/


document.addEventListener(

"click",

(e)=>{



const play =

e.target.closest(

".play-btn"

);



if(play){



console.log(

"Play clicked"

);



}



});






},







/*
====================================
SEARCH
====================================
*/


search(keyword){



if(

!keyword

){

return;

}



console.log(

"Search:",

keyword

);



// آینده:
// اتصال به API Search



},







/*
====================================
REFRESH USER DATA
====================================
*/


async refreshUser(){



if(

window.NightCastAuth

){



await NightCastAuth.init();



}



},







/*
====================================
APP INFO
====================================
*/


info(){



return {


name:"NightCast",

version:this.version,


mode:"User"



};



}



};








window.NightCastApp = NightCastApp;









/*
====================================
BOOT
====================================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{



NightCastApp.init();



});
