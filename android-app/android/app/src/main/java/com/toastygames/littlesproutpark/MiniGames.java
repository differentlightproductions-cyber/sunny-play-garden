package com.toastygames.littlesproutpark;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import java.util.Random;

/**
 * The little tap games inside the widget. The picture is split into a 4 x 4 grid of tap squares ("tiles"); every game
 * draws itself on that grid and answers a tap on one tile. No reading is needed, there is no losing and nothing is
 * ever saved except where the game is up to.
 */
final class MiniGames {
    static final int MENU = 0, FRUIT = 1, LETTER = 2, COUNT = 3, MEMORY = 4;
    // state slots (see S): 0 game, 1 celebrating, 2 stars so far, 3..5 fruit tiles, 6..8 fruit kinds, 9 target, 10..12 choices,
    // 13 wrong-answer mask, 14 right slot, 15 first memory card (+1), 16..23 memory pictures, 24..31 memory faces (0 down, 1 up, 2 matched), 32 second card (+1)
    static final int SLOTS = 33, GOAL = 5;

    static final class S {
        final int[] v = new int[SLOTS];
        static S parse(String s) {
            S r = new S();
            if (s != null && !s.isEmpty()) {
                String[] p = s.split(",");
                for (int i = 0; i < p.length && i < SLOTS; i++) { try { r.v[i] = Integer.parseInt(p[i]); } catch (NumberFormatException ignored) { r.v[i] = 0; } }
            }
            return r;
        }
        String dump() { StringBuilder b = new StringBuilder(); for (int i = 0; i < SLOTS; i++) { if (i > 0) b.append(','); b.append(v[i]); } return b.toString(); }
    }

    private static final Random RND = new Random();
    private static final int INK = 0xff5a3f5e, SKY = 0xffa9e1f3, LEAF = 0xff59b96e, SUN = 0xffffd54a, PINK = 0xffff6b81, CARD = 0xfffffbf0, BLUE = 0xff7fd4f5, PURPLE = 0xff9a7be8, ORANGE = 0xffff9d4d;
    private static final int[] COLORS = {PINK, SUN, LEAF, BLUE, PURPLE, ORANGE};
    private static final int[] TILE_BG = {0xffffe3e8, 0xfffff2c0, 0xffd4f1dc, 0xffd8f0fb};
    private static final String LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final Paint P = new Paint(Paint.ANTI_ALIAS_FLAG);

    // ---------- tap handling ----------

    /** A tap on tile 0..15. Returns true when the picture changed. {@code openApp} is set when the little app badge was touched. */
    static boolean tap(S s, int tile, boolean[] openApp) {
        int c = tile % 4, r = tile / 4;
        if (s.v[1] == 1) { s.v[0] = MENU; s.v[1] = 0; s.v[2] = 0; return true; }              // after the celebration, any tap goes back to the menu
        int g = s.v[0];
        if (g == MENU) {
            if (c == 3 && r == 3) { openApp[0] = true; return false; }
            int pick = (r / 2) * 2 + (c / 2) + 1;
            start(s, pick);
            return true;
        }
        if (c == 3 && r == 3) { s.v[0] = MENU; s.v[2] = 0; return true; }                     // home
        switch (g) {
            case FRUIT: return tapFruit(s, tile);
            case LETTER: case COUNT: return tapQuiz(s, c, r);
            case MEMORY: return tapMemory(s, c, r);
            default: return false;
        }
    }

    static void start(S s, int game) {
        s.v[0] = game; s.v[1] = 0; s.v[2] = 0; s.v[13] = 0; s.v[15] = 0; s.v[32] = 0;
        if (game == FRUIT) { for (int i = 0; i < 3; i++) s.v[3 + i] = -1; for (int i = 0; i < 3; i++) spawnFruit(s, i); }
        else if (game == LETTER || game == COUNT) quizRound(s);
        else if (game == MEMORY) memoryDeal(s);
    }

    private static void win(S s) { s.v[1] = 1; }

    // fruit: three fruits sit on tiles of the top three rows; touching one pops it
    private static void spawnFruit(S s, int slot) {
        int t;
        do {
            t = RND.nextInt(12);
            for (int i = 0; i < 3; i++) if (i != slot && s.v[3 + i] == t) { t = -1; break; }
        } while (t < 0);
        s.v[3 + slot] = t; s.v[6 + slot] = RND.nextInt(5);
    }
    private static boolean tapFruit(S s, int tile) {
        for (int i = 0; i < 3; i++) if (s.v[3 + i] == tile) {
            s.v[2]++; if (s.v[2] >= GOAL) win(s); else spawnFruit(s, i);
            return true;
        }
        return false;
    }

