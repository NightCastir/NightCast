
document
.getElementById("loginForm")
.addEventListener("submit", function(e){


    e.preventDefault();


    const username =
    document
    .getElementById("username")
    .value
    .trim();



    const password =
    document
    .getElementById("password")
    .value;



    const message =
    document
    .getElementById("message");



    if(!username || !password){


        message.innerHTML =
        "لطفاً نام کاربری و رمز عبور را وارد کنید";


        message.style.color = "red";


        return;

    }



    message.innerHTML =
    "در حال بررسی اطلاعات...";


    message.style.color =
    "#2563eb";



    console.log({

        username,

        password

    });


});
