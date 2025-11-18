/**
 * Process: Community Reports
 * Purpose: Handle reporting of posts and comments for moderation
 * Data Source: Firestore reports collection
 * Update Path: Users report items → writes to reports collection → admins review
 * Dependencies: firebaseBootstrap, useAuth
 */

import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "./firebaseBootstrap";

export type ReportItemType = "post" | "comment";

export interface Report {
  id: string;
  itemId: string;
  itemType: ReportItemType;
  reportedBy: string;
  createdAt: any;
  reason?: string | null;
  status: "pending" | "reviewed" | "dismissed";
  hidden?: boolean;
}

/**
 * Report a post or comment
 * Prevents duplicate reports from the same user for the same item
 */
export async function reportPostOrComment(
  itemId: string,
  itemType: ReportItemType,
  reportedBy: string,
  reason?: string
): Promise<void> {
  try {
    // Check for existing report from this user for this item
    const reportsRef = collection(db, "reports");
    const existingQuery = query(
      reportsRef,
      where("itemId", "==", itemId),
      where("itemType", "==", itemType),
      where("reportedBy", "==", reportedBy)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      // Check if the reason is meaningfully different
      const existingReport = existingSnapshot.docs[0].data();
      if (existingReport.reason === reason || (!existingReport.reason && !reason)) {
        throw new Error("You have already reported this item");
      }
      // If reason is different, allow the report (user providing more context)
    }

    // Create new report
    await addDoc(reportsRef, {
      itemId,
      itemType,
      reportedBy,
      createdAt: serverTimestamp(),
      reason: reason || null,
      status: "pending",
      hidden: false,
    });
  } catch (error: any) {
    console.error("Failed to create report:", error);
    throw error;
  }
}

/**
 * Get all reports (admin only)
 */
export async function getAllReports(): Promise<Report[]> {
  const reportsRef = collection(db, "reports");
  const q = query(reportsRef, orderBy("createdAt", "desc"));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Report[];
}

/**
 * Update report status (admin only)
 */
export async function updateReportStatus(
  reportId: string,
  status: "pending" | "reviewed" | "dismissed"
): Promise<void> {
  const reportRef = doc(db, "reports", reportId);
  await updateDoc(reportRef, {
    status,
  });
}

/**
 * Toggle hidden state of a post or comment (admin only)
 */
export async function toggleItemHidden(
  itemId: string,
  itemType: ReportItemType,
  hidden: boolean
): Promise<void> {
  if (itemType === "post") {
    const postRef = doc(db, "posts", itemId);
    await updateDoc(postRef, {
      hidden,
    });
  } else {
    // For comments, we need the postId - this will be handled by the caller
    // Comments are in sub-collection: posts/{postId}/comments/{commentId}
    throw new Error("Comment hiding requires postId - use toggleCommentHidden instead");
  }
}

/**
 * Toggle hidden state of a comment (admin only)
 */
export async function toggleCommentHidden(
  postId: string,
  commentId: string,
  hidden: boolean
): Promise<void> {
  const commentRef = doc(db, "posts", postId, "comments", commentId);
  await updateDoc(commentRef, {
    hidden,
  });
}

