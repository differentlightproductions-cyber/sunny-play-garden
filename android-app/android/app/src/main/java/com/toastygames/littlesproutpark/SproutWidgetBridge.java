package com.toastygames.littlesproutpark;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

// Only local, app-private previews cross this bridge. Voice recordings and cloud
// backup data never reach the widget or the Android launcher.
@CapacitorPlugin(name = "SproutWidget")
public class SproutWidgetBridge extends Plugin {
    static final String PREFS = "sprout_widget";
    static SharedPreferences prefs(Context context) { return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    static File imageFile(Context context, String id) { return new File(context.getFilesDir(), "widget-paint-" + id + ".png"); }
    private static boolean validId(String id) { return id != null && id.matches("[a-zA-Z0-9_-]{1,96}"); }

    @PluginMethod
    public void savePainting(PluginCall call) {
        String id = call.getString("id"), png = call.getString("png");
        if (!validId(id) || png == null || !png.startsWith("data:image/png;base64,")) { call.reject("Invalid painting"); return; }
        try {
            byte[] bytes = Base64.decode(png.substring("data:image/png;base64,".length()), Base64.DEFAULT);
            if (bytes.length > 512000 || bytes.length < 24) { call.reject("Painting size out of range"); return; }
            try (FileOutputStream out = new FileOutputStream(imageFile(getContext(), id))) { out.write(bytes); }
            call.resolve();
        } catch (Exception e) { call.reject("Could not save painting preview"); }
    }

    @PluginMethod
    public void setGallery(PluginCall call) {
        JSArray items = call.getArray("items");
        if (items == null || items.length() > 200) { call.reject("Invalid gallery"); return; }
        try {
            JSONArray clean = new JSONArray(); Set<String> keep = new HashSet<>();
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                String id = item.optString("id"), name = item.optString("name", "Painting");
                if (!validId(id) || !imageFile(getContext(), id).isFile()) continue;
                clean.put(new JSONObject().put("id", id).put("name", name.substring(0, Math.min(40, name.length()))));
                keep.add("widget-paint-" + id + ".png");
            }
            prefs(getContext()).edit().putString("gallery", clean.toString()).apply();
            File[] files = getContext().getFilesDir().listFiles();
            if (files != null) for (File file : files) if (file.getName().startsWith("widget-paint-") && !keep.contains(file.getName())) file.delete();
            SproutWidget.updateAll(getContext());
            call.resolve();
        } catch (Exception e) { call.reject("Could not update painting gallery"); }
    }

    @PluginMethod
    public void consumeWidgetTime(PluginCall call) {
        String day = call.getString("day", ""); SharedPreferences p = prefs(getContext());
        int seconds = day.equals(p.getString("day", "")) ? p.getInt("widgetSeconds", 0) : 0;
        p.edit().putInt("widgetSeconds", 0).putLong("lastTap", 0L).apply();
        JSObject result = new JSObject(); result.put("seconds", seconds); call.resolve(result);
    }

    @PluginMethod
    public void syncTimer(PluginCall call) {
        String day = call.getString("day", "");
        int seconds = Math.max(0, call.getInt("seconds", 0));
        int limit = Math.max(0, call.getInt("limitMinutes", 0));
        SharedPreferences p = prefs(getContext());
        SharedPreferences.Editor edit = p.edit();
        if (!day.equals(p.getString("day", ""))) edit.putInt("widgetSeconds", 0).putLong("lastTap", 0L);
        edit.putString("day", day).putInt("appSeconds", seconds).putInt("limitMinutes", limit).apply();
        SproutWidget.updateAll(getContext());
        call.resolve();
    }
}
