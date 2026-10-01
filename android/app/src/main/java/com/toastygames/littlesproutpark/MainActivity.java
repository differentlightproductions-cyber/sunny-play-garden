package com.toastygames.littlesproutpark;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/** Hosts the complete authored game from packaged assets under its own HTTPS origin. */
public final class MainActivity extends Activity {
    private static final String HOST = "sunny-play-garden.nicholasolsen22.workers.dev";
    private static final String HOME = "https://" + HOST + "/index.html";
    private static final int MIC_PERMISSION = 51;
    private static final int FILE_PICKER = 52;
    private static final int FILE_SAVE = 53;
    private WebView game;
    private PermissionRequest pendingMicrophone;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingSave;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enterFullScreen();
        game = new WebView(this);
        game.setBackgroundColor(0xFFA9E1F3);
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(game, false);
        WebView.setWebContentsDebuggingEnabled(false);
        game.setWebViewClient(new LocalGameClient());
        game.setWebChromeClient(new GameChromeClient());
        game.addJavascriptInterface(new AndroidFiles(), "AndroidFiles");
        setContentView(game);
        game.loadUrl(HOME);
    }

    private void enterFullScreen() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override
    protected void onResume() {
        super.onResume();
        enterFullScreen();
        if (game != null) game.onResume();
    }

    @Override
    protected void onPause() {
        if (game != null) game.onPause();
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        if (game != null) game.evaluateJavascript(
            "(function(){if(window.SPG&&SPG.app&&SPG.app.running())SPG.app.closeGame();})()", null);
    }

    @Override
    protected void onDestroy() {
        if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        if (pendingMicrophone != null) { pendingMicrophone.deny(); pendingMicrophone = null; }
        if (game != null) {
            game.stopLoading();
            game.destroy();
            game = null;
        }
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != MIC_PERMISSION || pendingMicrophone == null) return;
        PermissionRequest request = pendingMicrophone;
        pendingMicrophone = null;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED)
            request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        else request.deny();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_PICKER && fileCallback != null) {
            Uri[] result = resultCode == RESULT_OK && data != null && data.getData() != null ?
                new Uri[]{data.getData()} : null;
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        } else if (requestCode == FILE_SAVE) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingSave != null) {
                try (OutputStream output = getContentResolver().openOutputStream(data.getData())) {
                    if (output == null) throw new IOException("Cannot open selected file");
                    output.write(pendingSave);
                    Toast.makeText(this, "Saved to this device", Toast.LENGTH_SHORT).show();
                } catch (IOException e) {
                    Toast.makeText(this, "Could not save the file", Toast.LENGTH_LONG).show();
                }
            }
            pendingSave = null;
        }
    }

    private final class AndroidFiles {
        @JavascriptInterface
        public void saveBase64(String filename, String mimeType, String contents) {
            try { launchSave(filename, mimeType, Base64.decode(contents, Base64.DEFAULT)); }
            catch (IllegalArgumentException e) { Log.w("SproutGame", "Invalid export", e); }
        }

        @JavascriptInterface
        public void saveText(String filename, String mimeType, String contents) {
            launchSave(filename, mimeType, contents.getBytes(StandardCharsets.UTF_8));
        }

        private void launchSave(String filename, String mimeType, byte[] contents) {
            if (!filename.matches("[a-zA-Z0-9._-]{1,100}") ||
                !(mimeType.equals("image/png") || mimeType.equals("application/json")) ||
                contents.length > 10_000_000) return;
            runOnUiThread(() -> {
                if (pendingSave != null) return;
                pendingSave = contents;
                Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                save.addCategory(Intent.CATEGORY_OPENABLE);
                save.setType(mimeType);
                save.putExtra(Intent.EXTRA_TITLE, filename);
                try { startActivityForResult(save, FILE_SAVE); }
                catch (Exception e) {
                    pendingSave = null;
                    Toast.makeText(MainActivity.this, "No file picker available", Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    private static boolean isGameOrigin(Uri uri) {
        return "https".equalsIgnoreCase(uri.getScheme()) && HOST.equalsIgnoreCase(uri.getHost()) &&
            (uri.getPort() == -1 || uri.getPort() == 443);
    }

    private WebResourceResponse localAsset(WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (!isGameOrigin(uri)) return null;
        String path = Uri.decode(uri.getEncodedPath());
        if (path == null) path = "/";
        if (path.startsWith("/api/")) return null; // Existing Cloudflare account backup API.
        if (!"GET".equalsIgnoreCase(request.getMethod())) return response(405, "Method Not Allowed");
        if (path.equals("/") || path.equals("/privacy")) path = path.equals("/") ? "/index.html" : "/privacy.html";
        if (path.contains("..") || path.indexOf('\\') >= 0 || path.indexOf('\0') >= 0)
            return response(403, "Forbidden");
        String asset = "site" + path;
        try {
            InputStream content = getAssets().open(asset);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-store");
            headers.put("X-Content-Type-Options", "nosniff");
            return new WebResourceResponse(mime(path), "UTF-8", 200, "OK", headers, content);
        } catch (IOException notFound) { return response(404, "Not Found"); }
    }

    private static String mime(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "text/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".json") || path.endsWith(".webmanifest")) return "application/json";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".woff2")) return "font/woff2";
        if (path.endsWith(".mp3")) return "audio/mpeg";
        return "application/octet-stream";
    }

    private static WebResourceResponse response(int status, String reason) {
        return new WebResourceResponse("text/plain", "UTF-8", status, reason,
            new HashMap<>(), new ByteArrayInputStream(reason.getBytes(StandardCharsets.UTF_8)));
    }

    private final class LocalGameClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return localAsset(request);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return !isGameOrigin(request.getUrl());
        }
    }

    private final class GameChromeClient extends WebChromeClient {
        @Override
        public boolean onConsoleMessage(ConsoleMessage message) {
            Log.i("SproutGame", message.messageLevel() + ": " + message.message() +
                " (" + message.sourceId() + ":" + message.lineNumber() + ")");
            return true;
        }

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            if (!isGameOrigin(request.getOrigin()) || request.getResources().length != 1 ||
                !PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(request.getResources()[0])) {
                request.deny();
                return;
            }
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            } else {
                pendingMicrophone = request;
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MIC_PERMISSION);
            }
        }

        @Override
        public void onPermissionRequestCanceled(PermissionRequest request) {
            if (pendingMicrophone == request) pendingMicrophone = null;
        }

        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            pick.addCategory(Intent.CATEGORY_OPENABLE);
            pick.setType("application/json");
            try { startActivityForResult(pick, FILE_PICKER); }
            catch (Exception e) { fileCallback.onReceiveValue(null); fileCallback = null; return false; }
            return true;
        }
    }
}
