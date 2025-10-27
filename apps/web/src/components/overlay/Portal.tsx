import { createPortal } from 'react-dom';
import React from 'react';

/**
 * Process: Portal
 * Purpose: Portal wrapper for rendering children at document root
 * Data Source: React children
 * Update Path: Pass children to render
 * Dependencies: react-dom
 */
export function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  let root = document.getElementById('overlay-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'overlay-root';
    root.setAttribute('data-layer', 'overlay-root');
    document.body.appendChild(root);
  }
  return createPortal(children, root);
}

