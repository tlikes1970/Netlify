import { useState, useEffect } from 'react';
import { authLogManager } from '../lib/authLog';

interface DebugAuthHUDProps {
  status: string;
  authLoading: boolean;
  authInitialized: boolean;
  isAuthenticated: boolean;
  showAuthModal: boolean;
}

export default function DebugAuthHUD({
  status,
  authLoading,
  authInitialized,
  isAuthenticated,
  showAuthModal,
}: DebugAuthHUDProps) {
  const [traceId, setTraceId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    // Get current trace ID
    const currentTraceId = authLogManager.getTraceId();
    setTraceId(currentTraceId);

    // Check if Web Share API is supported
    setShareSupported(
      typeof navigator !== 'undefined' && 
      'share' in navigator && 
      typeof (navigator as any).share === 'function'
    );
  }, []);

  const handleExport = () => {
    authLogManager.downloadLog(traceId || undefined);
  };

  const handleCopy = async () => {
    const success = await authLogManager.copyLog(traceId || undefined);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!shareSupported) {
      // Fallback to copy
      handleCopy();
      return;
    }

    try {
      const markdown = authLogManager.formatAsMarkdown(traceId || undefined);
      const date = new Date().toISOString().split('T')[0];
      const filename = `flicklet-auth-log_${date}_${traceId || 'unknown'}.md`;
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const file = new File([blob], filename, { type: 'text/markdown' });

      if (navigator.share) {
        await navigator.share({
          title: 'Flicklet Auth Debug Log',
          text: markdown.substring(0, 500), // Share API text limit
          files: [file],
        });
      }
    } catch (error) {
      // User cancelled or share failed - fallback to copy
      console.warn('Share failed:', error);
      handleCopy();
    }
  };

  const handleClear = () => {
    if (traceId && confirm('Clear auth log for this session?')) {
      authLogManager.clearSession(traceId);
      window.location.reload();
    }
  };

  // Get persisted status
  const persistedStatus = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('flicklet.auth.status') || 'none'
    : 'none';

  // Get URL params (redacted)
  const urlParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
  const urlString = Array.from(urlParams.keys()).join(',');

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 99999,
      maxWidth: '320px',
      pointerEvents: 'auto',
      border: '2px solid #00ff00',
      boxShadow: '0 0 10px rgba(0,255,0,0.5)',
      maxHeight: '90vh',
      overflowY: 'auto',
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#00ff00', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🔍 Auth Debug</span>
        {traceId && (
          <span style={{ fontSize: '9px', color: '#999' }}>
            {traceId.substring(0, 12)}...
          </span>
        )}
      </div>

      {/* Status Info */}
      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #333' }}>
        <div>Status: <span style={{ color: status === 'redirecting' || status === 'resolving' ? '#ffff00' : '#fff' }}>{status}</span></div>
        <div>Loading: {authLoading ? 'yes' : 'no'}</div>
        <div>Initialized: {authInitialized ? 'yes' : 'no'}</div>
        <div>Auth: {isAuthenticated ? 'yes' : 'no'}</div>
        <div>Modal: <span style={{ color: showAuthModal ? '#ff6b6b' : '#51cf66' }}>{showAuthModal ? 'OPEN' : 'closed'}</span></div>
      </div>

      {/* URL Info */}
      <div style={{ marginBottom: '8px', fontSize: '10px', color: '#999', paddingBottom: '8px', borderBottom: '1px solid #333' }}>
        <div>URL params: {urlString || 'none'}</div>
        <div style={{ marginTop: '4px' }}>
          Persisted: {persistedStatus}
        </div>
      </div>

      {/* Export Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={handleExport}
          style={{
            background: '#00ff00',
            color: '#000',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 'bold',
            width: '100%',
          }}
        >
          📥 Export (.md)
        </button>

        {shareSupported ? (
          <button
            onClick={handleShare}
            style={{
              background: '#4a9eff',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold',
              width: '100%',
            }}
          >
            📤 Share
          </button>
        ) : (
          <button
            onClick={handleCopy}
            style={{
              background: '#4a9eff',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold',
              width: '100%',
            }}
          >
            {copySuccess ? '✓ Copied!' : '📋 Copy Log'}
          </button>
        )}

        <button
          onClick={handleClear}
          style={{
            background: '#ff4444',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 'bold',
            width: '100%',
          }}
        >
          🗑️ Clear Session
        </button>
      </div>
    </div>
  );
}

