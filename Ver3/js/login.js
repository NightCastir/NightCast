/*
NightCast CMS

File:
login.js

Version:
1.0.1
*/


const API_URL =
"https://nightcast-api.tomasgermany2580.workers.dev/api/v1";



const form =
document.getElementById("loginForm");



const message =
document.getElementById("message");




form.addEventListener(

"submit",

async function(e){


e.preventDefault();



const username =

document

.getElementById("username")

.value

.trim();




const password =

document

.getElementById("password")

.value;





message.innerHTML =
"در حال بررسی اطلاعات...";

message.style.color="black";





try{


const response =

await fetch(

API_URL + "/auth/login",

{

method:"POST",

headers:{

"Content-Type":

"application/json"

},


body:

JSON.stringify({

username,

password

})


}

);





const data =

await response.json();





if(!data.success){


message.innerHTML =
data.message;


message.style.color="red";


return;


}





localStorage.setItem(

"NightCastToken",

data.token

);




localStorage.setItem(

"NightCastUser",

JSON.stringify(data.user)

);





message.innerHTML =
"ورود موفق";

message.style.color="green";




setTimeout(()=>{


window.location.href=

"dashboard.html";



},800);




}

catch(error){



message.innerHTML =

"خطا در ارتباط با سرور";


message.style.color="red";


}



});
