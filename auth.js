const API =
"https://nightcast-api.tomasgermany2580.workers.dev";

const token =
localStorage.getItem("token");

if (!token) {

    location.replace("login.html");

} else {

    checkLogin();

}

async function checkLogin() {

    try {

        const res = await fetch(

            API + "/api/me",

            {

                headers: {

                    Authorization: "Bearer " + token

                }

            }

        );

        const data = await res.json();

        if (!data.success) {

            localStorage.clear();

            location.replace("login.html");

            return;

        }

        localStorage.setItem(

            "user",

            JSON.stringify(data.user)

        );

    }

    catch (e) {

        console.log(e);

        location.replace("login.html");

    }

}
