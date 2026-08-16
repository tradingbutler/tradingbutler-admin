# syntax=docker/dockerfile:1
#
# Multi-stage build for the Angular admin SPA with Bun.
#
# The build emits a static browser bundle, so the runtime is plain nginx —
# it also terminates the /api proxy to admin-api (see nginx.conf).

# Build base: Bun as the package manager, Node as the JS runtime.
#
# The Angular CLI hard-checks process.versions.node and refuses anything below
# v26.0.0 / v24.15.0, and oven/bun's Node compat layer reports v24.3.0 — so the
# build stages need a real Node with the bun binary dropped in next to it.
FROM node:26-slim AS base
COPY --from=oven/bun:1-slim /usr/local/bin/bun /usr/local/bin/bun

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app

COPY package.json bun.lock ./

# Install dependencies (includes devDependencies needed for the Angular build)
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `bun run` exports npm_package_version, which the build script bakes into
# APP_VERSION via --define
RUN bun run build

# Stage 3: Runner
FROM nginx:alpine AS runtime
RUN apk add --no-cache curl
COPY --from=builder /app/dist/admin/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
