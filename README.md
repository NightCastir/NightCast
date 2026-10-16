# NightCast — مستند جامع پروژه و برنامه بهبود
# NightCast — رادیو آنلاین و اپلیکیشن اندروید

وب‌سایت: https://www.nightcast.ir  
مخزن: https://github.com/NightCastir/NightCast

> این مستند بر پایه Workflow ارائه‌شده و اطلاعات شناخته‌شده پروژه نوشته شده است. تنظیمات واقعی Cloudflare و سورس Workerها هنوز از داشبورد/مخزن تأیید نشده‌اند؛ موارد تأییدنشده صریحاً مشخص شده‌اند و حدس زده نشده‌اند.

## معرفی

NightCast پروژه‌ای برای ارائه تجربه رادیویی و محتوای صوتی آنلاین از طریق وب‌سایت و اپلیکیشن اندروید است. مخزن شامل صفحات وب، بخش کاربران و GitHub Actions برای ساخت APK است.

## معماری کلی

```text
NightCast.ir
├── index.html
└── users/
    ├── login.html
    └── index.html

GitHub Actions
└── آماده‌سازی www/
    └── Capacitor / Android
        ├── Debug APK
        └── Release APK
```

## مسیرهای شناخته‌شده

| مسیر | کاربرد |
|---|---|
| `index.html` | صفحه اصلی ریشه |
| `users/login.html` | صفحه ورود کاربران |
| `users/index.html` | صفحه اصلی بخش کاربران |
| `.github/workflows/build-android.yml` | Workflow ساخت APK |
| `package.json` | وابستگی‌ها و اسکریپت‌های Node.js |
| `assets/icons/icon-512.png` | فایل آیکون لانچر که Workflow استفاده می‌کند |

## مسیر ورود موردنظر

```text
/index.html
    ↓
/users/login.html
    ↓
/users/index.html
```

این مسیر هدف موردنظر پروژه است. برای تأیید رفتار واقعی، باید redirectهای داخل HTML و JavaScript هر سه فایل بررسی شوند؛ مسیر `login.html` با `users/login.html` یکسان نیست.

## ساخت APK اندروید

Workflow ارائه‌شده این مراحل را اجرا می‌کند:

1. دریافت مخزن با `actions/checkout`.
2. راه‌اندازی Node.js نسخه 22.
3. نصب وابستگی‌ها با `npm ci` در صورت وجود `package-lock.json`، وگرنه `npm install`.
4. نصب Android SDK شامل `platform-tools`، `platforms;android-34`، `build-tools;34.0.0` و `ndk;27.0.11718014`.
5. راه‌اندازی Java نسخه 21.
6. تولید `capacitor.config.json` با `appId: ir.nightcast.app` و `webDir: www`.
7. آماده‌سازی پوشه `www`.
8. ساخت پلتفرم Android با `npx cap add android`.
9. تنظیم آیکون برنامه.
10. ایجاد پلاگین بومی Google Sign-In و افزودن وابستگی‌های Credential Manager.
11. اجرای `npx cap sync android`.
12. اعتبارسنجی Gradle و ساخت Debug و Release APK.
13. بارگذاری Artifactهای `NightCast-Debug-APK` و `NightCast-Release-APK`.

Artifactها طبق Workflow برای 30 روز نگهداری می‌شوند.

## نکته مهم درباره ورودی APK

در Workflow ارائه‌شده این دستور وجود دارد:

```bash
cp users/index.html www/index.html
```

این دستور محتوای `users/index.html` را به‌عنوان `www/index.html` قرار می‌دهد؛ در نتیجه صفحه شروع APK، صفحه اصلی ریشه مخزن نخواهد بود.

اگر هدف این است که APK از `index.html` ریشه شروع شود، دستور باید این باشد:

```bash
cp index.html www/index.html
```

و پوشه کاربران نیز در مسیر خودش کپی شود:

```bash
mkdir -p www/users
cp -r users/* www/users/
```

بعد از ساخت، این سه فایل باید وجود داشته باشند:

```text
www/index.html
www/users/login.html
www/users/index.html
```

