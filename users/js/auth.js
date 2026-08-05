/* ==================================================
   NightCast User Authentication
   File: /users/js/auth.js
   Version: 1.0
================================================== */



const NightCastAuth = {





/*
====================================
CURRENT USER
====================================
*/


user:null,







/*
====================================
INIT AUTH
====================================
*/


async init(){



const token =

NightCastAPI.getToken();



if(!token){


this.guestMode();


return;


}




const result =

await NightCastAPI.me();





if(

result.success &&

result.user

){



this.user =

result.user;



this.loggedMode();



}

else{


NightCastAPI.removeToken();


this.guestMode();


}



},







/*
====================================
GUEST MODE
====================================
*/


guestMode(){



const panel =

document.getElementById(

"userPanel"

);



if(panel){


panel.classList.add(

"hidden"

);


}



},







/*
====================================
LOGGED MODE
====================================
*/


loggedMode(){



const panel =

document.getElementById(

"userPanel"

);



if(panel){



panel.classList.remove(

"hidden"

);



}






const name =

document.getElementById(

"userName"

);



if(name){



name.textContent =

this.user.full_name ||

this.user.username;



}






const role =

document.getElementById(

"userRole"

);



if(role){



role.textContent =

this.user.role ||

"listener";



}



},







/*
====================================
LOGIN
====================================
*/


async login(

username,

password

){



const result =

await NightCastAPI.login(

username,

password

);





if(

result.success

){



this.user =

result.user;



this.loggedMode();



}




return result;



},







/*
====================================
REGISTER
====================================
*/


async register(data){



return await NightCastAPI.register(

data

);


},







/*
====================================
LOGOUT
====================================
*/


async logout(){



await NightCastAPI.logout();



this.user = null;



this.guestMode();





location.reload();



},







/*
====================================
CHECK LOGIN
====================================
*/


requireLogin(){



if(

!NightCastAPI.isLoggedIn()

){



const popup =

document.getElementById(

"loginPopup"

);



if(popup){



popup.classList.remove(

"hidden"

);



}



return false;



}



return true;



}






};







/*
====================================
GLOBAL
====================================
*/


window.NightCastAuth = NightCastAuth;








/*
====================================
AUTO START
====================================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{


NightCastAuth.init();



});
