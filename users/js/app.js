/*
=================================================

NightCast User App

Responsible for:

- Podcast Loading
- Infinite Scroll
- Podcast Cards
- Audio Player
- User Interface

=================================================
*/


"use strict";






class NightCastApp {



constructor(){



    this.page = 1;


    this.limit = 5;


    this.loading = false;


    this.finished = false;


    this.podcasts = [];



    this.container =

    document.getElementById(

        "podcastContainer"

    );



}









/*
==========================
INIT
==========================
*/


async init(){



try{



    this.bindEvents();



    await this.loadPodcasts();



}

catch(error){



console.error(

"APP INIT ERROR",

error

);



this.showError(

"خطا در بارگذاری رادیو"

);



}



}









/*
==========================
EVENTS
==========================
*/


bindEvents(){



window.addEventListener(

"scroll",

()=>{


this.handleScroll();



}

);



}









/*
==========================
INFINITE SCROLL
==========================
*/


handleScroll(){



if(this.loading || this.finished){

return;

}






const scrollPosition =

window.innerHeight +

window.scrollY;






const pageHeight =

document.body.offsetHeight;






if(

scrollPosition >=

pageHeight - 400

){



this.loadPodcasts();



}



}









/*
==========================
LOAD PODCASTS
==========================
*/


async loadPodcasts(){



if(

this.loading ||

this.finished

){

return;

}







try{



this.loading = true;



this.showLoading();







const result =

await API.get(

`/podcasts?page=${this.page}&limit=${this.limit}`

);








if(

!result ||

!result.success

){



throw new Error(

"دریافت پادکست‌ها ناموفق بود"

);



}








const items =

result.podcasts ||

result.data ||

[];








if(

items.length === 0

){



this.finished = true;



this.hideLoading();



return;



}







this.podcasts.push(

...items

);






this.render(items);






this.page++;






}

catch(error){



console.error(

"LOAD PODCAST ERROR",

error

);



this.showError(

error.message

);



}

finally{



this.loading=false;



this.hideLoading();



}



}
  

/*
==========================
RENDER PODCAST CARDS
==========================
*/


render(items){



if(!this.container){



console.error(

"Podcast container not found"

);



return;


}








items.forEach(

podcast=>{



const card =

document.createElement(

"article"

);



card.className =

"podcast-card";









card.innerHTML = `



<div class="podcast-cover-box">



<img

src="${

podcast.cover_url ||

"assets/images/default-cover.jpg"

}"

class="podcast-cover"

alt="NightCast">



</div>







<div class="podcast-content">



<h2>

${

this.escapeHTML(

podcast.title

)

}

</h2>






<div class="podcast-meta">



<span>

📚

${

podcast.book_name ||

"بدون کتاب"

}

</span>





<span>

🎙 قسمت

${

podcast.episode_number ||

1

}

</span>





</div>








<p>

${

this.escapeHTML(

podcast.summary ||

podcast.description ||

""

)

}

</p>







<div class="podcast-actions">



<button

class="btn btn-primary play-btn">


▶ گوش دادن


</button>







<button

class="btn btn-secondary detail-btn">


جزئیات


</button>







<button

class="btn btn-download download-btn">


⬇ دانلود


</button>



</div>





</div>



`;








/*
--------------------------
PLAY
--------------------------
*/


card

.querySelector(

".play-btn"

)

.addEventListener(

"click",

()=>{


this.playPodcast(

podcast

);



}

);








/*
--------------------------
DETAIL
--------------------------
*/


card

.querySelector(

".detail-btn"

)

.addEventListener(

"click",

()=>{


this.openDetail(

podcast

);



}

);









/*
--------------------------
DOWNLOAD
--------------------------
*/


card

.querySelector(

".download-btn"

)

.addEventListener(

"click",

()=>{



this.download(

podcast

);



}

);







this.container.appendChild(

card

);





}

);



}









/*
==========================
PLAY PODCAST
==========================
*/


playPodcast(podcast){



if(

window.player

){



player.play(

podcast

);



}



}









/*
==========================
DOWNLOAD
==========================
*/


download(podcast){



if(

window.userAuth &&

!userAuth.canDownload()

){



return;


}






const link =

document.createElement(

"a"

);






link.href =

podcast.audio_url;






link.download =

"NightCast.mp3";






link.click();



}









/*
==========================
DETAIL POPUP
==========================
*/


openDetail(podcast){



const popup =

document.getElementById(

"podcastPopup"

);






if(!popup){

return;

}







document

.getElementById(

"detailCover"

)

.src =

podcast.cover_url || "";








document

.getElementById(

"detailTitle"

)

.innerText =

podcast.title;








document

.getElementById(

"detailSummary"

)

.innerText =

podcast.summary ||

podcast.description ||

"";







popup.classList.add(

"active"

);



}
  

/*
==========================
CLOSE POPUP
==========================
*/


closePopup(){



const popup =

document.getElementById(

"podcastPopup"

);





if(popup){



popup.classList.remove(

"active"

);



}



}









/*
==========================
COMMENT ACCESS
==========================
*/


comment(podcastId){



if(

window.userAuth &&

!userAuth.canComment()

){



return;


}







/*

در این مرحله فرم نظرات جداگانه

ساخته خواهد شد.


فعلاً فقط آماده‌سازی مسیر است.


*/



window.location.href =

"comments.html?id="

+

podcastId;



}









/*
==========================
LOADING
==========================
*/


showLoading(){



const loader =

document.getElementById(

"globalLoader"

);






if(loader){



loader.classList.add(

"active"

);



}






}









hideLoading(){



const loader =

document.getElementById(

"globalLoader"

);






if(loader){



loader.classList.remove(

"active"

);



}



}









/*
==========================
ERROR MESSAGE
==========================
*/


showError(message){



if(

window.Toast &&

Toast.error

){



Toast.error(message);



}

else{



console.error(message);



}



}









/*
==========================
SUCCESS MESSAGE
==========================
*/


showSuccess(message){



if(

window.Toast &&

Toast.success

){



Toast.success(message);



}

else{



console.log(message);



}



}









/*
==========================
ESCAPE HTML

امنیت نمایش متن
==========================
*/


escapeHTML(value){



return String(

value || ""

)

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









/*
==========================
START APP
==========================
*/


document.addEventListener(

"DOMContentLoaded",

async()=>{



window.nightCastApp =

new NightCastApp();





await nightCastApp.init();




});