همچنین باید redirectهای درون فایل‌ها بررسی شوند تا مسیرهای نسبی اشتباه نباشند. این README به‌تنهایی کد برنامه را تغییر نمی‌دهد.

## پیکربندی Capacitor شناخته‌شده

```json
{
  "appId": "ir.nightcast.app",
  "appName": "NightCast",
  "webDir": "www",
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "allowMixedContent": true,
    "backgroundColor": "#050a16"
  }
}
```

Workflow همچنین تنظیمات SplashScreen و StatusBar را در `capacitor.config.json` ایجاد می‌کند.

## Google Sign-In در اندروید

Workflow این فایل‌ها را ایجاد می‌کند:

- `MainActivity.java`
- `NightCastGoogleAuth.java`

پلاگین بومی با نام `NightCastGoogleAuth` ثبت می‌شود و از Android Credential Manager و Google ID library برای دریافت Google ID token استفاده می‌کند. وابستگی‌های افزوده‌شده:

```gradle
implementation "androidx.credentials:credentials:1.6.0"
implementation "androidx.credentials:credentials-play-services-auth:1.6.0"
implementation "com.google.android.libraries.identity.googleid:googleid:1.2.0"
```

وجود پلاگین بومی به‌تنهایی اثبات نمی‌کند که کد JavaScript صفحه ورود آن را فراخوانی می‌کند یا توکن در سمت سرور اعتبارسنجی می‌شود. این موارد باید در `users/login.html` و سرویس احراز هویت واقعی بررسی شوند.

## امضای Release APK

Workflow به GitHub Actions Secrets زیر ارجاع می‌دهد:

- `ANDROID_KEYSTORE_BASE64`
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

در صورت نبود `ANDROID_KEYSTORE_BASE64`، Workflow طبق کد ارائه‌شده Release APK را بدون امضای اختصاصی می‌سازد. وضعیت امضای APK پیش از انتشار باید بررسی شود. مقدار Secretها را در README یا سورس عمومی قرار ندهید.

## Cloudflare و Worker

دامنه پروژه `NightCast.ir` است، اما صرف دانستن دامنه، تنظیمات واقعی Cloudflare را مشخص نمی‌کند. در اطلاعات قابل‌تأیید فعلی، نام Workerها، کد Worker، Routeها، Triggerها، Bindingها، متغیرهای محیطی، DNS records و تنظیمات Pages در دسترس نیستند؛ بنابراین هیچ endpoint یا کاربردی برای آن‌ها حدس زده نشده است.

برای تکمیل مستندات، این موارد باید از تنظیمات واقعی استخراج شوند:

| بخش | اطلاعات لازم |
|---|---|
| DNS | رکوردهای دامنه و زیر‌دامنه‌های مرتبط |
| Workers | نام و وظیفه هر Worker |
| Routes / Custom Domains | مسیرها و دامنه‌های متصل |
| Entry point | فایل یا کد اصلی Worker |
| API | مسیر، متد، ورودی، خروجی و احراز هویت هر endpoint |
| Bindings | نام و نوع KV، D1، R2، Service یا سایر Bindingها، در صورت وجود |
| Variables | نام و کاربرد متغیرها؛ نه مقادیر حساس |
| Secrets | فقط نام Secretها و محل مدیریتشان |
| Triggers | Cron یا سایر Triggerها، در صورت وجود |
| Deployment | روش انتشار و اتصال احتمالی به GitHub Actions |
| Security | CORS، اعتبارسنجی ورودی، کنترل دسترسی و محدودسازی درخواست |

### الگوی مستندسازی Worker

برای هر Worker واقعی، این اطلاعات ثبت شود:

```text
نام Worker:
وظیفه:
دامنه یا Route:
فایل ورودی:
روش استقرار:
متغیرها (فقط نام):
Bindings:
Endpointها:
احراز هویت:
سرویس‌های وابسته:
رفتار در خطا:
ملاحظات امنیتی:
```

اگر Worker فعالی برای NightCast وجود نداشته باشد، این موضوع باید پس از بررسی داشبورد ثبت شود؛ از وجود Cloudflare در DNS نمی‌توان نتیجه گرفت که حتماً Worker فعال است.

## امنیت و نگهداری

