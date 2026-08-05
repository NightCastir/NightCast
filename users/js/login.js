/*
=================================================

NightCast User Panel
Login Manager

Responsible for:

- Email Login
- SMS Login
- Token Save
- Redirect
- Messages

=================================================
*/


"use strict";







class LoginManager {



constructor(){



    this.init();



}









/*
==========================
INIT
==========================
*/


init(){



    this.bindEvents();



    this.hideLoader();



}









/*
==========================
EVENTS
==========================
*/


bindEvents(){







/*
--------------------------
EMAIL LOGIN
--------------------------
*/


document

.getElementById(

"btnEmailLogin"

)

?.addEventListener(

"click",

()=>{


this.emailLogin();


}

);









/*
--------------------------
SMS SEND
--------------------------
*/


document

.getElementById(

"btnSendSMS"

)

?.addEventListener(

"click",

()=>{


this.sendSMS();


}

);









/*
--------------------------
SMS VERIFY
--------------------------
*/


document

.getElementById(

"btnVerifySMS"

)

?.addEventListener(

"click",

()=>{


this.verifySMS();


}

);









/*
--------------------------
TABS
--------------------------
*/


document

.querySelectorAll(

".auth-tab"

)

.forEach(

tab=>{


tab.addEventListener(

"click",

()=>{


this.changeTab(

tab.dataset.tab

);


}

);


}

);








}









/*
==========================
CHANGE TAB
==========================
*/


changeTab(tabId){



document

.querySelectorAll(

".auth-tab"

)

.forEach(

item=>{


item.classList.remove(

"active"

);


});








document

.querySelectorAll(

".auth-form"

)

.forEach(

form=>{


form.classList.remove(

"active"

);


});








const tab =

document.querySelector(

`[data-tab="${tabId}"]`

);






if(tab){



tab.classList.add(

"active"

);


}








const form =

document.getElementById(

tabId

);






if(form){



form.classList.add(

"active"

);


}



}









/*
==========================
EMAIL LOGIN
==========================
*/


async emailLogin(){



try{



const username =

document

.getElementById(

"loginUsername"

)

.value

.trim();








const password =

document

.getElementById(

"loginPassword"

)

.value;








if(

!username ||

!password

){



this.error(

"نام کاربری و رمز عبور الزامی است"

);


return;


}








this.showLoader(

"در حال ورود..."

);








const result =

await API.post(

"/auth/login",

{


username,

password


}

);









if(

!result ||

!result.success

){



throw new Error(

result.message ||

"ورود ناموفق بود"

);


}








localStorage.setItem(

"NightCastToken",

result.token

);








localStorage.setItem(

"NightCastUser",

JSON.stringify(

result.user

)

);








this.success(

"ورود موفق بود"

);








setTimeout(

()=>{


window.location.href=

"../index.html";


},

800

);







}

catch(error){



console.error(

"LOGIN ERROR",

error

);



this.error(

error.message

);


}

finally{


this.hideLoader();


}



  }
  

/*
==========================
SEND SMS
==========================
*/


async sendSMS(){



try{



const phone =

document

.getElementById(

"phoneNumber"

)

.value

.trim();







if(!phone){



this.error(

"شماره موبایل را وارد کنید"

);



return;


}








this.showLoader(

"در حال ارسال کد..."

);








/*

فعلاً آماده اتصال به API پیامک است.

بعداً آدرس API شما اینجا قرار می‌گیرد.

مثال:

await API.post(
"/auth/sms/send",
{
 phone: phone
}
)

*/







this.success(

"در نسخه بعدی کد پیامک ارسال خواهد شد"

);






}

catch(error){



console.error(

"SMS SEND ERROR",

error

);



this.error(

error.message

);



}

finally{


this.hideLoader();


}



}









/*
==========================
VERIFY SMS
==========================
*/


async verifySMS(){



try{



const phone =

document

.getElementById(

"phoneNumber"

)

.value

.trim();






const code =

document

.getElementById(

"smsCode"

)

.value

.trim();








if(

!phone ||

!code

){



this.error(

"شماره و کد تأیید را وارد کنید"

);



return;


}









this.showLoader(

"در حال بررسی کد..."

);








/*

محل اتصال API پیامک شما

مثال آینده:

const result = await API.post(
"/auth/sms/verify",
{
 phone,
 code
}
);


*/







this.error(

"سیستم پیامک هنوز فعال نشده است"

);







}

catch(error){



console.error(

"SMS VERIFY ERROR",

error

);



this.error(

error.message

);



}

finally{


this.hideLoader();


}


}









/*
==========================
OPENAI LOGIN
==========================
*/


openAILogin(){



/*

رزرو برای OAuth آینده

بعد از مشخص شدن روش احراز هویت OpenAI

فعال می‌شود.


*/



this.error(

"ورود OpenAI در حال آماده‌سازی است"

);



}









/*
==========================
GOOGLE LOGIN
==========================
*/


googleLogin(){



this.error(

"ورود Google در نسخه بعد اضافه خواهد شد"

);



}









/*
==========================
LOADER
==========================
*/


showLoader(message){



const loader =

document.getElementById(

"globalLoader"

);






if(loader){



loader.classList.add(

"active"

);



const text =

loader.querySelector(

"p"

);






if(text && message){



text.innerText = message;


}



}



}









hideLoader(){



const loader =

document.getElementById(

"globalLoader"

);






if(loader){



loader.classList.remove(

"active"

);



}



}









/*
==========================
MESSAGES
==========================
*/


success(message){



if(

window.Toast &&

Toast.success

){



Toast.success(message);



}

else{


alert(message);


}



}









error(message){



if(

window.Toast &&

Toast.error

){



Toast.error(message);



}

else{


alert(message);


}



}



}









/*
==========================
START
==========================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{



window.loginManager =

new LoginManager();



});
