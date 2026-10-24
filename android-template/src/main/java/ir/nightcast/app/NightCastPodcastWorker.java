package ir.nightcast.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class NightCastPodcastWorker extends Worker {
    private static final String CHANNEL = "nightcast_new_podcasts";
    private static final String API = "https://nightcast-shield.tomasgermany2580.workers.dev/api/v1/public/podcasts?page=1&limit=5";

    public NightCastPodcastWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull @Override
    public Result doWork() {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(API).openConnection();
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Accept", "application/json");
            if (connection.getResponseCode() != 200) return Result.retry();
            StringBuilder body = new StringBuilder();
            try (InputStream in = connection.getInputStream();
                 BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) body.append(line);
            }
            JSONObject root = new JSONObject(body.toString());
            JSONArray podcasts = root.optJSONArray("podcasts");
            if (podcasts == null) podcasts = root.optJSONArray("data");
            if (podcasts == null) return Result.retry();
            long newest = 0;
            String newestTitle = "";
            String newestSlug = "";
            for (int i = 0; i < podcasts.length(); i++) {
                JSONObject podcast = podcasts.optJSONObject(i);
                if (podcast == null) continue;
                long id = podcast.optLong("id", 0);
                if (id > newest) {
                    newest = id;
                    newestTitle = podcast.optString("title", "پادکست تازه");
                    newestSlug = podcast.optString("slug", String.valueOf(id));
                }
            }
            if (newest <= 0) return Result.success();
            android.content.SharedPreferences prefs = getApplicationContext()
                    .getSharedPreferences("nightcast_notifications", Context.MODE_PRIVATE);
            long last = prefs.getLong("last_notified_podcast_id", 0);
            if (last == 0) {
                prefs.edit().putLong("last_notified_podcast_id", newest).apply();
                return Result.success();
            }
            if (newest > last) {
                showNotification(newestTitle, newestSlug, newest);
                prefs.edit().putLong("last_notified_podcast_id", newest).apply();
            }
            return Result.success();
        } catch (Exception error) {
            return Result.retry();
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private void showNotification(String title, String slug, long id) {
        Context context = getApplicationContext();
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.createNotificationChannel(new NotificationChannel(
                    CHANNEL, "پادکست‌های تازه NightCast", NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent pending = launch == null ? null : PendingIntent.getActivity(context, (int) (7400 + id % 10000), launch,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        NotificationCompat.Builder notification = new NotificationCompat.Builder(context, CHANNEL)
                .setSmallIcon(context.getApplicationInfo().icon)
                .setContentTitle("🎧 پادکست تازه در NightCast")
                .setContentText(title)
                .setStyle(new NotificationCompat.BigTextStyle().bigText("اپیزود تازه «" + title + "» منتشر شده است. برای شنیدن آن وارد NightCast شو."))
                .setContentIntent(pending)
                .setAutoCancel(true)
                .setColor(0xFF06B6D4)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify((int) (7400 + id % 10000), notification.build());
    }
}