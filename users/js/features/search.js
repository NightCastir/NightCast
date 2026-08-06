/*
=================================================

NightCast Search Module

File:
users/js/features/search.js

Responsibilities:

- Main search
- Mobile search
- Search overlay control
- Search result rendering
- API communication

Dependencies:

- api.js
- ui.js

=================================================
*/


(function(){

"use strict";



window.NightCast = window.NightCast || {};





const Search = {





/*
=================================================
CONFIG
=================================================
*/


config:{


minCharacters:2,


delay:400,


activeClass:"active"


},







state:{


timer:null,


query:"",


results:[],


isOpen:false


},







elements:{},







/*
=================================================
INIT
=================================================
*/


init(){


this.cacheElements();


this.bindEvents();


console.log(
"NightCast Search Initialized"
);


},







/*
=================================================
CACHE DOM
=================================================
*/


cacheElements(){



this.elements.searchInput =
document.getElementById(
"searchInput"
);



this.elements.mobileInput =
document.getElementById(
"mobileSearchInput"
);



this.elements.overlay =
document.getElementById(
"searchOverlay"
);



this.elements.results =
document.getElementById(
"searchResults"
);



this.elements.closeButton =
document.getElementById(
"closeSearch"
);



},







/*
=================================================
EVENTS
=================================================
*/


bindEvents(){



if(this.elements.searchInput){


this.elements.searchInput.addEventListener(
"input",
(e)=>{


this.handleTyping(
e.target.value
);


});


}






if(this.elements.mobileInput){


this.elements.mobileInput.addEventListener(
"input",
(e)=>{


this.handleTyping(
e.target.value
);


});


}






if(this.elements.closeButton){


this.elements.closeButton.addEventListener(
"click",
()=>{


this.close();


});


}



document.querySelectorAll(
'[data-action="open-search"]'
)
.forEach(btn=>{


btn.addEventListener(
"click",
()=>{


this.open();


});


});



},







/*
=================================================
OPEN SEARCH
=================================================
*/


open(){



if(!this.elements.overlay)
return;



this.elements.overlay.classList.remove(
"hidden"
);



this.state.isOpen=true;



document.body.classList.add(
"search-open"
);



},







/*
=================================================
CLOSE SEARCH
=================================================
*/


close(){



if(!this.elements.overlay)
return;



this.elements.overlay.classList.add(
"hidden"
);



this.state.isOpen=false;



document.body.classList.remove(
"search-open"
);



},







/*
=================================================
TYPING HANDLER
=================================================
*/


handleTyping(value){



clearTimeout(
this.state.timer
);



const query =
value.trim();





this.state.query=query;





if(query.length <
this.config.minCharacters){


this.clearResults();


return;


}







this.state.timer =
setTimeout(()=>{


this.search(
query
);


},
this.config.delay);



},







/*
=================================================
SEARCH REQUEST
=================================================
*/


async search(query){


try{


this.showLoading();





let response =
await NightCastAPI.get(
"/search?q="+
encodeURIComponent(query)
);





this.state.results =
response.data ||
response.results ||
[];





this.renderResults();




}
catch(error){



console.error(
"Search Error:",
error
);



this.showError();



}



},







/*
=================================================
LOADING
=================================================
*/


showLoading(){


if(!this.elements.results)
return;


this.elements.results.innerHTML=`

<div class="search-loading">

<i class="fa-solid fa-spinner fa-spin"></i>

در حال جستجو...

</div>

`;

},
/*
=================================================
ERROR STATE
=================================================
*/


showError(){


if(!this.elements.results)
return;



this.elements.results.innerHTML=`

<div class="search-empty">

<i class="fa-solid fa-circle-exclamation"></i>

<p>
خطا در دریافت نتایج جستجو
</p>

</div>

`;

},







/*
=================================================
RENDER RESULTS
=================================================
*/


renderResults(){



if(!this.elements.results)
return;




if(!this.state.results.length){


this.elements.results.innerHTML=`

<div class="search-empty">

<i class="fa-solid fa-magnifying-glass"></i>

<p>
نتیجه‌ای پیدا نشد
</p>

</div>

`;

return;


}






this.elements.results.innerHTML = "";





this.state.results.forEach(item=>{


const card =
this.createResultCard(item);



this.elements.results.appendChild(
card
);



});





},







/*
=================================================
CREATE RESULT CARD
=================================================
*/


createResultCard(item){



const card =
document.createElement(
"article"
);



card.className =
"search-result-card";





const type =
item.type ||
"podcast";






const title =
item.title ||
item.name ||
"بدون عنوان";





const cover =
item.cover ||
item.image ||
"/users/assets/images/default-cover.jpg";






const author =
item.author ||
item.author_name ||
"NightCast";






card.innerHTML = `

<div class="search-result-cover">


<img

src="${cover}"

alt="${title}"

loading="lazy">


</div>




<div class="search-result-info">


<h4>

${title}

</h4>



<p>

${author}

</p>



<span class="search-result-type">

${this.getTypeLabel(type)}

</span>



</div>

`;







card.addEventListener(
"click",
()=>{


this.selectResult(
item
);


});





return card;



},







/*
=================================================
TYPE LABEL
=================================================
*/


getTypeLabel(type){



const labels={


podcast:"پادکست",


book:"کتاب صوتی",


author:"نویسنده"



};





return labels[type] ||
"محتوا";


},







/*
=================================================
RESULT SELECT
=================================================
*/


selectResult(item){



console.log(
"Selected Search Result:",
item
);





/*
اگر پادکست باشد
مستقیماً به Player ارسال می‌شود
*/


if(
item.type === "podcast" &&
window.NightCast &&
NightCast.Player
){



NightCast.Player.load(
item
);



this.close();



return;


}






/*
در آینده:
Book page
Author page

*/




if(item.url){


window.location.href =
item.url;


}





},







/*
=================================================
CLEAR RESULTS
=================================================
*/


clearResults(){



if(!this.elements.results)
return;



this.elements.results.innerHTML="";



},







/*
=================================================
SET QUERY
=================================================
*/


setQuery(value){



if(this.elements.searchInput){


this.elements.searchInput.value =
value;


}



if(this.elements.mobileInput){


this.elements.mobileInput.value =
value;


}



this.handleTyping(
value
);



}






};








/*
=================================================
EXPORT
=================================================
*/


window.NightCast.Search =
Search;




})();
    
