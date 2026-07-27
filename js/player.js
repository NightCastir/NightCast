/* ==========================================================
   NightCast
   Player v2
   File : player.js
   ========================================================== */

"use strict";

/* ==========================================================
   Player Object
   ========================================================== */

const Player = {

    initialized: false,

    playing: false,

    currentEpisode: null,

    media: new Audio()

};

/* ==========================================================
   Cache DOM
   ========================================================== */

Player.ui = {

    root: document.getElementById("global-player"),

    cover: document.getElementById("player-cover"),

    title: document.getElementById("player-title"),

    subtitle: document.getElementById("player-subtitle"),

    play: document.getElementById("player-play"),

    close: document.getElementById("player-close"),

    progress: document.getElementById("player-progress"),

    progressFill: document.getElementById("progress-fill"),

    current: document.getElementById("current-time"),

    duration: document.getElementById("duration-time"),

    volume: document.getElementById("player-volume"),

    speed: document.getElementById("player-speed")

};

/* ==========================================================
   Initialize
   ========================================================== */

Player.init = function () {

    if (this.initialized) {

        return;

    }

    this.bindEvents();

    this.restoreSettings();

    this.initialized = true;

};

/* ==========================================================
   Start
   ========================================================== */

Player.start = function () {

    this.init();

};

/* ==========================================================
   Show Player
   ========================================================== */

Player.show = function () {

    if (!this.ui.root) {

        return;

    }

    this.ui.root.classList.add("active");

};

/* ==========================================================
   Hide Player
   ========================================================== */

Player.hide = function () {

    if (!this.ui.root) {

        return;

    }

    this.ui.root.classList.remove("active");

};

/* ==========================================================
   Reset Player
   ========================================================== */

Player.reset = function () {

    this.media.pause();

    this.media.currentTime = 0;

    this.currentEpisode = null;

    this.playing = false;




   
};



/* ==========================================================
   Load Episode
   ========================================================== */

Player.load = function (episode) {

    if (!episode) {

        console.warn("Episode is null.");

        return false;

    }

    this.currentEpisode = episode;

    /* ---------- Cover ---------- */

    if (this.ui.cover) {

        this.ui.cover.src =
            episode.cover || "assets/images/placeholder-cover.jpg";

        this.ui.cover.alt =
            episode.title || "NightCast";

    }

    /* ---------- Title ---------- */

    if (this.ui.title) {

        this.ui.title.textContent =
            episode.title || "";

    }

    /* ---------- Subtitle ---------- */

    if (this.ui.subtitle) {

        this.ui.subtitle.textContent =
            episode.description || "";

    }

    /* ---------- Audio ---------- */

    if (episode.audio && episode.audio !== "") {

        this.media.src = episode.audio;

        this.media.load();

    }

    this.updateMediaSession();

    this.show();

    return true;

};

/* ==========================================================
   Current Episode
   ========================================================== */

Player.getCurrent = function () {

    return this.currentEpisode;

};

/* ==========================================================
   Has Audio
   ========================================================== */

Player.hasAudio = function () {

    return (

        this.currentEpisode &&

        this.currentEpisode.audio &&

        this.currentEpisode.audio !== ""

    );

};

/* ==========================================================
   Has Video
   ========================================================== */

Player.hasVideo = function () {

    return (

        this.currentEpisode &&

        this.currentEpisode.video &&

        this.currentEpisode.video !== ""

    );

};

/* ==========================================================
   Open Video
   ========================================================== */

Player.openVideo = function () {

    if (!this.hasVideo()) {

        UI.toast(

            "لینک ویدئو موجود نیست.",

            "warning"

        );

        return;

    }

    window.open(

        this.currentEpisode.video,

        "_blank",

        "noopener"

    );

};




/* ==========================================================
   Play
   ========================================================== */

Player.play = async function () {

    if (!this.currentEpisode) {

        UI.toast(

            "اپیزودی انتخاب نشده است.",

            "warning"

        );

        return;

    }

    /* ---------- Audio ---------- */

    if (this.hasAudio()) {

        try {

            await this.media.play();

            this.playing = true;

            this.updatePlayButton();

            this.show();

        }

        catch (error) {

            console.error(error);

            UI.toast(

                "پخش فایل صوتی امکان‌پذیر نیست.",

                "error"

            );

        }

        return;

    }

    /* ---------- Video ---------- */

    if (this.hasVideo()) {

        this.openVideo();

        return;

    }

    UI.toast(

        "هیچ فایل قابل پخشی برای این اپیزود وجود ندارد.",

        "warning"

    );

};

/* ==========================================================
   Pause
   ========================================================== */

Player.pause = function () {

    if (this.hasAudio()) {

        this.media.pause();

    }

    this.playing = false;

    this.updatePlayButton();

};

