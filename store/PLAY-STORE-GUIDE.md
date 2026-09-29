# Publishing Sunny Play Garden on Google Play

The app is a web app that installs like an app (a PWA). For Google Play it is wrapped as a **Trusted Web Activity
(TWA)**: a tiny Android app that opens the website full screen with no browser bars. Because the game files are
served from your website, updates go live by deploying the website; you only re-upload to Play for changes to the
wrapper itself.

> Store rules change. Treat this as a checklist and double-check anything marked (verify) in the Play Console help.

## What is already done in this project
- Installable web app: `manifest.webmanifest` (fullscreen, icons incl. maskable, screenshots, categories), service worker with offline support.
- `privacy.html`: a public privacy policy page (fill in the two [placeholders]).
- `.well-known/assetlinks.json`: the file that lets the Android app hide the browser bar. Currently an empty list; you fill it in during step 4.
- Kid-safe by design: no ads, no analytics, no accounts, no links out, parental gate on every setting.
- `SPG.config.recorder` in `js/core.js`: set to `false` to remove all microphone use (simplest Families review). The rest of the app is unchanged.
- Store graphics and listing text in this folder (`store/`), not published on the website.

## 0. Before you start
1. Deploy the site (Cloudflare) and note its address, e.g. `https://play.yourdomain.com`. A custom domain is best; an address ending in `.workers.dev` also works but it is tied to your Cloudflare account name.
2. Open `https://YOUR-DOMAIN/privacy.html` and `https://YOUR-DOMAIN/.well-known/assetlinks.json` in a browser. Both must load (assetlinks shows `[]`). If assetlinks gives a 404, tell your developer: dot-folders sometimes need extra configuration on the host.
3. Edit `privacy.html`: replace **[Developer or company name]** and **[contact email address]**, deploy again.
4. Create a Google Play developer account (one-time fee, identity checks apply) at play.google.com/console.

## 1. Package the Android app (choose one)
**Easiest: PWABuilder (no command line)**
1. Go to pwabuilder.com, enter your site address, and run the check. Fix anything it flags.
2. Choose **Package for stores > Android**.
3. Set: Package ID (e.g. `com.yourname.sunnyplaygarden`, permanent), App name `Sunny Play Garden`, Launcher name `Play Garden`, Display `Fullscreen`, Orientation `Default`, Notifications off. Let it generate a signing key (**keep the downloaded key file and its passwords safe and backed up**).
4. Download the zip. It contains the app bundle (`.aab`), the signing key, and an `assetlinks.json` snippet.

**Alternative: Bubblewrap (command line)**
```
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://YOUR-DOMAIN/manifest.webmanifest
bubblewrap build
```
`store/twa-manifest.template.json` shows the settings we recommend (fullscreen, no notifications).

## 2. Create the app in Play Console
- All apps > Create app: name, default language, **App**, **Free**, accept the declarations.
- Category **Education**. Contact details and the privacy policy URL `https://YOUR-DOMAIN/privacy.html`.

## 3. Kids / Families settings (this is a children's app)
- **Target audience and content**: choose the youngest age groups you designed for (e.g. "5 and under" and "6-8"). Because children are included, the app is subject to Google's **Families Policy**. Answer yes to "appeals to children".
- **Ads**: "No, my app does not contain ads".
- **Data safety**: the app collects **no data** and shares none. The player names, progress and optional voice recordings stay on the device. Declare accordingly (verify wording in the form).
- **Content rating**: complete the IARC questionnaire honestly (cartoon fruit is sliced in Fruit Splash; there is no blood, no scary content, no chat, no purchases).
- **Permissions**: the wrapper declares none. The optional voice recorder asks the browser for the microphone only when a grown-up taps Record. If you would rather have no microphone use at all in the store version, set `SPG.config.recorder = false` in `js/core.js` and, in `_headers`, change `microphone=(self)` to `microphone=()`.
- **News/COVID/government/financial** declarations: no.

## 4. Verify the app with your website (Digital Asset Links)
This removes the browser address bar.
1. Upload your `.aab` to a Play **Internal testing** release first.
2. In Play Console, when using **Play App Signing** (recommended, default), open Release > Setup > **App signing** and copy the **SHA-256 certificate fingerprint of the app signing key**. Also copy the fingerprint of your **upload key** (optional but handy for testing).
3. Put the fingerprints into `.well-known/assetlinks.json` using `store/assetlinks.template.json` as the model (replace the package name and fingerprint), deploy the site, and check `https://YOUR-DOMAIN/.well-known/assetlinks.json` loads.
4. Install the internal test build on a phone. It should open full screen with no address bar. If a bar appears, the fingerprint or package name in assetlinks.json does not match.

## 5. Store listing
Use `store/listing.md` for the text and the images in `store/` (icon, feature graphic, phone and tablet screenshots).

## 6. Testing requirements and release
- Run an **Internal test** (up to 100 testers) to check everything works.
- New personal developer accounts must currently also run a **Closed test with a minimum number of testers for about two weeks** before applying for production (verify the current numbers). Plan for this: recruit friends and family.
- Then create a **Production** release and submit for review. First reviews can take days.

## 7. Updating later
- Game changes: deploy the website. The app picks them up next time it opens (the service worker fetches new files when online).
- Wrapper changes (name, icon, package settings): rebuild, increase the version code, upload a new release.

## Things worth checking on a real Android phone and tablet
Full screen with no bars; sound and voices; the back button never leaves the app (it goes back a screen); rotating the device; the microphone prompt in Grown-ups > Voices (if the recorder is enabled).
