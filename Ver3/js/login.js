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



message.innerHTML = "در حال اتصال...";



try{


const response = await fetch(

"https://nightcast-api.tomasgermany2580.workers.dev/api/login",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

username: username,

password: password

})

}

);



const data = await response.json();



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



setTimeout(function(){


window.location.href="dashboard.html";


},1000);



}


catch(error){


message.innerHTML =
"خطا در ارتباط با سرور";


message.style.color="red";


}



});
