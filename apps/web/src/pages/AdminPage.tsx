/**
 * Process: Admin Page
 * Purpose: Main admin dashboard page with metrics, bulk actions, and export
 * Data Source: Firestore posts and comments collections
 * Update Path: Real-time updates via onSnapshot listeners
 * Dependencies: AdminLayout, MetricsCards, BulkActions, ExportCSV
 */

import { useState, useEffect } from 'react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseBootstrap';
import AdminLayout from '../components/admin/AdminLayout';
import MetricsCards from '../components/admin/MetricsCards';
import BulkActions from '../components/admin/BulkActions';
import ExportCSV from '../components/admin/ExportCSV';
import AdminUserManagement from '../components/admin/AdminUserManagement';

export default function AdminPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [_comments, setComments] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch posts with limit(100)
    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, limit(100));

    const unsubscribePosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
      },
      (error) => {
        console.error('Error listening to posts:', error);
      }
    );

    return () => {
      unsubscribePosts();
    };
  }, []);

  useEffect(() => {
    if (!selectedPostId) {
      setComments([]);
      return;
    }

    // Fetch comments for selected post with limit(100)
    const commentsRef = collection(db, 'posts', selectedPostId, 'comments');
    const commentsQuery = query(commentsRef, limit(100));

    const unsubscribeComments = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsData);
      },
      (error) => {
        console.error('Error listening to comments:', error);
      }
    );

    return () => {
      unsubscribeComments();
    };
  }, [selectedPostId]);

  return (
    <AdminLayout>
      <MetricsCards />
      
      <AdminUserManagement />
      
      <BulkActions type="posts" />
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Comments Management</h2>
        <select
          value={selectedPostId || ''}
          onChange={(e) => setSelectedPostId(e.target.value || null)}
          className="px-4 py-2 rounded border mb-4"
          style={{ borderColor: 'var(--line)', backgroundColor: 'var(--card)' }}
        >
          <option value="">Select a post to manage comments</option>
          {posts.map((post) => (
            <option key={post.id} value={post.id}>
              {post.title || post.id.substring(0, 8)}...
            </option>
          ))}
        </select>
        
        {selectedPostId && (
          <BulkActions type="comments" postId={selectedPostId} />
        )}
      </div>

      <ExportCSV />
    </AdminLayout>
  );
}

