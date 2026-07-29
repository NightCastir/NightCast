alert("app.js loaded");
const API = "https://ncstgetrssfromaparat.tomasgermany2580.workers.dev";

const episodes = document.getElementById("episodes");
const loader = document.getElementById("loader");

const sheet = document.getElementById("playerSheet");
const overlay = document.getElementById("overlay");

const title = document.getElementById("sheetTitle");
const video = document.getElementById("videoContainer");
const desc = document.getElementById("episodeDescription");

const search = document.getElementById("search");

let allEpisodes = [];

async function loadEpisodes() {

    loader.style.display = "flex";

    try {

        console.log("1- شروع");

        const res = await fetch(API);

        console.log("2- Fetch Status:", res.status);

        const data = await res.json();

        console.log("3- JSON:", data);

        allEpisodes = data.episodes || [];

        console.log("4- تعداد اپیزود:", allEpisodes.length);

        showEpisodes(allEpisodes);

        console.log("5- کارت‌ها ساخته شدند");

    } catch (err) {

        console.error("ERROR:", err);

        alert(err.message);

    } finally {

        console.log("6- Loader مخفی شد");

        loader.style.display = "none";

    }

}

function showEpisodes(list) {

    episodes.innerHTML = "";

    if (list.length === 0) {

        episodes.innerHTML = "<p>موردی یافت نشد.</p>";

        return;

    }

    list.forEach(item => {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <div class="cardBody">

                <h3>${item.title}</h3>

                <p>${shortText(item.description)}</p>

                <div class="meta">

                    <span>📅 ${date(item.published)}</span>

                    <span>▶ آپارات</span>

                </div>

                <button class="listen">

                    🎧 همین الان گوش بده

                </button>

            </div>

        `;

        card.onclick = () => openEpisode(item);

        episodes.appendChild(card);

    });

}

function openEpisode(item) {

    title.textContent = item.title;

    desc.textContent = item.description;

    video.innerHTML = `

        <iframe
            src="${item.embed}"
            loading="lazy"
            allowfullscreen>
        </iframe>

    `;

    sheet.classList.add("show");

    overlay.classList.add("show");

}

function closePlayer() {

    sheet.classList.remove("show");

    overlay.classList.remove("show");

    video.innerHTML = "";

}

document.getElementById("closeSheet").onclick = closePlayer;

overlay.onclick = closePlayer;

document.getElementById("listenButton").onclick = function () {

    sheet.scrollTo({

        top: 0,

        behavior: "smooth"

    });

};

if (search) {

    search.addEventListener("input", function () {

        const text = this.value.trim().toLowerCase();

        const filtered = allEpisodes.filter(item => {

            return (

                item.title.toLowerCase().includes(text) ||

                item.description.toLowerCase().includes(text)

            );

        });

        showEpisodes(filtered);

    });

}

function shortText(text) {

    if (!text) return "";

    return text.length > 170

        ? text.substring(0, 170) + "..."

        : text;

}

function date(text) {

    if (!text) return "";

    return text

        .replace("Mon,", "")

        .replace("Tue,", "")

        .replace("Wed,", "")

        .replace("Thu,", "")

        .replace("Fri,", "")

        .replace("Sat,", "")

        .replace("Sun,", "")

        .replace("+0330", "")

        .trim();

}

function toast(message) {

    const t = document.getElementById("toast");

    if (!t) return;

    t.textContent = message;

    t.style.display = "block";

    setTimeout(() => {

        t.style.display = "none";

    }, 2500);

}

loadEpisodes();
