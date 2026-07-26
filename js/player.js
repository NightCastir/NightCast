/* ==========================================================
   NightCast
   Audio Player
   File : player.js
   Version : 1.0.0
   ========================================================== */

"use strict";

/* ==========================================================
   Player Object
   ========================================================== */

const Player = {

    audio : new Audio(),

    currentEpisode : null,

    playing : false,

    initialized : false

};

/* ==========================================================
   Cache DOM
   ========================================================== */

Player.ui = {

    root :

        document.getElementById("global-player"),

    cover :

        document.getElementById("player-cover"),

    title :

        document.getElementById("player-title"),

    subtitle :

        document.getElementById("player-subtitle"),

    play :

        document.getElementById("player-play"),

    progress :

        document.getElementById("player-progress"),

    progressFill :

        document.getElementById("progress-fill"),

    progressThumb :

        document.getElementById("progress-thumb"),

    current :

        document.getElementById("current-time"),

    duration :

        document.getElementById("duration-time"),

    volume :

        document.getElementById("player-volume"),

    speed :

        document.getElementById("player-speed"),

    close :

        document.getElementById("player-close")

};

/* ==========================================================
   Init
   ========================================================== */

Player.init = function(){

    if(this.initialized){

        return;

    }

    this.bindEvents();

    this.initialized = true;

};



/* ==========================================================
   Play
   ========================================================== */

Player.play = async function(){

    try{

        await this.audio.play();

        this.playing = true;

        this.updatePlayButton();

        this.show();

    }

    catch(error){

        console.error(error);

    }

};

/* ==========================================================
   Pause
   ========================================================== */

Player.pause = function(){

    this.audio.pause();

    this.playing = false;

    this.updatePlayButton();

};

/* ==========================================================
   Toggle
   ========================================================== */

Player.toggle = function(){

    if(this.audio.paused){

        this.play();

    }

    else{

        this.pause();

    }

};

/* ==========================================================
   Stop
   ========================================================== */

Player.stop = function(){

    this.audio.pause();

    this.audio.currentTime = 0;

    this.playing = false;

    this.updatePlayButton();

};

/* ==========================================================
   Update Play Button
   ========================================================== */

Player.updatePlayButton = function(){

    if(!this.ui.play){

        return;

    }

    this.ui.play.innerHTML = this.playing

        ? `<i class="fa-solid fa-pause"></i>`

        : `<i class="fa-solid fa-play"></i>`;

};

/* ==========================================================
   Audio Events
   ========================================================== */

Player.audio.addEventListener(

    "play",

    ()=>{

        Player.playing = true;

        Player.updatePlayButton();

    }

);

Player.audio.addEventListener(

    "pause",

    ()=>{

        Player.playing = false;

        Player.updatePlayButton();

    }

);

Player.audio.addEventListener(

    "ended",

    ()=>{

        Player.playing = false;

        Player.updatePlayButton();

    }

);




/* ==========================================================
   Progress Bar
   ========================================================== */

Player.updateProgress = function(){

    if(!this.audio.duration){

        return;

    }

    const percent =

        (this.audio.currentTime /

        this.audio.duration) * 100;

    if(this.ui.progressFill){

        this.ui.progressFill.style.width =

            percent + "%";

    }

    if(this.ui.progressThumb){

        this.ui.progressThumb.style.left =

            percent + "%";

    }

    this.updateTime();

};

/* ==========================================================
   Update Time
   ========================================================== */

Player.updateTime = function(){

    if(this.ui.current){

        this.ui.current.textContent =

            Feed.formatDuration(

                Math.floor(

                    this.audio.currentTime

                )

            );

    }

    if(

        this.ui.duration &&

        this.audio.duration

    ){

        this.ui.duration.textContent =

            Feed.formatDuration(

                Math.floor(

                    this.audio.duration

                )

            );

    }

};

/* ==========================================================
   Seek
   ========================================================== */

Player.seek = function(event){

    if(

        !this.audio.duration ||

        !this.ui.progress

    ){

        return;

    }

    const rect =

        this.ui.progress

        .getBoundingClientRect();

    const percent =

        (event.clientX - rect.left)

        / rect.width;

    this.audio.currentTime =

        percent *

        this.audio.duration;

};

