/* ==================================================

NightCast Listener
Podcasts Module V1

File:
users/js/features/podcasts.js


Responsibility:

- Load public podcasts
- Render podcast cards
- Connect with Player
- Handle podcast actions


Compatible With:

index.html V Final
api.js
player.js

================================================== */


(function(){

"use strict";


// ===============================
// CONFIG
// ===============================


const Podcasts = {


page:1,


limit:5,


loading:false,


hasMore:true,


initialized:false,


items:[],


currentSort:"latest",



};


// ===============================
// DOM CACHE
// ===============================


const DOM = {};



function cacheDOM(){


DOM.grid =
document.getElementById(
"podcastGrid"
);


DOM.template =
document.getElementById(
"podcastCardTemplate"
);



DOM.loadingTrigger =
document.getElementById(
"podcastLoadingTrigger"
);



DOM.sortButton =
document.getElementById(
"sortPodcastButton"
);



}




// ===============================
// HELPERS
// ===============================


function formatTime(seconds){


if(!seconds || seconds <= 0){

return "00:00";

}


const min =
Math.floor(seconds / 60);


const sec =
Math.floor(seconds % 60);



return (

String(min).padStart(2,"0")
+
":"
+
String(sec).padStart(2,"0")

);


}




function escapeHTML(value){


if(!value){

return "";

}


return String(value)

.replace(
/&/g,
"&amp;"
)

.replace(
/</g,
"&lt;"
)

.replace(
/>/g,
"&gt;"
)

.replace(
/"/g,
"&quot;"
)

.replace(
/'/g,
"&#039;"
);



}



// ===============================
// PUBLIC ACCESS
// ===============================


window.NightCastPodcasts = Podcasts;


 // ==================================================
// LOAD PODCASTS FROM API
// ==================================================


async function loadPodcasts(reset = false){



if(Podcasts.loading){

return;

}



if(!Podcasts.hasMore && !reset){

return;

}



if(reset){

Podcasts.page = 1;

Podcasts.hasMore = true;

Podcasts.items = [];


clearPodcastGrid();

}





Podcasts.loading = true;



try{


showLoadingState();



// ===============================
// API REQUEST
// ===============================


const response = await NightCastAPI.get(

"/public/podcasts",

{

page: Podcasts.page,

limit: Podcasts.limit

}

);





if(
!response
||
!response.success
){


throw new Error(

"Unable to load podcasts"

);


}






const podcasts =

response.podcasts || [];





// ذخیره داده‌ها

Podcasts.items.push(

...podcasts

);




// وضعیت صفحه‌بندی

Podcasts.hasMore =

response.hasMore || false;



// نمایش

renderPodcasts(

podcasts

);





Podcasts.page++;





}

catch(error){


console.error(

"Podcast Load Error:",
error

);


showPodcastError();



}

finally{


Podcasts.loading = false;


hideLoadingState();


}



}






// ==================================================
// CLEAR GRID
// ==================================================


function clearPodcastGrid(){


if(!DOM.grid){

return;

}



DOM.grid.innerHTML = "";



}





// ==================================================
// LOADING STATE CONTROL
// ==================================================


function showLoadingState(){


if(!DOM.grid){

return;

}



const skeletons =

DOM.grid.querySelectorAll(

".skeleton"

);



skeletons.forEach(item=>{


item.style.display = "flex";


});



}




function hideLoadingState(){



if(!DOM.grid){

return;

}



const skeletons =

DOM.grid.querySelectorAll(

".skeleton"

);



skeletons.forEach(item=>{


item.remove();


});


}







// ==================================================
// ERROR MESSAGE
// ==================================================


function showPodcastError(){


if(!DOM.grid){

return;

}



DOM.grid.innerHTML = `


<div class="podcast-error">


<i class="fa-solid fa-circle-exclamation"></i>


<p>
دریافت پادکست‌ها با مشکل مواجه شد
</p>


<button
id="retryPodcastLoad">

تلاش دوباره

</button>


</div>


`;



const retry =

document.getElementById(

"retryPodcastLoad"

);



if(retry){


retry.addEventListener(

"click",

()=>loadPodcasts(true)

);


}



}



 /* ==================================================

NightCast Podcast Module V2

File:
 /users/js/features/podcasts.js

Part:
3/6

Responsibilities:
- Render Podcast Cards
- Bind Podcast Actions
- Connect With Player
- Handle User Actions

================================================== */


(function(){

"use strict";



const PodcastUI = {





/*
==================================================
CREATE CARD
==================================================
*/


createCard(podcast){



const template = document.getElementById(
"podcastCardTemplate"
);



if(!template){

console.error(
"Podcast template not found"
);

return null;

}





const clone =
template.content.cloneNode(true);






const card =
clone.querySelector(
".podcast-card"
);




if(!card){

return null;

}






/*
----------------------------------
SET DATA
----------------------------------
*/


card.dataset.id =
podcast.id;





const cover =
card.querySelector(
"[data-field='cover']"
);


if(cover){

cover.src =
podcast.cover ||
"/users/assets/images/default-cover.jpg";


cover.alt =
podcast.title || "NightCast";


}








const title =
card.querySelector(
"[data-field='title']"
);



if(title){

title.textContent =
podcast.title ||
"بدون عنوان";


}








const author =
card.querySelector(
"[data-field='author']"
);



if(author){

author.textContent =
podcast.author ||
"NightCast";


}









const description =
card.querySelector(
"[data-field='description']"
);



if(description){

description.textContent =
podcast.description ||
"";


}









const duration =
card.querySelector(
"[data-field='duration']"
);



if(duration){


duration.innerHTML = `

<i class="fa-solid fa-clock"></i>

${PodcastUI.formatTime(
podcast.duration
)}

`;

}




return card;


},







/*
==================================================
RENDER LIST
==================================================
*/


render(list){



const grid =
document.getElementById(
"podcastGrid"
);



if(!grid){

console.error(
"Podcast grid not found"
);

return;

}






/*
remove skeleton
*/


grid.innerHTML = "";






if(
!Array.isArray(list)
||
list.length===0
){


grid.innerHTML = `

<div class="empty-state">

<i class="fa-solid fa-headphones"></i>

<p>
هنوز پادکستی منتشر نشده است
</p>


</div>

`;


return;

}









list.forEach(
podcast=>{


const card =
PodcastUI.createCard(
podcast
);



if(card){

grid.appendChild(card);

}



}

);





PodcastEvents.bind();


},







/*
==================================================
TIME FORMAT
==================================================
*/


formatTime(seconds){



if(
!seconds ||
isNaN(seconds)
){

return "00:00";

}



const min =
Math.floor(seconds / 60);



const sec =
Math.floor(seconds % 60);



return (

String(min).padStart(2,"0")

+

":"

+

String(sec).padStart(2,"0")

);



},






/*
==================================================
LOADING STATE
==================================================
*/


showLoading(){


const grid =
document.getElementById(
"podcastGrid"
);



if(!grid)
return;





grid.innerHTML = `


<div class="podcast-card skeleton">

<div class="podcast-cover-placeholder">

</div>


<div class="podcast-info-placeholder">

</div>


</div>


<div class="podcast-card skeleton">

<div class="podcast-cover-placeholder">

</div>


<div class="podcast-info-placeholder">

</div>


</div>


<div class="podcast-card skeleton">

<div class="podcast-cover-placeholder">

</div>


<div class="podcast-info-placeholder">

</div>


</div>


`;




},






/*
==================================================
ERROR STATE
==================================================
*/


showError(message){



const grid =
document.getElementById(
"podcastGrid"
);



if(!grid)
return;





grid.innerHTML = `


<div class="error-state">


<i class="fa-solid fa-triangle-exclamation"></i>


<p>

${message ||
"خطا در دریافت پادکست‌ها"}

</p>



<button
id="retryPodcastLoad">

تلاش دوباره

</button>



</div>


`;





const retry =
document.getElementById(
"retryPodcastLoad"
);



if(retry){


retry.onclick =
()=>{

PodcastManager.load();

};


}



}



};






window.PodcastUI =
PodcastUI;



})();




/* ==================================================

NightCast Podcast Module V2

File:
 /users/js/features/podcasts.js

Part:
4/6

Responsibilities:
- Podcast Events
- Player Connection
- Download Protection
- Favorite
- Comments

================================================== */


(function(){

"use strict";





const PodcastEvents = {





/*
==================================================
BIND EVENTS
==================================================
*/


bind(){



const cards =
document.querySelectorAll(
".podcast-card:not(.skeleton)"
);





cards.forEach(card=>{


const play =
card.querySelector(
"[data-action='play']"
);



if(play){


play.onclick = ()=>{


const id =
card.dataset.id;



const podcast =
PodcastManager.getById(id);




if(!podcast){

console.warn(
"Podcast not found"
);

return;

}





PodcastEvents.play(
podcast
);



};



}









const download =
card.querySelector(
"[data-action='download']"
);



if(download){


download.onclick = ()=>{


const id =
card.dataset.id;



const podcast =
PodcastManager.getById(id);



if(podcast){

PodcastEvents.download(
podcast
);

}


};


}








const favorite =
card.querySelector(
"[data-action='favorite']"
);



if(favorite){


favorite.onclick = ()=>{


const id =
card.dataset.id;



PodcastEvents.favorite(
id,
favorite
);



};


}








const comments =
card.querySelector(
"[data-action='comments']"
);



if(comments){


comments.onclick = ()=>{


const id =
card.dataset.id;



PodcastEvents.comments(
id
);



};


}



});





},







/*
==================================================
PLAY PODCAST
==================================================
*/


play(podcast){



if(
!window.NightCastPlayer
){

console.error(
"Player module not loaded"
);


return;

}






window.NightCastPlayer.load({


id: podcast.id,


title: podcast.title,


author: podcast.author,


cover: podcast.cover,


audio:
podcast.audio ||
podcast.file ||
podcast.url



});






window.NightCastPlayer.play();





},







/*
==================================================
DOWNLOAD
==================================================
*/


download(podcast){



/*
Guest users cannot download
*/


if(
window.AuthManager &&
!AuthManager.isLoggedIn()
){



const modal =
document.getElementById(
"downloadLoginModal"
);



if(modal){

modal.classList.remove(
"hidden"
);


}



return;


}







if(
!podcast.audio
&&
!podcast.file
&&
!podcast.url
){



if(window.UI){

UI.toast(
"فایل صوتی موجود نیست",
"error"
);

}


return;

}





const url =
podcast.audio ||
podcast.file ||
podcast.url;






const link =
document.createElement(
"a"
);



link.href =
url;



link.download =
podcast.title + ".mp3";



document.body.appendChild(
link
);



link.click();



link.remove();




},







/*
==================================================
FAVORITE
==================================================
*/


favorite(id,button){



let favorites =
JSON.parse(
localStorage.getItem(
"NightCastFavorites"
)
||
"[]"
);








const index =
favorites.indexOf(id);







if(index === -1){


favorites.push(id);



button.classList.add(
"active"
);



if(window.UI){

UI.toast(
"به علاقه‌مندی‌ها اضافه شد",
"success"
);


}




}

else{


favorites.splice(
index,
1
);



button.classList.remove(
"active"
);



if(window.UI){

UI.toast(
"از علاقه‌مندی‌ها حذف شد",
"info"
);


}


}






localStorage.setItem(

"NightCastFavorites",

JSON.stringify(
favorites
)

);





},








/*
==================================================
COMMENTS
==================================================
*/


comments(id){



const modal =
document.getElementById(
"commentPageModal"
);




if(!modal){

return;

}




modal.dataset.podcastId =
id;



modal.classList.remove(
"hidden"
);






if(window.CommentManager){


CommentManager.load(
id
);


}




}






};






window.PodcastEvents =
PodcastEvents;




})();






    
/* ==================================================

NightCast Podcast Module V2

File:
 /users/js/features/podcasts.js

Part:
5/6

Responsibilities:
- API Communication
- Podcast State
- Pagination
- Infinite Scroll
- Data Management

================================================== */


(function(){

"use strict";






const PodcastManager = {





/*
==================================================
STATE
==================================================
*/


state:{


items:[],


page:1,


limit:12,


loading:false,


finished:false,


sort:"latest"



},







/*
==================================================
INIT
==================================================
*/


init(){



PodcastUI.showLoading();



this.bindScroll();



this.load();





},








/*
==================================================
LOAD PODCASTS
==================================================
*/


async load(
reset=false
){



if(
this.state.loading
)
return;







if(
reset
){


this.state.page=1;


this.state.items=[];


this.state.finished=false;


}






if(
this.state.finished
)
return;







this.state.loading=true;







try{



let response;





/*
----------------------------------
API CHECK
----------------------------------
*/


if(
window.API
&&
API.get
){



response =
await API.get(

`/podcasts?page=${this.state.page}&limit=${this.state.limit}`

);



}

else{


throw new Error(
"API module unavailable"
);


}








/*
----------------------------------
NORMALIZE RESPONSE
----------------------------------
*/



const data =
response.data ||
response.items ||
response.podcasts ||
response;







if(
!Array.isArray(data)
||
data.length===0
){


this.state.finished=true;


this.state.loading=false;


return;

}









this.state.items.push(
...data
);





PodcastUI.render(
this.state.items
);






this.state.page++;







}
catch(error){



console.error(
"Podcast Load Error:",
error
);



PodcastUI.showError(
"دریافت پادکست‌ها ناموفق بود"
);





}

finally{


this.state.loading=false;


}



},







/*
==================================================
GET BY ID
==================================================
*/


getById(id){



return this.state.items.find(

item=>

String(item.id)
===

String(id)

);


},







/*
==================================================
SEARCH LOCAL
==================================================
*/


search(keyword){



if(!keyword)
return this.state.items;







return this.state.items.filter(
item=>{


const text =

(
item.title
+
item.description
+
item.author

)
.toLowerCase();




return text.includes(

keyword.toLowerCase()

);



}

);



},







/*
==================================================
SORT
==================================================
*/


sort(type){



this.state.sort =
type;







if(
type==="oldest"
){


this.state.items.sort(

(a,b)=>

new Date(a.created_at)
-
new Date(b.created_at)

);


}

else{


this.state.items.sort(

(a,b)=>

new Date(b.created_at)
-
new Date(a.created_at)

);



}







PodcastUI.render(
this.state.items
);



},







/*
==================================================
INFINITE SCROLL
==================================================
*/


bindScroll(){



const trigger =
document.getElementById(
"podcastLoadingTrigger"
);





if(
!trigger
)
return;







const observer =
new IntersectionObserver(

entries=>{



entries.forEach(
entry=>{


if(
entry.isIntersecting
){



this.load();



}



}

);



},
{

rootMargin:
"300px"


}

);







observer.observe(
trigger
);



}






};






window.PodcastManager =
PodcastManager;






/*
==================================================
AUTO START
==================================================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{


PodcastManager.init();


}

);






})();






   /* ==================================================

NightCast Podcast Module V2

File:
 /users/js/features/podcasts.js

Part:
6/6 FINAL

Responsibilities:
- Global Events
- Sort Controller
- Search Integration
- App Integration
- Public API

================================================== */


(function(){

"use strict";





const PodcastController = {





/*
==================================================
BIND GLOBAL EVENTS
==================================================
*/


init(){



this.bindSort();


this.bindHeroActions();


this.bindSearchIntegration();




},







/*
==================================================
SORT BUTTON
==================================================
*/


bindSort(){



const button =
document.getElementById(
"sortPodcastButton"
);





if(!button)
return;







button.addEventListener(
"click",

()=>{



const current =
PodcastManager.state.sort;





if(
current==="latest"
){


PodcastManager.sort(
"oldest"
);



button.innerHTML = `

<i class="fa-solid fa-arrow-up-wide-short"></i>

قدیمی‌ترین

`;



}

else{


PodcastManager.sort(
"latest"
);



button.innerHTML = `

<i class="fa-solid fa-arrow-down-wide-short"></i>

جدیدترین

`;



}




}

);



},







/*
==================================================
HERO BUTTON
==================================================
*/


bindHeroActions(){



const start =
document.getElementById(
"startListeningButton"
);





if(start){



start.onclick=()=>{



const section =
document.getElementById(
"podcasts"
);



if(section){


section.scrollIntoView({

behavior:"smooth"

});


}



};



}









const explore =
document.getElementById(
"exploreButton"
);





if(explore){



explore.onclick=()=>{


const section =
document.getElementById(
"podcasts"
);




if(section){


section.scrollIntoView({

behavior:"smooth"

});


}



};



}




},







/*
==================================================
SEARCH CONNECT
==================================================
*/


bindSearchIntegration(){



window.NightCastSearch = {


search(keyword){



return PodcastManager.search(
keyword
);



}



};



},







/*
==================================================
REFRESH
==================================================
*/


refresh(){


PodcastManager.load(
true
);


}






};








window.PodcastController =
PodcastController;








/*
==================================================
START MODULE
==================================================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{


PodcastController.init();


}

);






})(); 
 