- مقدار API token، Cloudflare secrets، رمزهای keystore، OAuth client secrets و توکن‌های کاربران را در مخزن عمومی قرار ندهید.
- در README فقط نام متغیرها و توضیح کاربردشان ثبت شود.
- پس از تغییر مسیرهای ورود، نسخه وب و APK را جداگانه آزمایش کنید.
- Workflow پوشه `android` را حذف و دوباره ایجاد می‌کند؛ تغییرات دستی در آن پوشه ممکن است از بین بروند، مگر آنکه در مراحل خودکارسازی بازتولید شوند.
- پس از شکست Build، اولین خطای واقعی در لاگ را بررسی کنید؛ هر Warning به‌تنهایی به معنی شکست Build نیست.
- برای Build تکرارپذیر، `package-lock.json` را با `package.json` هماهنگ نگه دارید.
- پس از تغییر Worker، Routeها و Bindings واقعی Cloudflare را دوباره بررسی کنید.

## وضعیت تکمیل مستندات

بخش GitHub Actions و ساخت APK بر اساس Workflow ارائه‌شده مستند شده است. تحلیل کامل Cloudflare و Workerها به دسترسی به کد Workerها و تنظیمات واقعی حساب Cloudflare نیاز دارد. برای تکمیل آن، فهرست Workerها، کد آن‌ها، Routeها، Bindingها و رکوردهای DNS مرتبط باید بررسی شوند. مقادیر محرمانه نباید ارسال شوند.


🔐 Android APK Signing (GitHub Actions)

NightCast uses GitHub Actions to build Android APK files. The release build can use a custom Android Keystore to sign the APK.

To enable release signing, configure the following repository secrets in GitHub.

Navigation: Repository → Settings → Secrets and variables → Actions → Repository secrets

Secret Name| Description
"ANDROID_KEYSTORE_BASE64"| The Android Keystore file encoded as a Base64 string.
"KEYSTORE_PASSWORD"| The password used to access the Keystore.
"KEY_ALIAS"| The alias identifying the signing key inside the Keystore.
"KEY_PASSWORD"| The password associated with the signing key.

How It Works

1. GitHub Actions reads the configured signing secrets.
2. The Base64-encoded Keystore is decoded into a temporary Keystore file.
3. Gradle uses the Keystore, alias, and passwords to sign the release APK.
4. The workflow separately builds the debug APK using Android's default debug-signing configuration.

Custom release signing requires a valid Keystore and matching credentials. Defining the secrets alone does not guarantee a successful build.

Generating the Base64 Keystore Value

If you already have a valid Android Keystore file, encode it as Base64 before adding it to GitHub Secrets.

For example, on Linux or macOS:

base64 -w 0 release-key.jks

On macOS, if the "-w" option is unavailable, use:

base64 < release-key.jks | tr -d '\n'

Copy the resulting Base64 string into the "ANDROID_KEYSTORE_BASE64" repository secret.

Security Requirements

- Never commit the Keystore file, its passwords, or the actual secret values to the repository.
- Never include secret values in this README or in GitHub Actions logs.
- Store a secure backup of the original Keystore and its credentials.
- Keep the same signing key for future updates to an app distributed using that key, unless the applicable Android signing or key-upgrade process allows a change.
- Restrict access to repository secrets and workflows that can use them.
- If a signing credential is compromised, assess the exposure and follow the appropriate key-rotation or app-signing recovery procedure.

Troubleshooting

If release signing fails, verify that:

- All four required secrets are configured correctly.
- "ANDROID_KEYSTORE_BASE64" decodes into a valid Keystore file.
- "KEYSTORE_PASSWORD" is correct.
- "KEY_ALIAS" matches an alias in the Keystore.
- "KEY_PASSWORD" is correct for that alias.
- The GitHub Actions logs do not report a Keystore or signing-configuration error.

Important: The presence of these secrets in GitHub does not prove that release signing is working. Confirm that the release build succeeds and verify the resulting APK's signing certificate.


---

## ممیزی فنی مخزن — ۱۷ اکتبر ۲۰۲۶

