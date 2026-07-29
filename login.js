const API =
"https://nightcast-api.tomasgermany2580.workers.dev";

const identity =
document.getElementById("identity");

const verifyBox =
document.getElementById("verifyBox");

let loginType="";

document
.getElementById("sendCode")
.onclick=async()=>{

const value=
identity.value.trim();

if(!value){

alert("ایمیل یا شماره را وارد کنید");

return;

}

loginType=
value.includes("@")
?"email"
:"phone";

const res=
await fetch(

API+"/api/auth/start",

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

type:loginType,

value:value

})

}

);

const data=
await res.json();

if(!data.success){

alert(data.message);

return;

}

alert(

"کد تایید:\n"+

data.code

);

verifyBox.style.display="block";

};

document
.getElementById("verify")
.onclick=async()=>{

const res=
await fetch(

API+"/api/auth/verify",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

type:loginType,

value:identity.value.trim(),

code:

document
.getElementById("verifyCode")
.value.trim()

})

}

);

const data=
await res.json();

if(!data.success){

alert(data.message);

return;

}

localStorage.setItem(

"token",

data.token

);

location.href="profile.html";

};
