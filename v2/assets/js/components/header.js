/*
==================================================
NightCast V2
Header Component
Version : 2.0.0
==================================================
*/

'use strict';

const Header = {

    init() {

        this.render();

        this.restoreTheme();

        this.bindEvents();

        this.animateLogo();

        this.loadUser();

        this.updateNotification(3);

        window.addEventListener(
            "scroll",
            () => this.onScroll()
        );

    },



    render() {

        const header =
            document.querySelector("header");

        if (!header) return;

        header.innerHTML = `

<div class="container">

<div class="header-wrapper">

<div class="brand">

<img
src="assets/images/logo.png"
alt="NightCast">

<div class="brand-name">

<div class="brand-title">

NightCast

</div>

<div class="brand-subtitle">

پادکست خلاصه کتاب

</div>

</div>

</div>

<div class="header-actions">

<button
class="icon-btn"
id="searchButton">

<i class="fa-solid fa-magnifying-glass"></i>

</button>

<button
class="icon-btn"
id="themeButton">

<i class="fa-solid fa-moon"></i>

</button>

<button
class="icon-btn"
id="notificationButton">

<i class="fa-solid fa-bell"></i>

<span
class="notification-count">

0

</span>

</button>

<button
class="icon-btn"
id="menuButton">

<i class="fa-solid fa-bars"></i>

</button>

</div>

</div>

</div>

`;

    },



    bindEvents() {

        const menuButton =
            Utils.id("menuButton");

        if (menuButton) {

            menuButton.onclick = () => {

                if (typeof Menu !== "undefined") {

                    Menu.open();

                }

            };

        }



        const themeButton =
            Utils.id("themeButton");

        if (themeButton) {

            themeButton.onclick = () => {

                this.toggleTheme();

            };

        }



        const searchButton =
            Utils.id("searchButton");

        if (searchButton) {

            searchButton.onclick = () => {

                console.log("Search");

            };

        }



        const notificationButton =
            Utils.id("notificationButton");

        if (notificationButton) {

            notificationButton.onclick = () => {

                console.log("Notifications");

            };

        }

    },



    onScroll() {

        const header =
            document.querySelector("header");

        if (!header) return;

        if (window.scrollY > 20) {

            header.style.background =
                "rgba(7,11,20,.98)";

            header.style.boxShadow =
                "0 10px 30px rgba(0,0,0,.35)";

        }

        else {

            header.style.background =
                "rgba(7,11,20,.94)";

            header.style.boxShadow =
                "none";

        }

    },



    toggleTheme() {

        document.body.classList.toggle(
            "theme-light"
        );

        const theme =
            document.body.classList.contains("theme-light")
                ? "light"
                : "dark";

        Utils.save(
            "theme",
            theme
        );

    },



    restoreTheme() {

        const theme =
            Utils.load(
                "theme",
                "dark"
            );

        if (theme === "light") {

            document.body.classList.add(
                "theme-light"
            );

        }

    },



    updateNotification(count = 0) {

        const badge =
            document.querySelector(".notification-count");

        if (!badge) return;

        if (count <= 0) {

            badge.style.display = "none";

            return;

        }

        badge.style.display = "flex";

        badge.textContent = count;

    },



    loadUser() {

        const user =
            Utils.load(
                "user",
                null
            );

        const subtitle =
            document.querySelector(".brand-subtitle");

        if (!subtitle) return;

        if (user && user.name) {

            subtitle.textContent =
                "سلام " + user.name;

        }

        else {

            subtitle.textContent =
                "پادکست خلاصه کتاب";

        }

    },



    animateLogo() {

        const logo =
            document.querySelector(".brand img");

        if (!logo) return;

        logo.onclick = () => {

            logo.animate(

                [

                    {

                        transform:"rotate(0deg)"

                    },

                    {

                        transform:"rotate(360deg)"

                    }

                ],

                {

                    duration:700

                }

            );

        };

    }

};

Object.freeze(Header);