این بخش بر اساس فایل‌های قابل‌مشاهده در شاخه `main` بررسی شده است. این بررسی static review است، نه تست نفوذ، تست کامل مرورگر/موبایل یا تأیید تنظیمات داشبورد Cloudflare. مواردی که نیازمند دسترسی یا اجرای واقعی هستند صریحاً مشخص شده‌اند.

### ساختار فعلی مخزن

- وب‌سایت استاتیک: `index.html`، `style.css`، `app.js` و فایل‌های ریشه.
- تجربه کاربران و پادکست‌ها: پوشه `users/` همراه با HTML، CSS، JavaScript و داده `users/data/podcasts.json` و XML.
- احراز هویت جداگانه در مسیرهای ریشه و کاربران: `js/auth.js`، `users/js/auth.js` و فایل‌های ورود زیر `auth/` و `users/`.
- کلاینت API: `users/js/api.js` که به آدرس Worker زیر درخواست می‌فرستد:
  `https://nightcast-api.tomasgermany2580.workers.dev/api/v1`
- PWA: `manifest.json` و دو فایل Service Worker با نام‌های `service-worker.js` و `sw.js`.
- Android: Capacitor 7 در `package.json` و Workflow ساخت APK در `.github/workflows/build-android.yml`.
- رسانه: فایل‌های صوتی و کاورها از مخزن جداگانه `NightCast-Media` بارگیری می‌شوند.

### نقاط قوت

1. تفکیک نسبی تجربه کاربری، API client، پلیر، فایل‌های داده و Workflow اندروید.
2. وجود PWA manifest، آیکون‌های 192 و 512 پیکسل و Service Worker برای شروع تجربه آفلاین.
3. وجود API مرکزی و استفاده از Bearer token در کلاینت API.
4. داده پادکست‌ها شامل شناسه، عنوان، slug، دسته‌بندی، خلاصه، مدت‌زمان و URL رسانه است؛ این ساختار برای جست‌وجو و نمایش کاتالوگ مناسب است.
5. ساخت خودکار APK با GitHub Actions و استفاده از Repository Secrets برای اطلاعات امضای انتشار، به‌جای نگهداری رمزها در کد.
6. وجود مسیرهای قابل‌استفاده برای هدایت‌هایی مانند `/login` و `/users` در فایل `_redirects`.

### ریسک‌ها و نقاط ضعف قابل مشاهده

#### 1. مسیر شروع APK و وب‌سایت

در Workflow باید دقیقاً بررسی شود که چه فایل‌هایی به پوشه `www` کپی می‌شوند. اگر `users/index.html` به `www/index.html` کپی شود، صفحه شروع APK با صفحه اصلی ریشه وب تفاوت خواهد داشت. این می‌تواند باعث تفاوت رفتار مسیرها و لینک‌ها بین وب و Android شود.

**اقدام:** ساختار `www` را در خود Workflow با خروجی مورد انتظار مقایسه کن؛ پس از Build بررسی کن که `www/index.html`، `www/users/index.html` و `www/users/login.html` در مسیر درست قرار دارند. تغییرات Android را فقط در صورتی دستی انجام بده که Workflow آن‌ها را حفظ کند یا بازتولید کند.

#### 2. مسیرهای مطلق و نسبی

در `js/router.js` از مسیر مطلق `/users/index.html` استفاده شده است. این مسیر برای دامنه ریشه مناسب است، اما باید در محیط Capacitor و هرگونه انتشار زیرمسیر نیز تست شود. در `index.html` نیز آدرس‌هایی مانند `images/favicon.png` دیده می‌شود؛ در حالی که در فهرست مخزن مسیرهای ریشه‌ای `favicon.png` و `assets/icons/` دیده می‌شوند و پوشه `images/` در فهرست فایل‌ها مشاهده نشد.

**اقدام:** تمام مسیرهای تصاویر، CSS، JavaScript، ورود و redirectها را با فایل‌های واقعی تطبیق بده و 404های مرورگر را برطرف کن.

#### 3. Service Worker و کش

