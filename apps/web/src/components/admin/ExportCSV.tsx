/**
 * Process: CSV Export
 * Purpose: Client-side CSV export for posts and comments
 * Data Source: Firestore posts and comments collections
 * Update Path: N/A - read-only export
 * Dependencies: firebaseBootstrap (db)
 */

import { useState } from 'react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebaseBootstrap';

export default function ExportCSV() {
  const [exporting, setExporting] = useState<'posts' | 'comments' | null>(null);

  const convertToCSV = (data: any[], columns: string[]): string => {
    const headers = columns.join(',');
    const rows = data.map((item) => {
      return columns.map((col) => {
        const value = item[col];
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) return JSON.stringify(value);
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).replace(/"/g, '""'); // Escape quotes
      }).map((val) => `"${val}"`).join(',');
    });
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPosts = async () => {
    setExporting('posts');
    try {
      const postsRef = collection(db, 'posts');
      const postsQuery = query(postsRef, limit(100));
      const snapshot = await getDocs(postsQuery);

      const posts = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          authorId: data.authorId || '',
          tagSlugs: JSON.stringify(data.tagSlugs || []),
          createdAt: data.publishedAt?.toDate ? data.publishedAt.toDate().toISOString() : data.publishedAt || '',
          voteScore: data.score || 0,
        };
      });

      const csv = convertToCSV(posts, ['id', 'title', 'authorId', 'tagSlugs', 'createdAt', 'voteScore']);
      downloadCSV(csv, `posts_export_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error exporting posts:', error);
      alert('Failed to export posts. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportComments = async () => {
    setExporting('comments');
    try {
      // Get all posts first to iterate through comments
      const postsRef = collection(db, 'posts');
      const postsQuery = query(postsRef, limit(100));
      const postsSnapshot = await getDocs(postsQuery);

      const allComments: any[] = [];

      for (const postDoc of postsSnapshot.docs) {
        const postId = postDoc.id;
        const commentsRef = collection(db, 'posts', postId, 'comments');
        const commentsQuery = query(commentsRef, limit(100));
        const commentsSnapshot = await getDocs(commentsQuery);

        commentsSnapshot.docs.forEach((commentDoc) => {
          const data = commentDoc.data();
          allComments.push({
            id: commentDoc.id,
            postId: postId,
            authorId: data.authorId || '',
            content: data.body || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || '',
          });
        });
      }

      const csv = convertToCSV(allComments, ['id', 'postId', 'authorId', 'content', 'createdAt']);
      downloadCSV(csv, `comments_export_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error exporting comments:', error);
      alert('Failed to export comments. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="border rounded-lg p-6" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--card)' }}>
      <h2 className="text-xl font-semibold mb-4">Export Data</h2>
      <div className="flex space-x-4">
        <button
          onClick={handleExportPosts}
          disabled={exporting !== null}
          className="px-4 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
          style={{ borderColor: 'var(--line)', backgroundColor: 'var(--btn)' }}
        >
          {exporting === 'posts' ? 'Exporting...' : 'Export Posts as CSV'}
        </button>
        <button
          onClick={handleExportComments}
          disabled={exporting !== null}
          className="px-4 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
          style={{ borderColor: 'var(--line)', backgroundColor: 'var(--btn)' }}
        >
          {exporting === 'comments' ? 'Exporting...' : 'Export Comments as CSV'}
        </button>
      </div>
    </div>
  );
}

