const API =
"https://nightcast-api.tomasgermany2580.workers.dev";

const token =
localStorage.getItem("token");

if(!token){

location.href="login.html";

}

async function loadProfile(){

try{

const res=await fetch(

API+"/api/me",

{

headers:{

Authorization:

"Bearer "+token

}

}

);

const data=await res.json();

if(!data.success){

localStorage.clear();

location.href="login.html";

return;

}

const user=data.user;

localStorage.setItem(

"user",

JSON.stringify(user)

);

document.getElementById("userName").textContent=

user.full_name ||

"NightCast User";

document.getElementById("userEmail").textContent=

user.email ||

user.phone ||

"";

document.getElementById("avatar").textContent=

(user.full_name ||

"N")

.charAt(0)

.toUpperCase();

}

catch(e){

console.log(e);

}

}

document

.getElementById("logout")

.onclick=async function(){

try{

await fetch(

API+"/api/logout",

{

method:"POST",

headers:{

Authorization:

"Bearer "+token

}

}

);

}catch(e){}

localStorage.clear();

location.href="login.html";

};

loadProfile();