    // letter and counting: a big question above, three answer cards below
    private static void quizRound(S s) {
        int game = s.v[0];
        int pool = game == LETTER ? 26 : 6;
        int target = game == LETTER ? RND.nextInt(pool) : 1 + RND.nextInt(pool);   // a letter index, or 1..6 dots
        int[] ch = new int[3]; int slot = RND.nextInt(3);
        for (int i = 0; i < 3; i++) {
            if (i == slot) { ch[i] = target; continue; }
            int x; boolean again;
            do {
                x = game == LETTER ? RND.nextInt(pool) : 1 + RND.nextInt(pool); again = x == target;
                for (int j = 0; j < i; j++) if (j != slot && ch[j] == x) again = true;
            } while (again);
            ch[i] = x;
        }
        s.v[9] = target; s.v[10] = ch[0]; s.v[11] = ch[1]; s.v[12] = ch[2]; s.v[13] = 0; s.v[14] = slot;
    }
    private static boolean tapQuiz(S s, int c, int r) {
        if (r < 2 || c > 2) return false;
        if (c == s.v[14]) { s.v[2]++; if (s.v[2] >= GOAL) win(s); else quizRound(s); return true; }
        if ((s.v[13] & (1 << c)) != 0) return false;
        s.v[13] |= 1 << c; return true;     // that one fades; the others stay
    }

