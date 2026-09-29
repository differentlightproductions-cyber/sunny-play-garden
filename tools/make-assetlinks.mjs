// Writes .well-known/assetlinks.json once Google Play has given you the app signing key.
// Usage: node tools/make-assetlinks.mjs com.yourname.littlesproutpark "AA:BB:...:FF" ["upload-key AA:BB:..."]
// Fingerprints are in Play Console > Test and release > App integrity > App signing (SHA-256).
import { writeFileSync } from 'node:fs';
const [pkg, ...fps] = process.argv.slice(2);
const ok = f => /^[A-F0-9]{2}(:[A-F0-9]{2}){31}$/.test(f);
if (!pkg || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(pkg) || !fps.length || !fps.every(ok)) {
  console.error('Usage: node tools/make-assetlinks.mjs <package.id> <SHA-256 fingerprint> [more fingerprints]\nFingerprints look like AA:BB:...:FF (32 pairs, uppercase).');
  process.exit(1);
}
const out = [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: fps } }];
writeFileSync('.well-known/assetlinks.json', JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote .well-known/assetlinks.json for ${pkg}. Deploy, then verify at https://<your-domain>/.well-known/assetlinks.json`);
