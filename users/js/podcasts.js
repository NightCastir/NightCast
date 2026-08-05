/* ==================================================
   NightCast User Podcasts Manager
   File: /users/js/podcasts.js
   Version: 2.0
================================================== */


const NightCastPodcasts = {



page: 1,


limit: 5,


podcasts: [],


total: 0,


hasMore: true,


loading: false,





/*
====================================
INIT
====================================
*/


async init(){


this.reset();


await this.load();



},







/*
====================================
LOAD PODCASTS
====================================
*/


async load(){



if(this.loading){

return;

}



if(!this.hasMore && this.page !== 1){

return;

}



this.loading = true;



NightCastUI.showLoader();





try{



const result =

await NightCastAPI.getPodcasts(

this.page,

this.limit

);






console.log(

"NightCast Podcasts API:",

result

);







if(result.success){



this.total =

result.total || 0;





this.hasMore =

result.hasMore || false;







const newItems =

result.podcasts || [];







/*

صفحه اول:

جایگزینی کامل


صفحات بعد:

اضافه کردن به لیست قبلی

*/


if(this.page === 1){


this.podcasts = newItems;


}

else{


this.podcasts.push(

...newItems

);


}







this.render();




this.updateLoadMore();




}

else{



NightCastUI.error(

result.message ||

"خطا در دریافت پادکست‌ها"

);



}





}

catch(error){



console.error(

error

);



NightCastUI.error(

"خطا در ارتباط با سرور"

);



}



finally{



this.loading=false;



NightCastUI.hideLoader();



}



},







/*
====================================
RENDER
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

this.podcasts.length === 0

){



container.innerHTML =

`

<div class="empty-state">

هنوز پادکستی منتشر نشده است

</div>

`;



return;



}







this.podcasts.forEach(

podcast => {



container.innerHTML +=

this.card(podcast);



}

);



},







/*
====================================
CARD
====================================
*/


card(p){



return `



<div class="podcast-card"

data-id="${p.id}">






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





<div class="play-overlay"

onclick="NightCastPodcasts.play(${p.id})">

▶

</div>





</div>






<div class="podcast-info">






<h3 class="podcast-title">

${

p.title || "بدون عنوان"

}

</h3>







<div class="book-info">

📚 ${

p.book_name ||

"بدون کتاب"

}

</div>







<div class="author-info">

✍ ${

p.author_name ||

"نامشخص"

}

</div>








<div class="meta">


<span>

🎧 ${

p.listen_count || 0

}

</span>



<span>

⏱ ${

NightCastUI.formatTime(

p.duration_seconds || 0

)

}

</span>



</div>





<p class="podcast-summary">

${

p.summary ||

p.description ||

"بدون توضیحات"

}

</p>







<div class="podcast-actions">





<button

class="play-btn"

onclick="NightCastPodcasts.play(${p.id})">

▶ پخش

</button>







<button

class="download-btn"

onclick="NightCastPodcasts.download(${p.id})">

⬇ دانلود

</button>





</div>







</div>



</div>



`;



},











/*
====================================
PLAY PODCAST
====================================
*/


async play(id){



const podcast =

this.podcasts.find(

item => item.id == id

);





if(!podcast){


NightCastUI.error(

"پادکست پیدا نشد"

);


return;


}







if(

window.NightCastPlayer &&

typeof NightCastPlayer.play === "function"

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



try{



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

else{



NightCastUI.error(

"آدرس فایل صوتی موجود نیست"

);



}





}

else{



NightCastUI.error(

result.message ||

"دانلود امکان پذیر نیست"

);



}



}

catch(error){



console.error(error);



NightCastUI.error(

"خطا در دانلود"

);



}



},







/*
====================================
NEXT PAGE / LOAD MORE
====================================
*/


async nextPage(){





if(

this.loading

){


return;


}






if(

!this.hasMore

){



NightCastUI.info(

"پادکست بیشتری وجود ندارد"

);



return;



}







this.page++;






await this.load();




},







/*
====================================
LOAD MORE BUTTON
====================================
*/


updateLoadMore(){



const btn =

document.getElementById(

"loadMoreBtn"

);





if(!btn){

return;

}





if(

this.hasMore

){



btn.style.display = "block";


btn.disabled = false;



btn.innerHTML =

"نمایش پادکست‌های بیشتر";



}

else{



btn.style.display="none";



}



},







/*
====================================
RESET
====================================
*/


reset(){



this.page = 1;



this.podcasts = [];



this.total = 0;



this.hasMore = true;



},
   

/*
====================================
SEARCH
====================================
*/


search(keyword){



keyword =

keyword.trim().toLowerCase();





if(!keyword){



this.render();



return;



}






const filtered =

this.podcasts.filter(

p=>{



return (

(p.title || "")

.toLowerCase()

.includes(keyword)

||



(p.book_name || "")

.toLowerCase()

.includes(keyword)

||



(p.author_name || "")

.toLowerCase()

.includes(keyword)



);



}

);






const container =

document.getElementById(

"podcastList"

);





if(!container){

return;

}





container.innerHTML="";






if(filtered.length===0){



container.innerHTML=

`

<div class="empty-state">

نتیجه‌ای پیدا نشد

</div>

`;



return;



}







filtered.forEach(

podcast=>{


container.innerHTML +=

this.card(podcast);



}

);



},







/*
====================================
CATEGORY FILTER
====================================
*/


filterCategory(category){



if(

category === "all"

){



this.render();



return;



}






const filtered =

this.podcasts.filter(

p=>{



return (

p.category_name &&

p.category_name

.toLowerCase()

.includes(

category.toLowerCase()

)

);



}

);







const container =

document.getElementById(

"podcastList"

);





if(!container){

return;

}





container.innerHTML="";






filtered.forEach(

podcast=>{



container.innerHTML +=

this.card(podcast);



}

);



},







/*
====================================
INFINITE SCROLL READY
====================================
*/


enableInfiniteScroll(){



window.addEventListener(

"scroll",

()=>{





const nearBottom =

window.innerHeight +

window.scrollY >=

document.body.offsetHeight - 300;







if(

nearBottom &&

this.hasMore &&

!this.loading

){



this.nextPage();



}





}

);



},







};









/*
====================================
GLOBAL ACCESS
====================================
*/


window.NightCastPodcasts =

NightCastPodcasts;









/*
====================================
START
====================================
*/


document.addEventListener(

"DOMContentLoaded",

()=>{





NightCastPodcasts.init();





NightCastPodcasts.enableInfiniteScroll();






const search =

document.getElementById(

"searchInput"

);






if(search){



search.addEventListener(

"input",

e=>{



NightCastPodcasts.search(

e.target.value

);



}

);



}







document.querySelectorAll(

".category-btn"

)

.forEach(

btn=>{



btn.addEventListener(

"click",

()=>{



document

.querySelectorAll(

".category-btn"

)

.forEach(

b=>

b.classList.remove(

"active"

)

);







btn.classList.add(

"active"

);






NightCastPodcasts.filterCategory(

btn.dataset.category

);



}

);



}

);



});
