export default {

    async fetch(request, env) {


        const url = new URL(request.url);

        const DB = env.NightCastBinding;


        const headers = {

            "Content-Type":
                "application/json; charset=UTF-8",

            "Access-Control-Allow-Origin":
                "*",

            "Access-Control-Allow-Headers":
                "Content-Type, Authorization",

            "Access-Control-Allow-Methods":
                "GET, POST, PUT, DELETE, OPTIONS"

        };





        function json(data, status = 200) {

            return new Response(

                JSON.stringify(data),

                {

                    status,

                    headers

                }

            );

        }







        // ==========================
        // CORS
        // ==========================


        if (request.method === "OPTIONS") {

            return new Response(

                null,

                {

                    status: 204,

                    headers

                }

            );

        }







        try {








            async function createBookSummaryRequest(userId, data) {

                const bookName =
                    String(data?.book_name || "").trim();

                const authorName =
                    String(data?.author_name || "").trim();

                const description =
                    String(data?.description || "").trim();


                if (!bookName) {

                    return {
                        success: false,
                        status: 400,
                        message: "نام کتاب الزامی است."
                    };

                }


                if (bookName.length > 200) {

                    return {
                        success: false,
                        status: 400,
                        message: "نام کتاب نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد."
                    };

                }


                if (authorName.length > 200) {

                    return {
                        success: false,
                        status: 400,
                        message: "نام نویسنده نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد."
                    };

                }


                if (description.length > 2000) {

                    return {
                        success: false,
                        status: 400,
                        message: "توضیحات نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد."
                    };

                }


                const existing =
                    await DB
                        .prepare(`
                SELECT id, status
                FROM book_summary_requests
                WHERE user_id = ?
                AND LOWER(TRIM(book_name))
                    = LOWER(TRIM(?))
                AND status IN ('pending', 'processing')
                LIMIT 1
            `)
                        .bind(
                            userId,
                            bookName
                        )
                        .first();


                if (existing) {

                    return {
                        success: false,
                        status: 409,
                        message: "این کتاب را قبلاً درخواست کرده‌اید."
                    };

                }


                const result =
                    await DB
                        .prepare(`
                INSERT INTO book_summary_requests
                (
                    user_id,
                    book_name,
                    author_name,
                    description,
                    status
                )
                VALUES (?, ?, ?, ?, 'pending')
            `)
                        .bind(
                            userId,
                            bookName,
                            authorName || null,
                            description || null
                        )
                        .run();


                return {

                    success: true,

                    status: 201,

                    message:
                        "درخواست شما با موفقیت ثبت شد.",

                    request: {

                        id:
                            result.meta.last_row_id,

                        status:
                            "pending"

                    }

                };

            }

            // ==========================
            // AUTH CHECK
            // ==========================


            async function checkAuth() {



                const auth =

                    request.headers.get(

                        "Authorization"

                    )

                    || "";




                if (!auth.startsWith("Bearer ")) {

                    return null;

                }





                const token =

                    auth.replace(

                        "Bearer ",

                        ""

                    );






                const admin =

                    await DB

                        .prepare(

                            `

    SELECT

    admins.id,

    admins.username,

    admins.full_name,

    'admin' as role

    FROM admin_sessions


    INNER JOIN admins

    ON admins.id = admin_sessions.admin_id


    WHERE admin_sessions.session_token = ?

    AND admin_sessions.expires_at >

    CURRENT_TIMESTAMP


    LIMIT 1

    `

                        )

                        .bind(token)

                        .first();







                if (admin) {

                    return admin;

                }







                const user =

                    await DB

                        .prepare(

                            `

    SELECT

    users.id,

    users.username,

    users.full_name,

    users.role


    FROM user_sessions


    INNER JOIN users

    ON users.id = user_sessions.user_id


    WHERE user_sessions.session_token = ?

    AND user_sessions.expires_at >

    CURRENT_TIMESTAMP


    LIMIT 1


    `

                        )

                        .bind(token)

                        .first();






                return user || null;


            }







            // ==========================
            // SYSTEM TEST
            // ==========================


            if (

                url.pathname ===

                "/api/v1/test"

                &&

                request.method === "GET"

            ) {


                return json({

                    success: true,

                    message:

                        "NightCast API V5 Running",

                    version:

                        "5.0"

                });


            }







            // ==========================
            // SYSTEM INFO
            // ==========================


            if (

                url.pathname ===

                "/api/v1/system"

                &&

                request.method === "GET"

            ) {


                return json({

                    success: true,

                    app:

                        "NightCast",

                    version:

                        "5.0",

                    database:

                        "connected"

                });


            }







            // ==========================
            // AUTH LOGIN
            // ==========================


            if (

                url.pathname ===

                "/api/v1/auth/login"

                &&

                request.method === "POST"

            ) {



                const body =

                    await request.json();



                const username =

                    (body.username || "")

                        .trim();



                const password =

                    body.password || "";





                if (!username || !password) {


                    return json({

                        success: false,

                        message:

                            "Username and password required"

                    }, 400);


                }





                let account =

                    await DB

                        .prepare(

                            `

    SELECT * 


    FROM admins

    WHERE username=?

    AND status='active'

    LIMIT 1

    `

                        )

                        .bind(username)

                        .first();






                let accountType =

                    "admin";







                if (!account) {



                    account =

                        await DB

                            .prepare(

                                `

    SELECT * 


    FROM users

    WHERE username=?

    AND status='active'

    LIMIT 1

    `

                            )

                            .bind(username)

                            .first();



                    accountType = "user";


                }








                if (!account) {


                    return json({

                        success: false,

                        message:

                            "User not found"

                    }, 401);


                }








                const hashBuffer =

                    await crypto.subtle.digest(

                        "SHA-256",

                        new TextEncoder()

                            .encode(password)

                    );






                const hashArray =

                    Array.from(

                        new Uint8Array(hashBuffer)

                    );






                const passwordHash =

                    hashArray

                        .map(

                            b => b.toString(16).padStart(2, "0")

                        )

                        .join("");







                if (

                    passwordHash !==

                    account.password_hash

                ) {


                    return json({

                        success: false,

                        message:

                            "Wrong password"

                    }, 401);


                }







                const tokenBytes =

                    new Uint8Array(32);



                crypto.getRandomValues(

                    tokenBytes

                );






                const token =

                    Array.from(tokenBytes)

                        .map(

                            b => b.toString(16).padStart(2, "0")

                        )

                        .join("");







                const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();






                if (accountType === "admin") {


                    await DB

                        .prepare(

                            `

    INSERT INTO admin_sessions

    (

    admin_id,

    session_token,

    expires_at

    )

    VALUES

    (?,?,?)

    `

                        )

                        .bind(

                            account.id,

                            token,

                            expires

                        )

                        .run();


                }

                else {


                    await DB

                        .prepare(

                            `

    INSERT INTO user_sessions

    (

    user_id,

    session_token,

    expires_at

    )

    VALUES

    (?,?,?)

    `

                        )

                        .bind(

                            account.id,

                            token,

                            expires

                        )

                        .run();


                }







                return json({

                    success: true,

                    message:

                        "Login successful",

                    token: token,

                    user: {

                        id: account.id,

                        username: account.username,

                        full_name: account.full_name,

                        role:

                            account.role || accountType

                    }

                });


            }



            // ==========================
            // AUTH ME
            // ==========================


            if (

                url.pathname ===

                "/api/v1/auth/me"

                &&

                request.method === "GET"

            ) {



                const user =

                    await checkAuth();



                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }





                return json({

                    success: true,

                    user: user

                });


            }








            // ==========================
            // AUTH STATUS
            // ==========================


            if (

                url.pathname ===

                "/api/v1/auth/status"

                &&

                request.method === "GET"

            ) {



                const user =

                    await checkAuth();



                return json({

                    success: true,

                    authenticated:

                        !!user,

                    user:

                        user || null

                });


            }







            // ==========================
            // AUTH LOGOUT
            // ==========================


            if (

                url.pathname ===

                "/api/v1/auth/logout"

                &&

                request.method === "POST"

            ) {



                const auth =

                    request.headers.get(

                        "Authorization"

                    )

                    || "";





                if (auth.startsWith("Bearer ")) {

                    const token =

                        auth.replace(

                            "Bearer ",

                            ""

                        );






                    await DB

                        .prepare(

                            `

    DELETE FROM admin_sessions

    WHERE session_token=?

    `

                        )

                        .bind(token)

                        .run();







                    await DB

                        .prepare(

                            `

    DELETE FROM user_sessions

    WHERE session_token=?

    `

                        )

                        .bind(token)

                        .run();



                }







                return json({

                    success: true,

                    message:

                        "Logout successful"

                });


            }









            // ==========================
            // DASHBOARD SUMMARY
            // ==========================

            if (

                url.pathname ===

                "/api/v1/admin/dashboard"

                &&

                request.method === "GET"

            ) {


                url.pathname = "/api/v1/dashboard";


            }


            if (

                url.pathname ===

                "/api/v1/dashboard"

                &&

                request.method === "GET"

            ) {



                const user =

                    await checkAuth();



                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                const podcastCount =

                    await DB

                        .prepare(

                            `

    SELECT COUNT(*) as total

    FROM podcasts

    `

                        )

                        .first();








                let bookCount =

                    0;






                try {


                    const books =

                        await DB

                            .prepare(

                                `

    SELECT COUNT(*) as total

    FROM books

    `

                            )

                            .first();



                    bookCount =

                        books.total || 0;



                }

                catch (e) {



                    bookCount = 0;


                }







                const userCount =

                    await DB

                        .prepare(

                            `

    SELECT COUNT(*) as total

    FROM users

    `

                        )

                        .first();








                const plays =

                    await DB

                        .prepare(

                            `

    SELECT

    SUM(listen_count) as total

    FROM podcasts

    `

                        )

                        .first();







                return json({

                    success: true,

                    statistics: {


                        podcasts:

                            podcastCount.total || 0,


                        books:

                            bookCount,


                        users:

                            userCount.total || 0,


                        plays:

                            plays.total || 0



                    },


                    user: user


                });


            }











            // ==========================
            // STATISTICS
            // ==========================


            if (

                url.pathname ===

                "/api/v1/statistics"

                &&

                request.method === "GET"

            ) {



                const podcast =

                    await DB

                        .prepare(

                            `

    SELECT COUNT(*) total

    FROM podcasts

    `

                        )

                        .first();





                const plays =

                    await DB

                        .prepare(

                            `

    SELECT SUM(listen_count) total

    FROM podcasts

    `

                        )

                        .first();







                return json({

                    success: true,

                    data: {


                        total_podcasts:

                            podcast.total || 0,


                        total_plays:

                            plays.total || 0


                    }


                });


            }









            // ==========================
            // DASHBOARD LATEST
            // ==========================


            if (

                url.pathname ===

                "/api/v1/dashboard/latest"

                &&

                request.method === "GET"

            ) {



                const result =

                    await DB

                        .prepare(

                            `

    SELECT *

    FROM podcasts

    ORDER BY id DESC

    LIMIT 5

    `

                        )

                        .all();







                return json({

                    success: true,

                    podcasts:

                        result.results || []

                });


            }









            // ==========================
            // ACTIVITY FEED
            // ==========================


            if (

                url.pathname ===

                "/api/v1/activity"

                &&

                request.method === "GET"

            ) {



                return json({

                    success: true,

                    activities: []

                });


            }



            // ==========================
            // PODCASTS API
            // ==========================


            // ==========================
            // GET ALL PODCASTS
            // ==========================


            if (

                url.pathname ===

                "/api/v1/podcasts"

                &&

                request.method === "GET"

            ) {



                const result =

                    await DB

                        .prepare(

                            `

    SELECT *

    FROM podcasts

    ORDER BY id DESC

    `

                        )

                        .all();






                return json({

                    success: true,

                    podcasts:

                        result.results || []

                });


            }









            // ==========================
            // GET ONE PODCAST
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/podcasts/"

                )

                &&

                request.method === "GET"

            ) {



                const id =

                    url.pathname

                        .split("/")

                        .pop();








                const podcast =

                    await DB

                        .prepare(

                            `

    SELECT *

    FROM podcasts

    WHERE id=?

    LIMIT 1

    `

                        )

                        .bind(id)

                        .first();







                if (!podcast) {


                    return json({

                        success: false,

                        message:

                            "Podcast not found"

                    }, 404);


                }







                return json({

                    success: true,

                    podcast: podcast

                });


            }


            // ==========================
            // BOOK SUMMARY REQUEST
            // ==========================

            if (
                url.pathname ===
                "/api/v1/book-summary-requests"
                &&
                request.method === "POST"
            ) {

                const user =
                    await checkAuth();


                if (!user) {

                    return json({

                        success: false,

                        message:
                            "برای ثبت درخواست ابتدا وارد حساب کاربری خود شوید."

                    }, 401);

                }


                let body;

                try {

                    body =
                        await request.json();

                }

                catch (error) {

                    return json({

                        success: false,

                        message:
                            "اطلاعات ارسال‌شده معتبر نیست."

                    }, 400);

                }


                const result =
                    await createBookSummaryRequest(
                        user.id,
                        body
                    );


                return json({

                    success:
                        result.success,

                    message:
                        result.message,

                    ...(result.request
                        ? {
                            request:
                                result.request
                        }
                        : {})

                }, result.status);

            }


            // ==========================
            // CREATE PODCAST
            // ==========================


            if (

                url.pathname ===

                "/api/v1/podcasts"

                &&

                request.method === "POST"

            ) {



                const user =

                    await checkAuth();





                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }








                const body =

                    await request.json();







                if (!body.title) {


                    return json({

                        success: false,

                        message:

                            "Title required"

                    }, 400);


                }








                const slug =

                    body.slug ||

                    body.title

                        .toLowerCase()

                        .trim()

                        .replace(/\s+/g, "-");








                await DB

                    .prepare(

                        `

    INSERT INTO podcasts

    (

    title,

    slug,

    book_name,

    author_name,

    category_name,

    tags,

    episode_number,

    summary,

    transcript,

    duration_seconds,

    audio_url,

    cover_url,

    status,

    publish_date,

    listen_count,

    created_by,

    description

    )

    VALUES

    (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)

    `

                    )

                    .bind(


                        body.title,


                        slug,


                        body.book_name || null,


                        body.author_name || null,


                        body.category_name || null,


                        body.tags || null,


                        body.episode_number || 1,


                        body.summary || null,


                        body.transcript || null,


                        body.duration_seconds || 0,


                        body.audio_url || null,


                        body.cover_url || null,


                        body.status || "draft",


                        body.publish_date || null,


                        0,


                        user.id,


                        body.description || null


                    )

                    .run();








                return json({

                    success: true,

                    message:

                        "Podcast created"

                });


            }









            // ==========================
            // UPDATE PODCAST
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/podcasts/"

                )

                &&

                request.method === "PUT"

            ) {



                const user =

                    await checkAuth();






                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                const id =

                    url.pathname

                        .split("/")

                        .pop();






                const body =

                    await request.json();








                await DB

                    .prepare(

                        `

    UPDATE podcasts

    SET


    title=?,


    book_name=?,


    author_name=?,


    category_name=?,


    tags=?,


    episode_number=?,


    summary=?,


    transcript=?,


    duration_seconds=?,


    audio_url=?,


    cover_url=?,


    status=?,


    description=?,


    updated_at=CURRENT_TIMESTAMP


    WHERE id=?


    `

                    )

                    .bind(


                        body.title,


                        body.book_name,


                        body.author_name,


                        body.category_name,


                        body.tags,


                        body.episode_number,


                        body.summary,


                        body.transcript,


                        body.duration_seconds,


                        body.audio_url,


                        body.cover_url,


                        body.status,


                        body.description,


                        id


                    )

                    .run();








                return json({

                    success: true,

                    message:

                        "Podcast updated"

                });


            }









            // ==========================
            // DELETE PODCAST
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/podcasts/"

                )

                &&

                request.method === "DELETE"

            ) {



                const user =

                    await checkAuth();








                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                if (

                    user.role !== "admin"

                ) {


                    return json({

                        success: false,

                        message:

                            "Permission denied"

                    }, 403);


                }








                const id =

                    url.pathname

                        .split("/")

                        .pop();









                await DB

                    .prepare(

                        `

    DELETE FROM podcasts

    WHERE id=?

    `

                    )

                    .bind(id)

                    .run();








                return json({

                    success: true,

                    message:

                        "Podcast deleted"

                });


            }



            // ==========================
            // BOOKS API
            // ==========================



            // ==========================
            // GET ALL BOOKS
            // ==========================


            if (

                url.pathname ===

                "/api/v1/books"

                &&

                request.method === "GET"

            ) {



                try {



                    const result =

                        await DB

                            .prepare(

                                `

    SELECT *

    FROM books

    ORDER BY id DESC

    `

                            )

                            .all();







                    return json({

                        success: true,

                        books:

                            result.results || []

                    });





                }

                catch (error) {



                    return json({

                        success: true,

                        books: []

                    });


                }


            }









            // ==========================
            // GET ONE BOOK
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/books/"

                )

                &&

                request.method === "GET"

            ) {



                const id =

                    url.pathname

                        .split("/")

                        .pop();







                try {



                    const book =

                        await DB

                            .prepare(

                                `

    SELECT *

    FROM books

    WHERE id=?

    LIMIT 1

    `

                            )

                            .bind(id)

                            .first();






                    if (!book) {


                        return json({

                            success: false,

                            message:

                                "Book not found"

                        }, 404);


                    }





                    return json({

                        success: true,

                        book: book

                    });





                }

                catch (error) {


                    return json({

                        success: false,

                        message:

                            "Books table not found"

                    }, 404);


                }



            }









            // ==========================
            // CREATE BOOK
            // ==========================


            if (

                url.pathname ===

                "/api/v1/books"

                &&

                request.method === "POST"

            ) {



                const user =

                    await checkAuth();






                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }








                const body =

                    await request.json();







                if (!body.title) {


                    return json({

                        success: false,

                        message:

                            "Title required"

                    }, 400);


                }








                try {



                    await DB

                        .prepare(

                            `

    INSERT INTO books

    (

    title,

    author_name,

    description,

    cover_url,

    category_name

    )

    VALUES

    (?,?,?,?,?)

    `

                        )

                        .bind(


                            body.title,


                            body.author_name || null,


                            body.description || null,


                            body.cover_url || null,


                            body.category_name || null


                        )

                        .run();







                    return json({

                        success: true,

                        message:

                            "Book created"

                    });




                }

                catch (error) {



                    return json({

                        success: false,

                        message:

                            "Books table not found"

                    }, 500);


                }



            }









            // ==========================
            // UPDATE BOOK
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/books/"

                )

                &&

                request.method === "PUT"

            ) {



                const user =

                    await checkAuth();






                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                const id =

                    url.pathname

                        .split("/")

                        .pop();






                const body =

                    await request.json();






                try {



                    await DB

                        .prepare(

                            `

    UPDATE books

    SET


    title=?,


    author_name=?,


    description=?,


    cover_url=?,


    category_name=?,


    updated_at=CURRENT_TIMESTAMP


    WHERE id=?


    `

                        )

                        .bind(


                            body.title,


                            body.author_name,


                            body.description,


                            body.cover_url,


                            body.category_name,


                            id


                        )

                        .run();







                    return json({

                        success: true,

                        message:

                            "Book updated"

                    });




                }

                catch (error) {



                    return json({

                        success: false,

                        message:

                            "Books table not found"

                    }, 500);


                }



            }









            // ==========================
            // DELETE BOOK
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/books/"

                )

                &&

                request.method === "DELETE"

            ) {



                const user =

                    await checkAuth();







                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }






                if (user.role !== "admin") {


                    return json({

                        success: false,

                        message:

                            "Permission denied"

                    }, 403);


                }








                const id =

                    url.pathname

                        .split("/")

                        .pop();






                try {



                    await DB

                        .prepare(

                            `

    DELETE FROM books

    WHERE id=?

    `

                        )

                        .bind(id)

                        .run();







                    return json({

                        success: true,

                        message:

                            "Book deleted"

                    });





                }

                catch (error) {



                    return json({

                        success: false,

                        message:

                            "Books table not found"

                    }, 500);


                }



            }



            // ==========================
            // USERS API
            // ==========================



            // ==========================
            // GET ALL USERS
            // ==========================


            if (

                url.pathname ===

                "/api/v1/users"

                &&

                request.method === "GET"

            ) {



                const user =

                    await checkAuth();






                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                const result =

                    await DB

                        .prepare(

                            `

    SELECT

    id,

    username,

    full_name,

    role,

    status,

    last_login,

    created_at

    FROM users

    ORDER BY id DESC

    `

                        )

                        .all();







                return json({

                    success: true,

                    users:

                        result.results || []

                });


            }









            // ==========================
            // GET ONE USER
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/users/"

                )

                &&

                request.method === "GET"

            ) {



                const id =

                    url.pathname

                        .split("/")

                        .pop();







                const result =

                    await DB

                        .prepare(

                            `

    SELECT

    id,

    username,

    full_name,

    role,

    status,

    last_login,

    created_at

    FROM users

    WHERE id=?

    LIMIT 1

    `

                        )

                        .bind(id)

                        .first();







                if (!result) {


                    return json({

                        success: false,

                        message:

                            "User not found"

                    }, 404);


                }







                return json({

                    success: true,

                    user: result

                });


            }









            // ==========================
            // CREATE USER
            // ==========================


            if (

                url.pathname ===

                "/api/v1/users"

                &&

                request.method === "POST"

            ) {



                const admin =

                    await checkAuth();







                if (!admin) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                if (admin.role !== "admin") {


                    return json({

                        success: false,

                        message:

                            "Permission denied"

                    }, 403);


                }








                const body =

                    await request.json();







                if (

                    !body.username

                    ||

                    !body.password

                ) {


                    return json({

                        success: false,

                        message:

                            "Username and password required"

                    }, 400);


                }







                const hashBuffer =

                    await crypto.subtle.digest(

                        "SHA-256",

                        new TextEncoder()

                            .encode(body.password)

                    );







                const hashArray =

                    Array.from(

                        new Uint8Array(hashBuffer)

                    );







                const passwordHash =

                    hashArray

                        .map(

                            b => b.toString(16).padStart(2, "0")

                        )

                        .join("");








                await DB

                    .prepare(

                        `

    INSERT INTO users

    (

    username,

    password_hash,

    full_name,

    role,

    status

    )

    VALUES

    (?,?,?,?,?)

    `

                    )

                    .bind(


                        body.username,


                        passwordHash,


                        body.full_name || null,


                        body.role || "user",


                        body.status || "active"


                    )

                    .run();








                return json({

                    success: true,

                    message:

                        "User created"

                });


            }









            // ==========================
            // UPDATE USER
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/users/"

                )

                &&

                request.method === "PUT"

            ) {



                const admin =

                    await checkAuth();







                if (!admin) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                if (admin.role !== "admin") {


                    return json({

                        success: false,

                        message:

                            "Permission denied"

                    }, 403);


                }







                const id =

                    url.pathname

                        .split("/")

                        .pop();







                const body =

                    await request.json();








                await DB

                    .prepare(

                        `

    UPDATE users

    SET


    full_name=?,


    role=?,


    status=?,


    updated_at=CURRENT_TIMESTAMP


    WHERE id=?


    `

                    )

                    .bind(


                        body.full_name,


                        body.role,


                        body.status,


                        id


                    )

                    .run();








                return json({

                    success: true,

                    message:

                        "User updated"

                });


            }









            // ==========================
            // DELETE USER
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/users/"

                )

                &&

                request.method === "DELETE"

            ) {



                const admin =

                    await checkAuth();







                if (!admin) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                if (admin.role !== "admin") {


                    return json({

                        success: false,

                        message:

                            "Permission denied"

                    }, 403);


                }








                const id =

                    url.pathname

                        .split("/")

                        .pop();








                await DB

                    .prepare(

                        `

    DELETE FROM users

    WHERE id=?

    `

                    )

                    .bind(id)

                    .run();








                return json({

                    success: true,

                    message:

                        "User deleted"

                });


            }



            // ==========================
            // MEDIA API
            // ==========================



            // ==========================
            // UPLOAD MEDIA
            // ==========================


            if (

                url.pathname ===

                "/api/v1/media/upload"

                &&

                request.method === "POST"

            ) {



                const user =

                    await checkAuth();







                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                if (

                    user.role !== "admin"

                    &&

                    user.role !== "editor"

                ) {


                    return json({

                        success: false,

                        message:

                            "Permission denied"

                    }, 403);


                }








                try {



                    const formData =

                        await request.formData();







                    const file =

                        formData.get("file");







                    const type =

                        formData.get("type");








                    if (!file) {


                        return json({

                            success: false,

                            message:

                                "File required"

                        }, 400);


                    }








                    if (

                        file.size >

                        10 * 1024 * 1024

                    ) {


                        return json({

                            success: false,

                            message:

                                "Maximum file size is 10MB"

                        }, 400);


                    }








                    const buffer =

                        await file.arrayBuffer();







                    const bytes =

                        new Uint8Array(buffer);








                    let binary = "";







                    for (

                        let i = 0;

                        i < bytes.length;

                        i++

                    ) {


                        binary +=

                            String.fromCharCode(

                                bytes[i]

                            );


                    }








                    const base64 =

                        btoa(binary);








                    const folder =

                        type === "audio"

                            ?

                            "audio"

                            :

                            "covers";








                    const ext =

                        file.name

                            .split(".")

                            .pop();








                    const filename =
                        Date.now()
                        +
                        "-"
                        +
                        crypto.randomUUID()
                        +
                        "."
                        +
                        ext;









                    const path =
                        folder
                        +
                        "/"
                        +
                        filename;






                    const githubResponse =

                        await fetch(

                            `https://api.github.com/repos/NightCastir/NightCast-Media/contents/${path}`,

                            {

                                method: "PUT",


                                headers: {


                                    "Authorization":

                                        "Bearer " + env.GITHUB_TOKEN,


                                    "Content-Type":

                                        "application/json",


                                    "User-Agent":

                                        "NightCast-CMS"


                                },



                                body:

                                    JSON.stringify({


                                        message:

                                            "Upload media " + filename,


                                        content:

                                            base64


                                    })


                            }

                        );







                    if (!githubResponse.ok) {


                        const error =

                            await githubResponse.text();




                        return json({

                            success: false,

                            message: error

                        }, 500);


                    }








                    const mediaURL =


                        `https://raw.githubusercontent.com/NightCastir/NightCast-Media/main/${path}`;








                    return json({

                        success: true,

                        url:

                            mediaURL,


                        path: path


                    });






                }

                catch (error) {



                    return json({

                        success: false,

                        message:

                            error.message

                    }, 500);


                }



            }









            // ==========================
            // MEDIA LIST
            // ==========================


            if (

                url.pathname ===

                "/api/v1/media"

                &&

                request.method === "GET"

            ) {



                const user =

                    await checkAuth();







                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                return json({

                    success: true,

                    media: []

                });


            }








            // ==========================
            // DELETE MEDIA
            // ==========================


            if (

                url.pathname.startsWith(

                    "/api/v1/media/"

                )

                &&

                request.method === "DELETE"

            ) {



                const user =

                    await checkAuth();








                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }








                return json({

                    success: true,

                    message:

                        "Media deleted"

                });


            }



            // ==========================
            // SETTINGS API
            // ==========================



            // ==========================
            // GET SETTINGS
            // ==========================


            if (

                url.pathname ===

                "/api/v1/settings"

                &&

                request.method === "GET"

            ) {



                const user =

                    await checkAuth();







                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }








                try {



                    const settings =

                        await DB

                            .prepare(

                                `

    SELECT *

    FROM settings

    ORDER BY id DESC

    `

                            )

                            .all();







                    return json({

                        success: true,

                        settings:

                            settings.results || []

                    });





                }

                catch (error) {



                    return json({

                        success: true,

                        settings: []

                    });


                }



            }









            // ==========================
            // UPDATE SETTINGS
            // ==========================


            if (

                url.pathname ===

                "/api/v1/settings"

                &&

                request.method === "PUT"

            ) {



                const user =

                    await checkAuth();







                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                if (user.role !== "admin") {


                    return json({

                        success: false,

                        message:

                            "Permission denied"

                    }, 403);


                }








                const body =

                    await request.json();







                try {



                    for (

                        const item of body

                    ) {



                        await DB

                            .prepare(

                                `

    UPDATE settings

    SET

    value=?,

    updated_at=CURRENT_TIMESTAMP

    WHERE key=?

    `

                            )

                            .bind(

                                item.value,

                                item.key

                            )

                            .run();



                    }







                    return json({

                        success: true,

                        message:

                            "Settings updated"

                    });





                }

                catch (error) {



                    return json({

                        success: false,

                        message:

                            "Settings table not found"

                    }, 500);


                }



            }









            // ==========================
            // ACTIVITY LOG
            // ==========================



            // GET ACTIVITY


            if (

                url.pathname ===

                "/api/v1/activity"

                &&

                request.method === "GET"

            ) {



                const user =

                    await checkAuth();







                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }








                try {



                    const result =

                        await DB

                            .prepare(

                                `

    SELECT *

    FROM activity_logs

    ORDER BY id DESC

    LIMIT 20

    `

                            )

                            .all();








                    return json({

                        success: true,

                        activities:

                            result.results || []

                    });





                }

                catch (error) {



                    return json({

                        success: true,

                        activities: []

                    });


                }



            }









            // ==========================
            // CREATE ACTIVITY
            // ==========================


            if (

                url.pathname ===

                "/api/v1/activity"

                &&

                request.method === "POST"

            ) {



                const user =

                    await checkAuth();







                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }







                const body =

                    await request.json();








                try {



                    await DB

                        .prepare(

                            `

    INSERT INTO activity_logs

    (

    user_id,

    action,

    description

    )

    VALUES

    (?,?,?)

    `

                        )

                        .bind(


                            user.id,


                            body.action || "unknown",


                            body.description || null


                        )

                        .run();







                    return json({

                        success: true,

                        message:

                            "Activity created"

                    });





                }

                catch (error) {



                    return json({

                        success: false,

                        message:

                            "Activity table not found"

                    }, 500);


                }



            }









            // ==========================
            // ADMIN PROFILE
            // ==========================


            if (

                url.pathname ===

                "/api/v1/profile"

                &&

                request.method === "GET"

            ) {



                const user =

                    await checkAuth();







                if (!user) {


                    return json({

                        success: false,

                        message:

                            "Unauthorized"

                    }, 401);


                }








                return json({

                    success: true,

                    profile: user

                });


            }



            // ==========================
            // SYSTEM INFO
            // ==========================


            if (

                url.pathname ===

                "/api/v1/system"

                &&

                request.method === "GET"

            ) {



                return json({

                    success: true,

                    app: "NightCast",

                    version: "5.0",

                    status: "running",

                    time:

                        new Date().toISOString()

                });


            }









            // ==========================
            // HEALTH CHECK
            // ==========================


            if (

                url.pathname ===

                "/api/v1/health"

                &&

                request.method === "GET"

            ) {



                return json({

                    success: true,

                    status: "ok"

                });


            }







            // ==================================================
            // PUBLIC USER API
            // NIGHTCAST LISTENER
            // PART 1/5
            // ==================================================


            // ==========================
            // PUBLIC PODCAST LIST
            // ==========================

            if (

                url.pathname === "/api/v1/public/podcasts"

                &&

                request.method === "GET"

            ) {


                const page =

                    parseInt(

                        url.searchParams.get("page") || "1"

                    );


                const limit =

                    Math.min(

                        parseInt(

                            url.searchParams.get("limit") || "5"

                        ),

                        5

                    );



                const offset =

                    (page - 1) * limit;



                try {


                    const result =

                        await DB

                            .prepare(

                                `

SELECT

id,

title,

slug,

book_name,

author_name,

category_name,

tags,

episode_number,

summary,

description,

duration_seconds,

audio_url,

cover_url,

listen_count,

publish_date,

created_at


FROM podcasts


WHERE status='active'


ORDER BY id DESC


LIMIT ?

OFFSET ?

`

                            )

                            .bind(

                                limit,

                                offset

                            )

                            .all();



                    const count =

                        await DB

                            .prepare(

                                `

SELECT COUNT(*) total

FROM podcasts

WHERE status='active'

`

                            )

                            .first();



                    return json({

                        success: true,


                        page: page,


                        limit: limit,


                        total:

                            count.total || 0,


                        hasMore:

                            (offset + limit)

                            <

                            (count.total || 0),


                        podcasts:

                            result.results || []

                    });


                }


                catch (error) {


                    return json({

                        success: false,

                        message:

                            "Unable to load podcasts"

                    }, 500);


                }


            }
            // ==========================
            // PUBLIC USER API
            // NIGHTCAST LISTENER
            // PART 1/5
            // ==========================


            // کد دریافت لیست پادکست‌ها


            // ==========================

            // ==================================================
            // USER REGISTER
            // PART 3/5
            // ==================================================

            if (

                url.pathname === "/api/v1/public/register"

                &&

                request.method === "POST"

            ) {

                try {


                    const body = await request.json();


                    const username =

                        (body.username || "")

                            .trim();



                    const password =

                        body.password || "";



                    const full_name =

                        body.full_name || null;



                    if (!username || !password) {


                        return json({

                            success: false,

                            message: "Username and password required"

                        }, 400);


                    }



                    // check duplicate

                    const exists =

                        await DB

                            .prepare(

                                `

SELECT id

FROM users

WHERE username=?

LIMIT 1

`

                            )

                            .bind(username)

                            .first();



                    if (exists) {


                        return json({

                            success: false,

                            message: "Username already exists"

                        }, 400);


                    }




                    // password hash

                    const hashBuffer =

                        await crypto.subtle.digest(

                            "SHA-256",

                            new TextEncoder()

                                .encode(password)

                        );



                    const hashArray =

                        Array.from(

                            new Uint8Array(hashBuffer)

                        );



                    const passwordHash =

                        hashArray

                            .map(

                                b => b.toString(16).padStart(2, "0")

                            )

                            .join("");





                    await DB

                        .prepare(

                            `

INSERT INTO users

(

username,

password_hash,

full_name,

role,

status

)

VALUES

(?,?,?,?,?)

`

                        )

                        .bind(

                            username,

                            passwordHash,

                            full_name,

                            "user",

                            "active"

                        )

                        .run();





                    return json({

                        success: true,

                        message: "Registration successful"

                    });


                }

                catch (error) {


                    return json({

                        success: false,

                        message: error.message

                    }, 500);


                }


            }




            // ==================================================
            // USER LOGIN
            // ==================================================

            if (

                url.pathname === "/api/v1/public/login"

                &&

                request.method === "POST"

            ) {


                try {


                    const body =

                        await request.json();



                    const username =

                        (body.username || "")

                            .trim();



                    const password =

                        body.password || "";



                    if (!username || !password) {


                        return json({

                            success: false,

                            message: "Username and password required"

                        }, 400);


                    }




                    const user =

                        await DB

                            .prepare(

                                `

SELECT *

FROM users

WHERE username=?

AND status='active'

LIMIT 1

`

                            )

                            .bind(username)

                            .first();





                    if (!user) {


                        return json({

                            success: false,

                            message: "User not found"

                        }, 401);


                    }






                    const hashBuffer =

                        await crypto.subtle.digest(

                            "SHA-256",

                            new TextEncoder()

                                .encode(password)

                        );



                    const hashArray =

                        Array.from(

                            new Uint8Array(hashBuffer)

                        );



                    const passwordHash =

                        hashArray

                            .map(

                                b => b.toString(16).padStart(2, "0")

                            )

                            .join("");






                    if (passwordHash !== user.password_hash) {


                        return json({

                            success: false,

                            message: "Wrong password"

                        }, 401);


                    }






                    const tokenBytes =

                        new Uint8Array(32);



                    crypto.getRandomValues(

                        tokenBytes

                    );



                    const token =

                        Array.from(tokenBytes)

                            .map(

                                b => b.toString(16).padStart(2, "0")

                            )

                            .join("");






                    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();





                    await DB

                        .prepare(

                            `

INSERT INTO user_sessions

(

user_id,

session_token,

expires_at

)

VALUES

(?,?,?)

`

                        )

                        .bind(

                            user.id,

                            token,

                            expires

                        )

                        .run();





                    return json({

                        success: true,

                        message: "Login successful",

                        token: token,

                        user: {

                            id: user.id,

                            username: user.username,

                            full_name: user.full_name,

                            role: user.role

                        }

                    });


                }

                catch (error) {


                    return json({

                        success: false,

                        message: error.message

                    }, 500);


                }


            }
            // ==================================================
            // USER API
            // PART 5/5
            // SECURITY + SMS LOGIN READY
            // ==================================================



            // ==========================
            // UPDATE USER LAST LOGIN
            // ==========================

            if (

                url.pathname === "/api/v1/public/touch-login"

                &&

                request.method === "POST"

            ) {


                const user = await checkAuth();



                if (!user) {


                    return json({

                        success: false,

                        message: "Unauthorized"

                    }, 401);


                }





                await DB

                    .prepare(

                        `

UPDATE users

SET

last_login=CURRENT_TIMESTAMP

WHERE id=?

`

                    )

                    .bind(user.id)

                    .run();





                return json({

                    success: true,

                    message: "Updated"

                });


            }






            // ==========================
            // SMS LOGIN PLACEHOLDER
            // ==========================
            //
            // بعداً API پیامک شما اینجا وصل می‌شود
            //
            // مثال:
            // ارسال کد
            // تایید کد
            //
            // فعلاً فقط ساختار آماده است
            // ==========================



            if (

                url.pathname === "/api/v1/public/login-sms"

                &&

                request.method === "POST"

            ) {


                return json({

                    success: false,

                    sms_required: true,

                    message:

                        "SMS provider not connected"

                }, 501);


            }






            // ==========================
            // BASIC SECURITY CHECK
            // ==========================


            // جلوگیری از ارسال درخواست‌های خیلی بزرگ

            const contentLength =

                request.headers.get(

                    "content-length"

                );



            if (

                contentLength

                &&

                Number(contentLength)

                >

                15 * 1024 * 1024

            ) {


                return json({

                    success: false,

                    message:

                        "Request too large"

                }, 413);


            }
            // ==========================
            // PUBLIC DOWNLOAD PODCAST
            // ==========================

            if (

                url.pathname.startsWith(

                    "/api/v1/public/download/"

                )

                &&

                request.method === "GET"

            ) {


                const user =

                    await checkAuth();



                if (!user) {


                    return json({

                        success: false,

                        message: "Login required"

                    }, 401);


                }



                const id =

                    url.pathname

                        .split("/")

                        .pop();





                const podcast =

                    await DB

                        .prepare(

                            `

SELECT

id,

title,

cover_url,

audio_url

FROM podcasts

WHERE id=?

LIMIT 1

`

                        )

                        .bind(id)

                        .first();





                if (!podcast) {


                    return json({

                        success: false,

                        message: "Podcast not found"

                    }, 404);


                }





                return json({

                    success: true,

                    download: {


                        id: podcast.id,

                        title: podcast.title,

                        cover_url: podcast.cover_url,

                        audio_url: podcast.audio_url,

                        download_allowed: true


                    }

                });


            }
            // ==================================================
            // AUTH EXTENSION
            // NIGHTCAST LISTENER
            // ==================================================


            // ==================================================
            // GOOGLE OPENID LOGIN
            // ==================================================

            if (

                url.pathname === "/api/v1/public/openid/google"

                &&

                request.method === "POST"

            ) {


                try {


                    const body =

                        await request.json();



                    const idToken =

                        body.idToken;



                    if (!idToken) {


                        return json({

                            success: false,

                            message: "Google Token Required"

                        }, 400);


                    }





                    const googleResponse =

                        await fetch(

                            "https://oauth2.googleapis.com/tokeninfo?id_token="

                            +

                            encodeURIComponent(idToken)

                        );



                    if (!googleResponse.ok) {


                        return json({

                            success: false,

                            message: "Invalid Google Token"

                        }, 401);


                    }





                    const googleUser =

                        await googleResponse.json();

                    if (
                        googleUser.email_verified !== true &&
                        googleUser.email_verified !== "true"
                    ) {

                        return json({

                            success: false,

                            message:
                                "Google email is not verified."

                        }, 401);

                    }
                    if (
                        googleUser.aud !==
                        "242292157493-km4c11qgkf0lr3e6pv9paspkn95jbf3a.apps.googleusercontent.com"
                    ) {

                        return json({

                            success: false,

                            message:
                                "Google Token برای NightCast صادر نشده است."

                        }, 401);

                    }

                    const email =

                        googleUser.email;



                    const name =

                        googleUser.name || "";



                    const picture =

                        googleUser.picture || "";





                    if (!email) {


                        return json({

                            success: false,

                            message: "Google email not found"

                        }, 401);


                    }






                    // پیدا کردن کاربر

                    let user =

                        await DB.prepare(`

SELECT *

FROM users

WHERE username=?

LIMIT 1

`)

                            .bind(email)

                            .first();








                    // ساخت کاربر جدید

                    if (!user) {


                        await DB.prepare(`

INSERT INTO users

(

username,

password_hash,

full_name,

role,

status

)

VALUES

(?,?,?,?,?)

`)

                            .bind(

                                email,

                                "",

                                name,

                                "user",

                                "active"

                            )

                            .run();




                        user =

                            await DB.prepare(`

SELECT *

FROM users

WHERE username=?

LIMIT 1

`)

                                .bind(email)

                                .first();



                    }






                    // ساخت Session

                    const bytes = new Uint8Array(32);
                    crypto.getRandomValues(bytes);
                    const token = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
                    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                    await DB.prepare(`INSERT INTO user_sessions(user_id,session_token,expires_at)
VALUES
(?,?,?)`).bind(
                        user.id,
                        token,
                        expires
                    ).run();

                    return json({
                        success: true, message: "Google login successful", token: token,
                        user:
                        {
                            id: user.id,
                            username: user.username,
                            full_name: user.full_name,
                            avatar: picture,
                            role: user.role
                        }
                    });



                }

                catch (error) {


                    return json({

                        success: false,

                        message: error.message

                    }, 500);


                }


            }
            // ==================================================
            // PUBLIC PODCAST SEARCH API
            // NIGHTCAST LISTENER
            // ==================================================

            if (

                url.pathname === "/api/v1/public/podcasts/search"

                &&

                request.method === "GET"

            ) {

                const query =

                    (

                        url.searchParams.get("q")

                        ||

                        ""

                    )

                        .trim();

                if (!query) {

                    return json({

                        success: true,

                        query: "",

                        total: 0,

                        podcasts: []

                    });

                }

                try {

                    const search = `%${query}%`;

                    const result =

                        await DB

                            .prepare(

                                `

SELECT

id,

title,

slug,

book_name,

author_name,

category_name,

tags,

episode_number,

summary,

description,

duration_seconds,

audio_url,

cover_url,

listen_count,

publish_date,

created_at

FROM podcasts

WHERE status='active'

AND (

title LIKE ?

OR book_name LIKE ?

OR author_name LIKE ?

OR category_name LIKE ?

OR tags LIKE ?

OR summary LIKE ?

OR description LIKE ?

)

ORDER BY id DESC

`

                            )

                            .bind(

                                search,

                                search,

                                search,

                                search,

                                search,

                                search,

                                search

                            )

                            .all();

                    return json({

                        success: true,

                        query: query,

                        total:

                            result.results?.length || 0,

                        podcasts:

                            result.results || []

                    });

                }

                catch (error) {

                    return json({

                        success: false,

                        message: "Search failed",

                        error: error.message

                    }, 500);

                }

            }
            // ==================================================
            // USER FAVORITES API
            // NIGHTCAST LISTENER
            // ==================================================


            // ==================================================
            // ADD PODCAST TO FAVORITES
            // ==================================================

            if (

                url.pathname.startsWith(
                    "/api/v1/public/favorites/"
                )

                &&

                request.method === "POST"

            ) {

                const user = await checkAuth();


                // ==========================
                // TOTAL FAVORITES
                // ==========================

                const countResult =
                    await DB
                        .prepare(
                            `
            SELECT COUNT(*) AS total
            FROM user_favorites
            `
                        )
                        .first();

                const total =
                    Number(
                        countResult?.total || 0
                    );


                // ==========================
                // GUEST / NOT LOGGED IN
                // ==========================

                if (
                    !user ||
                    user.role === "guest" ||
                    !user.id
                ) {

                    return json({

                        success: true,

                        favorites: [],

                        total,

                        guest: true

                    });

                }


                // ==========================
                // GUEST CANNOT FAVORITE
                // ==========================

                if (

                    user.role === "guest"

                    ||

                    !user.id

                ) {

                    return json({

                        success: false,

                        message: "Guest users cannot add favorites"

                    }, 403);

                }


                // ==========================
                // GET PODCAST ID
                // ==========================

                const podcastId =

                    url.pathname
                        .split("/")
                        .pop();


                if (!podcastId) {

                    return json({

                        success: false,

                        message: "Podcast ID required"

                    }, 400);

                }


                try {


                    // ==========================
                    // CHECK PODCAST
                    // ==========================

                    const podcast =

                        await DB

                            .prepare(

                                `

                                                                                                                                                                                                                                                                                                                                                                    SELECT

                                                                                                                                                                                                                                                                                                                                                                                        id,
                                                                                                                                                                                                                                                                                                                                                                                                            title

                                                                                                                                                                                                                                                                                                                                                                                                                            FROM podcasts

                                                                                                                                                                                                                                                                                                                                                                                                                                            WHERE id=?

                                                                                                                                                                                                                                                                                                                                                                                                                                                            LIMIT 1

                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `

                            )

                            .bind(podcastId)

                            .first();


                    if (!podcast) {

                        return json({

                            success: false,

                            message: "Podcast not found"

                        }, 404);

                    }


                    // ==========================
                    // CHECK EXISTING FAVORITE
                    // ==========================

                    const existing =

                        await DB

                            .prepare(

                                `

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                SELECT

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    id

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    FROM user_favorites

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    WHERE user_id=?

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    AND podcast_id=?

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    LIMIT 1

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    `

                            )

                            .bind(

                                user.id,

                                podcastId

                            )

                            .first();


                    if (existing) {

                        return json({

                            success: true,

                            already_favorite: true,

                            message: "Podcast already in favorites"

                        });

                    }


                    // ==========================
                    // INSERT FAVORITE
                    // ==========================

                    await DB

                        .prepare(

                            `

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        INSERT INTO user_favorites

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        (

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            user_id,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                podcast_id

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                )

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                VALUES

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                (?,?)

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `

                        )

                        .bind(

                            user.id,

                            podcastId

                        )

                        .run();


                    return json({

                        success: true,

                        favorite: true,

                        message: "Podcast added to favorites",

                        podcast_id: Number(podcastId)

                    });


                }

                catch (error) {

                    return json({

                        success: false,

                        message: "Unable to add favorite",

                        error: error.message

                    }, 500);

                }

            }



            // ==================================================
            // REMOVE PODCAST FROM FAVORITES
            // ==================================================

            if (

                url.pathname.startsWith(
                    "/api/v1/public/favorites/"
                )

                &&

                request.method === "DELETE"

            ) {

                const user = await checkAuth();


                // ==========================
                // LOGIN REQUIRED
                // ==========================

                if (!user) {

                    return json({

                        success: false,

                        message: "Login required"

                    }, 401);

                }


                if (

                    user.role === "guest"

                    ||

                    !user.id

                ) {

                    return json({

                        success: false,

                        message: "Guest users cannot manage favorites"

                    }, 403);

                }


                const podcastId =

                    url.pathname
                        .split("/")
                        .pop();


                if (!podcastId) {

                    return json({

                        success: false,

                        message: "Podcast ID required"

                    }, 400);

                }


                try {


                    await DB

                        .prepare(

                            `

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        DELETE FROM user_favorites

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE user_id=?

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        AND podcast_id=?

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `

                        )

                        .bind(

                            user.id,

                            podcastId

                        )

                        .run();


                    return json({

                        success: true,

                        favorite: false,

                        message: "Podcast removed from favorites",

                        podcast_id: Number(podcastId)

                    });


                }

                catch (error) {

                    return json({

                        success: false,

                        message: "Unable to remove favorite",

                        error: error.message

                    }, 500);

                }

            }



            // ==================================================
            // GET CURRENT USER FAVORITES
            // ==================================================

            if (
                url.pathname === "/api/v1/public/favorites" &&
                request.method === "GET"
            ) {

                // ==================================================
                // 1. TOTAL FAVORITES FOR ALL USERS
                // ==================================================

                let total = 0;

                try {

                    const countResult =
                        await DB
                            .prepare(`
                    SELECT COUNT(*) AS total
                    FROM user_favorites
                `)
                            .first();

                    total =
                        Number(
                            countResult?.total || 0
                        );

                } catch (error) {

                    return json({
                        success: false,
                        message: "Unable to load favorite count",
                        error: error.message
                    }, 500);

                }


                // ==================================================
                // 2. CHECK CURRENT USER
                // ==================================================

                const user =
                    await checkAuth();


                // ==================================================
                // 3. GUEST / NOT LOGGED IN
                //    فقط تعداد کل سایت را برگردان
                // ==================================================

                if (
                    !user ||
                    user.role === "guest" ||
                    !user.id
                ) {

                    return json({

                        success: true,

                        total: total,

                        favorites: [],

                        guest: true

                    });

                }


                // ==================================================
                // 4. LOGGED-IN USER
                //    علاقه‌مندی‌های خودش را برگردان
                // ==================================================

                try {

                    const result =
                        await DB
                            .prepare(`
                    SELECT
                        p.id,
                        p.title,
                        p.slug,
                        p.book_name,
                        p.author_name,
                        p.category_name,
                        p.tags,
                        p.episode_number,
                        p.summary,
                        p.description,
                        p.duration_seconds,
                        p.audio_url,
                        p.cover_url,
                        p.listen_count,
                        p.publish_date,
                        p.created_at,
                        uf.created_at AS favorited_at

                    FROM user_favorites uf

                    INNER JOIN podcasts p
                        ON p.id = uf.podcast_id

                    WHERE uf.user_id = ?

                    ORDER BY uf.id DESC
                `)
                            .bind(
                                user.id
                            )
                            .all();


                    return json({

                        success: true,

                        user_id:
                            user.id,

                        // تعداد کل علاقه‌مندی‌های تمام کاربران
                        total:
                            total,

                        // علاقه‌مندی‌های همین کاربر
                        favorites:
                            result.results || []

                    });

                } catch (error) {

                    return json({

                        success: false,

                        message:
                            "Unable to load favorites",

                        error:
                            error.message

                    }, 500);

                }

            } {

                const user = await checkAuth();


                // ==========================
                // LOGIN REQUIRED
                // ==========================

                if (!user) {

                    return json({

                        success: false,

                        message: "Login required"

                    }, 401);

                }


                if (

                    user.role === "guest"

                    ||

                    !user.id

                ) {

                    try {

                        return json({

                            success: true,

                            user_id: user.id,

                            total,

                            favorites:
                                result.results || []

                        });

                    }

                    catch (error) {

                        return json({

                            success: false,

                            message:
                                "Unable to load favorite count",

                            error:
                                error.message

                        }, 500);

                    }

                }


                try {


                    const result =

                        await DB

                            .prepare(

                                `

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                SELECT

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    p.id,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        p.title,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            p.slug,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                p.book_name,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    p.author_name,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        p.category_name,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            p.tags,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                p.episode_number,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    p.summary,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        p.description,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            p.duration_seconds,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                p.audio_url,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    p.cover_url,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        p.listen_count,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            p.publish_date,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                p.created_at,

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    uf.created_at AS favorited_at

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    FROM user_favorites uf

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    INNER JOIN podcasts p

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ON p.id = uf.podcast_id

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE uf.user_id=?

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ORDER BY uf.id DESC

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `

                            )

                            .bind(

                                user.id

                            )

                            .all();
                    const countResult =

                        await DB

                            .prepare(
                                `
            SELECT COUNT(*) AS total
            FROM user_favorites
            `
                            )

                            .first();

                    return json({

                        success: true,

                        user_id: user.id,

                        total:
                            Number(
                                countResult?.total || 0
                            ),

                        favorites:
                            result.results || []

                    });


                }

                catch (error) {

                    return json({

                        success: false,

                        message: "Unable to load favorites",

                        error: error.message

                    }, 500);

                }

            }



            // ==================================================
            // CHECK IF ONE PODCAST IS FAVORITE
            // ==================================================

            if (

                url.pathname.startsWith(
                    "/api/v1/public/favorites/check/"
                )

                &&

                request.method === "GET"

            ) {

                const user = await checkAuth();


                if (!user) {

                    return json({

                        success: true,

                        favorite: false,

                        authenticated: false

                    });

                }


                if (

                    user.role === "guest"

                    ||

                    !user.id

                ) {

                    return json({

                        success: true,

                        favorite: false,

                        authenticated: true,

                        guest: true

                    });

                }


                const podcastId =

                    url.pathname
                        .split("/")
                        .pop();


                try {


                    const favorite =

                        await DB

                            .prepare(

                                `

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    SELECT

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        id

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        FROM user_favorites

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE user_id=?

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        AND podcast_id=?

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        LIMIT 1

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `

                            )

                            .bind(

                                user.id,

                                podcastId

                            )

                            .first();


                    return json({

                        success: true,

                        favorite: !!favorite,

                        authenticated: true,

                        podcast_id: Number(podcastId)

                    });


                }

                catch (error) {

                    return json({

                        success: false,

                        message: "Unable to check favorite",

                        error: error.message

                    }, 500);

                }

            }



            // ==================================================
            // INTERNAL SYNC - ALL PODCASTS
            // ==================================================

            if (
                request.method === "GET" &&
                url.pathname === "/api/v1/internal/sync/podcasts"
            ) {

                try {

                    const result = await DB
                        .prepare(`
                SELECT
                    id,
                    title,
                    slug,
                    book_name,
                    author_name,
                    category_name,
                    tags,
                    episode_number,
                    summary,
                    description,
                    duration_seconds,
                    audio_url,
                    cover_url,
                    listen_count,
                    publish_date,
                    created_at
                FROM podcasts
                ORDER BY id DESC
            `)
                        .all();

                    const podcasts = result.results || [];

                    return json({

                        success: true,

                        total: podcasts.length,

                        podcasts: podcasts

                    });

                } catch (error) {

                    return json({

                        success: false,

                        message: "Failed to load podcasts",

                        error: error.message

                    }, 500);

                }
            }


            // ROUTE NOT FOUND
            // ==========================


            return json({

                success: false,

                message:

                    "Route not found",

                path:

                    url.pathname,

                method:

                    request.method

            }, 404);





        }

        catch (error) {



            return json({

                success: false,

                message:

                    "Server Error",

                error:

                    error.message

            }, 500);


        }





    }



};
