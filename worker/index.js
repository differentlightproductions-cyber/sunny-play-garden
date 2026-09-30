// Little Sprout Park cloud backup: a tiny Cloudflare Worker plus one Durable Object per family.
//
// What it stores: one encrypted blob per family. The app encrypts everything on the device with a key made
// from the family code, so this server only ever sees ciphertext and a hash-like id. It cannot read names,
// progress or drawings, and there are no emails, passwords or accounts.
//
// Routes (all under /api, same origin as the app):
//   GET    /api/backup   -> 200 { rev, updated, blob } | 404
//   PUT    /api/backup   { rev, blob }  -> 200 { rev, updated } | 409 { rev } (someone saved in between) | 413 | 429
//   DELETE /api/backup   -> 204
//   GET    /api/health   -> 200 "ok"
// Every backup request carries `X-Family: <64 hex chars>`.
import { DurableObject } from 'cloudflare:workers';

const MAX_BLOB = 2_400_000;          // characters of ciphertext (about 1.8 MB), far more than a family will ever use
const CHUNK = 400_000;               // stored in pieces so no single row gets too big
const KEEP_DAYS = 400;               // a backup nobody has touched for this long is deleted
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export class Backups extends DurableObject {
  constructor(state, env) {
    super(state, env);
    this.sql = state.storage.sql;
    this.tables();
  }
  // (deleteAll() removes the tables too, so they are made again whenever they are needed)
  tables() {
    this.sql.exec('CREATE TABLE IF NOT EXISTS chunks (i INTEGER PRIMARY KEY, b TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)');
  }
  meta(k) { const r = this.sql.exec('SELECT v FROM meta WHERE k = ?', k).toArray(); return r.length ? r[0].v : null; }
  setMeta(k, v) { this.sql.exec('INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)', k, String(v)); }

  async get() {
    this.tables();
    const rev = Number(this.meta('rev') || 0);
    if (!rev) return null;
    const blob = this.sql.exec('SELECT b FROM chunks ORDER BY i').toArray().map(r => r.b).join('');
    return { rev, updated: Number(this.meta('updated') || 0), blob };
  }
  async put(expected, blob) {
    this.tables();
    const rev = Number(this.meta('rev') || 0);
    if (expected !== rev) return { conflict: true, rev };
    // at most 200 saves an hour per family
    const hour = Math.floor(Date.now() / 3.6e6);
    const n = this.meta('hour') === String(hour) ? Number(this.meta('hits') || 0) : 0;
    if (n >= 200) return { limited: true };
    this.setMeta('hour', hour); this.setMeta('hits', n + 1);
    this.sql.exec('DELETE FROM chunks');
    for (let i = 0, k = 0; i < blob.length; i += CHUNK, k++) this.sql.exec('INSERT INTO chunks (i, b) VALUES (?, ?)', k, blob.slice(i, i + CHUNK));
    const updated = Date.now();
    this.setMeta('rev', rev + 1); this.setMeta('updated', updated);
    await this.ctx.storage.setAlarm(updated + KEEP_DAYS * 864e5);
    return { rev: rev + 1, updated };
  }
  async remove() { await this.ctx.storage.deleteAlarm(); await this.ctx.storage.deleteAll(); }
  async alarm() { await this.ctx.storage.deleteAll(); }
  // A tiny counter used to slow down anyone creating backups in bulk (per network address).
  async hit(max, seconds) {
    this.tables();
    const now = Date.now(), start = Number(this.meta('start') || 0);
    if (!start || now - start > seconds * 1000) { this.setMeta('start', now); this.setMeta('n', 1); await this.ctx.storage.setAlarm(now + seconds * 1000 + 1000); return true; }
    const n = Number(this.meta('n') || 0) + 1; this.setMeta('n', n);
    return n <= max;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    // The app talks to its own address only.
    const origin = request.headers.get('Origin');
    if (origin && new URL(origin).host !== url.host) return json({ error: 'forbidden' }, 403);
    if (url.pathname === '/api/health') return new Response('ok', { headers: { 'Cache-Control': 'no-store' } });
    if (url.pathname !== '/api/backup') return json({ error: 'not found' }, 404);

    const id = request.headers.get('X-Family') || '';
    if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: 'bad id' }, 400);
    const stub = env.BACKUPS.get(env.BACKUPS.idFromName('fam:' + id));

    if (request.method === 'GET') {
      const got = await stub.get();
      return got ? json(got) : json({ error: 'none' }, 404);
    }
    if (request.method === 'DELETE') { await stub.remove(); return new Response(null, { status: 204 }); }
    if (request.method === 'PUT') {
      const len = Number(request.headers.get('Content-Length') || 0);
      if (len > MAX_BLOB + 1000) return json({ error: 'too big' }, 413);
      let body;
      try { body = JSON.parse(await request.text()); } catch (_) { return json({ error: 'bad json' }, 400); }
      if (!body || !Number.isInteger(body.rev) || body.rev < 0 || typeof body.blob !== 'string') return json({ error: 'bad body' }, 400);
      if (body.blob.length > MAX_BLOB || body.blob.length < 8) return json({ error: 'too big' }, 413);
      if (body.rev === 0) {                                  // creating a new backup: limit bulk creation per address
        const ip = request.headers.get('CF-Connecting-IP') || 'local';
        const ok = await env.BACKUPS.get(env.BACKUPS.idFromName('ip:' + ip)).hit(20, 3600);
        if (!ok) return json({ error: 'slow down' }, 429);
      }
      const res = await stub.put(body.rev, body.blob);
      if (res.conflict) return json({ error: 'conflict', rev: res.rev }, 409);
      if (res.limited) return json({ error: 'slow down' }, 429);
      return json(res);
    }
    return json({ error: 'method' }, 405);
  }
};
