/* =====================
   NIGHTCAST UI MANAGER
===================== */



const NightCastUI = {



/*
 CREATE TOAST
*/


toast(
message,
type="success"
){



const container =

document.querySelector(
".nc-toast-container"
);



if(!container){

return;

}





const toast =

document.createElement(
"div"
);



toast.className =

"nc-toast nc-toast-" + type;




toast.innerHTML = message;



container.appendChild(toast);





setTimeout(()=>{


toast.remove();


},4000);



},





/*
 SUCCESS
*/


success(message){


this.toast(
message,
"success"
);


},





/*
 ERROR
*/


error(message){


this.toast(
message,
"error"
);


},





/*
 LOADING
*/


showLoading(){



const loader =

document.createElement(
"div"
);



loader.id=

"nc-loading";



loader.className=

"nc-loading";



loader.innerHTML=`

<div class="nc-spinner"></div>

`;



document.body.appendChild(loader);



},






hideLoading(){



const loader =

document.getElementById(
"nc-loading"
);



if(loader){

loader.remove();

}



}




};
