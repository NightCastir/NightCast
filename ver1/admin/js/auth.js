/* =====================
   NIGHTCAST AUTH
===================== */



const NightCastAuth = {



/*
 CHECK SESSION
*/


async check(){



const token =

sessionStorage.getItem(
"NightCastSession"
);



if(!token){


window.location.href="login.html";

return false;


}




try{


const data =

await NightCastAPI.get(
"/api/admin/me"
);





if(data.logged){



return data.admin;



}





this.logout();


}


catch(error){


console.error(
"AUTH ERROR:",
error
);



this.logout();


}



},





/*
 LOGOUT
*/


async logout(){



try{


await NightCastAPI.post(

"/api/admin/logout",

{}


);


}

catch(error){


console.error(error);


}





sessionStorage.removeItem(

"NightCastSession"

);



window.location.href=

"login.html";



}



};
