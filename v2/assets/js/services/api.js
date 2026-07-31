/*
==========================================================
NightCast V2
API Service
Version : 2.0.0
==========================================================
*/

'use strict';

const API = {

    baseURL: CONFIG.API.BASE_URL,

    timeout: CONFIG.API.TIMEOUT,



    async request(endpoint, options = {}) {

        const controller = new AbortController();

        const timer = setTimeout(() => {

            controller.abort();

        }, this.timeout);

        try {

            const response = await fetch(

                this.baseURL + endpoint,

                {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        "Content-Type": "application/json",
                        ...(options.headers || {})
                    }
                }

            );

            clearTimeout(timer);

            const json = await response.json();

            return json;

        }

        catch (error) {

            clearTimeout(timer);

            console.error(

                "API Error",

                error

            );

            return {

                success: false,

                message: error.message

            };

        }

    },



    async get(endpoint) {

        return this.request(

            endpoint,

            {
                method: "GET"
            }

        );

    },



    async post(endpoint, data = {}) {

        return this.request(

            endpoint,

            {

                method: "POST",

                body: JSON.stringify(data)

            }

        );

    },



    async put(endpoint, data = {}) {

        return this.request(

            endpoint,

            {

                method: "PUT",

                body: JSON.stringify(data)

            }

        );

    },



    async delete(endpoint) {

        return this.request(

            endpoint,

            {

                method: "DELETE"

            }

        );

    }

};

Object.freeze(API);
