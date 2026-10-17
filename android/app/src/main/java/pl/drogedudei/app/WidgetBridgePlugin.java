package pl.drogedudei.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.speech.tts.TextToSpeech;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.util.Locale;

/**
 * Most między aplikacją webową a Androidem:
 *  - setState: zapis stanu (seria dni, minuty, pytania dnia) dla widżetu i jego odświeżenie,
 *  - consumeAnswers: odczyt (i wyzerowanie) liczby dobrych odpowiedzi udzielonych w widżecie,
 *  - speak / stop: lektor Google (TextToSpeech, język polski),
 *  - setSystemBars: jasne/ciemne ikony pasków systemowych zgodnie z motywem aplikacji.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    public static final String PREFS = "drogedudei_widget";
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private boolean ttsInitDone = false;
    // Tekst zlecony przed zakończeniem inicjalizacji TTS (np. tuż po starcie aplikacji).
    private PluginCall pendingSpeak;

    @Override
    public void load() {
        tts = new TextToSpeech(getContext(), status -> {
            if (status == TextToSpeech.SUCCESS) {
                int r = tts.setLanguage(new Locale("pl", "PL"));
                ttsReady = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
            }
            PluginCall c;
            synchronized (this) { ttsInitDone = true; c = pendingSpeak; pendingSpeak = null; }
            if (c != null) doSpeak(c);
        });
    }

    @PluginMethod
    public void setState(PluginCall call) {
        String json = call.getString("json", "{}");
        Context ctx = getContext();
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor ed = p.edit().putString("state", json);
        // Nowy dzień = nowy zestaw pytań: zacznij od pierwszego, bez wczorajszej odpowiedzi.
        String date = "";
        try { date = new JSONObject(json).optString("date", ""); } catch (Exception ignored) { }
        if (!date.isEmpty() && !date.equals(p.getString("qDate", ""))) {
            ed.putString("qDate", date).putInt("idx", 0).putBoolean("answered", false);
        }
        ed.apply();
        DrogWidget.updateAll(ctx);
        call.resolve();
    }

    @PluginMethod
    public void consumeAnswers(PluginCall call) {
        SharedPreferences p = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSObject ret = new JSObject();
        ret.put("correct", p.getInt("pendingCorrect", 0));
        ret.put("total", p.getInt("pendingTotal", 0));
        p.edit().putInt("pendingCorrect", 0).putInt("pendingTotal", 0).apply();
        call.resolve(ret);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        synchronized (this) {
            if (!ttsInitDone) {
                if (pendingSpeak != null) pendingSpeak.resolve(); // zastąpiony nowszym tekstem
                pendingSpeak = call;
                return;
            }
        }
        doSpeak(call);
    }

    private void doSpeak(PluginCall call) {
        String text = call.getString("text", "");
        if (tts != null && ttsReady) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "drogedudei");
            call.resolve();
        } else {
            call.reject("Lektor (TTS) niedostępny – zainstaluj polski głos w ustawieniach Androida.");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        synchronized (this) { if (pendingSpeak != null) { pendingSpeak.resolve(); pendingSpeak = null; } }
        if (tts != null) tts.stop();
        call.resolve();
    }

    @PluginMethod
    public void setSystemBars(PluginCall call) {
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        getActivity().runOnUiThread(() -> {
            Window w = getActivity().getWindow();
            WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, w.getDecorView());
            c.setAppearanceLightStatusBars(!dark);
            c.setAppearanceLightNavigationBars(!dark);
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
    }
}
