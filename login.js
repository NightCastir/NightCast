const API =
"https://nightcast-api.tomasgermany2580.workers.dev/api";

const identity =
document.getElementById("identity");

const sendCode =
document.getElementById("sendCode");

const verifyBox =
document.getElementById("verifyBox");

const verifyCode =
document.getElementById("verifyCode");

const verifyButton =
document.getElementById("verify");

const toast =
document.getElementById("toast");

let loginType = "";
let loginValue = "";

function showToast(text){

toast.innerText = text;

toast.style.display = "block";

setTimeout(()=>{

toast.style.display = "none";

},3000);

}

function showLoading(button){

button.disabled = true;

button.innerText = "در حال پردازش...";

}

function hideLoading(button,text){

button.disabled = false;

button.innerText = text;

}

function detectType(value){

if(value.includes("@")){

return "email";

}

return "phone";

}


sendCode.onclick = async ()=>{

loginValue =
identity.value.trim();

if(loginValue===""){

showToast("ایمیل یا شماره موبایل را وارد کنید.");

return;

}

loginType =
detectType(loginValue);

// اعتبارسنجی ایمیل

if(loginType==="email"){

const emailRegex =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!emailRegex.test(loginValue)){

showToast("ایمیل معتبر نیست.");

return;

}

}

// اعتبارسنجی شماره

if(loginType==="phone"){

const phoneRegex =
/^\+[1-9]\d{7,14}$/;

if(!phoneRegex.test(loginValue)){

showToast("شماره را با کد کشور وارد کنید.\nمثال:\n+989123456789");

return;

}

}

showLoading(sendCode);

try{

const response =
await fetch(

API + "/auth/start",

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

type:loginType,

value:loginValue

})

}

);

const result =
await response.json();

hideLoading(

sendCode,

"ادامه"

);

if(!result.success){

showToast(result.message);

return;

}

verifyBox.style.display="block";

verifyCode.focus();

if(result.code){

showToast(

"کد تست:\n"+result.code

);

}else{

showToast(

"کد تأیید ارسال شد."

);

}

}catch{

hideLoading(

sendCode,

"ادامه"

);

showToast(

"ارتباط با سرور برقرار نشد."

);

}

};




verifyButton.onclick = async ()=>{

const code =
verifyCode.value.trim();

if(code===""){

showToast("کد تأیید را وارد کنید.");

return;

}

showLoading(verifyButton);

try{

const response =
await fetch(

API + "/auth/verify",

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

type:loginType,

value:loginValue,

code:code

})

}

);

const result =
await response.json();

hideLoading(

verifyButton,

"ورود"

);

if(!result.success){

showToast(result.message);

return;

}

// ذخیره Token

localStorage.setItem(

"nightcast_token",

result.token

);

showToast("ورود با موفقیت انجام شد.");

setTimeout(()=>{

window.location.href="index.html";

},800);

}catch{

hideLoading(

verifyButton,

"ورود"

);

showToast("ارتباط با سرور برقرار نشد.");

}

};






// ==========================
// AUTO LOGIN
// ==========================

window.addEventListener(

"load",

async ()=>{

const token =

localStorage.getItem(

"nightcast_token"

);

if(!token){

return;

}

try{

const response =

await fetch(

API + "/me",

{

headers:{

Authorization:

"Bearer " + token

}

}

);

const result =

await response.json();

if(result.success){

window.location.href =

"index.html";

return;

}

localStorage.removeItem(

"nightcast_token"

);

}catch{

localStorage.removeItem(

"nightcast_token"

);

}

}

);






// ==========================
// UX
// ==========================

// Enter روی فیلد ایمیل یا موبایل

identity.addEventListener(

"keydown",

function(e){

if(e.key==="Enter"){

sendCode.click();

}

}

);

// Enter روی فیلد کد

verifyCode.addEventListener(

"keydown",

function(e){

if(e.key==="Enter"){

verifyButton.click();

}

}

);

// فقط عدد

verifyCode.addEventListener(

"input",

function(){

this.value =

this.value

.replace(/\D/g,"")

.substring(0,6);

}

);

// فوکوس اولیه

window.addEventListener(

"load",

function(){

identity.focus();

}

);





// ==========================
// PREVENT DOUBLE CLICK
// ==========================

let sending = false;

sendCode.addEventListener(

"click",

()=>{

if(sending){

event.preventDefault();

return;

}

sending = true;

setTimeout(()=>{

sending = false;

},1500);

}

);

let verifying = false;

verifyButton.addEventListener(

"click",

()=>{

if(verifying){

event.preventDefault();

return;

}

verifying = true;

setTimeout(()=>{

verifying = false;

},1500);

}

);

// ==========================
// DEBUG
// ==========================

console.log(

"NightCast Login v1.0 Loaded"

);













