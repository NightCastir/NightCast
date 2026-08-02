const API = "https://nightcast-api.tomasgermany2580.workers.dev/api/v1";

const api = {

async login(username,password){

const response = await fetch(

API + "/auth/login",

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

return await response.json();

},



async me(token){

const response = await fetch(

API + "/auth/me",

{

headers:{
Authorization:"Bearer "+token
}

}

);

return await response.json();

},



async getPodcasts(){

const response = await fetch(

API + "/podcasts"

);

return await response.json();

},



async createPodcast(token,data){

const response = await fetch(

API + "/podcasts",

{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:"Bearer "+token

},

body:JSON.stringify(data)

}

);

return await response.json();

}

};
