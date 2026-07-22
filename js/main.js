document.addEventListener("DOMContentLoaded", function(){


const box = document.querySelector(".social-grid");


if(!box) return;



fetch("../data/social-feed.json")

.then(res=>res.json())

.then(data=>{


box.innerHTML="";


data.forEach(item=>{


box.innerHTML += `

<a href="${item.url}" target="_blank" class="social-card">


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


</a>

`;


});


})


.catch(err=>{

console.log(err);

});


});
