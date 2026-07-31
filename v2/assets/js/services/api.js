/*
────────────────────────────────────────
NightCast API Service
────────────────────────────────────────
*/

'use strict';

const API = {

    // آدرس Worker را فقط اینجا تغییر می‌دهی
    BASE_URL: "https://nightcast-api.tomasgermany2580.workers.dev",

    async getEpisodes(page = 1, limit = 12) {

        const response = await fetch(

            `${this.BASE_URL}/api/episodes?page=${page}&limit=${limit}`,

            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }

        );

        if (!response.ok)
            throw new Error("Network Error");

        return await response.json();

    }

};
