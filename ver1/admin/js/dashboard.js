
/* =====================
   NIGHTCAST DASHBOARD
===================== */



document.addEventListener(
"DOMContentLoaded",
async function(){



// =====================
// CHECK AUTH
// =====================


const admin =

await NightCastAuth.check();





if(!admin){

return;

}





// =====================
// SHOW ADMIN INFO
// =====================



const username =

document.getElementById(
"username"
);



const fullname =

document.getElementById(
"fullname"
);



const message =

document.getElementById(
"message"
);




if(username){

username.textContent =

admin.username || "-";

}





if(fullname){

fullname.textContent =

admin.full_name || "-";

}






if(message){


message.textContent =

"ورود تایید شد";


}




// =====================
// LOGOUT BUTTON
// =====================



const logoutBtn =

document.getElementById(
"logoutBtn"
);



if(logoutBtn){



logoutBtn.addEventListener(
"click",
()=>{

NightCastAuth.logout();

}

);


}





// =====================
// MOBILE MENU
// =====================



const menuToggle =

document.getElementById(
"menuToggle"
);



const sidebar =

document.getElementById(
"sidebar"
);



const overlay =

document.getElementById(
"overlay"
);





if(menuToggle){


menuToggle.addEventListener(
"click",
()=>{


sidebar.classList.toggle(
"open"
);


overlay.classList.toggle(
"active"
);



}

);

}





if(overlay){


overlay.addEventListener(
"click",
()=>{


sidebar.classList.remove(
"open"
);



overlay.classList.remove(
"active"
);



}

);


}





// =====================
// SUCCESS MESSAGE
// =====================


NightCastUI.success(
"خوش آمدید به پنل مدیریت NightCast"
);



});
