import { installFirstPaintGateGlobals } from './boot/firstPaint';

installFirstPaintGateGlobals();

void import('./boot/appBootstrap').then(({ renderApplication }) => {
  void renderApplication();
});

// Initialize Sentry for error tracking (only in production with DSN)
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  import('./runtime/switches').then(({ isOff }) => {
    if (isOff('ianalytics')) {
      console.info('[Sentry] Disabled via kill switch (ianalytics:off)');
      return;
    }

    import('@sentry/react')
      .then((Sentry) => {
        Sentry.init({
          dsn: import.meta.env.VITE_SENTRY_DSN,
          environment: import.meta.env.MODE || 'production',
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
          ],
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        });
      })
      .catch(() => {});
  });
}
