
const token = localStorage.getItem("NightCastToken");


const userInfo =
document.getElementById("userInfo");



if(!token){

window.location.href="login.html";

}




async function checkSession(){


try{


const response = await fetch(

"https://nightcast-api.tomasgermany2580.workers.dev/api/v1/auth/me"
  
{

method:"GET",

headers:{

"Authorization":
"Bearer "+token

}

}

);



const data =
await response.json();



if(!data.success){


localStorage.removeItem("NightCastToken");


window.location.href="login.html";


return;


}





userInfo.innerHTML =

`
<p>
خوش آمدید:
<b>${data.user.full_name}</b>
</p>

<p>
نقش:
<b>${data.user.role}</b>
</p>
`;



}


catch(error){


userInfo.innerHTML =
"خطا در ارتباط با سرور";


}


}




async function logout(){


await fetch(

  "https://nightcast-api.tomasgermany2580.workers.dev/api/v1/auth/logout"
  
{

method:"POST",

headers:{

"Authorization":
"Bearer "+token

}

}

);



localStorage.removeItem("NightCastToken");


window.location.href="login.html";


}



checkSession();
