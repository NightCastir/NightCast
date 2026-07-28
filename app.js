const API = "https://ncstgetrssfromaparat.tomasgermany2580.workers.dev/";

const episodes = document.getElementById("episodes");

const modal = document.getElementById("modal");

const player = document.getElementById("player");

const closeModal = document.getElementById("closeModal");


async function loadVideos(){

    try{

        const response = await fetch(API);

        const data = await response.json();

        episodes.innerHTML = "";

        data.episodes.forEach(video=>{

            episodes.innerHTML += `

            <article class="card">

                <h2>${video.title}</h2>

                <p>${video.description}</p>

                <button onclick="playVideo('${video.embed}')">

                    ▶ تماشای ویدیو

                </button>

            </article>

            `;

        });

    }

    catch(error){

        episodes.innerHTML=`

            <article class="card">

                <h2>خطا</h2>

                <p>

                ارتباط با سرور برقرار نشد.

                </p>

            </article>

        `;

    }

}



function playVideo(url){

    player.src=url;

    modal.style.display="flex";

}



closeModal.onclick=function(){

    player.src="";

    modal.style.display="none";

}



window.onclick=function(e){

    if(e.target===modal){

        player.src="";

        modal.style.display="none";

    }

}



loadVideos();
