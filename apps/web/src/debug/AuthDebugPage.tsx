/**
 * Process: Auth Debug Page
 * Purpose: Diagnostic page for auth issues - shows environment, config, storage, cookies, SW status
 * Data Source: Browser APIs, Firebase config, authDebug logs
 * Update Path: Manual navigation to /debug/auth
 * Dependencies: authDebug, firebaseBootstrap
 */

import { useEffect, useState } from 'react';
import { firebaseConfig } from '@/lib/firebaseBootstrap';
import { isAuthDebug, getQueryFlag, getAuthMode, getRecentAuthLogs, clearAuthLogs, maskSecret, safeOrigin, isAuthorizedOrigin } from '@/lib/authDebug';
import { getRedirectAttemptCount, isInitDone } from '@/lib/authGuard';
import { authReady } from '@/lib/authFlow';
import installAuthDebugBridge from './authDebugBridge';

interface StorageTest {
  name: string;
  available: boolean;
  error?: string;
}

interface CookieInfo {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  sameSite?: string;
  secure?: boolean;
}

export default function AuthDebugPage() {
  const [storageTests, setStorageTests] = useState<StorageTest[]>([]);
  const [cookies, setCookies] = useState<CookieInfo[]>([]);
  const [swInfo, setSwInfo] = useState<any>(null);
  const [authLogs, setAuthLogs] = useState(getRecentAuthLogs());
  const [cookieTestResult, setCookieTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [authReadyStatus, setAuthReadyStatus] = useState<boolean | null>(null);
  const [bypassUsername, setBypassUsername] = useState<string>('');
  const [probeResults, setProbeResults] = useState<any>({});

  // Install debug bridge
  useEffect(() => {
    installAuthDebugBridge();
    
    // Check auth ready status
    authReady.then(() => setAuthReadyStatus(true)).catch(() => setAuthReadyStatus(false));
    
    // Check bypass flag
    setBypassUsername(import.meta.env.VITE_BYPASS_USERNAME || '');
  }, []);

  // Refresh logs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAuthLogs([...getRecentAuthLogs()]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Test storage availability
  useEffect(() => {
    const tests: StorageTest[] = [];

    // Test localStorage
    try {
      const testKey = '__auth_debug_test__';
      localStorage.setItem(testKey, 'test');
      const read = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      tests.push({
        name: 'localStorage',
        available: read === 'test',
        error: read !== 'test' ? 'Read/write mismatch' : undefined,
      });
    } catch (e: any) {
      tests.push({
        name: 'localStorage',
        available: false,
        error: e?.message || String(e),
      });
    }

    // Test sessionStorage
    try {
      const testKey = '__auth_debug_test__';
      sessionStorage.setItem(testKey, 'test');
      const read = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      tests.push({
        name: 'sessionStorage',
        available: read === 'test',
        error: read !== 'test' ? 'Read/write mismatch' : undefined,
      });
    } catch (e: any) {
      tests.push({
        name: 'sessionStorage',
        available: false,
        error: e?.message || String(e),
      });
    }

    // Test IndexedDB
    if ('indexedDB' in window) {
      const testDB = indexedDB.open('__auth_debug_test__', 1);
      testDB.onsuccess = () => {
        testDB.result.close();
        indexedDB.deleteDatabase('__auth_debug_test__');
        tests.push({ name: 'IndexedDB', available: true });
        setStorageTests([...tests]);
      };
      testDB.onerror = () => {
        tests.push({
          name: 'IndexedDB',
          available: false,
          error: 'Failed to open database',
        });
        setStorageTests([...tests]);
      };
    } else {
      tests.push({ name: 'IndexedDB', available: false, error: 'Not supported' });
    }

    setStorageTests(tests);
  }, []);

  // Parse cookies
  useEffect(() => {
    const cookieList: CookieInfo[] = [];
    if (document.cookie) {
      document.cookie.split(';').forEach(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=');
        const value = valueParts.join('=');
        if (name) {
          cookieList.push({ name, value });
        }
      });
    }
    setCookies(cookieList);
  }, []);

  // Test cookie SameSite
  useEffect(() => {
    const testCookieName = '__auth_debug_cookie_test__';
    try {
      // Try to set a test cookie with SameSite=Lax; Secure
      document.cookie = `${testCookieName}=test; SameSite=Lax; Secure; path=/; max-age=60`;
      
      // Try to read it back
      setTimeout(() => {
        const found = document.cookie.includes(testCookieName);
        if (found) {
          // Clean up
          document.cookie = `${testCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          setCookieTestResult({ success: true });
        } else {
          setCookieTestResult({
            success: false,
            error: 'Cookie not readable after setting (may be blocked or SameSite issue)',
          });
        }
      }, 100);
    } catch (e: any) {
      setCookieTestResult({
        success: false,
        error: e?.message || String(e),
      });
    }
  }, []);

  // Get Service Worker info
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (navigator.serviceWorker.controller) {
        setSwInfo({
          controller: navigator.serviceWorker.controller.scriptURL,
          state: navigator.serviceWorker.controller.state,
        });
      } else {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            setSwInfo({
              registered: true,
              scope: reg.scope,
              installing: reg.installing?.state,
              waiting: reg.waiting?.state,
              active: reg.active?.state,
            });
          } else {
            setSwInfo({ registered: false });
          }
        });
      }
    } else {
      setSwInfo({ supported: false });
    }
  }, []);

  const handleToggleQuery = (param: string, value: string) => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(param) === value) {
      url.searchParams.delete(param);
    } else {
      url.searchParams.set(param, value);
    }
    window.location.href = url.toString();
  };

  const handleSkipSW = async () => {
    if (!isAuthDebug()) {
      alert('SW skip only available in debug mode');
      return;
    }
    
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
        // Clear caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        alert('Service Workers unregistered. Reloading...');
        window.location.reload();
      } catch (e) {
        alert(`Failed to unregister SW: ${e}`);
      }
    }
  };

  const isProd = import.meta.env.PROD;
  const isHttps = window.location.protocol === 'https:';
  const currentOrigin = safeOrigin();
  const authDomain = firebaseConfig.authDomain;
  const isAuthorized = isAuthorizedOrigin();
  // Show both values but don't treat inequality as error on Netlify
  const originMatchesAuthDomain = currentOrigin === `https://${authDomain}` || 
                                   currentOrigin.replace('https://', '') === authDomain;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>🔍 Auth Debug Page</h1>
      
      {/* Environment */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Environment</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>App Origin:</td>
              <td style={{ padding: '5px' }}>{currentOrigin}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Full URL:</td>
              <td style={{ padding: '5px' }}>{window.location.href}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Referrer:</td>
              <td style={{ padding: '5px' }}>{document.referrer || '(none)'}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>window.top === window:</td>
              <td style={{ padding: '5px' }}>{window.top === window ? '✅ Yes' : '❌ No (in iframe)'}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Protocol:</td>
              <td style={{ padding: '5px' }}>
                {isHttps ? '✅ HTTPS' : '⚠️ HTTP'}
                {isProd && !isHttps && <span style={{ color: 'red', marginLeft: '10px' }}>⚠️ PROD should use HTTPS</span>}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Auth Mode Override:</td>
              <td style={{ padding: '5px' }}>
                {getAuthMode() ? `✅ ${getAuthMode()}` : '(none)'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Auth Init Done:</td>
              <td style={{ padding: '5px' }}>
                {isInitDone() ? '✅ Yes' : '❌ No'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Redirect Attempts (last 10m):</td>
              <td style={{ padding: '5px' }}>
                {getRedirectAttemptCount()}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Firebase Config */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Firebase Config (Masked)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>authDomain:</td>
              <td style={{ padding: '5px' }}>{firebaseConfig.authDomain}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>projectId:</td>
              <td style={{ padding: '5px' }}>{firebaseConfig.projectId}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>apiKey:</td>
              <td style={{ padding: '5px' }}>{maskSecret(firebaseConfig.apiKey)}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>appId:</td>
              <td style={{ padding: '5px' }}>{maskSecret(firebaseConfig.appId)}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Authorized Origin:</td>
              <td style={{ padding: '5px' }}>
                {isAuthorized ? '✅ Authorized' : '❌ Not Authorized'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Origin vs authDomain:</td>
              <td style={{ padding: '5px' }}>
                {originMatchesAuthDomain ? '✅ Matches' : '⚠️ Different (normal on Netlify)'}
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  Origin: {currentOrigin.replace('https://', '')}<br />
                  authDomain: {authDomain}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Cookies */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Cookies</h2>
        {cookies.length === 0 ? (
          <p>No cookies found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Name</th>
                <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((cookie, i) => (
                <tr key={i}>
                  <td style={{ padding: '5px' }}>{cookie.name}</td>
                  <td style={{ padding: '5px', wordBreak: 'break-all' }}>{cookie.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {cookieTestResult && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: cookieTestResult.success ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
            <strong>Cookie Test (SameSite=Lax; Secure):</strong>{' '}
            {cookieTestResult.success ? '✅ Success' : `❌ Failed: ${cookieTestResult.error}`}
            {!cookieTestResult.success && (
              <div style={{ marginTop: '5px', fontSize: '12px' }}>
                Cookies may be blocked or misconfigured; cross-site return may fail.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Storage Tests */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Storage Availability</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Storage</th>
              <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
              <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Error</th>
            </tr>
          </thead>
          <tbody>
            {storageTests.map((test, i) => (
              <tr key={i}>
                <td style={{ padding: '5px' }}>{test.name}</td>
                <td style={{ padding: '5px' }}>{test.available ? '✅ Available' : '❌ Unavailable'}</td>
                <td style={{ padding: '5px', color: 'red' }}>{test.error || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Service Worker */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Service Worker</h2>
        {swInfo ? (
          <div>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(swInfo, null, 2)}
            </pre>
            {swInfo.controller && (
              <button
                onClick={handleSkipSW}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Skip Waiting & Reload (Debug Only)
              </button>
            )}
          </div>
        ) : (
          <p>Loading SW info...</p>
        )}
      </section>

      {/* Query Toggles */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Query Toggles</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleToggleQuery('debug', 'auth')}
            style={{
              padding: '8px 16px',
              backgroundColor: getQueryFlag('debug') === 'auth' ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {getQueryFlag('debug') === 'auth' ? '✅ debug=auth' : 'debug=auth'}
          </button>
          <button
            onClick={() => handleToggleQuery('authMode', 'popup')}
            style={{
              padding: '8px 16px',
              backgroundColor: getQueryFlag('authMode') === 'popup' ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {getQueryFlag('authMode') === 'popup' ? '✅ authMode=popup' : 'authMode=popup'}
          </button>
          <button
            onClick={() => handleToggleQuery('authMode', 'redirect')}
            style={{
              padding: '8px 16px',
              backgroundColor: getQueryFlag('authMode') === 'redirect' ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {getQueryFlag('authMode') === 'redirect' ? '✅ authMode=redirect' : 'authMode=redirect'}
          </button>
          <button
            onClick={() => handleToggleQuery('sw', 'skip')}
            style={{
              padding: '8px 16px',
              backgroundColor: getQueryFlag('sw') === 'skip' ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {getQueryFlag('sw') === 'skip' ? '✅ sw=skip' : 'sw=skip'}
          </button>
        </div>
      </section>

      {/* Auth Status */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Auth Status</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Auth Ready:</td>
              <td style={{ padding: '5px' }}>
                {authReadyStatus === null ? '⏳ Checking...' : authReadyStatus ? '✅ Yes' : '❌ No'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px', fontWeight: 'bold' }}>Username Bypass:</td>
              <td style={{ padding: '5px' }}>
                {bypassUsername === '1' ? '✅ ON (modal will be skipped)' : '❌ OFF'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Debug Probes */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Debug Probes</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button
            onClick={async () => {
              try {
                const result = await (window as any).__probeAuth?.();
                setProbeResults({ ...probeResults, auth: result });
              } catch (e: any) {
                setProbeResults({ ...probeResults, auth: { error: e.message } });
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Probe Auth
          </button>
          <button
            onClick={async () => {
              try {
                const result = await (window as any).__probeUsername?.();
                setProbeResults({ ...probeResults, username: result });
              } catch (e: any) {
                setProbeResults({ ...probeResults, username: { error: e.message } });
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Probe Username
          </button>
          <button
            onClick={async () => {
              try {
                const result = await (window as any).__probeWrite?.();
                setProbeResults({ ...probeResults, write: result });
              } catch (e: any) {
                setProbeResults({ ...probeResults, write: { error: e.message } });
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Test Write
          </button>
        </div>
        {Object.keys(probeResults).length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h3 style={{ marginBottom: '10px' }}>Probe Results:</h3>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
              {JSON.stringify(probeResults, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* Auth Logs */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: 0 }}>Recent Auth Logs</h2>
          <button
            onClick={() => {
              clearAuthLogs();
              setAuthLogs([]);
            }}
            style={{
              padding: '5px 10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
        <div style={{ maxHeight: '400px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {authLogs.length === 0 ? (
            <p style={{ color: '#666' }}>No logs yet. Enable ?debug=auth and trigger auth flow.</p>
          ) : (
            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
              {authLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: '5px' }}>
                  <span style={{ color: '#666' }}>[{log.timestamp}]</span>{' '}
                  <span style={{ fontWeight: 'bold' }}>{log.event}</span>
                  {log.payload && (
                    <span style={{ color: '#333' }}> {JSON.stringify(log.payload, null, 2)}</span>
                  )}
                </div>
              ))}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}

