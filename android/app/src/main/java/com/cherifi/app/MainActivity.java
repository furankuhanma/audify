package com.cherifi.app;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. Handle the splash screen transition BEFORE super.onCreate
        SplashScreen.installSplashScreen(this);

        super.onCreate(savedInstanceState);

        // 2. Configure WebView for audio playback (NEW)
        configureWebViewForAudio();

        // 3. Trigger the network call (EXISTING - UNCHANGED)
        fetchData();
    }

    /**
     * Configure WebView settings for audio playback
     * This fixes audio not playing in the app
     */
    private void configureWebViewForAudio() {
        try {
            // Get the Capacitor WebView
            WebView webView = getBridge().getWebView();
            
            if (webView != null) {
                WebSettings webSettings = webView.getSettings();
                
                // Enable media playback without user gesture
                webSettings.setMediaPlaybackRequiresUserGesture(false);
                
                // Enable file access for offline audio
                webSettings.setAllowFileAccess(true);
                webSettings.setAllowContentAccess(true);
                
                // Enable mixed content (HTTP + HTTPS) for Android 5.0+
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                }
                
                // Enable DOM storage (needed for some audio libraries)
                webSettings.setDomStorageEnabled(true);
                
                // Enable JavaScript (should already be enabled by Capacitor, but just in case)
                webSettings.setJavaScriptEnabled(true);
                
                // Add SQLite bridge for offline storage
                AndroidBridge androidBridge = new AndroidBridge(this);
                webView.addJavascriptInterface(androidBridge, "AndroidBridge");
                
                Log.d("AUDIO_CONFIG", "✅ WebView configured for audio playback");
                Log.d("AUDIO_CONFIG", "✅ SQLite bridge registered");
            } else {
                Log.e("AUDIO_CONFIG", "❌ WebView is null - cannot configure");
            }
        } catch (Exception e) {
            Log.e("AUDIO_CONFIG", "❌ Error configuring WebView: " + e.getMessage());
        }
    }

    /**
     * Fetch data from API (EXISTING - UNCHANGED)
     */
    private void fetchData() {
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("https://frank-loui-lapore-hp-probook-640-g1.tail11c2e9.ts.net/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        ApiService apiService = retrofit.create(ApiService.class);

        apiService.getData().enqueue(new Callback<List<Object>>() {
            @Override
            public void onResponse(Call<List<Object>> call, Response<List<Object>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Object> data = response.body();
                    Log.d("API_SUCCESS", "Items received: " + data.size());
                } else {
                    Log.e("API_ERROR", "Response code: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<List<Object>> call, Throwable t) {
                Log.e("API_FAILURE", "Error: " + t.getMessage());
            }
        });
    }
}