/* ==========================================================
   Toggle
   ========================================================== */

Player.toggle = function () {

    if (!this.currentEpisode) {

        return;

    }

    if (this.playing) {

        this.pause();

    }

    else {

        this.play();

    }

};

/* ==========================================================
   Stop
   ========================================================== */

Player.stop = function () {

    if (this.hasAudio()) {

        this.media.pause();

        this.media.currentTime = 0;

    }

    this.playing = false;

    this.updatePlayButton();

};

/* ==========================================================
   Update Play Button
   ========================================================== */

Player.updatePlayButton = function () {

    if (!this.ui.play) {

        return;

    }

    this.ui.play.innerHTML = this.playing

        ? '<i class="fa-solid fa-pause"></i>'

        : '<i class="fa-solid fa-play"></i>';

};

/* ==========================================================
   Audio Events
   ========================================================== */

Player.media.addEventListener(

    "play",

    () => {

        Player.playing = true;

        Player.updatePlayButton();

    }

);

Player.media.addEventListener(

    "pause",

    () => {

        Player.playing = false;

        Player.updatePlayButton();

    }

);

Player.media.addEventListener(

    "ended",

    () => {

        Player.playing = false;

        Player.updatePlayButton();

    }

);






/* ==========================================================
   Progress
   ========================================================== */

Player.updateProgress = function () {

    if (!this.hasAudio()) {

        return;

    }

    if (!this.media.duration) {

        return;

    }

    const percent =

        (this.media.currentTime / this.media.duration) * 100;

    if (this.ui.progressFill) {

        this.ui.progressFill.style.width =

            percent + "%";

    }

    this.updateTime();

};

/* ==========================================================
   Update Time
   ========================================================== */

Player.updateTime = function () {

    if (!this.hasAudio()) {

        return;

    }

    if (this.ui.current) {

        this.ui.current.textContent =

            Feed.formatDuration(

                Math.floor(this.media.currentTime)

            );

    }

    if (

        this.ui.duration &&

        this.media.duration

    ) {

        this.ui.duration.textContent =

            Feed.formatDuration(

                Math.floor(this.media.duration)

            );

    }

};

/* ==========================================================
   Seek
   ========================================================== */

Player.seek = function (event) {

    if (!this.hasAudio()) {

        return;

    }

    if (!this.media.duration) {

        return;

    }

    const rect =

        this.ui.progress.getBoundingClientRect();

    const percent =

        (event.clientX - rect.left) /

        rect.width;

    this.media.currentTime =

        percent * this.media.duration;

};

/* ==========================================================
   Volume
   ========================================================== */

Player.setVolume = function (value) {

    value = Number(value);

    value = Math.max(

        0,

        Math.min(1, value)

    );

    this.media.volume = value;

    this.saveSettings();

};

/* ==========================================================
   Playback Speed
   ========================================================== */

Player.setSpeed = function (speed) {

    speed = Number(speed);

    if (

        Number.isNaN(speed)

    ) {

        speed = 1;

    }

    this.media.playbackRate = speed;

    this.saveSettings();

};

/* ==========================================================
   Bind Events
   ========================================================== */

Player.bindEvents = function () {

    if (this.ui.play) {

        this.ui.play.addEventListener(

            "click",

            () => this.toggle()

        );

    }

    if (this.ui.progress) {

        this.ui.progress.addEventListener(

            "click",

            event => this.seek(event)

        );

    }

    if (this.ui.volume) {

        this.ui.volume.addEventListener(

            "input",

            event => {

                this.setVolume(

                    event.target.value

                );

            }

        );

    }

    if (this.ui.speed) {

        this.ui.speed.addEventListener(

            "change",

            event => {

                this.setSpeed(

                    event.target.value

                );

            }

        );

    }

    if (this.ui.close) {

        this.ui.close.addEventListener(

            "click",

            () => {

                this.stop();

                this.hide();

            }

        );

    }

};

/* ==========================================================
   Media Events
   ========================================================== */

Player.media.addEventListener(

    "timeupdate",

    () => {

        Player.updateProgress();

    }

);

Player.media.addEventListener(

    "loadedmetadata",

    () => {

        Player.updateTime();

    }

);

Player.media.addEventListener(

    "waiting",

    () => {

        UI.toast(

            "در حال بارگذاری...",

            "info"

        );

    }

);

Player.media.addEventListener(

    "error",

    () => {

        UI.toast(

            "خطا در پخش فایل.",

            "error"

        );

    }

);







/* ==========================================================
   Save Settings
   ========================================================== */

