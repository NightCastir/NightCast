/* ==================================================

NightCast Library Manager V1

File:
 /users/js/features/library.js

Responsibility:

- Continue Listening
- History
- Saved Podcasts
- Recently Played

Depends:

player.js
ui.js

================================================== */

const NightCastLibrary = {

    historyKey: "NightCastHistory",

    continueKey: "NightCastContinue",

    favoriteKey: "NightCastFavorites",





    /*
    ====================================
    INIT
    ====================================
    */

    init(){

        this.renderContinue();

        console.log("NightCast Library Loaded");

    },






    /*
    ====================================
    SAVE LAST PLAYED
    ====================================
    */

    saveContinue(podcast, currentTime = 0){

        if(!podcast){

            return;

        }

        const data = {

            id: podcast.id,

            title: podcast.title,

            author: podcast.author,

            cover: podcast.cover,

            audio: podcast.audio,

            currentTime: currentTime,

            updatedAt: Date.now()

        };

        localStorage.setItem(

            this.continueKey,

            JSON.stringify(data)

        );

        this.addHistory(data);

    },






    /*
    ====================================
    LOAD CONTINUE
    ====================================
    */

    getContinue(){

        try{

            return JSON.parse(

                localStorage.getItem(

                    this.continueKey

                )

            );

        }

        catch{

            return null;

        }

    },






    /*
    ====================================
    HISTORY
    ====================================
    */

    addHistory(item){

        let history = this.getHistory();

        history = history.filter(

            x => x.id !== item.id

        );

        history.unshift(item);

        history = history.slice(0,50);

        localStorage.setItem(

            this.historyKey,

            JSON.stringify(history)

        );

    },






    /*
    ====================================
    GET HISTORY
    ====================================
    */

    getHistory(){

        try{

            return JSON.parse(

                localStorage.getItem(

                    this.historyKey

                )

            ) || [];

        }

        catch{

            return [];

        }

    },






    /*
    ====================================
    FAVORITES
    ====================================
    */

    getFavorites(){

        try{

            return JSON.parse(

                localStorage.getItem(

                    this.favoriteKey

                )

            ) || [];

        }

        catch{

            return [];

        }

    },






    /*
    ====================================
    CONTINUE UI
    ====================================
    */

    renderContinue(){

        const box =

        document.getElementById(

            "continueListening"

        );

        if(!box){

            return;

        }

        const item = this.getContinue();

        if(!item){

            return;

        }

        box.innerHTML = `

<div class="continue-card">

    <img

    src="${item.cover ||

    "/users/assets/images/default-cover.jpg"}"

    class="continue-cover">



    <div class="continue-info">

        <h3>${item.title}</h3>

        <p>${item.author || "NightCast"}</p>

        <small>

        ادامه از

        ${this.format(item.currentTime)}

        </small>

    </div>



    <button

    class="gold-button"

    id="continuePlay">

        ادامه پخش

    </button>

</div>

`;

        const btn =

        document.getElementById(

            "continuePlay"

        );

        if(btn){

            btn.onclick = ()=>{

                if(window.NightCastPlayer){

                    NightCastPlayer.load(item);

                    NightCastPlayer.audio.currentTime =

                        item.currentTime || 0;

                    NightCastPlayer.play();

                }

            };

        }

    },






    /*
    ====================================
    CLEAR HISTORY
    ====================================
    */

    clearHistory(){

        localStorage.removeItem(

            this.historyKey

        );

    },






    /*
    ====================================
    CLEAR CONTINUE
    ====================================
    */

    clearContinue(){

        localStorage.removeItem(

            this.continueKey

        );

    },






    /*
    ====================================
    FORMAT TIME
    ====================================
    */

    format(sec){

        sec = parseInt(sec || 0);

        let m = Math.floor(sec/60);

        let s = sec%60;

        return (

            String(m).padStart(2,"0")

            + ":"

            +

            String(s).padStart(2,"0")

        );

    }

};

window.NightCastLibrary = NightCastLibrary;
