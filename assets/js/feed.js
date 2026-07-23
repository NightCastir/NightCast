/* ===================================================
   NightCast Feed Loader v1.0
=================================================== */

const API_URL = "/api/feed";

document.addEventListener("DOMContentLoaded", () => {

    loadFeed();

});

async function loadFeed() {

    const container = document.getElementById("feed-container");

    try {

        const response = await fetch(API_URL);

        if (!response.ok)
            throw new Error("Feed Error");

        const data = await response.json();

        renderFeed(data);

    }

    catch (err) {

        console.error(err);

        container.innerHTML = `

        <div class="feed-error">

            <h3>خطا در دریافت اطلاعات</h3>

            <button onclick="loadFeed()">

                تلاش مجدد

            </button>

        </div>

        `;

    }

}

function renderFeed(items){

    const container = document.getElementById("feed-container");

    container.innerHTML = "";

    items.forEach(item=>{

        container.innerHTML += createCard(item);

    });

}

function createCard(item){

return `

<div class="feed-card">

<img

class="feed-cover"

src="${item.image}"

loading="lazy">

<div class="feed-body">

<div class="feed-platform">

${platformIcon(item.platform)}

<span>

${item.platform}

</span>

</div>

<h3>

${item.title}

</h3>

<p>

${item.description}

</p>

<div class="feed-footer">

<span>

${item.date}

</span>

<a

href="${item.url}"

target="_blank">

مشاهده

</a>

</div>

</div>

</div>

`;

}

function platformIcon(platform){

switch(platform){

case "youtube":

return `<img src="assets/icons/youtube.svg">`;

case "aparat":

return `<img src="assets/icons/aparat.svg">`;

case "telegram":

return `<img src="assets/icons/telegram.svg">`;

default:

return "";

}

}
