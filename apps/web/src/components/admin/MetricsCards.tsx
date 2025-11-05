/**
 * Process: Admin Metrics Cards
 * Purpose: Display real-time metrics for posts, comments, users, and votes
 * Data Source: Firestore collections (posts, users) with aggregated counts
 * Update Path: Live listeners (onSnapshot) update counts in real-time
 * Dependencies: firebaseBootstrap (db)
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db } from '../../lib/firebaseBootstrap';

export default function MetricsCards() {
  const [totalPosts, setTotalPosts] = useState<number | null>(null);
  const [totalComments, setTotalComments] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState<number | null>(null);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to posts collection
    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, limit(100));
    
    const unsubscribePosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const posts = snapshot.docs;
        const postsCount = posts.length;
        const commentsSum = posts.reduce((sum, doc) => sum + (doc.data().commentCount || 0), 0);
        const votesSum = posts.reduce((sum, doc) => sum + (doc.data().voteCount || 0), 0);
        
        setTotalPosts(postsCount);
        setTotalComments(commentsSum);
        setTotalVotes(votesSum);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to posts:', error);
        setLoading(false);
      }
    );

    // Listen to users collection
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, limit(100));
    
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        setTotalUsers(snapshot.size);
      },
      (error) => {
        console.error('Error listening to users:', error);
      }
    );

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, []);

  const Card = ({ title, value }: { title: string; value: number | null }) => (
    <div className="border rounded-lg p-6" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--card)' }}>
      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>{title}</h3>
      {value === null ? (
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" style={{ backgroundColor: 'var(--line)' }}></div>
      ) : (
        <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card title="Total Posts" value={totalPosts} />
      <Card title="Total Comments" value={totalComments} />
      <Card title="Total Users" value={totalUsers} />
      <Card title="Total Votes" value={totalVotes} />
    </div>
  );
}

