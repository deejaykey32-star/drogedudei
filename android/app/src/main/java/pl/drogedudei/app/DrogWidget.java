package pl.drogedudei.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Nowoczesny widżet DrogEduDei na pulpit:
 *  - Kurak w czapce szofera z logo,
 *  - Pytania dnia TAK/NIE z oficjalnych zasad ruchu drogowego,
 *  - Wyjaśnienia przepisów, punktacja +3 XP,
 *  - Seria dni, minuty nauki dziś i pasek postępu,
 *  - Przycisk "Ćwicz z Kurakiem 🚦" otwierający aplikację deep-linkiem,
 *  - Automatyczna rotacja w tle przez DrogWidgetAlarm.
 */
public class DrogWidget extends AppWidgetProvider {
    public static final String ACTION_YES = "pl.drogedudei.app.WIDGET_YES";
    public static final String ACTION_NO = "pl.drogedudei.app.WIDGET_NO";
    public static final String ACTION_NEXT = "pl.drogedudei.app.WIDGET_NEXT";
    public static final String ACTION_ROTATE = DrogWidgetAlarm.ACTION_ROTATE;

    // Pytania zapasowe (gdy aplikacja jeszcze nie przekazała pełnej bazy)
    private static final String[][] FALLBACK = {
        {"Czy przed znakiem STOP przy pustej drodze możesz tylko zwolnić?", "0", "Zatrzymanie przed znakiem STOP jest bezwzględnie obowiązkowe.", "🛑", "🛑 Znak B-20"},
        {"Czy musisz ustąpić pierwszeństwa pieszemu wchodzącemu na przejście?", "1", "Ustępujesz pieszemu na przejściu oraz wchodzącemu na nie.", "🚸", "🚶 Pieszy"},
        {"Czy znak B-21 zabrania zawracania?", "0", "B-21 zakazuje skrętu w lewo. Zawracania zakazuje znak B-23.", "↩️", "🚸 Znak B-21"},
        {"Czy na skrzyżowaniu równorzędnym ustępujesz pojazdowi z prawej strony?", "1", "Reguła prawej ręki: pierwszeństwo ma pojazd nadjeżdżający z prawej.", "🚦", "🔀 Skrzyżowanie"},
        {"Czy na autostradzie dozwolone jest cofanie?", "0", "Na autostradzie i drodze ekspresowej cofanie jest surowo zabronione.", "🛣️", "⚠️ Autostrada"},
        {"Czy zielona strzałka warunkowa pozwala na skręt bez zatrzymania?", "0", "Przed sygnalizatorem S-2 z zieloną strzałką bezwzględnie się zatrzymaj.", "🟢", "🚦 Sygnalizator S-2"},
        {"Czy na rondzie bez znaków pierwszeństwa stosujesz regułę prawej ręki?", "1", "Na rondzie bez A-7 pierwszeństwo ma wjeżdżający z prawej strony.", "🔄", "🔄 Rondo"}
    };

    public static void updateAll(Context ctx) {
        if (ctx == null) return;
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        ComponentName cn = new ComponentName(ctx, DrogWidget.class);
        int[] ids = m.getAppWidgetIds(cn);
        if (ids != null) {
            for (int id : ids) update(ctx, m, id);
        }
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        if (ids != null) {
            for (int id : ids) update(ctx, m, id);
        }
        DrogWidgetAlarm.scheduleNext(ctx);
    }

    @Override
    public void onEnabled(Context ctx) {
        super.onEnabled(ctx);
        DrogWidgetAlarm.scheduleNext(ctx);
    }

