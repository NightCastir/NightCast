/*
=================================================

NightCast Profile Module

File:
users/js/features/profile.js


Responsibilities:

- User profile panel
- User information rendering
- Library navigation
- Logout handling


Dependencies:

- auth.js
- library.js
- ui.js


=================================================
*/


(function(){

"use strict";



window.NightCast =
window.NightCast || {};







const Profile = {





/*
=================================================
CONFIG
=================================================
*/


config:{


panelId:"profilePanel",


defaultName:"کاربر NightCast",


defaultUsername:"@username"



},







state:{


user:null,


isOpen:false


},







elements:{},







/*
=================================================
INIT
=================================================
*/


init(){



this.cacheElements();



this.bindEvents();



this.loadUser();



console.log(
"NightCast Profile Initialized"
);



},







/*
=================================================
CACHE DOM
=================================================
*/


cacheElements(){



this.elements.panel =
document.getElementById(
this.config.panelId
);




this.elements.name =
document.getElementById(
"profileName"
);




this.elements.username =
document.getElementById(
"profileUsername"
);






this.elements.logout =
document.getElementById(
"logoutButton"
);






},







/*
=================================================
EVENTS
=================================================
*/


bindEvents(){



/*
Profile open triggers
*/


document.querySelectorAll(
'[data-action="profile"]'
)
.forEach(btn=>{


btn.addEventListener(
"click",
()=>{


this.open();


});


});








if(this.elements.logout){



this.elements.logout.addEventListener(
"click",
()=>{


this.logout();


});


}






/*
Library buttons
*/


this.bindLibraryButtons();



},







/*
=================================================
LIBRARY BUTTONS
=================================================
*/


bindLibraryButtons(){



const map={



historyButton:"history",


favoritesButton:"favorites",


downloadsButton:"downloads",


savedButton:"saved"



};






Object.keys(map)
.forEach(id=>{



const button =
document.getElementById(id);





if(button){



button.addEventListener(
"click",
()=>{


this.openLibrary(
map[id]
);



});


}



});



},







/*
=================================================
LOAD USER
=================================================
*/


loadUser(){



try{



if(
window.NightCast &&
NightCast.Auth &&
NightCast.Auth.getUser
){



this.state.user =
NightCast.Auth.getUser();



}





this.render();



}
catch(error){



console.error(
"Profile User Load Error:",
error
);



}



},
    /*
=================================================
RENDER PROFILE
=================================================
*/


render(){



const user =
this.state.user;






if(
!user
){



if(this.elements.name){


this.elements.name.textContent =
this.config.defaultName;


}





if(this.elements.username){


this.elements.username.textContent =
this.config.defaultUsername;


}





return;



}







if(this.elements.name){


this.elements.name.textContent =

user.full_name ||

user.name ||

this.config.defaultName;



}







if(this.elements.username){


this.elements.username.textContent =

user.username
?
"@" + user.username
:
this.config.defaultUsername;



}



},







/*
=================================================
OPEN PROFILE PANEL
=================================================
*/


open(){



if(!this.elements.panel)
return;





this.elements.panel.classList.remove(
"hidden"
);



this.state.isOpen=true;



document.body.classList.add(
"profile-open"
);



},







/*
=================================================
CLOSE PROFILE PANEL
=================================================
*/


close(){



if(!this.elements.panel)
return;





this.elements.panel.classList.add(
"hidden"
);



this.state.isOpen=false;



document.body.classList.remove(
"profile-open"
);



},







/*
=================================================
TOGGLE PROFILE
=================================================
*/


toggle(){



if(this.state.isOpen){



this.close();



}
else{


this.open();


}



},







/*
=================================================
OPEN LIBRARY ITEM
=================================================
*/


openLibrary(type){



console.log(
"Profile Library:",
type
);







if(
window.NightCast &&
NightCast.Library
){



const data =
NightCast.Library.get(type);





console.log(
data
);



}





/*

در نسخه کامل:

Profile Page
یا
Library Modal

اینجا باز می‌شود

*/





},







/*
=================================================
REFRESH USER
=================================================
*/


refresh(){



this.loadUser();



this.render();



},







/*
=================================================
GET CURRENT USER
=================================================
*/


getUser(){



return this.state.user;



},







/*
=================================================
CHECK LOGIN
=================================================
*/


isLoggedIn(){



return !!this.state.user;



},
    /*
=================================================
LOGOUT
=================================================
*/


async logout(){



try{



/*
اول خروج از سرور
*/


if(
window.NightCast &&
NightCast.Auth &&
NightCast.Auth.logout
){


await NightCast.Auth.logout();


}





/*
پاک‌سازی وضعیت داخلی
*/


this.state.user =
null;



this.render();






/*
بستن پنل
*/


this.close();






/*
نمایش پیام
*/


if(
window.NightCast &&
NightCast.UI &&
NightCast.UI.toast
){



NightCast.UI.toast(

"با موفقیت خارج شدید"

);


}







/*
بازگشت به حالت مهمان

*/


const state =
document.getElementById(
"nightcastState"
);



if(state){


state.dataset.user =
"guest";


}





}
catch(error){



console.error(
"Logout Error:",
error
);




}






},







/*
=================================================
OPEN LOGIN
=================================================
*/


openLogin(){



const modal =
document.getElementById(
"authModal"
);





if(modal){



modal.classList.remove(
"hidden"
);



}



},







/*
=================================================
UPDATE AVATAR
=================================================
*/


setAvatar(image){



const avatar =
document.querySelector(
".profile-avatar img"
);





if(avatar){


avatar.src =
image;


}



},







/*
=================================================
DEBUG
=================================================
*/


debug(){



console.log(
"Profile State:",
this.state
);



}







};









/*
=================================================
EXPORT MODULE
=================================================
*/


window.NightCast.Profile =
Profile;





})();
