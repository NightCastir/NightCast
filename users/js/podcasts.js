/* ==================================================
   NightCast User Podcasts Manager
   File: /users/js/podcasts.js
   Version: 1.0
================================================== */



const NightCastPodcasts = {




page:1,


limit:5,



podcasts:[],







/*
====================================
INIT
====================================
*/


async init(){


await this.load();


},







/*
====================================
LOAD PODCASTS
====================================
*/


async load(){



NightCastUI.showLoader();





const result =

await NightCastAPI.getPodcasts(

this.page,

this.limit

);





NightCastUI.hideLoader();






if(

result.success

){



this.podcasts =

result.podcasts || [];



this.render();



}

else{



NightCastUI.error(

result.message ||

"خطا در دریافت پادکست‌ها"

);



}




},







/*
====================================
RENDER PODCAST CARDS
====================================
*/


render(){



const container =

document.getElementById(

"podcastList"

);





if(!container){

return;

}






container.innerHTML="";





if(

this.podcasts.length===0

){



container.innerHTML=

`

<div class="empty-state">

هنوز پادکستی منتشر نشده است

</div>

`;



return;


}







this.podcasts.forEach(

podcast=>{



container.innerHTML +=



this.card(

podcast

);



}

);



},







/*
====================================
CARD TEMPLATE
====================================
*/


card(p){



return `



<div class="podcast-card">



<div class="cover-wrapper">



<img

class="podcast-cover"

src="${

p.cover_url ||

'/users/assets/default-cover.jpg'

}"



onerror="this.src='/users/assets/default-cover.jpg'"



>



<div class="episode-badge">

قسمت ${

p.episode_number || 1

}

</div>



</div>







<div class="podcast-info">



<h3 class="podcast-title">

${

p.title || "بدون عنوان"

}

</h3>





<div class="meta">


<span>

🎧 ${

p.listen_count || 0

}

</span>



<span>

⏱ ${

NightCastUI.formatTime(

p.duration_seconds

)

}

</span>



</div>







<p class="podcast-summary">

${

p.summary ||

"بدون توضیحات"

}

</p>







<div class="podcast-actions">





<button

class="play-btn"

onclick="NightCastPodcasts.play(${p.id})"

>

▶ پخش

</button>







<button

class="download-btn"

onclick="NightCastPodcasts.download(${p.id})"

>

⬇ دانلود

</button>





</div>





</div>



</div>



`;



},







/*
====================================
PLAY
====================================
*/


async play(id){



const podcast =

this.podcasts.find(

p=>p.id==id

);





if(!podcast){

return;

}





if(

window.NightCastPlayer

){



NightCastPlayer.play(

podcast

);



}

else{



NightCastUI.error(

"Player آماده نیست"

);



}



},







/*
====================================
DOWNLOAD
====================================
*/


async download(id){



NightCastUI.showLoader();





const result =

await NightCastAPI.downloadPodcast(

id

);





NightCastUI.hideLoader();





if(

result.success &&

result.download

){





const url =

result.download.audio_url;





if(url){



window.open(

url,

"_blank"

);



NightCastUI.success(

"دانلود شروع شد"

);



}



}

else{



NightCastUI.error(

result.message ||

"دانلود امکان پذیر نیست"

);



}




},







/*
====================================
NEXT PAGE
====================================
*/


async nextPage(){



this.page++;



await this.load();



},







/*
====================================
RESET
====================================
*/


async reset(){



this.page=1;


await this.load();


}





};







window.NightCastPodcasts =

NightCastPodcasts;







document.addEventListener(

"DOMContentLoaded",

()=>{


NightCastPodcasts.init();



});
