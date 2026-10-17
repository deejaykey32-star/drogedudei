package pl.drogedudei.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class); // widżet + lektor Google
        super.onCreate(savedInstanceState);
        handleWidgetIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetIntent(intent);
    }

    private void handleWidgetIntent(Intent intent) {
        if (intent == null) return;
        String route = intent.getStringExtra("extra_route");
        if ((route == null || route.isEmpty()) && intent.getData() != null) {
            Uri data = intent.getData();
            String host = data.getHost();
            if ("training".equals(host)) route = "#/trening";
            else if ("practice".equals(host)) route = "#/praktyka";
            else if ("exam".equals(host)) route = "#/egzamin";
            else if (host != null && !host.isEmpty()) route = "#/" + host;
        }

        if (route != null && !route.isEmpty()) {
            final String targetRoute = route;
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().postDelayed(() -> {
                    String js = "window.location.hash = '" + targetRoute.replace("'", "\\'") + "';";
                    getBridge().getWebView().evaluateJavascript(js, null);
                }, 400);
            }
        }
    }
}
