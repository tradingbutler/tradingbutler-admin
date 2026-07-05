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
npm install
npm start            # ng serve on :4200, proxies /api → http://localhost:20000 (proxy.conf.json)
npm run build        # production build → dist/admin
```

Run the backend alongside it:

```bash
cd ../api && cargo run -p admin-api      # HTTP_PORT defaults to 20000; needs REDIS_URL
```
