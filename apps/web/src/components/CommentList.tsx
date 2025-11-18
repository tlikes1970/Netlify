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
import ProBadge from "./ProBadge";
import SpoilerWrapper from "./SpoilerWrapper";
import { reportPostOrComment } from "../lib/communityReports";

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  createdAt: any; // Firestore timestamp
  updatedAt?: any;
  containsSpoilers?: boolean;
  authorIsPro?: boolean;
  replyCount?: number;
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
  const [showThread, setShowThread] = useState<Record<string, boolean>>({});
  const [reporting, setReporting] = useState<Record<string, boolean>>({});

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
            // Filter out hidden comments (unless admin)
            if (data.hidden === true && !isAdmin) {
              return;
            }
            commentsData.push({
              id: doc.id,
              authorId: data.authorId || "",
              authorName: data.authorName || "Anonymous",
              authorAvatar: data.authorAvatar || "",
              body: data.body || "",
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              containsSpoilers: data.containsSpoilers || false,
              authorIsPro: data.authorIsPro || false,
              replyCount: data.replyCount || 0,
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

  const handleReport = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !user || reporting[commentId]) return;

    if (!confirm("Report this comment? This will notify moderators for review.")) {
      return;
    }

    setReporting((prev) => ({ ...prev, [commentId]: true }));
    try {
      await reportPostOrComment(commentId, "comment", user.uid);
      alert("Comment reported. Thank you for helping keep the community safe.");
    } catch (error: any) {
      alert(error.message || "Failed to report comment. Please try again.");
    } finally {
      setReporting((prev) => ({ ...prev, [commentId]: false }));
    }
  };

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
                  <ProBadge isPro={comment.authorIsPro} />
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {commentDate}
                  </span>
                </div>
                <SpoilerWrapper containsSpoilers={comment.containsSpoilers || false}>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--text)" }}
                  >
                    {comment.body}
                  </p>
                </SpoilerWrapper>
              </div>
            </div>

            {/* Reply Thread - shows when thread is expanded */}
            {showThread[comment.id] && (
              <div className="mt-3">
                <ReplyList 
                  postId={postId} 
                  commentId={comment.id}
                  showComposer={showReplyBox[comment.id] || false}
                />
              </div>
            )}

            <div className="flex items-center gap-4 mt-2">
              {/* Reply Counter - clickable to show/hide thread */}
              {comment.replyCount && comment.replyCount > 0 && (
                <button
                  onClick={() =>
                    setShowThread((s) => ({
                      ...s,
                      [comment.id]: !s[comment.id],
                    }))
                  }
                  className="text-sm font-medium hover:underline transition-colors"
                  style={{ 
                    color: "var(--accent-primary)",
                    cursor: "pointer"
                  }}
                >
                  {showThread[comment.id] 
                    ? `Hide ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`
                    : `Show ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`
                  }
                </button>
              )}

              {/* Reply Button - opens composer */}
              {isAuthenticated && user && (
                <button
                  onClick={() => {
                    setShowReplyBox((s) => ({
                      ...s,
                      [comment.id]: !s[comment.id],
                    }));
                    // Auto-expand thread when clicking Reply if it's collapsed
                    if (!showThread[comment.id]) {
                      setShowThread((s) => ({
                        ...s,
                        [comment.id]: true,
                      }));
                    }
                  }}
                  className="text-sm hover:underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {showReplyBox[comment.id] ? "Cancel" : "Reply"}
                </button>
              )}

              {isAuthenticated && user && (
                <button
                  onClick={(e) => handleReport(comment.id, e)}
                  disabled={reporting[comment.id]}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs rounded hover:bg-red-500/10"
                  style={{ color: "var(--muted)" }}
                  title="Report comment"
                >
                  {reporting[comment.id] ? "Reporting..." : "Report"}
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