وجود هم‌زمان `service-worker.js` و `sw.js` می‌تواند باعث دو منبع متفاوت برای سیاست کش شود، اگر هر دو ثبت شوند. در `service-worker.js` نام کش ثابت `nightcast-v1` است و درخواست‌های GET به‌صورت عمومی در کش ذخیره می‌شوند، به‌جز فایل‌های صوتی با پسوندهای مشخص. در صورت تغییر نام فایل‌ها یا داده‌های پویا، کاربر ممکن است نسخه قدیمی را ببیند. همچنین fallback عمومی به `/index.html` برای هر درخواست ناموفق ممکن است برای API یا منابع غیرصفحه‌ای پاسخ نامناسب ایجاد کند.

**اقدام:**
- مشخص کن کدام Service Worker واقعاً ثبت می‌شود و فقط یک سیاست اصلی داشته باش.
- نسخه کش را هنگام تغییر منابع افزایش بده.
- پاسخ‌های API، احراز هویت و محتوای شخصی را به‌صورت عمومی cache نکن.
- fallback آفلاین را به درخواست‌های navigation محدود کن.
- نصب، فعال‌سازی، به‌روزرسانی و پاک‌سازی کش را در Android Chrome و مرورگر دسکتاپ آزمایش کن.

#### 4. احراز هویت و نگهداری توکن

در `users/js/api.js` توکن از `localStorage` با کلید `NightCastUserToken` خوانده می‌شود و به‌عنوان Bearer token ارسال می‌شود. در فایل احراز هویت کاربران، کلیدهای دیگری از جمله `NightCastUser` و `NightCastToken` نیز دیده می‌شود. تفاوت نام کلیدها می‌تواند باعث شود بخش‌های مختلف برنامه وضعیت ورود یکسانی نداشته باشند.

**اقدام:**
- یک قرارداد واحد برای نام کلیدها و چرخه عمر نشست تعریف کن.
- تأیید سمت کلاینت را جایگزین اعتبارسنجی سمت Worker نکن.
- مطمئن شو Worker برای هر endpoint حساس، توکن را بررسی می‌کند و مجوز کاربر را جداگانه کنترل می‌کند.
- logout باید توکن‌ها و اطلاعات نشست مربوط را پاک کند.
- در صورت امکان معماری امن‌تر نشست را ارزیابی کن؛ ذخیره توکن در `localStorage` در برابر XSS آسیب‌پذیر است.
- پیام‌های خطا نباید توکن یا اطلاعات داخلی حساس را افشا کنند.

#### 5. API و وابستگی به Worker

کلاینت API یک آدرس مستقیم `workers.dev` دارد. این آدرس قابل مشاهده عمومی است و نباید به‌عنوان راز تلقی شود. تنظیمات واقعی Worker، کد backend، سیاست CORS، محدودسازی درخواست، اعتبارسنجی داده‌ها و Bindingها از مخزن وب به‌تنهایی قابل تأیید نیستند.

**اقدام:** فهرست endpointها و روش‌های HTTP، احراز هویت، ساختار پاسخ و خطا، محدودسازی نرخ، اعتبارسنجی ورودی و دسترسی به داده را مستند و آزمایش کن. کلاینت هرگز نباید به‌تنهایی مرجع امنیت باشد.

#### 6. وابستگی‌های خارجی

در `index.html` اسکریپت Capacitor از URL دارای نسخه `latest` بارگیری می‌شود. وابستگی به نسخه متغیر CDN می‌تواند رفتار وب را بدون تغییر کد مخزن عوض کند.

**اقدام:** در صورت نیاز واقعی، نسخه مشخص و آزموده‌شده را pin کن؛ وابستگی‌های غیرضروری را حذف کن و رفتار fallback را هنگام قطع CDN آزمایش کن.

#### 7. سازگاری و کیفیت داده پادکست‌ها

`users/data/podcasts.json` دارای فهرست محتوای پادکست و لینک‌های رسانه از مخزن جداگانه است. URLهای خارجی ممکن است حذف، جابه‌جا یا غیرقابل‌دسترسی شوند. داده JSON و XML نیز ممکن است در طول زمان از هم فاصله بگیرند.

