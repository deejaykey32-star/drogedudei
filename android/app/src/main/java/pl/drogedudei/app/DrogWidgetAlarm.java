package pl.drogedudei.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;

/**
 * Cykliczne odświeżanie pytania w widżecie na pulpicie (co 15 minut).
 */
public class DrogWidgetAlarm {
    public static final String ACTION_ROTATE = "pl.drogedudei.app.WIDGET_ROTATE";
    public static final long ROTATION_INTERVAL_MS = 15 * 60 * 1000L;
    private static final int ALARM_REQUEST_CODE = 8092;

    public static void scheduleNext(Context context) {
        if (context == null) return;
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, DrogWidget.class);
        intent.setAction(ACTION_ROTATE);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pi = PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags);
        long triggerAt = SystemClock.elapsedRealtime() + ROTATION_INTERVAL_MS;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME, triggerAt, pi);
            } else {
                am.set(AlarmManager.ELAPSED_REALTIME, triggerAt, pi);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void cancel(Context context) {
        if (context == null) return;
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, DrogWidget.class);
        intent.setAction(ACTION_ROTATE);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pi = PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags);
        try {
            am.cancel(pi);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
