package com.cherifi.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

}

// Inside your Activity class
private void fetchData() {
    Retrofit retrofit = new Retrofit.Builder()
            .baseUrl("https://frank-loui-lapore-hp-probook-640-g1.tail11c2e9.ts.net/") // Must end with /
            .addConverterFactory(GsonConverterFactory.create())
            .build();

    ApiService apiService = retrofit.create(ApiService.class);

    // 2. Make the Actual Call
    apiService.getData().enqueue(new retrofit2.Callback<List<Object>>() {
        @Override
        public void onResponse(Call<List<Object>> call, retrofit2.Response<List<Object>> response) {
            if (response.isSuccessful() && response.body() != null) {
                List<Object> data = response.body();
                // SUCCESS! Your data is now in the 'data' list
                android.util.Log.d("API_SUCCESS", "Items received: " + data.size());
            } else {
                android.util.Log.e("API_ERROR", "Response code: " + response.code());
            }
        }

        @Override
        public void onFailure(Call<List<Object>> call, Throwable t) {
            // This happens if the Tailscale address isn't reachable or the server is down
            android.util.Log.e("API_FAILURE", "Error: " + t.getMessage());
        }
    });
}