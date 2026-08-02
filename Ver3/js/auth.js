/*
NightCast CMS
Auth Manager
Version 2.0
*/


const API =
"https://nightcast-api.tomasgermany2580.workers.dev/api/v1";



const token =
localStorage.getItem("NightCastToken");



const userInfo =
document.getElementById("userInfo");





if(!token){

window.location.href="login.html";

}





async function checkSession(){


try{


const response = await fetch(

API + "/auth/me",

{

method:"GET",

headers:{

"Authorization":

"Bearer " + token,

"Cache-Control":

"no-cache"

}

}

);



const data =
await response.json();



console.log("SESSION:",data);




if(!data.success){


localStorage.removeItem(
"NightCastToken"
);


localStorage.removeItem(
"NightCastUser"
);



window.location.href="login.html";


return;


}




if(userInfo){


userInfo.innerHTML =

`

<div>

👤

<b>

${data.user.full_name}

</b>

</div>


<div>

نقش:

${data.user.role}

</div>

`;



}



}

catch(error){


console.error(error);



if(userInfo){

userInfo.innerHTML =

"خطا در ارتباط";

}


}



}





async function logout(){


try{


await fetch(

API + "/auth/logout",

{

method:"POST",

headers:{

"Authorization":

"Bearer "+token

}

}

);



}


catch(e){



console.log(e);


}



localStorage.removeItem(
"NightCastToken"
);


localStorage.removeItem(
"NightCastUser"
);



window.location.href="login.html";


}





checkSession();