**اقدام:**
- اعتبار URLهای صوت و کاور را به‌صورت خودکار بررسی کن.
- ساختار JSON را با schema اعتبارسنجی کن.
- منبع اصلی داده را مشخص کن و در صورت تولید XML از JSON، تولید خودکار را جایگزین ویرایش دستی دو فایل کن.
- برای پخش، حالت loading، خطا، قطع شبکه، ادامه پخش و خطای فایل ناموجود را آزمایش کن.
- شمارش پخش را فقط بر اساس رویداد معتبر سمت سرور ثبت کن تا به‌آسانی قابل جعل نباشد.

#### 8. امنیت انتشار APK

Workflow به Secrets زیر ارجاع می‌دهد: `ANDROID_KEYSTORE_BASE64`، `KEYSTORE_PASSWORD`، `KEY_ALIAS` و `KEY_PASSWORD`. وجود Secretها به‌تنهایی ثابت نمی‌کند Release APK واقعاً با کلید مورد انتظار امضا شده است.

**اقدام:** Build را برای حالت نبودن هر Secret کنترل کن؛ از انتشار APK بدون امضای مورد انتظار جلوگیری کن؛ امضای خروجی را در CI بررسی کن؛ کلید و نسخه پشتیبان آن را امن نگه دار. هرگز مقدار Secretها را در README یا log چاپ نکن.

#### 9. کیفیت CI و تکرارپذیری

Workflow از Node.js 22، Java 21، Android API 34 و Build Tools 34.0.0 استفاده می‌کند. باید سازگاری این نسخه‌ها با نسخه Capacitor، Gradle و پلاگین‌های واقعی در خروجی Build بررسی شود. اگر `package-lock.json` موجود نباشد، نصب با `npm install` می‌تواند وابستگی‌های متفاوتی در اجراهای مختلف ایجاد کند.

**اقدام:**
- `package-lock.json` را نگه دار و در CI از `npm ci` استفاده کن.
- مراحل lint، اعتبارسنجی JSON، بررسی لینک‌ها و تست JavaScript را اضافه کن.
- Buildهای Debug و Release را جداگانه تأیید کن.
- پس از هر تغییر در کپی فایل‌ها، مسیرهای ورودی APK را بررسی کن.
- Artifactها را با نسخه، commit SHA و تاریخ Build نام‌گذاری کن.
- وابستگی‌های GitHub Actions را دوره‌ای به‌روزرسانی و تغییرات را در محیط کنترل‌شده آزمایش کن.

#### 10. SEO، دسترس‌پذیری و عملکرد

بررسی اولیه نشان می‌دهد عنوان و توضیحات فارسی در صفحه اصلی وجود دارد، اما این موضوع به‌تنهایی وضعیت SEO، دسترس‌پذیری یا عملکرد کل سایت را ثابت نمی‌کند.

**اقدام:**
- برای صفحات عمومی عنوان و description یکتا، canonical، Open Graph و favicon معتبر تعریف کن.
- sitemap.xml و robots.txt را بر اساس صفحات واقعاً قابل ایندکس بررسی کن.
- کنتراست، اندازه فونت، فوکوس صفحه‌کلید، label فرم‌ها و پیام‌های خطا را تست کن.
- تصاویر را بهینه کن و lazy loading را برای تصاویر خارج از صفحه در نظر بگیر.
- Core Web Vitals و عملکرد شبکه موبایل را اندازه‌گیری کن.

### ممیزی Cloudflare: وضعیت و محدودیت

از کد کلاینت می‌توان وجود آدرس API روی دامنه `workers.dev` را تأیید کرد؛ اما این به‌تنهایی دسترسی به داشبورد Cloudflare یا اثبات پیکربندی آن نیست. در این بررسی، اطلاعات واقعی DNS، Worker source، Routes، Custom Domains، Bindings، Secrets، Logs و تنظیمات Cloudflare Pages در دسترس قرار نگرفتند. بنابراین هیچ‌کدام از این تنظیمات به‌عنوان بررسی‌شده گزارش نمی‌شوند.

