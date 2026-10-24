package ir.nightcast.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "NightCastNotifications", permissions = {
    @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
})
public class NightCastNotifications extends Plugin {
    @Override public void load() {
        super.load();
        Constraints constraints = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        PeriodicWorkRequest work = new PeriodicWorkRequest.Builder(NightCastPodcastWorker.class, 15, TimeUnit.MINUTES)
            .setConstraints(constraints).build();
        WorkManager.getInstance(getContext()).enqueueUniquePeriodicWork(
            "nightcast-new-podcast-notifications", ExistingPeriodicWorkPolicy.KEEP, work);
    }

    @PluginMethod public void requestNotificationsPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationPermissionOnlyCallback");
            return;
        }
        call.resolve();
    }

    @PermissionCallback private void notificationPermissionOnlyCallback(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) call.resolve();
        else call.reject("Notification permission was not granted.");
    }

    @PluginMethod public void setQuizCountdown(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
            return;
        }
        updateCountdown(call.getBoolean("enabled", false));
        call.resolve();
    }

    @PermissionCallback private void notificationPermissionCallback(PluginCall call) {
        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            updateCountdown(call.getBoolean("enabled", false));
            call.resolve();
        } else call.reject("Notification permission was not granted.");
    }

    private void updateCountdown(boolean enabled) {
        Context context = getContext();
        context.getSharedPreferences("nightcast_notifications", Context.MODE_PRIVATE)
            .edit().putBoolean("quiz_countdown_enabled", enabled).apply();
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, NightCastQuizCountdownReceiver.class);
        PendingIntent pending = PendingIntent.getBroadcast(context, 7322, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        if (alarm == null) return;
        if (!enabled) {
            alarm.cancel(pending);
            android.app.NotificationManager manager = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.cancel(NightCastQuizCountdownReceiver.NOTIFICATION_ID);
            return;
        }
        long next = (System.currentTimeMillis() / 60000L + 1L) * 60000L;
        if (Build.VERSION.SDK_INT >= 23) alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pending);
        else alarm.set(AlarmManager.RTC_WAKEUP, next, pending);
        context.sendBroadcast(new Intent(context, NightCastQuizCountdownReceiver.class));
    }
}