Player.saveSettings = function () {

    try {

        localStorage.setItem(

            "nightcast-player",

            JSON.stringify({

                volume: this.media.volume,

                speed: this.media.playbackRate

            })

        );

    }

    catch (e) {

        console.error(e);

    }

};

/* ==========================================================
   Restore Settings
   ========================================================== */

Player.restoreSettings = function () {

    try {

        const json = localStorage.getItem(

            "nightcast-player"

        );

        if (!json) {

            return;

        }

        const settings = JSON.parse(json);

        if (

            typeof settings.volume === "number"

        ) {

            this.media.volume = settings.volume;

        }

        if (

            typeof settings.speed === "number"

        ) {

            this.media.playbackRate = settings.speed;

        }

    }

    catch (e) {

        console.error(e);

    }

};

/* ==========================================================
   Save Playback
   ========================================================== */

Player.savePlayback = function () {

    if (!this.currentEpisode) {

        return;

    }

    if (!this.hasAudio()) {

        return;

    }

    try {

        localStorage.setItem(

            "nightcast-playback",

            JSON.stringify({

                id: this.currentEpisode.id,

                time: Math.floor(

                    this.media.currentTime

                )

            })

        );

    }

    catch (e) {

        console.error(e);

    }

};

/* ==========================================================
   Restore Playback
   ========================================================== */

Player.restorePlayback = function () {

    try {

        const json = localStorage.getItem(

            "nightcast-playback"

        );

        if (!json) {

            return;

        }

        const playback = JSON.parse(json);

        const episode = Feed.getEpisode(

            playback.id

        );

        if (!episode) {

            return;

        }

        this.load(episode);

        if (this.hasAudio()) {

            this.media.addEventListener(

                "loadedmetadata",

                () => {

                    this.media.currentTime =

                        playback.time || 0;

                },

                { once: true }

            );

        }

    }

    catch (e) {

        console.error(e);

    }

};

/* ==========================================================
   Auto Save Position
   ========================================================== */

Player.media.addEventListener(

    "pause",

    () => {

        Player.savePlayback();

    }

);

Player.media.addEventListener(

    "ended",

    () => {

        Player.savePlayback();

    }

);

/* ==========================================================
   Media Session
   ========================================================== */

Player.updateMediaSession = function () {

    if (

        !("mediaSession" in navigator)

    ) {

        return;

    }

    if (!this.currentEpisode) {

        return;

    }

    navigator.mediaSession.metadata =

        new MediaMetadata({

            title:

                this.currentEpisode.title ||

                "NightCast",

            artist:

                "NightCast",

            album:

                "NightCast",

            artwork: [

                {

                    src:

                        this.currentEpisode.cover ||

                        "assets/images/placeholder-cover.jpg",

                    sizes: "512x512",

                    type: "image/jpeg"

                }

            ]

        });

    navigator.mediaSession.setActionHandler(

        "play",

        () => this.play()

    );

    navigator.mediaSession.setActionHandler(

        "pause",

        () => this.pause()

    );

};





/* ==========================================================
   Feed Events
   ========================================================== */

Feed.on(

    "feed:ready",

    () => {

        try {

            Player.restorePlayback();

        }

        catch (e) {

            console.error(e);

        }

    }

);

Feed.on(

    "feed:updated",

    () => {

        if (

            Player.currentEpisode

        ) {

            const updated = Feed.getEpisode(

                Player.currentEpisode.id

            );

            if (updated) {

                Player.currentEpisode = updated;

            }

        }

    }

);

/* ==========================================================
   Keyboard Shortcuts
   ========================================================== */

document.addEventListener(

    "keydown",

    event => {

        if (

            event.target.matches(

                "input, textarea, select"

            )

        ) {

            return;

        }

        switch (event.code) {

            case "Space":

                event.preventDefault();

                Player.toggle();

                break;

            case "ArrowRight":

                if (Player.hasAudio()) {

                    Player.media.currentTime += 10;

                }

                break;

            case "ArrowLeft":

                if (Player.hasAudio()) {

                    Player.media.currentTime -= 10;

                }

                break;

        }

    }

);

/* ==========================================================
   Close Player
   ========================================================== */

Player.close = function () {

    this.stop();

    this.hide();

    this.currentEpisode = null;

    document

        .querySelectorAll(

            ".episode-card"

        )

        .forEach(card => {

            card.classList.remove(

                "playing"

            );

        });

};

/* ==========================================================
   Destroy
   ========================================================== */

Player.destroy = function () {

    this.stop();

    this.hide();

    this.currentEpisode = null;

};

/* ==========================================================
   Start Player
   ========================================================== */

Player.start = function () {

    this.init();

};

/* ==========================================================
   Export
   ========================================================== */

window.Player = Player;

/* ==========================================================
   End Of File
   ========================================================== */

