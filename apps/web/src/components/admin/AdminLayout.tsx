/**
 * Process: Admin Layout
 * Purpose: Wrapper for admin pages with navigation and role check/redirect
 * Data Source: useAdminRole hook
 * Update Path: Redirects non-admin users to home
 * Dependencies: useAdminRole, App.tsx routing
 */

import { useEffect } from 'react';
import { useAdminRole } from '../../hooks/useAdminRole';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAdminRole();

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirect to home if not admin
      window.history.pushState(null, '', '/');
      // Trigger navigation event for App.tsx
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <span className="font-semibold">Admin Dashboard</span>
              <div className="flex space-x-4">
                <a href="/admin" className="hover:opacity-80">Dashboard</a>
                <span className="opacity-50">|</span>
                <span className="opacity-50">Posts</span>
                <span className="opacity-50">|</span>
                <span className="opacity-50">Comments</span>
                <span className="opacity-50">|</span>
                <span className="opacity-50">Export</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

