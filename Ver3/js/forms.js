const Forms={

counter(input,max){

const c=document.createElement("small");

c.className="counter";

input.parentNode.appendChild(c);

const update=()=>{

const len=input.value.length;

c.innerHTML=len+" / "+max;

if(len<max*.7){

c.style.color="#16a34a";

}else if(len<max){

c.style.color="#d97706";

}else{

c.style.color="#dc2626";

}

};

input.addEventListener("input",update);

update();

},

hint(input,text){

const h=document.createElement("small");

h.className="hint";

h.innerHTML=text;

input.parentNode.appendChild(h);

},

required(input,msg){

input.dataset.required=msg;

},

validate(){

let ok=true;

document.querySelectorAll("[data-required]").forEach(i=>{

if(!i.value.trim()){

i.classList.add("error");

UI.toast(i.dataset.required,"#dc2626");

ok=false;

}else{

i.classList.remove("error");

}

});

return ok;

}

};

window.Forms=Forms;
