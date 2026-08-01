/*
==================================================
NightCast V2
Drawer Menu
Version : 2.0.0
==================================================
*/

'use strict';

const Menu = {

    drawer: null,

    overlay: null,



    init() {

        this.render();

        this.cache();

        this.bindEvents();

    },



    render() {

        document.body.insertAdjacentHTML(

            "beforeend",

`
<div
class="drawer-overlay"
id="drawerOverlay"></div>

<aside
class="drawer"
id="drawer">

<div class="drawer-header">

<div class="drawer-profile">

<div class="drawer-avatar">

<img
src="assets/images/default-avatar.png"
alt="User">

</div>

<div class="drawer-user">

<h3 id="drawerUserName">

مهمان

</h3>

<p id="drawerUserStatus">

به NightCast خوش آمدید

</p>

</div>

</div>

</div>

<div
class="drawer-menu">

<a
href="#"
class="drawer-item active">

<i class="fa-solid fa-house"></i>

<span>

خانه

</span>

</a>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-podcast"></i>

<span>

آخرین پادکست‌ها

</span>

</a>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-fire"></i>

<span>

محبوب‌ترین‌ها

</span>

</a>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-book"></i>

<span>

کتاب‌ها

</span>

</a>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-heart"></i>

<span>

علاقه‌مندی‌ها

</span>

</a>

<div class="drawer-group">

<div class="drawer-group-title">

حساب کاربری

</div>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-user"></i>

<span>

پروفایل

</span>

</a>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-gear"></i>

<span>

تنظیمات

</span>

</a>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-moon"></i>

<span>

حالت شب

</span>

</a>

</div>

<div class="drawer-group">

<div class="drawer-group-title">

NightCast

</div>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-circle-info"></i>

<span>

درباره ما

</span>

</a>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-envelope"></i>

<span>

ارتباط با ما

</span>

</a>

<a
href="#"
class="drawer-item">

<i class="fa-solid fa-shield-halved"></i>

<span>

حریم خصوصی

</span>

</a>

</div>

</div>

<div class="drawer-footer">

<div class="drawer-version">

NightCast

<br>

Version

2.0.0

</div>

</div>

</aside>

`

);

    },



    cache(){

        this.drawer=

        document.getElementById(

            "drawer"

        );



        this.overlay=

        document.getElementById(

            "drawerOverlay"

        );

    },



    bindEvents(){

        this.overlay.onclick=()=>{

            this.close();

        };



        document.addEventListener(

            "keydown",

            (e)=>{

                if(

                    e.key==="Escape"

                ){

                    this.close();

                }

            }

        );

    },



    open(){

        this.drawer.classList.add(

            "open"

        );



        this.overlay.classList.add(

            "show"

        );



        document.body.style.overflow=

        "hidden";

    },



    close(){

        this.drawer.classList.remove(

            "open"

        );



        this.overlay.classList.remove(

            "show"

        );



        document.body.style.overflow=

        "";

    },



    toggle(){

        if(

            this.drawer.classList.contains(

                "open"

            )

        ){

            this.close();

        }

        else{

            this.open();

        }

    },



    updateUser(user){

        const name=

        document.getElementById(

            "drawerUserName"

        );



        const status=

        document.getElementById(

            "drawerUserStatus"

        );



        if(!user){

            name.textContent=

            "مهمان";



            status.textContent=

            "به NightCast خوش آمدید";



            return;

        }



        name.textContent=

        user.name;



        status.textContent=

        "عضو NightCast";

    }

};

Object.freeze(Menu);
