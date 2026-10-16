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
