/* ==================================================
   NightCast User UI Manager
   File: /users/js/ui.js
   Version: 1.0
================================================== */



const NightCastUI = {




/*
====================================
SHOW TOAST
====================================
*/


toast(

message,

type="success"

){



const box =

document.getElementById(

"toast"

);



if(!box){

return;

}



box.textContent = message;



box.className =

"toast";




if(type==="error"){



box.style.background =

"#ff5555";



box.style.color =

"#fff";



}

else if(type==="info"){



box.style.background =

"#00d4ff";



box.style.color =

"#000";



}

else{



box.style.background =

"#00ff88";



box.style.color =

"#000";



}





setTimeout(()=>{



box.classList.remove(

"hidden"

);



},50);






setTimeout(()=>{



box.classList.add(

"hidden"

);



},3000);



},







/*
====================================
LOADER
====================================
*/


showLoader(){



const loader =

document.getElementById(

"globalLoader"

);



if(loader){



loader.classList.remove(

"hidden"

);



}



},






hideLoader(){



const loader =

document.getElementById(

"globalLoader"

);



if(loader){



loader.classList.add(

"hidden"

);



}



},









/*
====================================
OPEN POPUP
====================================
*/


openPopup(id){



const popup =

document.getElementById(id);



if(popup){



popup.classList.remove(

"hidden"

);



}



},







/*
====================================
CLOSE POPUP
====================================
*/


closePopup(id){



const popup =

document.getElementById(id);



if(popup){



popup.classList.add(

"hidden"

);



}



},







/*
====================================
CONFIRM LOGIN
====================================
*/


needLogin(){



this.toast(

"برای استفاده از این بخش ابتدا وارد شوید",

"info"

);



this.openPopup(

"loginPopup"

);



},







/*
====================================
SUCCESS MESSAGE
====================================
*/


success(message){



this.toast(

message,

"success"

);



},







/*
====================================
ERROR MESSAGE
====================================
*/


error(message){



this.toast(

message,

"error"

);



},







/*
====================================
FORMAT TIME
====================================
*/


formatTime(seconds){



if(!seconds){

return "00:00";

}



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



},







/*
====================================
EMPTY STATE
====================================
*/


showEmpty(id){



const element =

document.getElementById(id);



if(element){



element.classList.remove(

"hidden"

);



}



},







hide(id){



const element =

document.getElementById(id);



if(element){



element.classList.add(

"hidden"

);



}



}





};





window.NightCastUI = NightCastUI;








/*
====================================
GLOBAL EVENTS
====================================
*/


document.addEventListener(

"click",

(e)=>{



const close =

e.target.dataset.close;



if(close){



NightCastUI.closePopup(

close

);



}



});
