package com.cherifi.app; // This MUST match your project package

import java.util.List;
import retrofit2.Call;
import retrofit2.http.GET;

public interface ApiService {
    @GET("/")
    Call<List<Object>> getData();
}