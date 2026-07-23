/* ==========================================
   NightCast App v1.0
========================================== */

document.addEventListener("DOMContentLoaded", init);

function init(){

    initNavigation();

    initPlayer();

    initHero();

}

/* ========================= */

function initNavigation(){

    const links=document.querySelectorAll(".bottom-nav a");

    links.forEach(link=>{

        link.addEventListener("click",()=>{

            links.forEach(item=>item.classList.remove("active"));

            link.classList.add("active");

        });

    });

}

/* ========================= */

function initPlayer(){

    const play=document.getElementById("player-play");

    let playing=false;

    play.addEventListener("click",()=>{

        const img=play.querySelector("img");

        playing=!playing;

        img.src=playing

        ?"assets/icons/pause.svg"

        :"assets/icons/play.svg";

    });

}

/* ========================= */

function initHero(){

    const button=document.querySelector(".hero-button");

    if(!button) return;

    button.addEventListener("click",(e)=>{

        e.preventDefault();

        document

        .getElementById("latest")

        .scrollIntoView({

            behavior:"smooth"

        });

    });

}
