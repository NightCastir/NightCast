/*
==================================================
NightCast V2
Player Component
Version : 2.0.0
==================================================
*/

'use strict';

const Player = {

    audio: null,

    currentEpisode: null,

    isPlaying: false,

    volume: 1,



    init() {

        this.render();

        this.cache();

        this.bindEvents();

    },



    render() {

        const container =
            document.getElementById(
                "player"
            );

        if (!container)
            return;

        container.innerHTML = `

<div class="mini-player hide" id="miniPlayer">

<div class="player-cover">

<img
id="playerCover"
src="assets/images/logo.png"
alt="NightCast">

</div>

<div class="player-info">

<div
class="player-title"
id="playerTitle">

NightCast

</div>

<div
class="player-author"
id="playerAuthor">

آماده پخش...

</div>

</div>

<div class="player-controls">

<button
class="player-btn"
id="playerPrev">

<i class="fa-solid fa-backward-step"></i>

</button>

<button
class="player-btn play"
id="playerPlay">

<i class="fa-solid fa-play"></i>

</button>

<button
class="player-btn"
id="playerNext">

<i class="fa-solid fa-forward-step"></i>

</button>

</div>

<div class="player-progress">

<span id="playerProgress"></span>

</div>

<audio
id="audioPlayer"
preload="metadata">

</audio>

</div>

`;

    },



    cache() {

    this.audio =
        document.getElementById(
            "audioPlayer"
        );

    this.miniPlayer =
        document.getElementById(
            "miniPlayer"
        );

    this.cover =
        document.getElementById(
            "playerCover"
        );

    this.title =
        document.getElementById(
            "playerTitle"
        );

    this.author =
        document.getElementById(
            "playerAuthor"
        );

    this.playButton =
        document.getElementById(
            "playerPlay"
        );

    this.progressContainer =
        document.getElementById(
            "progressContainer"
        );

    this.progressBar =
        document.getElementById(
            "progressBar"
        );

    this.currentTime =
        document.getElementById(
            "currentTime"
        );

    this.duration =
        document.getElementById(
            "duration"
        );

},



    bindEvents() {

        if (!this.audio)
            return;


this.audio.addEventListener(

    "timeupdate",

    () => {

        this.updateProgress();

    }

);



this.progressContainer.onclick =

    (event) => {

        this.seek(event);

    };
        this.audio.addEventListener(

            "ended",

            () => {

                this.stop();

                
            }

        );

    }

};

formatTime(seconds) {

    if (

        isNaN(seconds)

    ) {

        return "00:00";

    }

    const minutes =

        Math.floor(

            seconds / 60

        );

    const secs =

        Math.floor(

            seconds % 60

        );

    return (

        String(minutes)

        .padStart(2,"0")

        +

        ":"

        +

        String(secs)

        .padStart(2,"0")

    );

},



updateProgress() {

    if (

        !this.audio.duration

    ) {

        return;

    }

    const percent =

        (

            this.audio.currentTime

            /

            this.audio.duration

        )

        *

        100;

    this.progressBar.style.width =

        percent + "%";

    this.currentTime.textContent =

        this.formatTime(

            this.audio.currentTime

        );

    this.duration.textContent =

        this.formatTime(

            this.audio.duration

        );

},



seek(event) {

    const rect =

        this.progressContainer.getBoundingClientRect();

    const percent =

        (

            event.clientX - rect.left

        )

        /

        rect.width;

    this.audio.currentTime =

        percent *

        this.audio.duration;

            };

Object.freeze(Player);

play(episode) {

    if (!episode)
        return;

    this.currentEpisode = episode;

    this.title.textContent =
        episode.title || "بدون عنوان";

    this.author.textContent =
        episode.author ||
        episode.publisher ||
        "NightCast";

    this.cover.src =
        episode.image ||
        episode.thumbnail ||
        "assets/images/logo.png";

    this.audio.src =
        episode.audio ||
        episode.audioUrl ||
        episode.url ||
        "";

    this.audio.play();

    this.isPlaying = true;

    this.miniPlayer.classList.remove("hide");

    this.updatePlayButton();

},



pause() {

    if (!this.audio)
        return;

    this.audio.pause();

    this.isPlaying = false;

    this.updatePlayButton();

},



resume() {

    if (!this.audio)
        return;

    this.audio.play();

    this.isPlaying = true;

    this.updatePlayButton();

},



stop() {

    if (!this.audio)
        return;

    this.audio.pause();

    this.audio.currentTime = 0;

    this.isPlaying = false;

    this.updatePlayButton();

},



toggle() {

    if (!this.audio)
        return;

    if (this.audio.paused) {

        this.resume();

    }

    else {

        this.pause();

    }

},



updatePlayButton() {

    if (!this.playButton)
        return;

    this.playButton.innerHTML =

        this.isPlaying

        ?

        '<i class="fa-solid fa-pause"></i>'

        :

        '<i class="fa-solid fa-play"></i>';

},<div class="mini-player hide" id="miniPlayer">

<div class="player-cover">

<img
id="playerCover"
src="assets/images/logo.png"
alt="NightCast">

</div>

<div class="player-info">

<div
class="player-title"
id="playerTitle">

NightCast

</div>

<div
class="player-author"
id="playerAuthor">

آماده پخش...

</div>

<div class="player-time">

<span id="currentTime">

00:00

</span>

<span>

/

</span>

<span id="duration">

00:00

</span>

</div>

<div
class="progress-container"
id="progressContainer">

<div
class="progress-bar"
id="progressBar">

</div>

</div>

</div>

<div class="player-controls">

<button
class="player-btn"
id="playerPrev">

<i class="fa-solid fa-backward-step"></i>

</button>

<button
class="player-btn play"
id="playerPlay">

<i class="fa-solid fa-play"></i>

</button>

<button
class="player-btn"
id="playerNext">

<i class="fa-solid fa-forward-step"></i>

</button>

</div>

<audio
id="audioPlayer"
preload="metadata">

</audio>

</div>
