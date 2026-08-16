# admin

The TradingButler admin dashboard — an Angular 21 SPA (client-only, no SSR) styled to match the
public `web/` site. It talks to the Rust `admin-api` crate over `/api/*`.

## Brokers

Manage brokers, their API keys, IP whitelists, symbol maps, logos, and affiliate URLs
(`/`, the default route):

- **Create** `POST /api/brokers { id, name, allowed_ips? }` → returns the **plaintext key once**.
  The server stores only the SHA-512 hash, the same digest the MT5 gateway DLL sends, so a terminal
  authenticating with the plaintext key matches. Copy the key on creation — it cannot be retrieved.
- **List** `GET /api/brokers` → `[{ id, name, has_key, allowed_ips, open_account_url, logo, symbol_map }]`
  (never the key).
- **Regenerate** `POST /api/brokers/{id}/key` → new plaintext key, old one stops working.
- **Revoke** `DELETE /api/brokers/{id}/key` → clears the key (broker kept, can regenerate later).
- **Whitelist IPs** `PUT /api/brokers/{id}/allowed-ips { allowed_ips }` → replace allowed IPs/CIDRs
  (empty = no restriction). Validated, trimmed, de-duplicated. **Enforced by the `collector`** at
  the MT5 `broker` handshake — a connection from an IP outside the whitelist is rejected.
- **Logo** `PUT /api/brokers/{id}/logo { logo }` → replace the broker's logo (a data URL, uploaded
  as a file and read client-side via `FileReader`).
- **Affiliate URL** `PUT /api/brokers/{id}/open-account-url { open_account_url }` → replace the
  "Open Account" link.
- **Symbol map** `PUT /api/brokers/{id}/symbol-map { symbol_map }` → replace this broker's alias →
  canonical symbol table (e.g. `{"BITCOIN": "BTCUSD"}`); empty disables normalization. Applied by
  the collector before storing this broker's ticks.
- **Delete** `DELETE /api/brokers/{id}` → removes the broker and its live stream + snapshot.

## Analytics

`/analytics` shows live connection counts per `collector`/`rate-streamer` instance (grouped by
the `HOSTNAME`/`ID`-derived instance id each backend reports itself under), polling
`GET /api/analytics/collector` and `GET /api/analytics/rate-streamer` every 5s.

## Develop

```bash
bun install
bun run start        # ng serve on :4200, proxies /api → http://localhost:20000 (proxy.conf.json)
bun run build        # production build → dist/admin (SPA + bundled server, see below)
bun run serve:admin  # run the built server the way the container does, on :8080
```

Bun is the package manager (`bun.lock`, pinned in `.bun-version`); the Angular CLI itself still
runs on Node — Bun's Node compat layer reports a version the CLI rejects, so keep Node 26 on
PATH locally (the Dockerfile layers the bun binary onto `node:26-slim` for the same reason).

## Runtime

The image no longer runs nginx. `server.ts` (Express) serves `dist/admin/browser`, proxies `/api`
to `ADMIN_API_ORIGIN` (default `http://admin-api:8080`, matching the compose service name),
gzips responses and falls back to `index.html` for deep links — everything the old `nginx.conf`
did, plus a `/version` endpoint used as the container healthcheck.

`bun run build` bundles it, with every dependency inlined, into a single
`dist/admin/server/server.mjs` via `bun build --target=node`. That is why the runtime image can be
distroless (`gcr.io/distroless/nodejs26-debian13:nonroot`, uid 65532): it ships no `node_modules`,
no package manager and no shell. Use `make docker-build-debug` + `make shell` when you need to
poke around inside it.

Local `ng serve` never touches `server.ts` — dev proxying stays in `proxy.conf.json`.

Run the backend alongside it:

```bash
cd ../api && cargo run -p admin-api      # HTTP_PORT defaults to 20000; needs REDIS_URL
```
