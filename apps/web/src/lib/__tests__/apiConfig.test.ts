import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../capacitorEnv', () => ({
  isCapacitorNative: vi.fn(),
}));

describe('apiConfig', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('uses relative TMDB proxy on web', async () => {
    const { isCapacitorNative } = await import('../capacitorEnv');
    vi.mocked(isCapacitorNative).mockReturnValue(false);
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_PUBLIC_BASE_URL', '');
    vi.stubEnv('VITE_TMDB_PROXY_BASE', '');

    const { API_BASE, TMDB_PROXY_BASE, apiUrl } = await import('../apiConfig');
    expect(API_BASE).toBe('');
    expect(TMDB_PROXY_BASE).toBe('/api/tmdb-proxy');
    expect(apiUrl('/api/foo')).toBe('/api/foo');
  });

  it('uses production TMDB proxy on Capacitor without env', async () => {
    const { isCapacitorNative } = await import('../capacitorEnv');
    vi.mocked(isCapacitorNative).mockReturnValue(true);
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_PUBLIC_BASE_URL', '');
    vi.stubEnv('VITE_TMDB_PROXY_BASE', '');

    const { API_BASE, TMDB_PROXY_BASE, apiUrl } = await import('../apiConfig');
    expect(API_BASE).toBe('https://flicklet.netlify.app');
    expect(TMDB_PROXY_BASE).toBe('https://flicklet.netlify.app/api/tmdb-proxy');
    expect(apiUrl('/api/tmdb-proxy')).toBe(
      'https://flicklet.netlify.app/api/tmdb-proxy'
    );
  });
});