/* ==========================================================
   Skip Forward
   ========================================================== */

Player.forward = function(

    seconds = 15

){

    this.audio.currentTime = Math.min(

        this.audio.currentTime + seconds,

        this.audio.duration || 0

    );

};

/* ==========================================================
   Skip Backward
   ========================================================== */

Player.backward = function(

    seconds = 15

){

    this.audio.currentTime = Math.max(

        this.audio.currentTime - seconds,

        0

    );

};





/* ==========================================================
   Volume
   ========================================================== */

Player.setVolume = function(value){

    value = Math.max(

        0,

        Math.min(1, Number(value))

    );

    this.audio.volume = value;

    this.saveSettings();

};

/* ==========================================================
   Mute
   ========================================================== */

Player.mute = function(){

    this.audio.muted = true;

    this.updateVolumeIcon();

};

/* ==========================================================
   Unmute
   ========================================================== */

Player.unmute = function(){

    this.audio.muted = false;

    this.updateVolumeIcon();

};

/* ==========================================================
   Toggle Mute
   ========================================================== */

Player.toggleMute = function(){

    this.audio.muted = !this.audio.muted;

    this.updateVolumeIcon();

};

/* ==========================================================
   Update Volume Icon
   ========================================================== */

Player.updateVolumeIcon = function(){

    const button =

        document.getElementById(

            "player-mute"

        );

    if(!button){

        return;

    }

    button.innerHTML = this.audio.muted

        ? `<i class="fa-solid fa-volume-xmark"></i>`

        : `<i class="fa-solid fa-volume-high"></i>`;

};

/* ==========================================================
   Playback Speed
   ========================================================== */

Player.setSpeed = function(speed){

    speed = Number(speed);

    this.audio.playbackRate = speed;

    this.saveSettings();

};

/* ==========================================================
   Settings
   ========================================================== */

Player.saveSettings = function(){

    localStorage.setItem(

        "nightcast-player",

        JSON.stringify({

            volume:

                this.audio.volume,

            speed:

                this.audio.playbackRate

        })

    );

};

