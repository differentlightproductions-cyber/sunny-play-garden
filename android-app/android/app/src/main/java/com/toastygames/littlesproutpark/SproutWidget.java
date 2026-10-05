package com.toastygames.littlesproutpark;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** Tap-sized mini games for a parent-added home or Samsung Flex Window widget. */
public class SproutWidget extends AppWidgetProvider {
    private static final String ACTION_TAP = "com.toastygames.littlesproutpark.WIDGET_TAP";
    private static final String[] MODES = {"care", "letters", "rain", "fruit", "color", "fish", "paintings"};
    private static final String[] NAMES = {"Pet Care", "Letter Garden", "Rain Bucket", "Fruit Splash", "Coloring Book", "Fish Tank", "My paintings"};
    private static final int[] TILES = {R.id.widget_tile_0, R.id.widget_tile_1, R.id.widget_tile_2, R.id.widget_tile_3, R.id.widget_tile_4, R.id.widget_tile_5, R.id.widget_tile_6, R.id.widget_tile_7, R.id.widget_tile_8};
    private static final int INK = Color.rgb(90, 63, 94), SKY = Color.rgb(169, 225, 243), LEAF = Color.rgb(89, 185, 110);
    private static final int[] COLORS = {0xffff6b81, 0xffffd54a, 0xff59b96e, 0xff7fd4f5, 0xff9a7be8, 0xffff9d4d};
    private static final char[] LETTERS = {'C', 'S', 'B', 'A', 'U', 'E', 'T', 'N', 'E'};
    private static final String[] WORDS = {"CAT", "SUN", "BEE"};
    private static final Paint PAINT = new Paint(Paint.ANTI_ALIAS_FLAG);

