/**
 * Process: Admin User Management
 * Purpose: UI to grant/revoke admin roles to users via callable function
 * Data Source: Firestore users collection, Firebase Auth custom claims
 * Update Path: Calls manageAdminRole Cloud Function to update custom claims
 * Dependencies: firebaseBootstrap (db, functions), useAdminRole
 */

import { useState, useEffect } from 'react';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebaseBootstrap';

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  lastLoginAt?: string;
  isAdmin?: boolean;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, orderBy('lastLoginAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      usersQuery,
      async (snapshot) => {
        const usersData: User[] = [];
        
        // Check admin status for each user by calling getIdTokenResult
        // Since we can't directly check other users' claims, we'll need to call a function
        // For now, we'll show users and allow toggling - the function will verify
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          usersData.push({
            uid: doc.id,
            email: data.email || data.profile?.email || '',
            displayName: data.displayName || data.profile?.displayName || '',
            photoURL: data.photoURL || data.profile?.photoURL,
            lastLoginAt: data.lastLoginAt,
            isAdmin: false, // Will be updated when we check
          });
        });

        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleToggleAdmin = async (userId: string, currentEmail: string, grant: boolean) => {
    if (!confirm(`Are you sure you want to ${grant ? 'grant' : 'revoke'} admin role for ${currentEmail}?`)) {
      return;
    }

    setUpdating(prev => new Set(prev).add(userId));

    try {
      const manageAdminRole = httpsCallable(functions, 'manageAdminRole');
      
      await manageAdminRole({ userId, grant });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === userId 
            ? { ...user, isAdmin: grant }
            : user
        )
      );

      alert(grant ? 'Admin role granted. User must sign out and back in for changes to take effect.' : 'Admin role revoked.');
    } catch (error: any) {
      console.error('Error managing admin role:', error);
      alert(`Failed to ${grant ? 'grant' : 'revoke'} admin role: ${error.message || 'Unknown error'}`);
    } finally {
      setUpdating(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const filteredUsers = users.filter(user => 
    !searchEmail || 
    user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  if (loading) {
    return (
      <div className="border rounded-lg p-6" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--card)' }}>
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" style={{ backgroundColor: 'var(--line)' }}></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" style={{ backgroundColor: 'var(--line)' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 mb-8" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--card)' }}>
      <h2 className="text-xl font-semibold mb-4">Manage Admin Roles</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="w-full px-4 py-2 rounded border"
          style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)' }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--line)' }}>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">UID</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.uid} className="border-b" style={{ borderColor: 'var(--line)' }}>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.displayName || '—'}</td>
                <td className="p-2 text-sm font-mono">{user.uid.substring(0, 8)}...</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${user.isAdmin ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/20 text-gray-600'}`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleToggleAdmin(user.uid, user.email, !user.isAdmin)}
                    disabled={updating.has(user.uid)}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                    style={{ 
                      borderColor: 'var(--line)', 
                      backgroundColor: user.isAdmin ? 'var(--btn)' : 'var(--accent)',
                      color: user.isAdmin ? 'var(--text)' : 'white'
                    }}
                  >
                    {updating.has(user.uid) 
                      ? 'Updating...' 
                      : user.isAdmin 
                        ? 'Revoke Admin' 
                        : 'Grant Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
            {searchEmail ? 'No users found matching search' : 'No users found'}
          </p>
        )}
      </div>
      
      <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>
        Note: Users must sign out and sign back in for admin role changes to take effect.
      </p>
    </div>
  );
}

