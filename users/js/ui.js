
/* ==================================================
   NightCast UI Manager V2

   File:
   /users/js/core/ui.js

   Responsibility:
   UI Components Manager

================================================== */

const NightCastUI = {

    loader:null,
    toast:null,

    /*
    ====================================
    INIT
    ====================================
    */

    init(){

        this.loader =
        document.getElementById("globalLoader");

        this.createToast();

    },

    /*
    ====================================
    LOADER
    ====================================
    */

    showLoader(){

        if(this.loader){

            this.loader.classList.remove("hidden");

        }

    },

    hideLoader(){

        if(this.loader){

            this.loader.classList.add("hidden");

        }

    },

    /*
    ====================================
    TOAST
    ====================================
    */

    createToast(){

        if(document.getElementById("nightToast")){

            this.toast =
            document.getElementById("nightToast");

            return;

        }

        this.toast =
        document.createElement("div");

        this.toast.id = "nightToast";

        this.toast.style.position = "fixed";
        this.toast.style.bottom = "90px";
        this.toast.style.left = "50%";
        this.toast.style.transform = "translateX(-50%)";
        this.toast.style.background = "#111";
        this.toast.style.color = "#fff";
        this.toast.style.padding = "12px 22px";
        this.toast.style.borderRadius = "12px";
        this.toast.style.zIndex = "99999";
        this.toast.style.display = "none";
        this.toast.style.boxShadow = "0 6px 20px rgba(0,0,0,.35)";
        this.toast.style.maxWidth = "90%";
        this.toast.style.textAlign = "center";

        document.body.appendChild(this.toast);

    },

    /*
    ====================================
    SHOW MESSAGE
    ====================================
    */

    showMessage(message,type="info"){

        if(!this.toast){

            this.createToast();

        }

        this.toast.innerText = message;

        switch(type){

            case "success":

                this.toast.style.background="#16a34a";

                break;

            case "error":

                this.toast.style.background="#dc2626";

                break;

            case "warning":

                this.toast.style.background="#d97706";

                break;

            default:

                this.toast.style.background="#111";

        }

        this.toast.style.display="block";

        clearTimeout(this.toast.timer);

        this.toast.timer =
        setTimeout(()=>{

            this.toast.style.display="none";

        },3000);

    },

    /*
    ====================================
    POPUP
    ====================================
    */

    openPopup(id){

        const popup =
        document.getElementById(id);

        if(!popup){

            return;

        }

        popup.classList.remove("hidden");

    },

    closePopup(id){

        const popup =
        document.getElementById(id);

        if(!popup){

            return;

        }

        popup.classList.add("hidden");

    },

    /*
    ====================================
    FORMAT TIME
    ====================================
    */

    formatTime(seconds){

        if(!seconds){

            return "00:00";

        }

        seconds = Math.floor(seconds);

        const m =
        Math.floor(seconds/60);

        const s =
        seconds%60;

        return (

            String(m).padStart(2,"0")

            +":"

            +

            String(s).padStart(2,"0")

        );

    },

    /*
    ====================================
    BUTTON LOADING
    ====================================
    */

    buttonLoading(btn,state=true){

        if(!btn){

            return;

        }

        if(state){

            btn.disabled=true;

            btn.dataset.oldText=btn.innerHTML;

            btn.innerHTML="...";

        }

        else{

            btn.disabled=false;

            btn.innerHTML=btn.dataset.oldText;

        }

    }

};

window.NightCastUI = NightCastUI;

document.addEventListener(

"DOMContentLoaded",

()=>{

    NightCastUI.init();

});

console.log("NightCast UI V2 Loaded");
