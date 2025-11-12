/**
 * Process: Comment List
 * Purpose: Display comments with real-time updates, delete functionality, and replies
 * Data Source: Firestore posts/{postId}/comments sub-collection via onSnapshot
 * Update Path: Comments appear/disappear in real-time as they're added/deleted
 * Dependencies: firebaseBootstrap, useAuth, ReplyList
 */

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebaseBootstrap";
import { useAuth } from "../hooks/useAuth";
import { useAdminRole } from "../hooks/useAdminRole";
import { ReplyList } from "./ReplyList";

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  createdAt: any; // Firestore timestamp
  updatedAt?: any;
}

interface CommentListProps {
  postId: string;
  postAuthorId?: string;
}

export default function CommentList({
  postId,
  postAuthorId,
}: CommentListProps) {
  const { isAuthenticated, user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReplyBox, setShowReplyBox] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    // Kill switch: Firestore listeners disabled
    import("../runtime/switches").then(({ isOff }) => {
      if (isOff("ifire")) {
        console.info(
          "[CommentList] Firestore disabled via kill switch (ifire:off)"
        );
        setLoading(false);
        return;
      }

      const commentsRef = collection(db, "posts", postId, "comments");
      const q = query(commentsRef, orderBy("createdAt", "asc"));

      // Real-time listener
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const commentsData: Comment[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            commentsData.push({
              id: doc.id,
              authorId: data.authorId || "",
              authorName: data.authorName || "Anonymous",
              authorAvatar: data.authorAvatar || "",
              body: data.body || "",
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
          });

          setComments(commentsData);
          setLoading(false);
        },
        (error) => {
          console.error("Error listening to comments:", error);
          setLoading(false);
        }
      );
    });

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [postId]);

  const handleDelete = async (commentId: string, commentAuthorId: string) => {
    if (!isAuthenticated || !user) return;

    // Check if user can delete (comment author, post author, or admin)
    const canDelete =
      user.uid === commentAuthorId || user.uid === postAuthorId || isAdmin;

    if (!canDelete) {
      alert("You can only delete your own comments or comments on your posts");
      return;
    }

    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const commentRef = doc(db, "posts", postId, "comments", commentId);
      await deleteDoc(commentRef);
      // Comment count will be updated automatically by Cloud Function
    } catch (error: any) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm py-4" style={{ color: "var(--muted)" }}>
        No comments yet. Be the first to comment!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const commentDate = comment.createdAt?.toDate
          ? comment.createdAt.toDate().toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : comment.createdAt
            ? new Date(comment.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "";

        const canDelete =
          isAuthenticated &&
          user &&
          (user.uid === comment.authorId ||
            user.uid === postAuthorId ||
            isAdmin);

        return (
          <div
            key={comment.id}
            className="p-4 rounded-lg bg-layer border border-line relative group"
          >
            <div className="flex items-start gap-3">
              {comment.authorAvatar && (
                <img
                  src={comment.authorAvatar}
                  alt={comment.authorName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-medium text-sm"
                    style={{ color: "var(--text)" }}
                  >
                    {comment.authorName}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {commentDate}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: "var(--text)" }}
                >
                  {comment.body}
                </p>
              </div>
            </div>

            {/* Reply List - appears directly under comment body when Reply button is clicked */}
            {showReplyBox[comment.id] && (
              <div className="mt-3">
                <ReplyList postId={postId} commentId={comment.id} />
              </div>
            )}

            <div className="flex items-center gap-4 mt-2">
              {isAuthenticated && user && (
                <button
                  onClick={() =>
                    setShowReplyBox((s) => ({
                      ...s,
                      [comment.id]: !s[comment.id],
                    }))
                  }
                  className="text-sm hover:underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {showReplyBox[comment.id] ? "Cancel" : "Reply"}
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => handleDelete(comment.id, comment.authorId)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs rounded hover:bg-red-500/10"
                  style={{ color: "var(--muted)" }}
                  title="Delete comment"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
