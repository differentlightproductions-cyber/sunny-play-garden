// Parent-only email recovery. No Google OAuth or third-party sign-in SDK is used.
// The family code is handled only for the requested email, never stored with the cloud backup.
const enc = new TextEncoder();
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const hex = bytes => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async value => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))));

function familyCode(value) {
  const code = String(value || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');
  return code.length === 20 && [...code].every(c => alphabet.includes(c)) ? code : null;
}

export async function deriveFamilyId(code) {
  const key = await crypto.subtle.importKey('raw', enc.encode('spg1:' + code), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('little-sprout-park/backup/v1'), iterations: 120000 }, key, 256);
  return hex(new Uint8Array(bits));
}

function parentEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : null;
}

async function deliver(env, to, subject, text) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Little Sprout Park <recovery@littlesproutpark.online>', to: [to], subject, text })
    });
    return res.ok;
  } catch (_) { return false; }
}

async function readSmallJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('bad json');
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) throw new Error('too big');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function handleRecovery(request, env, path) {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (!env.RESEND_API_KEY) return json({ error: 'unavailable' }, 503);
  if (Number(request.headers.get('Content-Length') || 0) > 2048) return json({ error: 'too big' }, 413);
  let body;
  try { body = await readSmallJson(request); }
  catch (error) { return json({ error: error.message === 'too big' ? 'too big' : 'bad json' }, error.message === 'too big' ? 413 : 400); }
  const code = body && familyCode(body.code);
  if (!code) return json({ error: 'bad code' }, 400);
  if (!['/api/recovery/start', '/api/recovery/confirm'].includes(path)) return json({ error: 'not found' }, 404);

  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const gate = env.BACKUPS.get(env.BACKUPS.idFromName('recovery-ip:' + ip));
  if (!await gate.hit(30, 3600)) return json({ error: 'slow down' }, 429);
  // PBKDF2 runs in a Durable Object invocation, whose CPU allowance covers the existing 120k-iteration key derivation.
  const stub = env.BACKUPS.get(env.BACKUPS.idFromName('fam:' + await gate.deriveFamilyId(code)));
  if (!await stub.hasBackup()) return json({ error: 'no cloud backup' }, 404);

  if (path === '/api/recovery/start') {
    const email = parentEmail(body.email);
    if (!email) return json({ error: 'bad email' }, 400);
    const oneTimeCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const result = stub.startRecovery(email, await sha256(email), await sha256(salt + ':' + oneTimeCode), salt);
    const status = await result;
    if (status === 'linked') return json({ error: 'linked to another email' }, 409);
    if (status === 'slow') return json({ error: 'slow down' }, 429);
    const sent = await deliver(env, email, 'Verify your Little Sprout Park email',
      `A grown-up is linking this email address to a Little Sprout Park family backup.\n\nVerification code: ${oneTimeCode}\n\nEnter it in the app within 10 minutes. If you did not request this, ignore this email. The family code has not been sent.\n`);
    if (!sent) { await stub.cancelRecoveryStart(); return json({ error: 'email unavailable' }, 502); }
    return json({ ok: true });
  }

  const oneTimeCode = String(body.verificationCode || '');
  if (!/^\d{6}$/.test(oneTimeCode)) return json({ error: 'bad verification code' }, 400);
  const ready = await stub.confirmRecovery(oneTimeCode);
  if (ready.error) return json({ error: ready.error }, ready.error === 'slow down' ? 429 : 400);
  const prettyCode = code.match(/.{1,5}/g).join('-');
  const sent = await deliver(env, ready.email, 'Your Little Sprout Park family code',
    `Your Little Sprout Park family recovery code is:\n\n${prettyCode}\n\nTo restore on another device, open Grown-ups > Keep drawings and progress safe > Restore from this code. Keep this message private: anyone with the code can restore your family's cloud backup.\n\nIf you did not request this, contact nicholasolsen22@gmail.com.\n`);
  await stub.finishRecovery(sent);
  return sent ? json({ ok: true, email: ready.email }) : json({ error: 'email unavailable' }, 502);
}