برای تکمیل ممیزی Cloudflare، برای هر Worker و پروژه Pages این موارد را ثبت کن:
- نام، هدف، محیط (production/staging) و آخرین زمان انتشار.
- Route و Custom Domain متصل.
- فایل ورودی و نسخه کد منتشرشده.
- endpointها، متدها، احراز هویت و پاسخ‌های خطا.
- نام Bindingها و نوع سرویس متصل، بدون افشای مقادیر حساس.
- نام متغیرها و Secretها، بدون مقدار آن‌ها.
- سیاست CORS، محدودسازی نرخ، اعتبارسنجی ورودی، کنترل دسترسی و لاگ خطا.
- روش rollback و نسخه آخرین انتشار سالم.
- تنظیمات DNS، TLS/HTTPS و redirectها.
- ارتباط واقعی Worker با مخزن رسانه، API یا سایر سرویس‌ها.

### نقشه راه پیشنهادی بهبود

**اولویت P0 — امنیت و قابلیت انتشار**
1. بررسی مجوزها و اعتبارسنجی سمت Worker برای تمام endpointهای حساس.
2. یکپارچه‌سازی نام کلیدهای نشست و آزمایش ورود، خروج و انقضای توکن.
3. اطمینان از اینکه Release APK فقط با امضای معتبر مورد انتظار منتشر می‌شود.
4. بررسی و اصلاح مسیرهای واقعی `www` و شروع APK.
5. بررسی اینکه Service Worker کدام فایل ثبت می‌شود و جلوگیری از کش داده حساس.

**اولویت P1 — پایداری**
1. افزودن تست خودکار برای مسیرهای اصلی، ورود، API و پخش صوت.
2. اعتبارسنجی JSON و سلامت URLهای صوتی/کاورها.
3. ثبت خطاهای سمت کلاینت و Worker بدون داده شخصی یا Secret.
4. افزودن health check و هشدار برای API و انتشارهای ناموفق.
5. تکمیل مستندات Cloudflare بر پایه تنظیمات واقعی.

**اولویت P2 — تجربه کاربری و رشد**
1. بهبود دسترس‌پذیری، عملکرد موبایل و Core Web Vitals.
2. SEO فنی، sitemap و metadata برای صفحات عمومی.
3. بهبود جست‌وجو، دسته‌بندی، تاریخچه و تجربه ادامه پخش در صورت تطبیق با نیاز محصول.
4. سنجش تحلیلی با رعایت حریم خصوصی و تعریف شاخص‌های محصول.
5. تعریف چرخه انتشار نسخه وب، Worker و APK با شماره نسخه و changelog.

### چک‌لیست پیش از انتشار

- [ ] صفحه اصلی و مسیرهای ورود در وب و APK درست باز می‌شوند.
- [ ] هیچ فایل یا درخواست ضروری خطای 404 یا خطای CORS ندارد.
- [ ] ورود، خروج، نشست منقضی‌شده و دسترسی مهمان آزمایش شده‌اند.
- [ ] endpointهای حساس سمت Worker مجوز کاربر را کنترل می‌کنند.
- [ ] پخش، توقف، جست‌وجو و خطای فایل صوتی آزمایش شده‌اند.
- [ ] کش قدیمی پس از به‌روزرسانی، نسخه جدید را مسدود نمی‌کند.
- [ ] Debug و Release build موفق‌اند و امضای Release تأیید شده است.
- [ ] مقادیر Secret در کد، README و logها وجود ندارند.
- [ ] تنظیمات DNS، Worker Routes و Pages با انتشار مورد انتظار تطبیق دارند.
- [ ] نسخه پشتیبان و روش rollback مشخص است.

### جمع‌بندی ممیزی

NightCast در حال حاضر یک ساختار وب استاتیک با تجربه پادکست، کلاینت API، قابلیت PWA و مسیر ساخت APK اندروید دارد. مهم‌ترین مواردی که باید پیش از توسعه قابلیت‌های جدید بررسی شوند، همسان‌سازی مسیرهای وب و APK، مدیریت واحد نشست، سیاست کش، تکرارپذیری Build و تأیید امنیت واقعی API/Worker هستند. بخش Cloudflare تا زمان بررسی تنظیمات و کد منتشرشده، **ممیزی‌نشده** محسوب می‌شود؛ این محدودیت باید حفظ شود تا مستندات، واقعیت را از فرض جدا کند.
