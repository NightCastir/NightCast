document.addEventListener("DOMContentLoaded", function(){


const box = document.querySelector(".social-grid");


if(!box) return;



fetch("../data/social-feed.json")

.then(res => res.json())

.then(data => {


box.innerHTML = "";


data.forEach(item => {


box.innerHTML += `


<a href="${item.url}" target="_blank" class="social-card">


<img class="social-image" src="${item.image}" alt="${item.platform}">


<div class="social-content">


<div class="platform">

<i class="fa-solid fa-radio"></i>

${item.platform}

</div>



<h4>
${item.title}
</h4>



<p>
${item.description}
</p>



<span class="watch-btn">

مشاهده

<i class="fa-solid fa-arrow-left"></i>

</span>



</div>


</a>


`;


});


})


.catch(error=>{

console.log("Feed Error:",error);

});


});
