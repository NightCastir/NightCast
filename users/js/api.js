/* ==================================================

NightCast User API Core

File:
 /users/js/api.js

Responsibility:
- Worker Connection
- Fetch Manager
- Token Handling
- Error Handling

API Version:
V5

================================================== */


(function(){

"use strict";


// ================================================
// API BASE URL
// ================================================


const API_CONFIG = {


BASE_URL:

"https://nightcast-api.tomasgermany2580.workers.dev/api/v1",



TOKEN_KEY:

"NightCastUserToken"



};




// ================================================
// TOKEN MANAGER
// ================================================


const TokenManager = {



get(){


return localStorage.getItem(

API_CONFIG.TOKEN_KEY

);


},



set(token){


if(!token){

return;

}


localStorage.setItem(

API_CONFIG.TOKEN_KEY,

token

);


},



remove(){


localStorage.removeItem(

API_CONFIG.TOKEN_KEY

);


},



exists(){


return !!this.get();


}


};





// ================================================
// REQUEST CORE
// ================================================


async function request(

endpoint,

options={}

){



const url =

API_CONFIG.BASE_URL + endpoint;



const token =

TokenManager.get();




const headers = {


"Content-Type":

"application/json"



};





// Authorization

if(token){


headers.Authorization =

"Bearer " + token;


}





const config = {


method:

options.method || "GET",



headers:



{

...headers,

...(options.headers || {})

}



};





// Body

if(options.body){


config.body =

typeof options.body === "string"

?

options.body

:

JSON.stringify(options.body);



}





try{



const response =

await fetch(

url,

config

);





let data;



try{


data =

await response.json();



}

catch(e){


data = {


success:false,


message:

"Invalid server response"



};


}





if(!response.ok){



return {


success:false,


status:

response.status,


message:

data.message ||

"Request failed",



data:data



};



}





return data;



}

catch(error){



console.error(

"NightCast API Error:",

error

);



return {


success:false,


message:

"Connection error",


error:

error.message



};



}



}








// ================================================
// PUBLIC API METHODS
// ================================================


const API = {





// -------------------------------
// GET
// -------------------------------


get(endpoint){


return request(

endpoint,

{

method:"GET"

}

);


},





// -------------------------------
// POST
// -------------------------------


post(

endpoint,

data={}

){


return request(

endpoint,

{

method:"POST",


body:data


}

);


},





// -------------------------------
// PUT
// -------------------------------


put(

endpoint,

data={}

){


return request(

endpoint,

{

method:"PUT",


body:data


}

);


},





// -------------------------------
// DELETE
// -------------------------------


delete(endpoint){


return request(

endpoint,

{

method:"DELETE"

}

);


},






// -------------------------------
// TOKEN
// -------------------------------


token:


TokenManager





};







// ================================================
// GLOBAL EXPORT
// ================================================


window.NightCastAPI = API;



console.log(

"NightCast API Loaded"

);



})();
