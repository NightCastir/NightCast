/* =====================================
   NightCast v1.0
   Aparat Episode Card
===================================== */


document.addEventListener(
"DOMContentLoaded",
()=>{


const box = document.getElementById(
"aparat-video"
);



if(!box) return;



fetch("data/aparat.json")


.then(res=>res.json())


.then(video=>{


if(!video.title){

box.innerHTML =

`
<div class="loading">
اپیزودی پیدا نشد
</div>
`;

return;

}



box.innerHTML =


`

<div class="episode-wrapper">


<div class="episode-image">


<img

src="${video.thumbnail || 'assets/logo.png'}"

alt="${video.title}"

loading="lazy"

/>


</div>




<div class="episode-info">


<h3>

${video.title}

</h3>



<p>

${video.description || ""}

</p>



<div class="episode-date">

${video.date || ""}

</div>



<a

href="${video.url}"

target="_blank"

class="btn"

>

▶ مشاهده ویدئو

</a>


</div>



</div>

`;




})


.catch(err=>{


console.error(
"NightCast Aparat Error",
err
);


box.innerHTML =

`

<div class="loading">

خطا در دریافت اطلاعات

</div>

`;



});



});