    @Override
    public void onDisabled(Context ctx) {
        super.onDisabled(ctx);
        DrogWidgetAlarm.cancel(ctx);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        String a = intent != null ? intent.getAction() : null;
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
        } else if (ACTION_NEXT.equals(a) || ACTION_ROTATE.equals(a)) {
            p.edit()
                .putInt("idx", p.getInt("idx", 0) + 1)
                .putBoolean("answered", false)
                .apply();
            updateAll(ctx);
            if (ACTION_ROTATE.equals(a)) {
                DrogWidgetAlarm.scheduleNext(ctx);
            }
        } else if (Intent.ACTION_BOOT_COMPLETED.equals(a)) {
            DrogWidgetAlarm.scheduleNext(ctx);
            updateAll(ctx);
        }
    }

    /** Zwraca [pytanie, "1"/"0", wyjaśnienie, emoji, badge]. */
    static String[] currentQuestion(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(WidgetBridgePlugin.PREFS, Context.MODE_PRIVATE);
        int idx = p.getInt("idx", 0);
        try {
            JSONObject st = new JSONObject(p.getString("state", "{}"));
            JSONArray qs = st.optJSONArray("questions");
            if (qs != null && qs.length() > 0) {
                JSONObject q = qs.getJSONObject(Math.abs(idx) % qs.length());
                String question = q.optString("q");
                String c = q.optBoolean("c") ? "1" : "0";
                String exp = q.optString("e");
                String emoji = pickEmoji(question);
                String cat = st.optString("cat", "B");
                String badge = "🚦 Kat. " + cat;
                return new String[]{question, c, exp, emoji, badge};
            }
        } catch (Exception ignored) { }
        return FALLBACK[Math.abs(idx) % FALLBACK.length];
    }

    private static String pickEmoji(String q) {
        if (q == null) return "💡";
        String lower = q.toLowerCase();
        if (lower.contains("stop")) return "🛑";
        if (lower.contains("pieszy") || lower.contains("przejści")) return "🚸";
        if (lower.contains("rondo") || lower.contains("ruchu okrężnym")) return "🔄";
        if (lower.contains("prędkoś") || lower.contains("km/h")) return "⚡";
        if (lower.contains("światł") || lower.contains("sygnalizac")) return "🚦";
        if (lower.contains("autostrad") || lower.contains("ekspresow")) return "🛣️";
        if (lower.contains("parkowan") || lower.contains("postoj")) return "🅿️";
        if (lower.contains("wyprzedzan")) return "🏎️";
        if (lower.contains("alkohol") || lower.contains("badani")) return "🩺";
        if (lower.contains("hamowan") || lower.contains("droga hamowania")) return "🛑";
        return "🚗";
    }

    static void update(Context ctx, AppWidgetManager m, int id) {
        SharedPreferences p = ctx.getSharedPreferences(WidgetBridgePlugin.PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_drog);

        int streak = 0, min = 0, goal = 20, xp = 0;
        String cat = "B";
        try {
            JSONObject st = new JSONObject(p.getString("state", "{}"));
            streak = st.optInt("streak", 0);
            min = st.optInt("min", 0);
            goal = Math.max(1, st.optInt("goal", 20));
            xp = st.optInt("xp", 0);
            cat = st.optString("cat", "B");
        } catch (Exception ignored) { }

        v.setTextViewText(R.id.widget_badge, "🚦 Kat. " + cat);
        v.setTextViewText(R.id.widget_stats, "🔥 " + streak + " dni   ⏱️ " + min + "/" + goal + " min   ⭐ " + xp + " XP");

        String[] q = currentQuestion(ctx);
        v.setTextViewText(R.id.widget_question, q[0]);
        v.setTextViewText(R.id.widget_emoji, q.length > 3 ? q[3] : "🛑");

        boolean answered = p.getBoolean("answered", false);
        if (answered) {
            boolean ok = p.getBoolean("lastOk", false);
            String correct = "1".equals(q[1]) ? "TAK" : "NIE";
            String feedback = (ok ? "✅ Dobrze! +3 XP. " : "❌ Błąd (poprawnie: " + correct + "). ") + q[2];
            v.setTextViewText(R.id.widget_feedback, feedback);
            v.setViewVisibility(R.id.widget_feedback, View.VISIBLE);
            v.setViewVisibility(R.id.widget_answers, View.GONE);
            v.setViewVisibility(R.id.widget_btn_next, View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.widget_feedback, View.GONE);
            v.setViewVisibility(R.id.widget_answers, View.VISIBLE);
            v.setViewVisibility(R.id.widget_btn_next, View.GONE);
        }

        v.setOnClickPendingIntent(R.id.widget_btn_yes, broadcast(ctx, ACTION_YES, id * 10 + 1));
        v.setOnClickPendingIntent(R.id.widget_btn_no, broadcast(ctx, ACTION_NO, id * 10 + 2));
        v.setOnClickPendingIntent(R.id.widget_btn_next, broadcast(ctx, ACTION_NEXT, id * 10 + 3));
        v.setOnClickPendingIntent(R.id.widget_btn_refresh, broadcast(ctx, ACTION_NEXT, id * 10 + 4));

        // Deep link do otwarcia DrogEduDei i przejścia do ćwiczeń
        Intent open = new Intent(ctx, MainActivity.class);
        open.setAction(Intent.ACTION_VIEW);
        open.setData(Uri.parse("drogedudei://training?cat=" + cat));
        open.putExtra("extra_route", "#/trening");
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pi = PendingIntent.getActivity(ctx, id * 10 + 5, open, flags);
        v.setOnClickPendingIntent(R.id.widget_btn_practice, pi);
        v.setOnClickPendingIntent(R.id.widget_kurak_avatar, pi);
        v.setOnClickPendingIntent(R.id.widget_title, pi);
        v.setOnClickPendingIntent(R.id.widget_content_container, pi);

        m.updateAppWidget(id, v);
    }

    private static PendingIntent broadcast(Context ctx, String action, int code) {
        Intent i = new Intent(ctx, DrogWidget.class);
        i.setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(ctx, code, i, flags);
    }
}
