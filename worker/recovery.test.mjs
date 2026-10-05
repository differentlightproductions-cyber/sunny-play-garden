import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveFamilyId, handleRecovery } from './recovery.js';

const CODE = '0123456789ABCDEFGHJK';
const emails = [];
globalThis.fetch = async (_url, init) => {
  emails.push(JSON.parse(init.body));
  return new Response(JSON.stringify({ id: 'test' }), { status: 200 });
};
const family = {
  async hasBackup() { return true; },
  async startRecovery(email) { this.email = email; return 'ok'; },
  async cancelRecoveryStart() { this.email = null; },
  async confirmRecovery(otp) { return otp === this.otp ? { email: this.email } : { error: 'wrong verification code' }; },
  async finishRecovery(sent) { this.sent = sent; }
};
const gate = { async hit() { return true; }, deriveFamilyId };
const env = { RESEND_API_KEY: 'test-only', BACKUPS: { idFromName: x => x, get: x => x.startsWith('recovery-ip:') ? gate : family } };
const call = (path, body) => handleRecovery(new Request('https://example.test' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), env, path);

test('server lookup ID matches the existing client PBKDF2 prefix', async () => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('spg1:' + CODE), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode('little-sprout-park/backup/v1'), iterations: 120000 }, key, 768));
  assert.equal(await deriveFamilyId(CODE), Buffer.from(bits.slice(0, 32)).toString('hex'));
});

test('a verified inbox gets the family code only after the email challenge', async () => {
  emails.length = 0;
  const started = await call('/api/recovery/start', { code: CODE, email: ' Parent@Example.com ' });
  assert.equal(started.status, 200);
  assert.equal(emails.length, 1);
  assert.deepEqual(emails[0].to, ['parent@example.com']);
  assert.ok(!emails[0].text.includes(CODE));
  family.otp = emails[0].text.match(/Verification code: (\d{6})/)[1];
  const wrong = await call('/api/recovery/confirm', { code: CODE, verificationCode: '999999' === family.otp ? '888888' : '999999' });
  assert.equal(wrong.status, 400);
  assert.equal(emails.length, 1);
  const confirmed = await call('/api/recovery/confirm', { code: CODE, verificationCode: family.otp });
  assert.equal(confirmed.status, 200);
  assert.equal(emails.length, 2);
  assert.deepEqual(emails[1].to, ['parent@example.com']);
  assert.ok(emails[1].text.includes(CODE.match(/.{1,5}/g).join('-')));
  assert.equal(family.sent, true);
});

test('invalid family code sends no email', async () => {
  emails.length = 0;
  const response = await call('/api/recovery/start', { code: 'not-a-family-code', email: 'parent@example.com' });
  assert.equal(response.status, 400);
  assert.equal(emails.length, 0);
});

test('oversized request is rejected before parsing or sending mail', async () => {
  emails.length = 0;
  const response = await call('/api/recovery/start', { code: CODE, email: 'parent@example.com', padding: 'x'.repeat(3000) });
  assert.equal(response.status, 413);
  assert.equal(emails.length, 0);
});
