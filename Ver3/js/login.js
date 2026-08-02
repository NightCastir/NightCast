document
.getElementById("loginForm")
.addEventListener("submit", async function(e){

e.preventDefault();


const username =
document.getElementById("username").value.trim();


const password =
document.getElementById("password").value;


const message =
document.getElementById("message");



if(!username || !password){

message.innerHTML =
"نام کاربری و رمز عبور را وارد کنید";

message.style.color="red";

return;

}



message.innerHTML =
"در حال ورود...";



try{


const response = await fetch(

"https://YOUR-WORKER-DOMAIN/api/login",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

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



message.innerHTML =
"ورود موفق";

message.style.color="green";



setTimeout(()=>{


window.location.href =
"dashboard.html";


},1000);



}

catch(error){


message.innerHTML =
"خطا در ارتباط با سرور";


message.style.color="red";


}



});
