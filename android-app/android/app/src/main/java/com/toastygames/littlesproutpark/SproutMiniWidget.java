package com.toastygames.littlesproutpark;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.net.Uri;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Tiny tap games (fruit popping, letters, counting, memory pairs) on a home screen or a Samsung Flip cover screen.
 * A grown-up adds it from the widget list; it needs no permissions, never goes online and never touches the child's saved data.
 * It also stops for the day (shows the moon) when the game's own daily play limit has been reached.
 */
public class SproutMiniWidget extends AppWidgetProvider {
    static final String ACTION_TAP = "com.toastygames.littlesproutpark.MINI_TAP";
    private static final String PREFS = "sprout_mini_widget";
    private static final int[] TILES = {R.id.sm_t0, R.id.sm_t1, R.id.sm_t2, R.id.sm_t3, R.id.sm_t4, R.id.sm_t5, R.id.sm_t6, R.id.sm_t7,
        R.id.sm_t8, R.id.sm_t9, R.id.sm_t10, R.id.sm_t11, R.id.sm_t12, R.id.sm_t13, R.id.sm_t14, R.id.sm_t15};
    private static final int MAX_SIDE = 480;   // the picture is small on purpose: widgets are sent across processes

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    static String today() { return new SimpleDateFormat("yyyy-M-d", Locale.US).format(new Date()); }

    @Override public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) { for (int id : ids) update(ctx, mgr, id, getClass()); }
    @Override public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager mgr, int id, Bundle o) { update(ctx, mgr, id, getClass()); }
    @Override public void onDeleted(Context ctx, int[] ids) { SharedPreferences.Editor e = prefs(ctx).edit(); for (int id : ids) e.remove("s" + id); e.apply(); }

    @Override public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        if (intent == null || !ACTION_TAP.equals(intent.getAction())) return;
        int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        int tile = intent.getIntExtra("tile", -1);
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        if (id == AppWidgetManager.INVALID_APPWIDGET_ID || tile < 0 || tile > 15 || mgr.getAppWidgetInfo(id) == null) return;
        if (!resting(ctx)) {
            MiniGames.S s = MiniGames.S.parse(prefs(ctx).getString("s" + id, ""));
            boolean[] open = new boolean[1];
            MiniGames.tap(s, tile, open);
            prefs(ctx).edit().putString("s" + id, s.dump()).apply();
            if (open[0]) {
                Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
                if (launch != null) { launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); try { ctx.startActivity(launch); } catch (Exception ignored) { /* the widget stays as it is */ } }
            }
        }
        update(ctx, mgr, id, getClass());
    }

    /** True once the app has said today's play time is used up. */
    static boolean resting(Context ctx) { return today().equals(prefs(ctx).getString("rest", "")); }

    /** Redraw every widget of this app (used when the rest state changes). */
    static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        for (Class<?> cls : new Class<?>[] {SproutMiniWidget.class, SproutCoverWidget.class})
            for (int id : mgr.getAppWidgetIds(new ComponentName(ctx, cls))) update(ctx, mgr, id, cls);
    }

    static void update(Context ctx, AppWidgetManager mgr, int id, Class<?> cls) {
        DisplayMetrics dm = ctx.getResources().getDisplayMetrics();
        Bundle o = mgr.getAppWidgetOptions(id);
        int wDp = Math.max(o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0), o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0));
        int hDp = Math.max(o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0), o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0));
        if (wDp <= 0) wDp = 180; if (hDp <= 0) hDp = 180;
        float w = wDp * dm.density, h = hDp * dm.density, k = Math.min(1f, MAX_SIDE / Math.max(w, h));
        int bw = Math.max(64, Math.round(w * k)), bh = Math.max(64, Math.round(h * k));
        Bitmap bmp = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
        MiniGames.S s = MiniGames.S.parse(prefs(ctx).getString("s" + id, ""));
        MiniGames.draw(new Canvas(bmp), bw, bh, s, resting(ctx));
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.sprout_mini);
        rv.setImageViewBitmap(R.id.sm_img, bmp);
        for (int t = 0; t < 16; t++) {
            Intent i = new Intent(ctx, cls).setAction(ACTION_TAP).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id).putExtra("tile", t)
                .setData(Uri.parse("sproutmini://" + id + "/" + t));
            rv.setOnClickPendingIntent(TILES[t], PendingIntent.getBroadcast(ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        mgr.updateAppWidget(id, rv);
    }
}