Player.restoreSettings = function(){

    const settings =

        localStorage.getItem(

            "nightcast-player"

        );

    if(!settings){

        return;

    }

    const data = JSON.parse(settings);

    if(

        typeof data.volume ===

        "number"

    ){

        this.audio.volume =

            data.volume;





/* ==========================================================
   Resume Playback
   ========================================================== */

Player.savePlayback = function () {

    if (!this.currentEpisode) {

        return;

    }

    localStorage.setItem(

        "nightcast-playback",

        JSON.stringify({

            id: this.currentEpisode.id,

            time: Math.floor(this.audio.currentTime)

        })

    );

};

Player.restorePlayback = function () {

    const playback = localStorage.getItem(

        "nightcast-playback"

    );

    if (!playback) {

        return;

    }

    try {

        const data = JSON.parse(playback);

        const episode = Feed.getEpisode(data.id);

        if (!episode) {

            return;

        }

        this.load(episode);

        this.audio.addEventListener(

            "loadedmetadata",

            () => {

                this.audio.currentTime =

                    data.time || 0;

            },

            { once: true }

        );

    }

    catch (error) {

        console.error(error);

    }

};

/* ==========================================================
   Auto Save Position
   ========================================================== */

Player.audio.addEventListener(

    "timeupdate",

    () => {

        Player.savePlayback();

    }

);

/* ==========================================================
   Media Session API
   ========================================================== */

Player.updateMediaSession = function () {

    if (

        !"mediaSession" in navigator ||

        !this.currentEpisode

    ) {

        return;

    }

    navigator.mediaSession.metadata =

        new MediaMetadata({

            title:

                this.currentEpisode.title,

            artist:

                "NightCast",

            album:

                this.currentEpisode.book.title,

            artwork: [

                {

                    src:

                        this.currentEpisode.cover,

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

    navigator.mediaSession.setActionHandler(

        "seekforward",

        () => this.forward()

    );

    navigator.mediaSession.setActionHandler(

        "seekbackward",

        () => this.backward()

    );

};

/* ==========================================================
   Keyboard Shortcuts
   ========================================================== */

document.addEventListener(

    "keydown",

    function (event) {

        if (

            event.target.matches(

                "input,textarea,select"

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

                Player.forward();

                break;

            case "ArrowLeft":

                Player.backward();

                break;

            case "KeyM":

                Player.toggleMute();

                break;

        }

    }

);/* ==========================================================
   Show Player
   ========================================================== */

Player.show = function(){

    if(!this.ui.root){

        return;

    }

    this.ui.root.classList.add("active");

};

/* ==========================================================
   Hide Player
   ========================================================== */

Player.hide = function(){

    if(!this.ui.root){

        return;

    }

    this.pause();

    this.ui.root.classList.remove("active");

};

/* ==========================================================
   Close Player
   ========================================================== */

Player.close = function(){

    this.stop();

    this.currentEpisode = null;

    this.hide();

    document
        .querySelectorAll(".episode-card")
        .forEach(card=>{

            card.classList.remove("playing");

        });

};

/* ==========================================================
   Loading State
   ========================================================== */

Player.setLoading = function(state){

    if(!this.ui.root){

        return;

    }

    this.ui.root.classList.toggle(

        "loading",

        state

    );

};

/* ==========================================================
   Audio Loading Events
   ========================================================== */

Player.audio.addEventListener(

    "waiting",

    ()=>{

        Player.setLoading(true);

    }

);

Player.audio.addEventListener(

    "playing",

    ()=>{

        Player.setLoading(false);

    }

);

Player.audio.addEventListener(

    "canplay",

    ()=>{

        Player.setLoading(false);

    }

);

/* ==========================================================
   Audio Error
   ========================================================== */

Player.audio.addEventListener(

    "error",

    ()=>{

        Player.setLoading(false);

        UI.toast(

            "خطا در بارگذاری فایل صوتی",

            "error"

        );

    }

);

/* ==========================================================
   Ended
   ========================================================== */

Player.audio.addEventListener(

    "ended",

    ()=>{

        Player.playing=false;

        Player.updatePlayButton();

        Player.savePlayback();

        UI.toast(

            "پخش اپیزود به پایان رسید.",

            "success"

        );

    }

);

/* ==========================================================
   Close Button
   ========================================================== */

if(Player.ui.close){

    Player.ui.close.addEventListener(

        "click",

        function(){

            Player.close();

        }

    );

}

      
      
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

};

/* ==========================================================
   Next Episode
   ========================================================== */

Player.playNext = function () {

    if (!this.currentEpisode) {

        return;

    }

    const episodes = Feed.getEpisodes();

    const index = episodes.findIndex(

        item => item.id === this.currentEpisode.id

    );

    if (

        index === -1 ||

        index >= episodes.length - 1

    ) {

        return;

    }

    this.load(

        episodes[index + 1]

    );

    this.play();

};

/* ==========================================================
   Previous Episode
   ========================================================== */

Player.playPrevious = function () {

    if (!this.currentEpisode) {

        return;

    }

    const episodes = Feed.getEpisodes();

    const index = episodes.findIndex(

        item => item.id === this.currentEpisode.id

    );

    if (index <= 0) {

        return;

    }

    this.load(

        episodes[index - 1]

    );

    this.play();

};

/* ==========================================================
   Initialize Player
   ========================================================== */

Player.start = function () {

    this.init();

    this.restoreSettings();

    this.restorePlayback();

    this.updatePlayButton();

};

/* ==========================================================
   Feed Events
   ========================================================== */

Feed.on(

    "feed:ready",

    () => {

        Player.restorePlayback();

    }

);

Feed.on(

    "network:offline",

    () => {

        UI.toast(

            "در حالت آفلاین هستید.",

            "warning"

        );

    }

);

/* ==========================================================
   Auto Next Episode
   ========================================================== */

Player.audio.addEventListener(

    "ended",

    () => {

        Player.playNext();

    }

);

/* ==========================================================
   Global Export
   ========================================================== */

window.Player = Player;

/* ==========================================================
   End Of File
   ========================================================== */
