/**
 * API origin for Netlify functions (/api/*, TMDB proxy).
 *
 * Web / `netlify dev`: empty API_BASE → relative URLs resolve to the current host.
 * Capacitor Android/iOS: no same-origin server → use production Netlify (env or fallback).
 *
 * Build with `--mode mobile` and/or set VITE_API_BASE_URL / VITE_TMDB_PROXY_BASE in `.env.mobile`.
 * Runtime Capacitor detection still applies when those vars are unset.
 */

import { isCapacitorNative } from './capacitorEnv';

/** Used when native shell has no env override. */
export const DEFAULT_NATIVE_API_ORIGIN = 'https://flicklet.netlify.app';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function envConfiguredOrigin(): string {
  const api = trimTrailingSlash(String(import.meta.env.VITE_API_BASE_URL ?? '').trim());
  if (api) return api;
  const pub = trimTrailingSlash(String(import.meta.env.VITE_PUBLIC_BASE_URL ?? '').trim());
  if (pub) return pub;
  return '';
}

const API_BASE =
  envConfiguredOrigin() ||
  (isCapacitorNative() ? DEFAULT_NATIVE_API_ORIGIN : '');

const explicitTmdbProxy = String(import.meta.env.VITE_TMDB_PROXY_BASE ?? '').trim();

const TMDB_PROXY_BASE =
  explicitTmdbProxy ||
  (API_BASE ? `${API_BASE}/api/tmdb-proxy` : '/api/tmdb-proxy');

/** Resolve `/api/...` or `/.netlify/functions/...` against API_BASE when on native. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
}

export { API_BASE, TMDB_PROXY_BASE };
