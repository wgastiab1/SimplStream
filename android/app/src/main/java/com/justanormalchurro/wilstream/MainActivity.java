package com.justanormalchurro.wilstream;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    private static boolean isAdBlockEnabled = false;
    private static final Set<String> BLACKLIST = new HashSet<>(Arrays.asList(
        "doubleclick.net", "google-analytics.com", "googlesyndication.com",
        "popads.net", "adnxs.com", "taboola.com", "outbrain.com",
        "scorecardresearch.com", "openx.net", "mads.amazon.com",
        "pubmatic.com", "revcontent.com", "onclickads.net",
        "propellerads.com", "exoclick.com", "ero-advertising.com",
        "juicyads.com", "plugrush.com", "dynamic-yield.com",
        "fast-ads.net", "ad-delivery.net", "a-ads.com", "adform.net",
        "adservice.google.com", "popcash.net", "yllix.com",
        "histats.com", "jnbhi.com", "adsco.re", "dtiserv2.com",
        "onclickperform.com", "creative-serving.com",
        // Expanded popup/redirect blocklist
        "popunder.net", "redirect.com", "tracking.com", "clickadu.com",
        "trafficfactory.biz", "adskeeper.co.uk", "adf.ly", "linkshrink.net",
        "shorte.st", "revenuemantra.com", "trafficjunky.com", "cdn77.org",
        "hilltopads.net", "mgid.com", "zedo.com", "serving-sys.com",
        "admixcloud.com", "popchicago.com", "adtng.com", "adhigh.net",
        "coinhive.com", "coin-hive.com", "hive.mindfultalks.com",
        "realsrv.com", "youporn-trk.com", "ad.stickyadstv.com",
        "ads.trafficjunky.net", "phncdn.com", "ptrking.com",
        "pornhub.net", "traffic-media.co", "trafficback.com"
    ));

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(AdBlockerPlugin.class);
        enableImmersiveMode();
        setupAdBlocker();
    }

    private void setupAdBlocker() {
        WebView webView = this.bridge.getWebView();

        webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (isAdBlockEnabled) {
                    String url = request.getUrl().toString();
                    for (String domain : BLACKLIST) {
                        if (url.contains(domain)) {
                            return new WebResourceResponse("text/plain", "utf-8", 
                                new ByteArrayInputStream("".getBytes()));
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Block navigation to known ad/popup domains
                if (request != null && request.getUrl() != null) {
                    String url = request.getUrl().toString();
                    for (String domain : BLACKLIST) {
                        if (url.contains(domain)) {
                            return true; // Block navigation
                        }
                    }
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }

    @CapacitorPlugin(name = "AdBlocker")
    public static class AdBlockerPlugin extends Plugin {
        @PluginMethod
        public void setEnabled(PluginCall call) {
            isAdBlockEnabled = call.getBoolean("enabled", false);
            JSObject ret = new JSObject();
            ret.put("status", isAdBlockEnabled);
            call.resolve(ret);
        }

        @PluginMethod
        public void setImmersive(PluginCall call) {
            boolean immersive = call.getBoolean("immersive", false);
            bridge.executeOnMainThread(() -> {
                MainActivity activity = (MainActivity) getActivity();
                if (immersive) {
                    activity.enableImmersiveMode();
                } else {
                    activity.disableImmersiveMode();
                }
                call.resolve();
            });
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveMode();
        }
    }

    private void enableImmersiveMode() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            android.view.WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        }
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    private void disableImmersiveMode() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            android.view.WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.show(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars());
            }
        }
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override
    public void onBackPressed() {
        // Enviar evento personalizado a JS para que App.tsx lo maneje
        getBridge().triggerWindowJSEvent("nativeBackButton");
    }
}
