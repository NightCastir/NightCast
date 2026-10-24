package ir.nightcast.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import java.util.Calendar;

public class NightCastQuizCountdownReceiver extends BroadcastReceiver {
    static final String CHANNEL_ID = "nightcast_daily_quiz";
    static final int NOTIFICATION_ID = 7323;

    @Override
    public void onReceive(Context context, Intent intent) {
        boolean enabled = context.getSharedPreferences("nightcast_notifications", Context.MODE_PRIVATE)
                .getBoolean("quiz_countdown_enabled", false);
        if (!enabled) return;
        createChannel(context);
        Calendar now = Calendar.getInstance();
        Calendar midnight = (Calendar) now.clone();
        midnight.add(Calendar.DAY_OF_YEAR, 1);
        midnight.set(Calendar.HOUR_OF_DAY, 0);
        midnight.set(Calendar.MINUTE, 0);
        midnight.set(Calendar.SECOND, 0);
        midnight.set(Calendar.MILLISECOND, 0);
        long left = Math.max(0, midnight.getTimeInMillis() - now.getTimeInMillis());
        long hours = left / 3600000L;
        long minutes = (left % 3600000L) / 60000L;
        long seconds = (left % 60000L) / 1000L;
        String time = String.format(java.util.Locale.ROOT, "%02d:%02d:%02d", hours, minutes, seconds);
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent content = open == null ? null : PendingIntent.getActivity(context, 7324, open,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(context.getApplicationInfo().icon)
                .setContentTitle("🎁 سؤال روز NightCast")
                .setContentText("زمان باقی‌مانده تا پایان فرصت: " + time)
                .setStyle(new NotificationCompat.BigTextStyle().bigText("فرصت پاسخ به سؤال روز تا نیمه‌شب باقی است.\n⏳ " + time))
                .setContentIntent(content)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setColor(0xFF8B5CF6)
                .setAutoCancel(false)
                .build();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(NOTIFICATION_ID, notification);

        android.app.AlarmManager alarms = (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent next = new Intent(context, NightCastQuizCountdownReceiver.class);
        PendingIntent pending = PendingIntent.getBroadcast(context, 7322, next,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        if (alarms != null) {
            long nextMinute = (System.currentTimeMillis() / 60000L + 1L) * 60000L;
            if (Build.VERSION.SDK_INT >= 23) alarms.setAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, nextMinute, pending);
            else alarms.set(android.app.AlarmManager.RTC_WAKEUP, nextMinute, pending);
        }
    }

    private static void createChannel(Context context) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.createNotificationChannel(new NotificationChannel(
                    CHANNEL_ID, "یادآور سؤال روز NightCast", NotificationManager.IMPORTANCE_LOW));
        }
    }
}