// NightCast v2

document.addEventListener("DOMContentLoaded", function () {


fetch("../data/social.json")

.then(response => response.json())

.then(data => {


const socialBox = document.querySelector(".social-grid");


if(!socialBox) return;


socialBox.innerHTML = "";


data.forEach(item => {


socialBox.innerHTML += `

<a href="${item.url}" target="_blank" class="social-card">


<div class="platform">

<i class="fa-solid fa-radio"></i>

${item.name}

</div>


<p>
ورود به صفحه رسمی NightCast در ${item.name}
</p>


</a>

`;


});


})


.catch(error => {

console.log("Social Load Error:", error);

});


});
