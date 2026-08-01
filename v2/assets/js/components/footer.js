/*
==================================================
NightCast V2
Footer Component
Version : 2.0.0
==================================================
*/

'use strict';

const Footer = {

    init() {

        this.render();

        this.bindEvents();

    },



    render() {

        const footer =
            document.getElementById("footer");

        if (!footer) return;

        footer.innerHTML = `

<div class="container">

<div class="footer-content">

<div class="footer-brand">

<img
src="assets/images/logo.png"
alt="NightCast">

<h2>

NightCast

</h2>

<p>

پادکست خلاصه و تحلیل کتاب‌های ارزشمند

</p>

</div>



<div class="footer-links">

<h3>

دسترسی سریع

</h3>

<a href="#">

خانه

</a>

<a href="#">

آخرین پادکست‌ها

</a>

<a href="#">

دسته‌بندی کتاب‌ها

</a>

<a href="#">

درخواست کتاب

</a>

<a href="#">

تماس با ما

</a>

</div>



<div class="footer-social">

<h3>

شبکه‌های اجتماعی

</h3>

<div class="social-icons">

<a
href="https://eitaa.com/NightCast"
target="_blank"
aria-label="Eitaa">

<i class="fa-solid fa-paper-plane"></i>

</a>

<a
href="#"
target="_blank"
aria-label="Telegram">

<i class="fa-brands fa-telegram"></i>

</a>

<a
href="#"
target="_blank"
aria-label="YouTube">

<i class="fa-brands fa-youtube"></i>

</a>

<a
href="https://nightcast.ir"
target="_blank"
aria-label="Website">

<i class="fa-solid fa-globe"></i>

</a>

</div>

</div>

</div>



<div class="footer-bottom">

<div>

© 2026 NightCast

</div>

<div>

Version 2.0.0

</div>

</div>

</div>

`;

    },



    bindEvents() {

        const links =
            document.querySelectorAll(
                ".footer-links a"
            );

        links.forEach(

            link => {

                link.addEventListener(

                    "click",

                    e => {

                        e.preventDefault();

                        console.log(

                            "Footer:",

                            link.textContent.trim()

                        );

                    }

                );

            }

        );

    },



    updateVersion(version) {

        const versionBox =
            document.querySelector(
                ".footer-bottom div:last-child"
            );

        if (!versionBox) return;

        versionBox.textContent =
            "Version " + version;

    }

};

Object.freeze(Footer);
