/**
 * Process: Bulk Actions
 * Purpose: Table with checkboxes for selecting and batch deleting posts or comments
 * Data Source: Firestore posts collection or comments sub-collections
 * Update Path: Batch delete updates aggregated counts via transactions
 * Dependencies: firebaseBootstrap (db), runTransaction
 */

import { useState, useEffect } from 'react';
import { collection, query, limit, onSnapshot, doc, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebaseBootstrap';

interface Item {
  id: string;
  title?: string;
  body?: string;
  postId?: string;
  authorId?: string;
  createdAt?: any;
}

interface BulkActionsProps {
  type: 'posts' | 'comments';
  postId?: string; // Required if type is 'comments'
}

export default function BulkActions({ type, postId }: BulkActionsProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === 'comments' && !postId) {
      setLoading(false);
      return;
    }

    const itemsRef = type === 'posts' 
      ? collection(db, 'posts')
      : collection(db, 'posts', postId!, 'comments');
    
    const itemsQuery = query(itemsRef, limit(100));

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const itemsData: Item[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          itemsData.push({
            id: docSnap.id,
            title: data.title,
            body: data.body,
            postId: type === 'comments' ? postId : undefined,
            authorId: data.authorId,
            createdAt: data.createdAt,
          });
        });
        setItems(itemsData);
        setLoading(false);
      },
      (error) => {
        console.error(`Error listening to ${type}:`, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [type, postId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} ${type}?`)) {
      return;
    }

    try {
      if (type === 'posts') {
        // For posts, use batch delete (no transaction needed for simple deletes)
        const batch = writeBatch(db);
        
        for (const id of selectedIds) {
          const postRef = doc(db, 'posts', id);
          batch.delete(postRef);
        }
        
        await batch.commit();
      } else {
        // For comments, use transaction to atomically update post commentCount
        if (!postId) return;

        await runTransaction(db, async (transaction) => {
          const postRef = doc(db, 'posts', postId);
          const postDoc = await transaction.get(postRef);
          
          if (!postDoc.exists()) {
            throw new Error('Post not found');
          }

          // Delete comments using transaction
          let deletedCount = 0;
          for (const id of selectedIds) {
            const commentRef = doc(db, 'posts', postId, 'comments', id);
            transaction.delete(commentRef);
            deletedCount++;
          }

          // Update commentCount on post
          const currentCount = postDoc.data().commentCount || 0;
          transaction.update(postRef, {
            commentCount: Math.max(0, currentCount - deletedCount),
          });
        });
      }

      setSelectedIds(new Set());
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}. Please try again.`);
    }
  };

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold capitalize">{type}</h2>
        <button
          onClick={handleDeleteSelected}
          disabled={selectedIds.size === 0}
          className="px-4 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
          style={{ borderColor: 'var(--line)', backgroundColor: selectedIds.size > 0 ? 'var(--btn)' : 'transparent' }}
        >
          Delete Selected ({selectedIds.size})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--line)' }}>
              <th className="text-left p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === items.length && items.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4"
                />
              </th>
              <th className="text-left p-2">ID</th>
              {type === 'posts' ? (
                <>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Author ID</th>
                  <th className="text-left p-2">Created</th>
                </>
              ) : (
                <>
                  <th className="text-left p-2">Content</th>
                  <th className="text-left p-2">Author ID</th>
                  <th className="text-left p-2">Created</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b" style={{ borderColor: 'var(--line)' }}>
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="p-2 text-sm font-mono">{item.id.substring(0, 8)}...</td>
                {type === 'posts' ? (
                  <>
                    <td className="p-2">{item.title || 'Untitled'}</td>
                    <td className="p-2 text-sm font-mono">{item.authorId?.substring(0, 8)}...</td>
                    <td className="p-2 text-sm">
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 max-w-md truncate">{item.body || 'No content'}</td>
                    <td className="p-2 text-sm font-mono">{item.authorId?.substring(0, 8)}...</td>
                    <td className="p-2 text-sm">
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>No {type} found</p>
        )}
      </div>
    </div>
  );
}

