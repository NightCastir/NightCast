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







            
            


            
            
            /* ==================================================
   NIGHTCAST SMS AUTHENTICATION
   D1 + KAVENEGAR
================================================== */

function normalizeNightCastMobile(value) {

    let mobile = String(value || "")
        .trim()
        .replace(/\s+/g, "")
        .replace(/-/g, "");

    if (mobile.startsWith("+98")) {
        mobile = "0" + mobile.substring(3);
    }

    if (mobile.startsWith("98")) {
        mobile = "0" + mobile.substring(2);
    }

    if (!/^09\d{9}$/.test(mobile)) {
        return null;
    }

    return mobile;
}


/* ==================================================
   OTP GENERATOR
================================================== */

function generateNightCastOTP() {

    const bytes = new Uint32Array(1);

    crypto.getRandomValues(bytes);

    return String(
        100000 + (bytes[0] % 900000)
    );
}


/* ==================================================
   RANDOM HEX
================================================== */

function generateNightCastRandomHex(byteLength = 32) {

    const bytes = new Uint8Array(byteLength);

    crypto.getRandomValues(bytes);

    return Array.from(bytes)
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


/* ==================================================
   HASH OTP
================================================== */

async function hashNightCastOTP(
    env,
    mobile,
    otp
) {

    const data = new TextEncoder().encode(
        mobile +
        ":" +
        otp +
        ":" +
        env.NIGHTCAST_OTP_PEPPER
    );

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array.from(
        new Uint8Array(hash)
    )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


/* ==================================================
   CONSTANT-TIME HASH COMPARISON
================================================== */

function safeCompareNightCastHash(
    a,
    b
) {

    if (
        typeof a !== "string" ||
        typeof b !== "string" ||
        a.length !== b.length
    ) {
        return false;
    }

    let result = 0;

    for (let i = 0; i < a.length; i++) {

        result |=
            a.charCodeAt(i) ^
            b.charCodeAt(i);

    }

    return result === 0;
}


/* ==================================================
   KAVENEGAR
================================================== */

async function sendNightCastSmsOTP(
    env,
    mobile,
    otp
) {

    const apiKey =
        env.KAVENEGAR_API_KEY;

    const sender =
        env.KAVENEGAR_SENDER;

    if (!apiKey) {
        throw new Error(
            "KAVENEGAR_API_KEY is not configured."
        );
    }

    if (!sender) {
        throw new Error(
            "KAVENEGAR_SENDER is not configured."
        );
    }

    const endpoint =
        `https://api.kavenegar.com/v1/` +
        `${encodeURIComponent(apiKey)}` +
        `/sms/send.json`;

    const body =
        new URLSearchParams();

    body.append(
        "sender",
        sender
    );

    body.append(
        "receptor",
        mobile
    );

    body.append(
        "message",
        `کد ورود NightCast: ${otp}`
    );

    const response =
        await fetch(
            endpoint,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8"
                },

                body:
                    body.toString()
            }
        );

    const data =
        await response
            .json()
            .catch(
                () => null
            );

    if (
        !response.ok ||
        !data ||
        !data.return ||
        Number(data.return.status) !== 200
    ) {

        throw new Error(
            data?.return?.message ||
            "Kavenegar rejected the SMS."
        );

    }

    return data;
}
            // ==========================
            // SYSTEM TEST
            // ==========================
/* ==================================================
   SMS REQUEST
   POST /api/v1/public/sms/request
================================================== */

if (
    url.pathname ===
        "/api/v1/public/sms/request" &&
    request.method === "POST"
) {

    const body =
        await request
            .json()
            .catch(() => ({}));

    const mobile =
        normalizeNightCastMobile(
            body.mobile
        );

    if (!mobile) {

        return json(
            {
                success: false,
                message:
                    "شماره موبایل معتبر نیست."
            },
            400
        );

    }

    const now =
        Date.now();


    /* ==========================================
       CHECK 60 SECOND RESEND LIMIT
    ========================================== */

    const existing =
        await DB
            .prepare(`
                SELECT
                    id,
                    last_sent_at
                FROM sms_otps
                WHERE mobile = ?
                LIMIT 1
            `)
            .bind(mobile)
            .first();


    if (existing) {

        const elapsed =
            now -
            Number(
                existing.last_sent_at
            );

        if (elapsed < 60000) {

            const remaining =
                Math.ceil(
                    (60000 - elapsed) /
                    1000
                );

            return json(
                {
                    success: false,

                    message:
                        "لطفاً کمی بعد دوباره تلاش کنید.",

                    retry_after:
                        remaining
                },
                429
            );

        }

    }


    /* ==========================================
       GENERATE OTP
    ========================================== */

    const otp =
        generateNightCastOTP();


    const codeHash =
        await hashNightCastOTP(
            env,
            mobile,
            otp
        );


    const expiresAt =
        now +
        (2 * 60 * 1000);


    /* ==========================================
       SEND SMS FIRST
    ========================================== */


   try {
    await sendNightCastSmsOTP(env, mobile, otp);
} catch (error) {
    return json(
        {
            success: false,
            message: "ارسال پیامک انجام نشد.",
            error: error instanceof Error ? error.message : String(error)
        },
        502
    );
}

    /* ==========================================
       SAVE HASHED OTP
    ========================================== */

    await DB
        .prepare(`
            INSERT INTO sms_otps
            (
                mobile,
                code_hash,
                expires_at,
                attempts,
                created_at,
                last_sent_at
            )
            VALUES (?, ?, ?, 0, ?, ?)

            ON CONFLICT(mobile)
            DO UPDATE SET
                code_hash = excluded.code_hash,
                expires_at = excluded.expires_at,
                attempts = 0,
                created_at = excluded.created_at,
                last_sent_at = excluded.last_sent_at
        `)
        .bind(
            mobile,
            codeHash,
            expiresAt,
            now,
            now
        )
        .run();


    return json({
        success: true,
        message:
            "کد تأیید ارسال شد."
    });

}

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

                   --- TRUNCATED --- 222,998 chars