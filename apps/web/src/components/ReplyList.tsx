/**
 * Process: Reply List
 * Purpose: Display and manage 1-level deep replies to comments with real-time updates
 * Data Source: Firestore posts/{postId}/comments/{commentId}/replies sub-collection via onSnapshot
 * Update Path: Replies appear/disappear in real-time as they're added/deleted
 * Dependencies: firebaseBootstrap, useAuth
 */

import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebaseBootstrap';
import { useAuth } from '../hooks/useAuth';

interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  createdAt: any;
}

interface ReplyListProps {
  postId: string;
  commentId: string;
}

export function ReplyList({ postId, commentId }: ReplyListProps) {
  const { isAuthenticated, user } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!postId || !commentId) return;

    const repliesRef = collection(db, 'posts', postId, 'comments', commentId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    
    const unsub = onSnapshot(
      q,
      (snap) => {
        const repliesData: Reply[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            authorId: data.authorId || '',
            authorName: data.authorName || 'Anonymous',
            authorAvatar: data.authorAvatar || '',
            body: data.body || '',
            createdAt: data.createdAt,
          };
        });
        setReplies(repliesData);
      },
      (error) => {
        console.error('Error listening to replies:', error);
      }
    );
    
    return unsub;
  }, [postId, commentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !isAuthenticated || !user) return;

    addDoc(collection(db, 'posts', postId, 'comments', commentId, 'replies'), {
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorAvatar: user.photoURL || '',
      body: body.trim(),
      createdAt: serverTimestamp(),
    });
    setBody('');
  };

  return (
    <div className="mt-3 ml-4 border-l-2 pl-4 space-y-3" style={{ borderColor: 'var(--line)' }}>
      {replies.map((r) => {
        const replyDate = r.createdAt?.toDate
          ? r.createdAt.toDate().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : r.createdAt
          ? new Date(r.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '';

        return (
          <div key={r.id} className="rounded-lg p-3" style={{ backgroundColor: 'var(--layer)' }}>
            <div className="flex items-center gap-2 mb-1">
              {r.authorAvatar && (
                <img
                  src={r.authorAvatar}
                  alt={r.authorName}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm" style={{ color: 'var(--text)' }}>{r.authorName}</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{replyDate}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{r.body}</p>
          </div>
        );
      })}

      {isAuthenticated && user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Write a reply…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--layer)',
              color: 'var(--text)',
              borderColor: 'var(--line)',
            }}
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-lg hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text)',
            }}
          >
            Reply
          </button>
        </form>
      )}
    </div>
  );
}

