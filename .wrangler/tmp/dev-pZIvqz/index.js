var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.js
import { DurableObject } from "cloudflare:workers";
var MAX_BLOB = 24e5;
var CHUNK = 4e5;
var KEEP_DAYS = 400;
var json = /* @__PURE__ */ __name((body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }), "json");
var Backups = class extends DurableObject {
  static {
    __name(this, "Backups");
  }
  constructor(state, env) {
    super(state, env);
    this.sql = state.storage.sql;
    this.tables();
  }
  // (deleteAll() removes the tables too, so they are made again whenever they are needed)
  tables() {
    this.sql.exec("CREATE TABLE IF NOT EXISTS chunks (i INTEGER PRIMARY KEY, b TEXT NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)");
  }
  meta(k) {
    const r = this.sql.exec("SELECT v FROM meta WHERE k = ?", k).toArray();
    return r.length ? r[0].v : null;
  }
  setMeta(k, v) {
    this.sql.exec("INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)", k, String(v));
  }
  async get() {
    this.tables();
    const rev = Number(this.meta("rev") || 0);
    if (!rev) return null;
    const blob = this.sql.exec("SELECT b FROM chunks ORDER BY i").toArray().map((r) => r.b).join("");
    return { rev, updated: Number(this.meta("updated") || 0), blob };
  }
  async put(expected, blob) {
    this.tables();
    const rev = Number(this.meta("rev") || 0);
    if (expected !== rev) return { conflict: true, rev };
    const hour = Math.floor(Date.now() / 36e5);
    const n = this.meta("hour") === String(hour) ? Number(this.meta("hits") || 0) : 0;
    if (n >= 200) return { limited: true };
    this.setMeta("hour", hour);
    this.setMeta("hits", n + 1);
    this.sql.exec("DELETE FROM chunks");
    for (let i = 0, k = 0; i < blob.length; i += CHUNK, k++) this.sql.exec("INSERT INTO chunks (i, b) VALUES (?, ?)", k, blob.slice(i, i + CHUNK));
    const updated = Date.now();
    this.setMeta("rev", rev + 1);
    this.setMeta("updated", updated);
    await this.ctx.storage.setAlarm(updated + KEEP_DAYS * 864e5);
    return { rev: rev + 1, updated };
  }
  async remove() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }
  async alarm() {
    await this.ctx.storage.deleteAll();
  }
  // A tiny counter used to slow down anyone creating backups in bulk (per network address).
  async hit(max, seconds) {
    this.tables();
    const now = Date.now(), start = Number(this.meta("start") || 0);
    if (!start || now - start > seconds * 1e3) {
      this.setMeta("start", now);
      this.setMeta("n", 1);
      await this.ctx.storage.setAlarm(now + seconds * 1e3 + 1e3);
      return true;
    }
    const n = Number(this.meta("n") || 0) + 1;
    this.setMeta("n", n);
    return n <= max;
  }
};
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
    const origin = request.headers.get("Origin");
    if (origin && new URL(origin).host !== url.host) return json({ error: "forbidden" }, 403);
    if (url.pathname === "/api/health") return new Response("ok", { headers: { "Cache-Control": "no-store" } });
    if (url.pathname !== "/api/backup") return json({ error: "not found" }, 404);
    const id = request.headers.get("X-Family") || "";
    if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: "bad id" }, 400);
    const stub = env.BACKUPS.get(env.BACKUPS.idFromName("fam:" + id));
    if (request.method === "GET") {
      const got = await stub.get();
      return got ? json(got) : json({ error: "none" }, 404);
    }
    if (request.method === "DELETE") {
      await stub.remove();
      return new Response(null, { status: 204 });
    }
    if (request.method === "PUT") {
      const len = Number(request.headers.get("Content-Length") || 0);
      if (len > MAX_BLOB + 1e3) return json({ error: "too big" }, 413);
      let body;
      try {
        body = JSON.parse(await request.text());
      } catch (_) {
        return json({ error: "bad json" }, 400);
      }
      if (!body || !Number.isInteger(body.rev) || body.rev < 0 || typeof body.blob !== "string") return json({ error: "bad body" }, 400);
      if (body.blob.length > MAX_BLOB || body.blob.length < 8) return json({ error: "too big" }, 413);
      if (body.rev === 0) {
        const ip = request.headers.get("CF-Connecting-IP") || "local";
        const ok = await env.BACKUPS.get(env.BACKUPS.idFromName("ip:" + ip)).hit(20, 3600);
        if (!ok) return json({ error: "slow down" }, 429);
      }
      const res = await stub.put(body.rev, body.blob);
      if (res.conflict) return json({ error: "conflict", rev: res.rev }, 409);
      if (res.limited) return json({ error: "slow down" }, 429);
      return json(res);
    }
    return json({ error: "method" }, 405);
  }
};

// ../../../tmp/claude-0/-home-user-sunny-play-garden/d3b536fb-f898-545e-8e97-8ef5befc0852/scratchpad/wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../tmp/claude-0/-home-user-sunny-play-garden/d3b536fb-f898-545e-8e97-8ef5befc0852/scratchpad/wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-BuZ7cC/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../tmp/claude-0/-home-user-sunny-play-garden/d3b536fb-f898-545e-8e97-8ef5befc0852/scratchpad/wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-BuZ7cC/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Backups,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
