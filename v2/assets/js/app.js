/*
──────────────────────────────────────────────
 NightCast V2
 Main Application
──────────────────────────────────────────────
*/

'use strict';

document.addEventListener('DOMContentLoaded', async () => {

    await App.init();

});

const App = {

    async init() {

        Header.init();

        Feed.init();

        Footer.init();

        Player.init();

        Router.init();

    }

};