    private static String key(int id, String suffix) { return id + "." + suffix; }
    private static String today() { return new SimpleDateFormat("yyyy-M-d", Locale.US).format(new Date()); }
    private static JSONArray gallery(SharedPreferences p) { try { return new JSONArray(p.getString("gallery", "[]")); } catch (Exception e) { return new JSONArray(); } }

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) { for (int id : ids) update(context, manager, id); }
    @Override public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) { update(context, manager, id); }
    @Override public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (!ACTION_TAP.equals(intent.getAction())) return;
        int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, -1);
        if (id < 0 || AppWidgetManager.getInstance(context).getAppWidgetInfo(id) == null) return;
        String what = intent.getStringExtra("what");
        SharedPreferences p = SproutWidgetBridge.prefs(context);
        String day = today();
        SharedPreferences.Editor e = p.edit();
        if (!day.equals(p.getString("day", ""))) e.putString("day", day).putInt("appSeconds", 0).putInt("widgetSeconds", 0).putLong("lastTap", 0).apply();
        int limit = p.getInt("limitMinutes", 0), used = p.getInt("appSeconds", 0) + p.getInt("widgetSeconds", 0);
        long now = System.currentTimeMillis(), last = p.getLong("lastTap", 0);
        if (last > 0 && now >= last) used += Math.max(1, Math.min(60, (int) ((now - last) / 1000)));
        else used++;
        p.edit().putInt("widgetSeconds", Math.max(0, used - p.getInt("appSeconds", 0))).putLong("lastTap", now).apply();
        if (limit > 0 && used >= limit * 60) { update(context, AppWidgetManager.getInstance(context), id); return; }

        String mode = p.getString(key(id, "mode"), "menu");
        int round = p.getInt(key(id, "round"), 0), score = p.getInt(key(id, "score"), 0), page = p.getInt(key(id, "page"), 0);
        e = p.edit();
        if ("menu".equals(what)) {
            if ("painting-detail".equals(mode)) e.putString(key(id, "mode"), "paintings");
            else e.putString(key(id, "mode"), "menu");
        } else if ("next".equals(what)) {
            if ("paintings".equals(mode)) e.putInt(key(id, "page"), page + 1);
            else if ("painting-detail".equals(mode)) e.putInt(key(id, "selected"), p.getInt(key(id, "selected"), 0) + 1);
            else if ("color".equals(mode)) e.putInt(key(id, "page"), (page + 1) % 3);
            else e.putInt(key(id, "round"), round + 1);
        } else if (what != null && what.startsWith("tile:")) {
            int tile;
            try { tile = Integer.parseInt(what.substring(5)); } catch (NumberFormatException ex) { return; }
            if (tile < 0 || tile > 8) return;
            if ("menu".equals(mode)) {
                if (tile < MODES.length) e.putString(key(id, "mode"), MODES[tile]).putInt(key(id, "page"), 0);
            } else if ("paintings".equals(mode)) {
                JSONArray list = gallery(p);
                int pages = Math.max(1, (list.length() + 8) / 9);
                int index = Math.floorMod(page, pages) * 9 + tile;
                if (index < list.length()) e.putString(key(id, "mode"), "painting-detail").putInt(key(id, "selected"), index);
            } else if ("letters".equals(mode)) {
                String word = WORDS[Math.floorMod(round, WORDS.length)];
                int step = p.getInt(key(id, "step"), 0);
                if (LETTERS[tile] == word.charAt(step)) {
                    if (step == 2) e.putInt(key(id, "step"), 0).putInt(key(id, "round"), round + 1).putInt(key(id, "score"), score + 1);
                    else e.putInt(key(id, "step"), step + 1);
                }
            } else if ("color".equals(mode)) {
                String colorKey = key(id, "color." + page + "." + tile);
                e.putInt(colorKey, (p.getInt(colorKey, -1) + 1) % COLORS.length);
            } else if ("rain".equals(mode)) {
                if (tile % 3 == round % 3) e.putInt(key(id, "score"), score + 1).putInt(key(id, "round"), round + 1);
            } else if ("fish".equals(mode)) {
                if (tile == (round * 4 + 1) % 9) e.putInt(key(id, "score"), score + 1).putInt(key(id, "round"), round + 1);
            } else if ("fruit".equals(mode)) {
                e.putInt(key(id, "score"), score + 1).putInt(key(id, "round"), round + 1);
            } else if ("care".equals(mode)) {
                e.putInt(key(id, "score"), score + 1).putInt(key(id, "round"), round + 1);
            }
        }
        e.apply(); update(context, AppWidgetManager.getInstance(context), id);
    }

    @Override public void onDeleted(Context context, int[] ids) {
        SharedPreferences p = SproutWidgetBridge.prefs(context); SharedPreferences.Editor e = p.edit();
        for (int id : ids) for (String k : p.getAll().keySet()) if (k.startsWith(id + ".")) e.remove(k);
        e.apply();
    }

    static void updateAll(Context context) {
        AppWidgetManager m = AppWidgetManager.getInstance(context);
        for (int id : m.getAppWidgetIds(new ComponentName(context, SproutWidget.class))) update(context, m, id);
        for (int id : m.getAppWidgetIds(new ComponentName(context, SproutCoverWidget.class))) update(context, m, id);
    }
    private static PendingIntent tap(Context context, int id, String what, int request) {
        Intent i = new Intent(context, SproutWidget.class).setAction(ACTION_TAP).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id).putExtra("what", what);
        return PendingIntent.getBroadcast(context, id * 20 + request, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private static PendingIntent openApp(Context context, int id) {
        Intent i = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, id * 20 + 19, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private static void update(Context context, AppWidgetManager manager, int id) {
        SharedPreferences p = SproutWidgetBridge.prefs(context);
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.sprout_widget);
        String mode = p.getString(key(id, "mode"), "menu");
        JSONArray list = gallery(p);
        int page = p.getInt(key(id, "page"), 0), selected = p.getInt(key(id, "selected"), 0), round = p.getInt(key(id, "round"), 0), score = p.getInt(key(id, "score"), 0);
        boolean resting = p.getInt("limitMinutes", 0) > 0 && p.getInt("appSeconds", 0) + p.getInt("widgetSeconds", 0) >= p.getInt("limitMinutes", 0) * 60;
        if ("paintings".equals(mode) && list.length() > 0) page = Math.floorMod(page, (list.length() + 8) / 9);
        String title = "Sprout Park", footer = "Tap a game";
        if (resting) { title = "Rest time"; footer = "A grown-up can give more time in the app"; mode = "rest"; }
        else if ("painting-detail".equals(mode)) { JSONObject item = list.optJSONObject(Math.floorMod(selected, Math.max(1, list.length()))); title = item == null ? "My painting" : item.optString("name", "My painting"); footer = "Your colors, just as you painted them"; }
        else if ("paintings".equals(mode)) { title = "My paintings"; footer = list.length() == 0 ? "Open Coloring Book once to show your art" : "Tap one to see your own colors"; }
        else if ("letters".equals(mode)) { title = "Letter Garden"; footer = "Spell " + WORDS[Math.floorMod(round, 3)] + "  •  " + p.getInt(key(id, "step"), 0) + "/3"; }
        else if ("color".equals(mode)) { title = "Coloring Book"; footer = "Tap to color  •  Page " + (page % 3 + 1) + "/3"; }
        else if (!"menu".equals(mode)) { for (int n = 0; n < MODES.length; n++) if (MODES[n].equals(mode)) title = NAMES[n]; footer = "Happy taps: " + score; }
        rv.setTextViewText(R.id.widget_title, title); rv.setTextViewText(R.id.widget_footer, footer);
        rv.setTextViewText(R.id.widget_next, "menu".equals(mode) ? "↗" : "›");
        rv.setOnClickPendingIntent(R.id.widget_menu, tap(context, id, "menu", 10));
        rv.setOnClickPendingIntent(R.id.widget_next, "menu".equals(mode) ? openApp(context, id) : tap(context, id, "next", 11));
        boolean detail = "painting-detail".equals(mode);
        rv.setViewVisibility(R.id.widget_grid, detail ? View.GONE : View.VISIBLE);
        rv.setViewVisibility(R.id.widget_art, detail ? View.VISIBLE : View.GONE);
        if (detail) {
            JSONObject item = list.optJSONObject(Math.floorMod(selected, Math.max(1, list.length())));
            Bitmap bitmap = item == null ? null : loadPainting(context, item.optString("id"));
            rv.setImageViewBitmap(R.id.widget_art, bitmap != null ? bitmap : tile(context, "paintings", 0, 0, 0, p, id));
        } else {
            for (int n = 0; n < 9; n++) {
                Bitmap bitmap = null;
                if ("paintings".equals(mode)) {
                    JSONObject item = list.optJSONObject(page * 9 + n);
                    if (item != null) bitmap = loadPainting(context, item.optString("id"));
                }
                if (bitmap == null) bitmap = tile(context, mode, n, round, page, p, id);
                rv.setImageViewBitmap(TILES[n], bitmap);
                rv.setOnClickPendingIntent(TILES[n], "menu".equals(mode) && n == 8 ? openApp(context, id) : tap(context, id, "tile:" + n, n));
            }
        }
        manager.updateAppWidget(id, rv);
    }

    private static Bitmap loadPainting(Context context, String id) {
        if (id == null || !id.matches("[a-zA-Z0-9_-]{1,96}")) return null;
        return BitmapFactory.decodeFile(SproutWidgetBridge.imageFile(context, id).getAbsolutePath());
    }

    private static void fill(Canvas c, int color) { c.drawColor(color); }
    private static void round(Canvas c, float x, float y, float w, float h, float r, int color) { PAINT.setColor(color); PAINT.setStyle(Paint.Style.FILL); c.drawRoundRect(new RectF(x, y, x + w, y + h), r, r, PAINT); }
    private static void circle(Canvas c, float x, float y, float r, int color) { PAINT.setColor(color); PAINT.setStyle(Paint.Style.FILL); c.drawCircle(x, y, r, PAINT); }
    private static void line(Canvas c, float x, float y, float xx, float yy, int color, float width) { PAINT.setColor(color); PAINT.setStrokeWidth(width); PAINT.setStrokeCap(Paint.Cap.ROUND); PAINT.setStyle(Paint.Style.STROKE); c.drawLine(x, y, xx, yy, PAINT); PAINT.setStyle(Paint.Style.FILL); }
    private static void text(Canvas c, String value, float x, float y, float size, int color) { PAINT.setColor(color); PAINT.setTextSize(size); PAINT.setTypeface(android.graphics.Typeface.create("sans-serif-rounded", android.graphics.Typeface.BOLD)); PAINT.setTextAlign(Paint.Align.CENTER); c.drawText(value, x, y, PAINT); }
    private static Bitmap tile(Context context, String mode, int n, int round, int page, SharedPreferences p, int widgetId) {
        Bitmap b = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888); Canvas c = new Canvas(b);
        round(c, 4, 4, 88, 88, 18, 0xffffffff);
        if ("rest".equals(mode)) { moon(c); return b; }
        if ("menu".equals(mode)) {
            if (n < 7) {
                round(c, 7, 7, 82, 82, 17, new int[]{0xffffecce, 0xffffe8ed, 0xffdff2ff, 0xffffe4dc, 0xffeee3ff, 0xffd8f2ff, 0xfff9e6f3}[n]);
                symbol(c, n, 48, 40, n);
                text(c, new String[]{"PET", "LETTERS", "RAIN", "FRUIT", "COLOR", "FISH", "MY ART"}[n], 48, 82, 10, INK);
            } else if (n == 8) { sprout(c, 48, 37, LEAF); text(c, "OPEN APP", 48, 82, 9, INK); }
            return b;
        }
        if ("paintings".equals(mode)) { sprout(c, 48, 48, 0xffbfcbbf); return b; }
        if ("letters".equals(mode)) {
            round(c, 10, 10, 76, 76, 16, new int[]{0xffffe8ed, 0xffe7f5d8, 0xffe5f2ff}[n % 3]);
            text(c, String.valueOf(LETTERS[n]), 48, 63, 48, INK);
            return b;
        }
        if ("care".equals(mode)) {
            if (n == 4) pet(c, 48, 48, round % 2 == 0 ? 0xffbd8b5d : 0xffffc798);
            else if (n % 3 == 0) { circle(c, 48, 45, 23, 0xffffd54a); text(c, "♥", 48, 57, 34, 0xffff6b81); }
            else if (n % 3 == 1) { circle(c, 48, 44, 20, SKY); circle(c, 61, 30, 8, 0xff7fd4f5); circle(c, 30, 26, 6, 0xff7fd4f5); }
            else { circle(c, 48, 48, 22, 0xffff9d4d); line(c, 32, 35, 64, 61, 0xffffffff, 4); }
            return b;
        }
        if ("rain".equals(mode)) {
            fill(c, 0xffdff2ff); round(c, 4, 4, 88, 88, 18, 0xffdff2ff);
            if (n < 3) { cloud(c); if (n == round % 3) text(c, "★", 48, 82, 21, 0xffffc747); }
            else if (n < 6) { circle(c, 48, 43, 10, 0xff67b8e9); line(c, 48, 52, 44, 70, 0xff67b8e9, 7); }
            else { round(c, 21, 48, 54, 30, 7, 0xffffd54a); line(c, 24, 48, 72, 48, INK, 4); }
            return b;
        }
        if ("fruit".equals(mode)) { fruit(c, (n + round) % 4); return b; }
        if ("fish".equals(mode)) {
            round(c, 4, 4, 88, 88, 18, 0xffbde9f7);
            if (n == (round * 4 + 1) % 9) fish(c, 0xffff9d4d);
            else { circle(c, 28 + n % 3 * 12, 32, 7, 0xffffffff); line(c, 45, 77, 45, 50, LEAF, 5); circle(c, 58, 58, 9, LEAF); }
            return b;
        }
        if ("color".equals(mode)) {
            int color = p.getInt(key(widgetId, "color." + page % 3 + "." + n), -1);
            int tint = color < 0 ? 0xffffffff : COLORS[color % COLORS.length];
            round(c, 7, 7, 82, 82, 14, 0xfffffdf6);
            if (page % 3 == 0) flower(c, tint);
            else if (page % 3 == 1) fish(c, tint);
            else { sprout(c, 48, 49, tint); circle(c, 72, 22, 9, 0xffffd54a); }
            return b;
        }
        sprout(c, 48, 48, LEAF); return b;
    }

    private static void symbol(Canvas c, int kind, int x, int y, int n) {
        if (kind == 0) pet(c, x, y, 0xffbd8b5d);
        else if (kind == 1) { circle(c, x, y, 25, 0xffffffff); text(c, "A", x, y + 14, 40, INK); }
        else if (kind == 2) cloud(c);
        else if (kind == 3) fruit(c, 0);
        else if (kind == 4) flower(c, 0xffff6b81);
        else if (kind == 5) fish(c, 0xffff9d4d);
        else { round(c, 20, 14, 56, 54, 5, 0xffffffff); flower(c, 0xffff6b81); }
    }
    private static void pet(Canvas c, float x, float y, int fur) {
        circle(c, x - 21, y - 22, 14, fur); circle(c, x + 21, y - 22, 14, fur); circle(c, x, y, 29, fur);
        circle(c, x - 10, y - 2, 3, INK); circle(c, x + 10, y - 2, 3, INK); circle(c, x, y + 9, 5, 0xffff9db8);
        line(c, x - 6, y + 17, x, y + 20, INK, 2); line(c, x, y + 20, x + 6, y + 17, INK, 2);
    }
    private static void cloud(Canvas c) { circle(c, 36, 44, 18, 0xffffffff); circle(c, 54, 37, 23, 0xffffffff); circle(c, 69, 47, 15, 0xffffffff); round(c, 23, 42, 55, 20, 9, 0xffffffff); }
    private static void sprout(Canvas c, float x, float y, int leaf) { line(c, x, y + 25, x, y - 15, 0xff3f9a5a, 7); circle(c, x - 15, y - 17, 13, leaf); circle(c, x + 15, y - 26, 13, leaf); round(c, x - 27, y + 20, 54, 13, 6, 0xffb9805a); }
    private static void flower(Canvas c, int petal) { line(c, 48, 74, 48, 42, LEAF, 5); for (int i = 0; i < 6; i++) { double a = i * Math.PI / 3; circle(c, (float) (48 + Math.cos(a) * 17), (float) (36 + Math.sin(a) * 17), 10, petal); } circle(c, 48, 36, 10, 0xffffd54a); circle(c, 33, 61, 7, LEAF); }
    private static void fish(Canvas c, int body) {
        circle(c, 47, 47, 22, body);
        Path tail = new Path(); tail.moveTo(27, 47); tail.lineTo(12, 32); tail.lineTo(12, 62); tail.close(); PAINT.setColor(body); c.drawPath(tail, PAINT);
        circle(c, 56, 42, 3, INK); circle(c, 75, 22, 6, 0xffffffff);
    }
    private static void fruit(Canvas c, int type) {
        int col = new int[]{0xffff6b81, 0xffff9d4d, 0xffffd54a, 0xff9a7be8}[type];
        circle(c, 48, 52, 25, col); circle(c, 39, 45, 5, 0x66ffffff); line(c, 48, 27, 48, 17, 0xff3f9a5a, 5); circle(c, 58, 21, 9, LEAF);
    }
    private static void moon(Canvas c) { round(c, 4, 4, 88, 88, 18, 0xff3d4384); circle(c, 50, 43, 24, 0xfffff3b0); circle(c, 59, 35, 24, 0xff3d4384); text(c, "★", 26, 74, 22, 0xfffff3b0); }
}
