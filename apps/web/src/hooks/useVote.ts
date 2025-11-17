/**
 * Process: Vote Hook
 * Purpose: Optimistic voting with real-time score updates using Firestore onSnapshot
 * Data Source: Firestore posts/{postId}/votes/{userId} sub-collection
 * Update Path: User votes via setDoc/deleteDoc, scores aggregated by Cloud Function
 * Dependencies: firebaseBootstrap (db), authManager (userId)
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseBootstrap';
import { authManager } from '../lib/auth';

export interface VoteState {
  userVote: number | null; // -1, 0, or 1 (null = not loaded yet, 0 = no vote)
  score: number; // Aggregated score from parent post doc
  voteCount: number; // Total number of votes
  loading: boolean;
  error: string | null;
}

export function useVote(postId: string) {
  const [state, setState] = useState<VoteState>({
    userVote: null,
    score: 0,
    voteCount: 0,
    loading: true,
    error: null,
  });

  const userId = authManager.getCurrentUser()?.uid;

  // Load user's vote
  useEffect(() => {
    if (!postId) return;

    let unsubscribePost: (() => void) | null = null;
    let unsubscribeVote: (() => void) | null = null;

    // Subscribe to post document for score and voteCount
    const postRef = doc(db, 'posts', postId);
    unsubscribePost = onSnapshot(
      postRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setState((prev) => ({
            ...prev,
            score: data.score || 0,
            voteCount: data.voteCount || 0,
            loading: prev.userVote === null && !!userId,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            score: 0,
            voteCount: 0,
            loading: prev.userVote === null && !!userId,
          }));
        }
      },
      (error) => {
        console.error('Error listening to post:', error);
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      }
    );

    // Subscribe to user's vote if authenticated
    if (userId) {
      const voteRef = doc(db, 'posts', postId, 'votes', userId);
      unsubscribeVote = onSnapshot(
        voteRef,
        (snapshot) => {
          setState((prev) => ({
            ...prev,
            userVote: snapshot.exists() ? (snapshot.data()?.value || 0) : 0,
            loading: false,
            error: null,
          }));
        },
        (error) => {
          // If vote doc doesn't exist, that's OK (user hasn't voted)
          if (error.code !== 'permission-denied') {
            console.error('Error listening to vote:', error);
          }
          setState((prev) => ({
            ...prev,
            userVote: 0,
            loading: false,
            error: error.code === 'permission-denied' ? null : error.message,
          }));
        }
      );
    } else {
      // Not authenticated - no user vote
      setState((prev) => ({
        ...prev,
        userVote: 0,
        loading: false,
      }));
    }

    return () => {
      if (unsubscribePost) unsubscribePost();
      if (unsubscribeVote) unsubscribeVote();
    };
  }, [postId, userId]);

  // Toggle vote (optimistic update)
  const toggleVote = useCallback(
    async (voteValue: 1 | -1) => {
      if (!userId) {
        setState((prev) => ({
          ...prev,
          error: 'You must be signed in to vote',
        }));
        return;
      }

      if (!postId) {
        setState((prev) => ({
          ...prev,
          error: 'Invalid post ID',
        }));
        return;
      }

      const voteRef = doc(db, 'posts', postId, 'votes', userId);

      try {
        // Check current vote
        const voteSnap = await getDoc(voteRef);
        const currentValue = voteSnap.exists() ? voteSnap.data()?.value : 0;

        // Optimistic update
        const newVote = currentValue === voteValue ? 0 : voteValue;
        setState((prev) => ({
          ...prev,
          userVote: newVote,
          error: null,
        }));

        if (newVote === 0) {
          // Remove vote (toggle off)
          await deleteDoc(voteRef);
        } else {
          // Set vote
          await setDoc(voteRef, { value: newVote }, { merge: true });
        }

        // Note: score and voteCount will update automatically via onSnapshot
        // when the Cloud Function updates the parent post document
      } catch (error: any) {
        console.error('Error toggling vote:', error);
        
        // Revert optimistic update
        const voteSnap = await getDoc(voteRef);
        const actualValue = voteSnap.exists() ? voteSnap.data()?.value : 0;
        setState((prev) => ({
          ...prev,
          userVote: actualValue,
          error: error.message || 'Failed to update vote',
        }));
      }
    },
    [postId, userId]
  );

  const upvote = useCallback(() => toggleVote(1), [toggleVote]);
  const downvote = useCallback(() => toggleVote(-1), [toggleVote]);

  return {
    ...state,
    upvote,
    downvote,
    isUpvoted: state.userVote === 1,
    isDownvoted: state.userVote === -1,
    canVote: !!userId,
  };
}
























