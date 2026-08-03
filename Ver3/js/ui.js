const UI={

toast(msg,color="#2563eb"){

let t=document.getElementById("toast");

if(!t){

t=document.createElement("div");

t.id="toast";

document.body.appendChild(t);

}

t.innerHTML=msg;

t.style.background=color;

t.classList.add("show");

setTimeout(()=>{

t.classList.remove("show");

},3000);

},

loading(show=true){

let l=document.getElementById("loading");

if(!l){

l=document.createElement("div");

l.id="loading";

l.innerHTML=`
<div class="loader"></div>
`;

document.body.appendChild(l);

}

l.style.display=show?"flex":"none";

},

confirm(text){

return confirm(text);

}

};

window.UI=UI;
