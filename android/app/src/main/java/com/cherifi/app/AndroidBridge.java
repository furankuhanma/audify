package com.cherifi.app;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Android Bridge for SQLite Database
 * Exposes SQL execution to WebView JavaScript
 */
public class AndroidBridge extends SQLiteOpenHelper {
    
    private static final String DATABASE_NAME = "VibeStreamOffline.db";
    private static final int DATABASE_VERSION = 1;
    private static final String TAG = "AndroidBridge";
    
    public AndroidBridge(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
        Log.d(TAG, "✅ AndroidBridge initialized");
    }
    
    @Override
    public void onCreate(SQLiteDatabase db) {
        // Tables are created by JavaScript code
        Log.d(TAG, "Database onCreate called");
    }
    
    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Handle migrations if needed
        Log.d(TAG, "Database onUpgrade called: " + oldVersion + " -> " + newVersion);
    }
    
    /**
     * Execute SQL query from JavaScript
     * This method is called from WebView
     */
    @JavascriptInterface
    public String executeSQL(String jsonRequest) {
        Log.d(TAG, "📝 Executing SQL: " + jsonRequest);
        
        try {
            JSONObject request = new JSONObject(jsonRequest);
            String query = request.getString("query");
            JSONArray paramsArray = request.optJSONArray("params");
            
            SQLiteDatabase db = this.getWritableDatabase();
            
            // Convert JSON array to String array
            String[] params = null;
            if (paramsArray != null) {
                params = new String[paramsArray.length()];
                for (int i = 0; i < paramsArray.length(); i++) {
                    params[i] = paramsArray.optString(i);
                }
            }
            
            // Check if it's a SELECT query
            if (query.trim().toUpperCase().startsWith("SELECT")) {
                String result = executeSelectQuery(db, query, params);
                Log.d(TAG, "✅ SELECT query executed successfully");
                return result;
            } else {
                String result = executeNonQuery(db, query, params);
                Log.d(TAG, "✅ Non-SELECT query executed successfully");
                return result;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ SQL execution error: " + e.getMessage());
            e.printStackTrace();
            return createErrorResponse(e.getMessage());
        }
    }
    
    /**
     * Execute SELECT query and return JSON result
     */
    private String executeSelectQuery(SQLiteDatabase db, String query, String[] params) {
        try {
            Cursor cursor = db.rawQuery(query, params);
            JSONObject result = new JSONObject();
            JSONArray rows = new JSONArray();
            
            while (cursor.moveToNext()) {
                JSONObject row = new JSONObject();
                for (int i = 0; i < cursor.getColumnCount(); i++) {
                    String columnName = cursor.getColumnName(i);
                    
                    // Handle different data types
                    int type = cursor.getType(i);
                    if (type == Cursor.FIELD_TYPE_NULL) {
                        row.put(columnName, JSONObject.NULL);
                    } else if (type == Cursor.FIELD_TYPE_INTEGER) {
                        row.put(columnName, cursor.getLong(i));
                    } else if (type == Cursor.FIELD_TYPE_FLOAT) {
                        row.put(columnName, cursor.getDouble(i));
                    } else {
                        row.put(columnName, cursor.getString(i));
                    }
                }
                rows.put(row);
            }
            
            cursor.close();
            result.put("rows", rows);
            result.put("success", true);
            
            Log.d(TAG, "📊 SELECT returned " + rows.length() + " rows");
            return result.toString();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ SELECT query error: " + e.getMessage());
            e.printStackTrace();
            return createErrorResponse(e.getMessage());
        }
    }
    
    /**
     * Execute INSERT, UPDATE, DELETE queries
     */
    private String executeNonQuery(SQLiteDatabase db, String query, String[] params) {
        try {
            if (params != null && params.length > 0) {
                db.execSQL(query, params);
            } else {
                db.execSQL(query);
            }
            
            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("rowsAffected", 1);
            
            return result.toString();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Non-SELECT query error: " + e.getMessage());
            e.printStackTrace();
            return createErrorResponse(e.getMessage());
        }
    }
    
    /**
     * Create error response JSON
     */
    private String createErrorResponse(String message) {
        try {
            JSONObject error = new JSONObject();
            error.put("success", false);
            error.put("error", message);
            return error.toString();
        } catch (Exception e) {
            return "{\"success\":false,\"error\":\"Unknown error\"}";
        }
    }
}