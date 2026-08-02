
/* =====================
   NIGHTCAST API CLIENT
===================== */


const NightCastAPI = {


baseURL:

"https://nightcast-api.tomasgermany2580.workers.dev",



/*
 GET REQUEST
*/

async get(endpoint){


const token =

sessionStorage.getItem(
"NightCastSession"
);



const response =

await fetch(

this.baseURL + endpoint,

{

method:"GET",

headers:{


"Content-Type":

"application/json",


"Authorization":

token

?

"Bearer " + token

:

""

}

}

);



return await response.json();


},




/*
 POST REQUEST
*/

async post(endpoint,data={}){


const token =

sessionStorage.getItem(
"NightCastSession"
);



const response =

await fetch(

this.baseURL + endpoint,

{


method:"POST",


headers:{


"Content-Type":

"application/json",



"Authorization":

token

?

"Bearer " + token

:

""

},



body:

JSON.stringify(data)


}

);



return await response.json();


}




};
