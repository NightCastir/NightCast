const API={

base:"https://nightcast-api.tomasgermany2580.workers.dev/api/v1",

token(){
return localStorage.getItem("NightCastToken");
},

headers(json=false){

const h={};

if(json) h["Content-Type"]="application/json";

const t=this.token();

if(t){
h["Authorization"]="Bearer "+t;
}

return h;

},

async get(url){

const r=await fetch(
this.base+url,
{
headers:this.headers()
}
);

return await r.json();

},

async post(url,data){

const r=await fetch(
this.base+url,
{
method:"POST",
headers:this.headers(true),
body:JSON.stringify(data)
}
);

return await r.json();

},

async put(url,data){

const r=await fetch(
this.base+url,
{
method:"PUT",
headers:this.headers(true),
body:JSON.stringify(data)
}
);

return await r.json();

},

async delete(url){

const r=await fetch(
this.base+url,
{
method:"DELETE",
headers:this.headers()
}
);

return await r.json();

},

async upload(file,type){

const form=new FormData();

form.append("file",file);

form.append("type",type);

const r=await fetch(

this.base+"/media/upload",

{

method:"POST",

headers:{
Authorization:"Bearer "+this.token()
},

body:form

}

);

return await r.json();

}

};

window.API=API;
