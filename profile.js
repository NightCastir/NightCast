const user = JSON.parse(localStorage.getItem("user"));

if(user){

document.getElementById("userName").textContent =
user.name || "NightCast User";

document.getElementById("userEmail").textContent =
user.email || user.phone;

document.getElementById("avatar").textContent =
(user.name || "N")
.charAt(0)
.toUpperCase();

}

document
.getElementById("logout")
.onclick=function(){

localStorage.removeItem("token");

localStorage.removeItem("user");

location.href="index.html";

};
