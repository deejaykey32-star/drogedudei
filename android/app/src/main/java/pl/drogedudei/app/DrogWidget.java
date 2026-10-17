package pl.drogedudei.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Widżet DrogEduDei: seria dni, minuty nauki dziś i „pytanie dnia” TAK/NIE z wyjaśnieniem.
 * Odpowiedzi trafiają do aplikacji (consumeAnswers) i dają XP.
 */
public class DrogWidget extends AppWidgetProvider {
    static final String ACTION_YES = "pl.drogedudei.app.WIDGET_YES";
    static final String ACTION_NO = "pl.drogedudei.app.WIDGET_NO";
    static final String ACTION_NEXT = "pl.drogedudei.app.WIDGET_NEXT";

    // Pytania zapasowe – gdy aplikacja nie była jeszcze uruchomiona.
    private static final String[][] FALLBACK = {
        {"Czy przed znakiem STOP przy pustej drodze możesz tylko zwolnić?", "0", "Zatrzymanie przed znakiem STOP jest bezwzględnie obowiązkowe."},
        {"Czy musisz ustąpić pierwszeństwa pieszemu wchodzącemu na przejście?", "1", "Ustępujesz pieszemu na przejściu i wchodzącemu na nie."},
        {"Czy znak B-21 zabrania zawracania?", "0", "B-21 zakazuje skrętu w lewo. Zawracania zakazuje B-23."},
    };

    public static void updateAll(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] ids = m.getAppWidgetIds(new ComponentName(ctx, DrogWidget.class));
        for (int id : ids) update(ctx, m, id);
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) update(ctx, m, id);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        String a = intent.getAction();
        if (a == null) return;
        SharedPreferences p = ctx.getSharedPreferences(WidgetBridgePlugin.PREFS, Context.MODE_PRIVATE);
        if (ACTION_YES.equals(a) || ACTION_NO.equals(a)) {
            if (p.getBoolean("answered", false)) return;
            String[] q = currentQuestion(ctx);
            boolean answerYes = ACTION_YES.equals(a);
            boolean ok = answerYes == "1".equals(q[1]);
            p.edit()
                .putBoolean("answered", true)
                .putBoolean("lastOk", ok)
                .putInt("pendingTotal", p.getInt("pendingTotal", 0) + 1)
                .putInt("pendingCorrect", p.getInt("pendingCorrect", 0) + (ok ? 1 : 0))
                .apply();
            updateAll(ctx);
        } else if (ACTION_NEXT.equals(a)) {
            p.edit().putInt("idx", p.getInt("idx", 0) + 1).putBoolean("answered", false).apply();
            updateAll(ctx);
        }
    }

    /** Zwraca [pytanie, "1"/"0", wyjaśnienie]. */
    static String[] currentQuestion(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(WidgetBridgePlugin.PREFS, Context.MODE_PRIVATE);
        int idx = p.getInt("idx", 0);
        try {
            JSONObject st = new JSONObject(p.getString("state", "{}"));
            JSONArray qs = st.optJSONArray("questions");
            if (qs != null && qs.length() > 0) {
                JSONObject q = qs.getJSONObject(Math.abs(idx) % qs.length());
                return new String[]{q.optString("q"), q.optBoolean("c") ? "1" : "0", q.optString("e")};
            }
        } catch (Exception ignored) { }
        return FALLBACK[Math.abs(idx) % FALLBACK.length];
    }

    static void update(Context ctx, AppWidgetManager m, int id) {
        SharedPreferences p = ctx.getSharedPreferences(WidgetBridgePlugin.PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_drog);
        int streak = 0, min = 0, goal = 20;
        String cat = "B";
        try {
            JSONObject st = new JSONObject(p.getString("state", "{}"));
            streak = st.optInt("streak", 0);
            min = st.optInt("min", 0);
            goal = Math.max(1, st.optInt("goal", 20));
            cat = st.optString("cat", "B");
        } catch (Exception ignored) { }
        v.setTextViewText(R.id.w_stats, "🔥 " + streak + "   ⏱️ " + min + "/" + goal + " min   🪪 " + cat);
        v.setProgressBar(R.id.w_progress, goal, Math.min(goal, min), false);

        String[] q = currentQuestion(ctx);
        v.setTextViewText(R.id.w_question, q[0]);
        boolean answered = p.getBoolean("answered", false);
        if (answered) {
            boolean ok = p.getBoolean("lastOk", false);
            String correct = "1".equals(q[1]) ? "TAK" : "NIE";
            v.setTextViewText(R.id.w_feedback, (ok ? "✅ Dobrze! +3 XP. " : "❌ Niestety – poprawnie: " + correct + ". ") + q[2]);
            v.setViewVisibility(R.id.w_feedback, View.VISIBLE);
            v.setViewVisibility(R.id.w_answers, View.GONE);
            v.setViewVisibility(R.id.w_next, View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.w_feedback, View.GONE);
            v.setViewVisibility(R.id.w_answers, View.VISIBLE);
            v.setViewVisibility(R.id.w_next, View.GONE);
        }
        v.setOnClickPendingIntent(R.id.w_yes, broadcast(ctx, ACTION_YES, 1));
        v.setOnClickPendingIntent(R.id.w_no, broadcast(ctx, ACTION_NO, 2));
        v.setOnClickPendingIntent(R.id.w_next, broadcast(ctx, ACTION_NEXT, 3));
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 10, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_open, pi);
        v.setOnClickPendingIntent(R.id.w_title, pi);
        m.updateAppWidget(id, v);
    }

    private static PendingIntent broadcast(Context ctx, String action, int code) {
        Intent i = new Intent(ctx, DrogWidget.class);
        i.setAction(action);
        return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
