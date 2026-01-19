package com.cherifi.app;

import android.os.Bundle;
import android.util.Log;
import androidx.core.splashscreen.SplashScreen; // Import required for modern splash
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

        // 2. Trigger the network call
        fetchData();
    }

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