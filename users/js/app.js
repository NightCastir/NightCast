/* ==================================================
   NightCast User Application Controller
   File: /users/js/app.js
   Version: 2.0
================================================== */


const NightCastApp = {



/*
====================================
INIT APPLICATION
====================================
*/


async init(){


console.log(
"NightCast User App Starting..."
);



try{


// Auth

if(
window.NightCastAuth &&
typeof NightCastAuth.init === "function"
){

await NightCastAuth.init();

}




// Player

if(
window.NightCastPlayer &&
typeof NightCastPlayer.init === "function"
){

NightCastPlayer.init();

}




// Podcasts

if(
window.NightCastPodcasts &&
typeof NightCastPodcasts.init === "function"
){

NightCastPodcasts.init();

}





// UI

this.bindGlobalEvents();




console.log(
"NightCast User App Ready"
);



}

catch(error){


console.error(
"NightCast App Error:",
error
);


}





},







/*
====================================
GLOBAL EVENTS
====================================
*/


bindGlobalEvents(){



/*
LOGIN BUTTON
*/


const loginSubmit =
document.getElementById(
"userLoginSubmit"
);



if(loginSubmit){


loginSubmit.onclick = async ()=>{


const username =
document.getElementById(
"userLoginUsername"
).value.trim();



const password =
document.getElementById(
"userLoginPassword"
).value;



if(
!username ||
!password
){


NightCastUI.showMessage(
"نام کاربری و رمز عبور را وارد کنید"
);


return;

}



const result =
await NightCastAuth.login(
username,
password
);



if(result.success){


NightCastUI.showMessage(
"ورود موفق بود"
);



document
.getElementById(
"loginPopup"
)
.classList.add(
"hidden"
);



location.reload();



}

else{


NightCastUI.showMessage(
result.message ||
"ورود ناموفق بود"
);



}



};



}









/*
PLAYER BUTTONS
*/


const playBtn =
document.getElementById(
"playerPlayBtn"
);



if(playBtn){


playBtn.onclick=()=>{


NightCastPlayer.toggle();


};



}





const pauseBtn =
document.getElementById(
"playerPauseBtn"
);



if(pauseBtn){


pauseBtn.onclick=()=>{


NightCastPlayer.pause();


};


}









/*
LOGIN POPUP
*/


const loginBtn =
document.getElementById(
"loginBtn"
);



const popup =
document.getElementById(
"loginPopup"
);



if(loginBtn && popup){



loginBtn.onclick=()=>{


popup.classList.remove(
"hidden"
);


};



}






const close =
document.getElementById(
"closeLogin"
);



if(close){


close.onclick=()=>{


popup.classList.add(
"hidden"
);


};


}








/*
OUTSIDE CLICK POPUP CLOSE
*/


document
.querySelectorAll(".popup")
.forEach(
popup=>{


popup.addEventListener(
"click",
(e)=>{


if(e.target===popup){


popup.classList.add(
"hidden"
);


}


});


});






}






};





window.NightCastApp =
NightCastApp;







document.addEventListener(
"DOMContentLoaded",
()=>{


NightCastApp.init();


});
