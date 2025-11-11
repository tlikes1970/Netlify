/**
 * FlickWord Mobile Tuner
 * 
 * Interactive tool to adjust tile and keyboard sizes in real-time.
 * 
 * Usage (in DevTools console):
 *   import('/src/debug/fwTuner.tsx').then(m => m.mountFwTuner());
 * 
 * This file should be tree-shaken out of production builds.
 */

import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface TunerProps {
  onClose: () => void;
}

function FwTuner({ onClose }: TunerProps) {
  const root = document.querySelector('[data-fw-root]') as HTMLElement;
  
  // Tile settings
  const [tileSize, setTileSize] = useState(() => {
    const computed = root ? getComputedStyle(root).getPropertyValue('--fw-tile-size') : '42px';
    return parseInt(computed) || 42;
  });
  
  const [tileGap, setTileGap] = useState(() => {
    const computed = root ? getComputedStyle(root).getPropertyValue('--fw-tile-gap') : '2px';
    return parseFloat(computed) || 2;
  });

  // Keyboard settings
  const [keyHeight, setKeyHeight] = useState(() => {
    const computed = root ? getComputedStyle(root).getPropertyValue('--fw-key-h') : '48px';
    return parseInt(computed) || 48;
  });

  const [keyGap, setKeyGap] = useState(() => {
    const computed = root ? getComputedStyle(root).getPropertyValue('--fw-key-gap') : '2px';
    return parseFloat(computed) || 2;
  });

  const [kbSidePad, setKbSidePad] = useState(() => {
    const computed = root ? getComputedStyle(root).getPropertyValue('--fw-kb-side-pad') : '4px';
    return parseFloat(computed) || 4;
  });

  // Apply changes to CSS variables
  useEffect(() => {
    if (!root) return;
    root.style.setProperty('--fw-tile-size', `${tileSize}px`);
    root.style.setProperty('--fw-tile-gap', `${tileGap}px`);
    root.style.setProperty('--fw-key-h', `${keyHeight}px`);
    root.style.setProperty('--fw-key-gap', `${keyGap}px`);
    root.style.setProperty('--fw-kb-side-pad', `${kbSidePad}px`);
  }, [root, tileSize, tileGap, keyHeight, keyGap, kbSidePad]);

  const resetTiles = () => {
    setTileSize(42);
    setTileGap(2);
  };

  const resetKeyboard = () => {
    setKeyHeight(48);
    setKeyGap(2);
    setKbSidePad(4);
  };

  const copyValues = () => {
    const values = {
      tiles: {
        size: tileSize,
        gap: tileGap,
      },
      keyboard: {
        keyHeight,
        keyGap,
        sidePad: kbSidePad,
      },
    };
    const json = JSON.stringify(values, null, 2);
    navigator.clipboard.writeText(json);
    alert('Values copied to clipboard!');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: '320px',
        maxHeight: '90vh',
        background: '#1a1d24',
        border: '2px solid #3a3f4b',
        borderRadius: '12px',
        padding: '16px',
        zIndex: 100000,
        color: '#e6eaf0',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>🎛️ FlickWord Tuner</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#a9b3c1',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      {/* Tiles Section */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #3a3f4b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Tiles</h4>
          <button
            onClick={resetTiles}
            style={{
              background: '#2a2f38',
              border: '1px solid #3a3f4b',
              color: '#e6eaf0',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Reset
          </button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a9b3c1' }}>
            Tile Size: <strong>{tileSize}px</strong>
          </label>
          <input
            type="range"
            min="30"
            max="60"
            value={tileSize}
            onChange={(e) => setTileSize(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6a7280', marginTop: '4px' }}>
            <span>30px</span>
            <span>60px</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a9b3c1' }}>
            Tile Gap: <strong>{tileGap}px</strong>
          </label>
          <input
            type="range"
            min="0"
            max="8"
            step="0.5"
            value={tileGap}
            onChange={(e) => setTileGap(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6a7280', marginTop: '4px' }}>
            <span>0px</span>
            <span>8px</span>
          </div>
        </div>
      </div>

      {/* Keyboard Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Keyboard</h4>
          <button
            onClick={resetKeyboard}
            style={{
              background: '#2a2f38',
              border: '1px solid #3a3f4b',
              color: '#e6eaf0',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Reset
          </button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a9b3c1' }}>
            Key Height: <strong>{keyHeight}px</strong>
          </label>
          <input
            type="range"
            min="40"
            max="60"
            value={keyHeight}
            onChange={(e) => setKeyHeight(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6a7280', marginTop: '4px' }}>
            <span>40px</span>
            <span>60px</span>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a9b3c1' }}>
            Key Gap: <strong>{keyGap}px</strong>
          </label>
          <input
            type="range"
            min="0"
            max="6"
            step="0.5"
            value={keyGap}
            onChange={(e) => setKeyGap(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6a7280', marginTop: '4px' }}>
            <span>0px</span>
            <span>6px</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a9b3c1' }}>
            Side Padding: <strong>{kbSidePad}px</strong>
          </label>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={kbSidePad}
            onChange={(e) => setKbSidePad(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6a7280', marginTop: '4px' }}>
            <span>0px</span>
            <span>12px</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={copyValues}
          style={{
            flex: 1,
            background: '#3b82f6',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          📋 Copy Values
        </button>
        <button
          onClick={() => {
            resetTiles();
            resetKeyboard();
          }}
          style={{
            flex: 1,
            background: '#2a2f38',
            border: '1px solid #3a3f4b',
            color: '#e6eaf0',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          🔄 Reset All
        </button>
      </div>
    </div>
  );
}

export function mountFwTuner() {
  // Remove existing tuner if present
  const existing = document.getElementById('fw-tuner-root');
  if (existing) {
    existing.remove();
  }

  // Create container
  const container = document.createElement('div');
  container.id = 'fw-tuner-root';
  document.body.appendChild(container);

  const root = createRoot(container);
  
  const handleClose = () => {
    root.unmount();
    container.remove();
  };

  root.render(<FwTuner onClose={handleClose} />);
  
  console.log('✅ FlickWord Tuner mounted! Adjust values and click "Copy Values" when done.');
}

