/*
==================================================
NightCast V2
Main Application Controller
Version : 2.0.0
==================================================
*/

'use strict';

const App = {

    async init() {

        console.log(
            `🚀 ${CONFIG.APP.NAME} v${CONFIG.APP.VERSION} Started`
        );

        try {

            // Drawer Menu
            if (window.Menu) {

                Menu.init();

            }

            // Header
            if (window.Header) {

                Header.init();

            }

            // Audio Player
            if (window.Player) {

                Player.init();

            }

            // Podcast Feed
            if (window.Feed) {

                await Feed.init();

            }

            // Footer
            if (window.Footer) {

                Footer.init();

            }

            // Router
            if (window.Router) {

                Router.init();

            }

            console.log(
                "✅ NightCast Loaded Successfully"
            );

        }

        catch (error) {

            console.error(
                "❌ App Initialization Error",
                error
            );

        }

    }

};

document.addEventListener(

    "DOMContentLoaded",

    () => {

        App.init();

    }

);
