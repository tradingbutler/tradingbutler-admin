# admin

The TradingButler admin dashboard — an Angular 21 SPA (client-only, no SSR) styled to match the
public `web/` site. It talks to the Rust `admin-api` crate over `/api/*`.

## Brokers

Manage brokers, their API keys, and per-broker IP whitelists (`/`, the default route):

- **Create** `POST /api/brokers { id, name, allowed_ips? }` → returns the **plaintext key once**.
  The server stores only the SHA-512 hash, the same digest the MT5 gateway DLL sends, so a terminal
  authenticating with the plaintext key matches. Copy the key on creation — it cannot be retrieved.
- **List** `GET /api/brokers` → `[{ id, name, has_key, allowed_ips }]` (never the key).
- **Regenerate** `POST /api/brokers/{id}/key` → new plaintext key, old one stops working.
- **Revoke** `DELETE /api/brokers/{id}/key` → clears the key (broker kept, can regenerate later).
- **Whitelist IPs** `PUT /api/brokers/{id}/allowed-ips { allowed_ips }` → replace allowed IPs/CIDRs
  (empty = no restriction). Validated, trimmed, de-duplicated.
- **Delete** `DELETE /api/brokers/{id}` → removes the broker and its live stream + snapshot.

> IP whitelists are stored but not yet enforced by the `collector` — that's a follow-up.

## Develop

```bash
npm install
npm start            # ng serve on :4200, proxies /api → http://localhost:20000 (proxy.conf.json)
npm run build        # production build → dist/admin
```

Run the backend alongside it:

```bash
cd ../api && cargo run -p admin-api      # HTTP_PORT defaults to 20000; needs REDIS_URL
```