    // memory: four pairs, eight cards in the top two rows
    private static void memoryDeal(S s) {
        int[] deck = {0, 0, 1, 1, 2, 2, 3, 3};
        for (int i = deck.length - 1; i > 0; i--) { int j = RND.nextInt(i + 1), t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
        for (int i = 0; i < 8; i++) { s.v[16 + i] = deck[i]; s.v[24 + i] = 0; }
        s.v[15] = 0; s.v[32] = 0;
    }
    private static boolean tapMemory(S s, int c, int r) {
        if (r > 1) return false;
        int idx = r * 4 + c;
        if (s.v[24 + idx] != 0) return false;
        if (s.v[32] != 0) {   // two odd cards are showing: turn them back before the next one
            s.v[24 + s.v[15] - 1] = 0; s.v[24 + s.v[32] - 1] = 0; s.v[15] = 0; s.v[32] = 0;
        }
        s.v[24 + idx] = 1;
        if (s.v[15] == 0) { s.v[15] = idx + 1; return true; }
        int first = s.v[15] - 1;
        if (s.v[16 + first] == s.v[16 + idx]) {
            s.v[24 + first] = 2; s.v[24 + idx] = 2; s.v[15] = 0; s.v[2]++;
            if (s.v[2] >= 4) win(s);
        } else s.v[32] = idx + 1;
        return true;
    }

    // ---------- drawing ----------

    static void draw(Canvas cv, int w, int h, S s, boolean rest) {
        float tw = w / 4f, th = h / 4f;
        cv.drawColor(0);
        P.setStyle(Paint.Style.FILL); P.setColor(SKY);
        cv.drawRoundRect(new RectF(0, 0, w, h), Math.min(w, h) * .09f, Math.min(w, h) * .09f, P);
        P.setColor(0xff8fd89e); // soft hills
        Path hill = new Path(); hill.moveTo(0, h); hill.lineTo(0, h * .84f); hill.quadTo(w * .3f, h * .74f, w * .55f, h * .86f); hill.quadTo(w * .8f, h * .96f, w, h * .8f); hill.lineTo(w, h); hill.close();
        cv.save(); Path clip = new Path(); clip.addRoundRect(new RectF(0, 0, w, h), Math.min(w, h) * .09f, Math.min(w, h) * .09f, Path.Direction.CW); cv.clipPath(clip);
        cv.drawPath(hill, P); cv.restore();
        if (rest) { drawRest(cv, w, h); return; }
        if (s.v[1] == 1) { drawCelebrate(cv, w, h); return; }
        switch (s.v[0]) {
            case FRUIT: drawFruitGame(cv, tw, th, s); break;
            case LETTER: case COUNT: drawQuiz(cv, tw, th, s); break;
            case MEMORY: drawMemory(cv, tw, th, s); break;
            default: drawMenu(cv, tw, th); break;
        }
        if (s.v[0] != MENU) drawHome(cv, tw, th);
    }

    private static RectF cell(float tw, float th, float c, float r, float cs, float rs, float pad) {
        float p = Math.min(tw, th) * pad;
        return new RectF(c * tw + p, r * th + p, (c + cs) * tw - p, (r + rs) * th - p);
    }
    private static void card(Canvas cv, RectF r, int fill) {
        float rad = Math.min(r.width(), r.height()) * .22f;
        P.setStyle(Paint.Style.FILL); P.setColor(0x30000000); cv.drawRoundRect(new RectF(r.left, r.top + rad * .25f, r.right, r.bottom + rad * .25f), rad, rad, P);
        P.setColor(fill); cv.drawRoundRect(r, rad, rad, P);
    }
    private static void text(Canvas cv, String t, float cx, float cy, float size, int color) {
        P.setStyle(Paint.Style.FILL); P.setColor(color); P.setTextAlign(Paint.Align.CENTER); P.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD)); P.setTextSize(size);
        cv.drawText(t, cx, cy + size * .35f, P);
    }
    private static void star(Canvas cv, float cx, float cy, float r, int color) {
        Path p = new Path();
        for (int i = 0; i < 10; i++) { double a = -Math.PI / 2 + i * Math.PI / 5; float rr = i % 2 == 0 ? r : r * .45f; float x = cx + (float) Math.cos(a) * rr, y = cy + (float) Math.sin(a) * rr; if (i == 0) p.moveTo(x, y); else p.lineTo(x, y); }
        p.close(); P.setStyle(Paint.Style.FILL); P.setColor(color); cv.drawPath(p, P);
    }
    private static void heart(Canvas cv, float cx, float cy, float r, int color) {
        Path p = new Path(); p.moveTo(cx, cy + r * .9f);
        p.cubicTo(cx - r * 1.5f, cy - r * .1f, cx - r * .8f, cy - r * 1.1f, cx, cy - r * .35f);
        p.cubicTo(cx + r * .8f, cy - r * 1.1f, cx + r * 1.5f, cy - r * .1f, cx, cy + r * .9f); p.close();
        P.setStyle(Paint.Style.FILL); P.setColor(color); cv.drawPath(p, P);
    }
    private static void fruit(Canvas cv, int kind, float cx, float cy, float r) {
        P.setStyle(Paint.Style.FILL);
        switch (kind) {
            case 0: P.setColor(0xffe53935); cv.drawCircle(cx - r * .22f, cy + r * .08f, r * .66f, P); cv.drawCircle(cx + r * .22f, cy + r * .08f, r * .66f, P);
                P.setColor(0xff6d4c41); cv.drawRect(cx - r * .05f, cy - r * .85f, cx + r * .05f, cy - r * .45f, P);
                P.setColor(LEAF); cv.drawOval(new RectF(cx + r * .05f, cy - r * .85f, cx + r * .5f, cy - r * .55f), P); break;
            case 1: P.setColor(0xffff9800); cv.drawCircle(cx, cy + r * .08f, r * .78f, P); P.setColor(LEAF); cv.drawOval(new RectF(cx - r * .05f, cy - r * .85f, cx + r * .4f, cy - r * .55f), P); break;
            case 2: P.setColor(0xff8e5bd0); for (int i = 0; i < 6; i++) { float gx = cx + ((i % 3) - 1) * r * .42f + (i / 3) * r * .0f, gy = cy - r * .2f + (i / 3) * r * .55f; cv.drawCircle(gx, gy, r * .34f, P); }
                P.setColor(LEAF); cv.drawOval(new RectF(cx - r * .1f, cy - r * .85f, cx + r * .4f, cy - r * .5f), P); break;
            case 3: P.setColor(0xffffe45c); cv.drawOval(new RectF(cx - r * .85f, cy - r * .6f, cx + r * .85f, cy + r * .6f), P); P.setColor(0xffffd21f); cv.drawOval(new RectF(cx - r * .7f, cy - r * .12f, cx + r * .7f, cy + r * .5f), P); break;
            default: heart(cv, cx, cy + r * .05f, r * .72f, 0xfff2395a); P.setColor(LEAF); cv.drawOval(new RectF(cx - r * .35f, cy - r * .8f, cx + r * .35f, cy - r * .5f), P); break;
        }
    }

    private static void drawMenu(Canvas cv, float tw, float th) {
        RectF a = cell(tw, th, 0, 0, 2, 2, .12f), b = cell(tw, th, 2, 0, 2, 2, .12f), c = cell(tw, th, 0, 2, 2, 2, .12f), d = cell(tw, th, 2, 2, 2, 2, .12f);
        card(cv, a, TILE_BG[0]); card(cv, b, TILE_BG[1]); card(cv, c, TILE_BG[2]); card(cv, d, TILE_BG[3]);
        float u = Math.min(a.width(), a.height());
        fruit(cv, 0, a.centerX() - u * .18f, a.centerY() + u * .05f, u * .3f); fruit(cv, 1, a.centerX() + u * .2f, a.centerY() - u * .1f, u * .22f);
        text(cv, "Aa", b.centerX(), b.centerY(), u * .5f, INK);
        for (int i = 0; i < 3; i++) { P.setStyle(Paint.Style.FILL); P.setColor(COLORS[i * 2 % 6]); cv.drawCircle(c.centerX() + (i - 1) * u * .26f, c.centerY(), u * .1f, P); }
        text(cv, "123", c.centerX(), c.centerY() + u * .3f, u * .24f, INK);
        float mx = d.centerX() - u * .12f, my = d.centerY() - u * .12f, cw = u * .26f;   // four little cards, kept clear of the badge in the corner
        card(cv, new RectF(mx - cw - u * .03f, my - cw - u * .03f, mx - u * .03f, my - u * .03f), CARD); card(cv, new RectF(mx + u * .03f, my - cw - u * .03f, mx + cw + u * .03f, my - u * .03f), CARD);
        heart(cv, mx - cw / 2f - u * .03f, my - cw / 2f - u * .03f, u * .075f, PINK); star(cv, mx + cw / 2f + u * .03f, my - cw / 2f - u * .03f, u * .09f, SUN);
        card(cv, new RectF(mx - cw - u * .03f, my + u * .03f, mx - u * .03f, my + cw + u * .03f), PURPLE); card(cv, new RectF(mx + u * .03f, my + u * .03f, mx + cw + u * .03f, my + cw + u * .03f), PURPLE);
        // the little badge in the corner opens the whole app
        float bx = 3.5f * tw, by = 3.5f * th, br = Math.min(tw, th) * .34f;
        P.setStyle(Paint.Style.FILL); P.setColor(0xffffffff); cv.drawCircle(bx, by, br, P); P.setColor(LEAF); cv.drawCircle(bx, by, br * .82f, P);
        Path leaf = new Path(); leaf.moveTo(bx, by + br * .45f); leaf.cubicTo(bx - br * .7f, by, bx - br * .3f, by - br * .55f, bx, by - br * .5f); leaf.cubicTo(bx + br * .3f, by - br * .55f, bx + br * .7f, by, bx, by + br * .45f);
        P.setColor(0xffffffff); cv.drawPath(leaf, P);
    }

    private static void drawHome(Canvas cv, float tw, float th) {
        float cx = 3.5f * tw, cy = 3.5f * th, r = Math.min(tw, th) * .36f;
        P.setStyle(Paint.Style.FILL); P.setColor(0xffffffff); cv.drawCircle(cx, cy, r, P);
        P.setColor(INK); Path p = new Path();
        p.moveTo(cx - r * .55f, cy - r * .05f); p.lineTo(cx, cy - r * .55f); p.lineTo(cx + r * .55f, cy - r * .05f); p.lineTo(cx + r * .38f, cy - r * .05f); p.lineTo(cx + r * .38f, cy + r * .5f); p.lineTo(cx - r * .38f, cy + r * .5f); p.lineTo(cx - r * .38f, cy - r * .05f); p.close();
        cv.drawPath(p, P);
    }

    private static void drawStars(Canvas cv, float tw, float th, S s, int goal, float row) {
        float r = Math.min(tw, th) * .3f;
        for (int i = 0; i < goal; i++) star(cv, (.55f + i * .75f) * Math.min(tw, th) + r * .2f, (row + .5f) * th, r, i < s.v[2] ? SUN : 0x55ffffff);
    }

    private static void drawFruitGame(Canvas cv, float tw, float th, S s) {
        for (int i = 0; i < 3; i++) {
            int t = s.v[3 + i]; if (t < 0) continue;
            float cx = (t % 4 + .5f) * tw, cy = (t / 4 + .5f) * th, r = Math.min(tw, th) * .42f;
            card(cv, cell(tw, th, t % 4, t / 4, 1, 1, .06f), 0x66ffffff);
            fruit(cv, s.v[6 + i], cx, cy, r);
        }
        drawStars(cv, tw, th, s, GOAL, 3);
    }

    private static void drawQuiz(Canvas cv, float tw, float th, S s) {
        boolean letter = s.v[0] == LETTER;
        RectF q = cell(tw, th, 0, 0, 3, 2, .08f);
        card(cv, q, CARD);
        if (letter) text(cv, String.valueOf(LETTERS.charAt(s.v[9])), q.centerX(), q.centerY(), Math.min(q.width(), q.height()) * .95f, ORANGE);
        else dots(cv, q, s.v[9]);
        for (int i = 0; i < 3; i++) {
            RectF a = cell(tw, th, i, 2, 1, 2, .07f);
            boolean wrong = (s.v[13] & (1 << i)) != 0;
            card(cv, a, wrong ? 0x88ffffff : TILE_BG[i]);
            int val = s.v[10 + i];
            String t = letter ? String.valueOf(LETTERS.charAt(val)) : String.valueOf(val);
            text(cv, t, a.centerX(), a.centerY(), Math.min(a.width(), a.height()) * .8f, wrong ? 0x66000000 : INK);
        }
        drawStarsTop(cv, tw, th, s);
    }
    private static void drawStarsTop(Canvas cv, float tw, float th, S s) {
        float r = Math.min(tw, th) * .24f;
        for (int i = 0; i < GOAL; i++) star(cv, 3.5f * tw, (.4f + i * .56f) * th, r, i < s.v[2] ? SUN : 0x55ffffff);
    }
    private static void dots(Canvas cv, RectF q, int n) {
        float u = Math.min(q.width() / 3f, q.height() / 2f);
        for (int i = 0; i < n; i++) {
            float cx = q.centerX() + ((i % 3) - 1) * u * 1.0f, cy = q.centerY() + ((i / 3) - .5f) * u * 1.0f;
            P.setStyle(Paint.Style.FILL); P.setColor(COLORS[i % 6]); cv.drawCircle(cx, cy, u * .36f, P);
            P.setColor(0x55ffffff); cv.drawCircle(cx - u * .1f, cy - u * .12f, u * .1f, P);
        }
    }

    private static void drawMemory(Canvas cv, float tw, float th, S s) {
        for (int i = 0; i < 8; i++) {
            RectF a = cell(tw, th, i % 4, i / 4, 1, 1, .07f);
            int face = s.v[24 + i];
            if (face == 0) { card(cv, a, PURPLE); star(cv, a.centerX(), a.centerY(), Math.min(a.width(), a.height()) * .25f, 0x66ffffff); continue; }
            card(cv, a, face == 2 ? 0xffd4f1dc : CARD);
            float cx = a.centerX(), cy = a.centerY(), r = Math.min(a.width(), a.height()) * .36f;
            switch (s.v[16 + i]) { case 0: fruit(cv, 0, cx, cy, r); break; case 1: fruit(cv, 1, cx, cy, r); break; case 2: star(cv, cx, cy, r, SUN); break; default: heart(cv, cx, cy, r * .95f, PINK); }
        }
        drawStars(cv, tw, th, s, 4, 2);
    }

    private static void drawCelebrate(Canvas cv, int w, int h) {
        float u = Math.min(w, h);
        for (int i = 0; i < 16; i++) {
            float cx = (.1f + (i * 37 % 80) / 100f) * w, cy = (.1f + (i * 53 % 80) / 100f) * h;
            if (i % 3 == 0) star(cv, cx, cy, u * .06f, COLORS[i % 6]); else if (i % 3 == 1) heart(cv, cx, cy, u * .045f, COLORS[i % 6]); else { P.setStyle(Paint.Style.FILL); P.setColor(COLORS[i % 6]); cv.drawCircle(cx, cy, u * .035f, P); }
        }
        star(cv, w / 2f, h / 2f, u * .3f, SUN);
        P.setColor(INK); P.setStyle(Paint.Style.FILL); cv.drawCircle(w / 2f - u * .08f, h / 2f - u * .03f, u * .025f, P); cv.drawCircle(w / 2f + u * .08f, h / 2f - u * .03f, u * .025f, P);
        P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(u * .02f); P.setStrokeCap(Paint.Cap.ROUND); cv.drawArc(new RectF(w / 2f - u * .08f, h / 2f - u * .02f, w / 2f + u * .08f, h / 2f + u * .1f), 20, 140, false, P);
        P.setStyle(Paint.Style.FILL);
    }

    private static void drawRest(Canvas cv, int w, int h) {
        float u = Math.min(w, h);
        P.setStyle(Paint.Style.FILL); P.setColor(0xff2b2f5a); cv.drawRoundRect(new RectF(0, 0, w, h), u * .09f, u * .09f, P);
        P.setColor(0xffffe9a8); cv.drawCircle(w / 2f, h * .46f, u * .24f, P); P.setColor(0xff2b2f5a); cv.drawCircle(w / 2f + u * .1f, h * .42f, u * .22f, P);
        star(cv, w * .22f, h * .25f, u * .05f, 0xffffe9a8); star(cv, w * .8f, h * .2f, u * .04f, 0xffffe9a8); star(cv, w * .75f, h * .72f, u * .035f, 0xffffe9a8);
        text(cv, "z z z", w / 2f, h * .82f, u * .12f, 0xffffe9a8);
    }
}
