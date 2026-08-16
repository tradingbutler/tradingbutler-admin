/**
 * Static server for the admin SPA — the replacement for the nginx runtime this
 * image used to ship.
 *
 * It is deliberately *not* part of the Angular build (`tsconfig.app.json` only
 * includes `src/**`): `bun build --target=node` bundles it, and every dependency
 * it imports, into a single `dist/admin/server/server.mjs`, so the runtime image
 * needs no `node_modules` and can be distroless — same shape as `web/`.
 *
 * Local development doesn't use this file at all; `ng serve` proxies /api itself
 * via proxy.conf.json.
 */
import compression from 'compression';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { join } from 'node:path';

import { version } from './package.json';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

/**
 * Proxy /api to admin-api so the browser only ever talks to this one origin
 * (replaces nginx.conf's `location /api { proxy_pass http://admin-api:8080; }`).
 */
const adminApiOrigin = process.env['ADMIN_API_ORIGIN'] || 'http://admin-api:8080';
app.use(
    createProxyMiddleware({
        pathFilter: '/api',
        target: adminApiOrigin,
        changeOrigin: true,
    }),
);

// Replaces nginx's `gzip on;`
app.use(compression());

app.get('/version', (_req, res) => {
    res.json({ version });
});

/**
 * Hashed build artifacts can be cached forever; index.html must not be, or a
 * deploy leaves browsers pinned to the previous bundle.
 */
app.use(
    express.static(browserDistFolder, {
        index: false,
        redirect: false,
        maxAge: '1y',
        setHeaders(res, path) {
            if (path.endsWith('index.html')) {
                res.setHeader('Cache-Control', 'no-cache');
            }
        },
    }),
);

/**
 * SPA fallback — replaces nginx's `try_files $uri $uri/ /index.html`, so deep
 * links like /analytics resolve to the app shell instead of 404ing.
 */
app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(join(browserDistFolder, 'index.html'));
});

const port = process.env['PORT'] ? Number(process.env['PORT']) : 8080;
app.listen(port, () => {
    console.log(`Admin server listening on http://localhost:${port}`);
});
