
/*
=================================================

NightCast User Authentication

Responsible for:

- User Session
- Token Management
- Guest Access
- Protected Actions

=================================================
*/


"use strict";






class UserAuth {



constructor(){



    this.user = null;

    this.token =

    localStorage.getItem(

        "NightCastToken"

    );



}









/*
==========================
INIT USER
==========================
*/


async init(){



try{



if(!this.token){



    this.setGuest();


    return;


}







const result =

await API.get(

"/auth/me"

);







if(

result &&

result.success

){



this.user =

result.user;







localStorage.setItem(

"NightCastUser",

JSON.stringify(

this.user

)

);



}

else{


this.logoutLocal();


}



}

catch(error){



console.error(

"AUTH INIT ERROR",

error

);



this.logoutLocal();



}



}









/*
==========================
IS LOGIN
==========================
*/


isLoggedIn(){



return !!this.token;



}









/*
==========================
GET USER
==========================
*/


getUser(){



return this.user;



}









/*
==========================
SET GUEST
==========================
*/


setGuest(){



this.user = null;



}









/*
==========================
REQUIRE LOGIN

برای عملیات حساس

==========================
*/


requireLogin(){



if(

!this.isLoggedIn()

){



this.redirectLogin();



return false;



}



return true;



}









/*
==========================
REDIRECT LOGIN
==========================
*/


redirectLogin(){



window.location.href =

"login.html";



}









/*
==========================
LOGOUT
==========================
*/


async logout(){



try{



await API.post(

"/auth/logout",

{}

);



}

catch(error){



console.error(

"LOGOUT ERROR",

error

);



}

finally{



this.logoutLocal();



}



}









/*
==========================
LOCAL LOGOUT
==========================
*/


logoutLocal(){



localStorage.removeItem(

"NightCastToken"

);




localStorage.removeItem(

"NightCastUser"

);



this.token=null;



this.user=null;



}
  // ==========================
// CHECK DOWNLOAD ACCESS
// ==========================
//
// دانلود فقط برای کاربران ثبت‌نام شده
// ==========================


canDownload(){



if(

!this.isLoggedIn()

){



this.redirectLogin();


return false;


}




return true;



}









/*
==========================
CHECK COMMENT ACCESS

نظردهی فقط برای کاربران عضو
==========================
*/


canComment(){



if(

!this.isLoggedIn()

){



this.redirectLogin();


return false;


}



return true;



}









/*
==========================
GET TOKEN
==========================
*/


getToken(){



return localStorage.getItem(

"NightCastToken"

);



}









/*
==========================
GET USER NAME
==========================
*/


getUserName(){



if(

this.user &&

this.user.full_name

){



return this.user.full_name;



}





const saved =

localStorage.getItem(

"NightCastUser"

);







if(saved){



try{



const user =

JSON.parse(saved);





return user.full_name || 

user.username || 

"کاربر";



}

catch(e){



return "کاربر";



}



}





return "مهمان";



}









/*
==========================
UPDATE HEADER USER

برای index.html
==========================
*/


updateUserUI(){



const name =

document.getElementById(

"username"

);






if(name){



name.innerText =

this.getUserName();



}









const loginButtons =

document.querySelectorAll(

".guest-only"

);








const userButtons =

document.querySelectorAll(

".user-only"

);







if(this.isLoggedIn()){



loginButtons.forEach(

item=>{


item.style.display="none";


}

);







userButtons.forEach(

item=>{


item.style.display="block";


}

);





}

else{



loginButtons.forEach(

item=>{


item.style.display="block";


}

);






userButtons.forEach(

item=>{


item.style.display="none";


}

);



}



}









/*
==========================
AUTO INIT
==========================
*/


document.addEventListener(

"DOMContentLoaded",

async()=>{



window.userAuth =

new UserAuth();




await userAuth.init();




userAuth.updateUserUI();



});
