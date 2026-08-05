/* ==================================================
   NightCast User API Manager
   File: /users/js/api.js
   Version: 1.0
================================================== */


const NightCastAPI = {


/*
====================================
WORKER API URL
====================================
*/


baseURL:

"https://nightcast-api.tomasgermany2580.workers.dev/api/v1",





/*
====================================
GET TOKEN
====================================
*/


getToken(){


return localStorage.getItem(

"NightCastUserToken"

);


},






/*
====================================
SET TOKEN
====================================
*/


setToken(token){


localStorage.setItem(

"NightCastUserToken",

token

);


},






/*
====================================
REMOVE TOKEN
====================================
*/


removeToken(){


localStorage.removeItem(

"NightCastUserToken"

);


},






/*
====================================
DEFAULT HEADERS
====================================
*/


headers(auth=false){



const headers = {


"Content-Type":

"application/json"

};



if(auth){



const token = this.getToken();



if(token){


headers["Authorization"] =

"Bearer " + token;


}



}



return headers;


},








/*
====================================
MAIN REQUEST
====================================
*/


async request(

endpoint,

options={}

){



try{



const response =

await fetch(

this.baseURL + endpoint,

options

);



const data =

await response.json();




return data;



}

catch(error){



return {


success:false,


message:

"Network Error",


error:

error.message


};



}



},









/*
====================================
TEST CONNECTION
====================================
*/


async test(){



return await this.request(

"/test",

{


method:"GET"

}


);



},









/*
====================================
PUBLIC PODCASTS
====================================
*/


async getPodcasts(

page=1,

limit=5

){



return await this.request(


`/public/podcasts?page=${page}&limit=${limit}`,


{


method:"GET"


}



);



},







/*
====================================
GET SINGLE DOWNLOAD
====================================
*/


async downloadPodcast(id){



return await this.request(


"/public/download/" + id,


{


method:"GET",


headers:

this.headers(true)



}



);



},









/*
====================================
REGISTER
====================================
*/


async register(data){



return await this.request(


"/public/register",


{


method:"POST",


headers:

this.headers(false),


body:

JSON.stringify(data)



}



);



},









/*
====================================
LOGIN
====================================
*/


async login(

username,

password

){



const result =

await this.request(


"/public/login",


{


method:"POST",


headers:

this.headers(false),


body:

JSON.stringify({

username,

password

})


}



);



if(

result.success &&

result.token

){


this.setToken(

result.token

);



}



return result;


},









/*
====================================
CURRENT USER
====================================
*/


async me(){



return await this.request(


"/public/me",


{


method:"GET",


headers:

this.headers(true)



}



);



},









/*
====================================
LOGOUT
====================================
*/


async logout(){



const result =

await this.request(


"/public/logout",


{


method:"POST",


headers:

this.headers(true)



}



);



this.removeToken();



return result;



},







/*
====================================
IS LOGGED IN
====================================
*/


isLoggedIn(){



return !!this.getToken();



}





};




// Global Access

window.NightCastAPI = NightCastAPI;
