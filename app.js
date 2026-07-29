const API =
"https://ncstgetrssfromaparat.tomasgermany2580.workers.dev";

const episodes=document.getElementById("episodes");
const loader=document.getElementById("loader");

let allEpisodes = [];

const sheet=document.getElementById("playerSheet");
const overlay=document.getElementById("overlay");

const title=document.getElementById("sheetTitle");
const video=document.getElementById("videoContainer");
const desc=document.getElementById("episodeDescription");

async function loadEpisodes(){

try{

const data=await res.json();

loader.style.display="none";

allEpisodes = data.episodes;

showEpisodes(allEpisodes);

}

catch(e){

loader.style.display="none";

toast("خطا در ارتباط با سرور");

console.log(e);

}

}

function showEpisodes(list){

episodes.innerHTML="";

list.forEach(item=>{

const card=document.createElement("div");

card.className="card";

card.card.innerHTML=`

<img
class="cover"
src="${item.image}"
loading="lazy">

<div class="cardBody">

<h3>

${item.title}

</h3>

<p>

${shortText(item.description)}

</p>

<div class="meta">

<span>

📅 ${date(item.published)}

</span>

<span>

▶ آپارات

</span>

</div>

<button class="listen">

🎧 همین الان گوش بده

</button>

</div>

`;

<h3>${item.title}</h3>

<p>

${shortText(item.description)}

</p>

<div class="meta">

<span>${date(item.published)}</span>

<span>آپارات</span>

</div>

<button class="listen">

🎧 گوش بده

</button>

`;

card.onclick=()=>openEpisode(item);

episodes.appendChild(card);

});

}

function openEpisode(item){

title.innerText=item.title;

desc.innerText=item.description;

video.innerHTML=`

<iframe

src="${item.embed}"

allowfullscreen

loading="lazy">

</iframe>

`;

sheet.classList.add("show");

overlay.classList.add("show");

}

function closePlayer(){

sheet.classList.remove("show");

overlay.classList.remove("show");

video.innerHTML="";

}

document
.getElementById("closeSheet")
.onclick=closePlayer;

overlay.onclick=closePlayer;

function shortText(text){

if(!text) return "";

return text.length>170
?text.substring(0,170)+"..."
:text;

}

function date(text){

return text
.replace("+0330","")
.replace("Mon,","")
.replace("Tue,","")
.replace("Wed,","")
.replace("Thu,","")
.replace("Fri,","")
.replace("Sat,","")
.replace("Sun,","");

}

function toast(msg){

const t=document.getElementById("toast");

t.innerHTML=msg;

t.style.display="block";

setTimeout(()=>{

t.style.display="none";

},2500);

}

document
.getElementById("listenButton")
.onclick=function(){

sheet.scrollTo({

top:0,

behavior:"smooth"

});

};

loadEpisodes();
