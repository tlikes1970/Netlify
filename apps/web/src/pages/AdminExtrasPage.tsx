import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebaseBootstrap";
import { ExtrasVideo } from "../lib/extras/types";
import { extrasProvider } from "../lib/extras/extrasProvider";
import { useSettings, settingsManager } from "../lib/settings";
import { useAdminRole } from "../hooks/useAdminRole";
import { isMobileNow } from "../lib/isMobile";
import {
  getAllReports,
  updateReportStatus,
  toggleItemHidden,
  toggleCommentHidden,
  type Report,
} from "../lib/communityReports";

interface UGCSubmission {
  id: string;
  type: "comment" | "video";
  showName: string;
  content: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

/**
 * Process: Admin Extras Review
 * Purpose: Admin interface for reviewing and approving bloopers/extras content and UGC
 * Data Source: ExtrasProvider, UGC submissions, feedback forms
 * Update Path: Manual admin review, bulk operations
 * Dependencies: ExtrasProvider, admin authentication, email processing
 */

interface ModerationQueueProps {
  reports: Report[];
  reportsLoading: boolean;
  processingReport: string | null;
  onLoadReports: () => Promise<void>;
  onUpdateStatus: (
    reportId: string,
    status: "pending" | "reviewed" | "dismissed"
  ) => Promise<void>;
  onToggleHidden: (report: Report) => Promise<void>;
}

function ModerationQueue({
  reports,
  reportsLoading,
  processingReport,
  onLoadReports,
  onUpdateStatus,
  onToggleHidden,
}: ModerationQueueProps) {
  const [itemPreviews, setItemPreviews] = useState<
    Record<string, { text: string; hidden: boolean }>
  >({});
  const [loadingPreviews, setLoadingPreviews] = useState<
    Record<string, boolean>
  >({});

  // Load reports on mount
  useEffect(() => {
    onLoadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load item previews
  useEffect(() => {
    const loadPreviews = async () => {
      for (const report of reports) {
        if (itemPreviews[report.id]) continue; // Already loaded

        setLoadingPreviews((prev) => ({ ...prev, [report.id]: true }));
        try {
          if (report.itemType === "post") {
            const postRef = doc(db, "posts", report.itemId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
              const data = postSnap.data();
              const preview = (
                data.body ||
                data.excerpt ||
                data.title ||
                ""
              ).slice(0, 100);
              setItemPreviews((prev) => ({
                ...prev,
                [report.id]: { text: preview, hidden: data.hidden || false },
              }));
            }
          } else {
            // For comments, find the post
            const postsRef = collection(db, "posts");
            const postsSnapshot = await getDocs(postsRef);
            for (const postDoc of postsSnapshot.docs) {
              const commentRef = doc(
                db,
                "posts",
                postDoc.id,
                "comments",
                report.itemId
              );
              const commentSnap = await getDoc(commentRef);
              if (commentSnap.exists()) {
                const data = commentSnap.data();
                const preview = (data.body || "").slice(0, 100);
                setItemPreviews((prev) => ({
                  ...prev,
                  [report.id]: { text: preview, hidden: data.hidden || false },
                }));
                break;
              }
            }
          }
        } catch (error) {
          console.error(
            `Failed to load preview for report ${report.id}:`,
            error
          );
        } finally {
          setLoadingPreviews((prev) => ({ ...prev, [report.id]: false }));
        }
      }
    };

    if (reports.length > 0) {
      loadPreviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div
        className="bg-gray-100 rounded-lg p-6"
        style={{ backgroundColor: "var(--card)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Moderation Queue</h2>
          <button
            onClick={onLoadReports}
            disabled={reportsLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {reportsLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {reportsLoading ? (
          <div
            className="text-center py-6 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div
            className="text-center py-6 text-sm"
            style={{ color: "var(--muted)" }}
          >
            No reports pending review
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const preview = itemPreviews[report.id];
              const isProcessing = processingReport === report.id;

              return (
                <div
                  key={report.id}
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--line)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="px-2 py-1 text-xs rounded-full font-medium"
                          style={{
                            backgroundColor:
                              report.itemType === "post"
                                ? "var(--accent-primary)"
                                : "var(--accent)",
                            color: "white",
                          }}
                        >
                          {report.itemType === "post" ? "Post" : "Comment"}
                        </span>
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor:
                              report.status === "pending"
                                ? "#fbbf24"
                                : report.status === "reviewed"
                                  ? "#10b981"
                                  : "#6b7280",
                            color: "white",
                          }}
                        >
                          {report.status}
                        </span>
                        {preview?.hidden && (
                          <span
                            className="px-2 py-1 text-xs rounded-full font-semibold"
                            style={{
                              backgroundColor: "#ef4444",
                              color: "white",
                            }}
                          >
                            [HIDDEN]
                          </span>
                        )}
                      </div>

                      <div
                        className="text-sm mb-2"
                        style={{ color: "var(--text)" }}
                      >
                        <div>
                          <strong>Item ID:</strong> {report.itemId}
                        </div>
                        <div>
                          <strong>Reported by:</strong> {report.reportedBy}
                        </div>
                        <div>
                          <strong>Date:</strong> {formatDate(report.createdAt)}
                        </div>
                        {report.reason && (
                          <div>
                            <strong>Reason:</strong> {report.reason}
                          </div>
                        )}
                      </div>

                      {loadingPreviews[report.id] ? (
                        <div
                          className="text-xs"
                          style={{ color: "var(--muted)" }}
                        >
                          Loading preview...
                        </div>
                      ) : preview ? (
                        <div
                          className="text-sm mt-2 p-2 rounded"
                          style={{
                            backgroundColor: "var(--card)",
                            color: "var(--muted)",
                          }}
                        >
                          {preview.text}
                          {preview.text.length >= 100 && "..."}
                        </div>
                      ) : (
                        <div
                          className="text-xs"
                          style={{ color: "var(--muted)" }}
                        >
                          Preview unavailable
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => onToggleHidden(report)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-xs rounded transition-colors"
                        style={{
                          backgroundColor: preview?.hidden
                            ? "#10b981"
                            : "#ef4444",
                          color: "white",
                        }}
                      >
                        {isProcessing
                          ? "Processing..."
                          : preview?.hidden
                            ? "Unhide"
                            : "Hide"}
                      </button>
                      <button
                        onClick={() => onUpdateStatus(report.id, "reviewed")}
                        disabled={isProcessing || report.status === "reviewed"}
                        className="px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: "#10b981",
                          color: "white",
                        }}
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => onUpdateStatus(report.id, "dismissed")}
                        disabled={isProcessing || report.status === "dismissed"}
                        className="px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: "#6b7280",
                          color: "white",
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminExtrasPage({
  isMobile: isMobileProp,
}: { isMobile?: boolean } = {}) {
  const settings = useSettings();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [videos, setVideos] = useState<ExtrasVideo[]>([]);
  const [ugcSubmissions, setUgcSubmissions] = useState<UGCSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShow, setSelectedShow] = useState<string>("");
  const [showId, setShowId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<
    | "content"
    | "comments"
    | "videos"
    | "pro"
    | "community"
    | "admin"
    | "insights"
    | "moderation"
  >("community");

  // Use prop if provided, otherwise fall back to isMobileNow()
  const isMobile = isMobileProp ?? isMobileNow();

  // Insights generation state
  const [insightsTmdbId, setInsightsTmdbId] = useState<string>("");
  const [insightsTitle, setInsightsTitle] = useState<string>("");
  const [insightsMediaType, setInsightsMediaType] = useState<"movie" | "tv">(
    "tv"
  );
  const [insightsGenres, setInsightsGenres] = useState<string>("");
  const [insightsYear, setInsightsYear] = useState<string>("");
  const [insightsRuntime, setInsightsRuntime] = useState<string>("");
  const [insightsGenerating, setInsightsGenerating] = useState(false);
  const [insightsResult, setInsightsResult] = useState<{
    success: boolean;
    itemsGenerated?: number;
    error?: string;
  } | null>(null);
  const [bulkIngestionRunning, setBulkIngestionRunning] = useState(false);
  const [bulkIngestionResult, setBulkIngestionResult] = useState<{
    success: boolean;
    total?: number;
    succeeded?: number;
    failed?: number;
    error?: string;
  } | null>(null);

  // Admin management state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminUserId, setAdminUserId] = useState("");
  const [adminManagementLoading, setAdminManagementLoading] = useState(false);

  // Digest config state
  const [digestConfig, setDigestConfig] = useState({
    title: "",
    intro: "",
    productPulseChanged: "",
    productPulseNext: "",
    productPulseHowTo: "",
    productPulseBonus: "",
    tipHeadline: "",
    tipBody: "",
    footerNote: "",
    isActive: false,
    autoSendEnabled: false,
    autoSendDay: "friday",
    autoSendTime: "09:00",
    lastAutoSentAt: null as any,
    lastAutoSentCount: null as number | null,
    lastManualSentAt: null as any,
    lastManualSentCount: null as number | null,
  });
  const [digestConfigLoading, setDigestConfigLoading] = useState(false);
  const [digestConfigSaving, setDigestConfigSaving] = useState(false);
  const [digestSendNowBusy, setDigestSendNowBusy] = useState(false);
  const [digestSendNowResult, setDigestSendNowResult] = useState<{
    ok: boolean;
    sentCount?: number;
    distinctEmails?: number;
    error?: string;
  } | null>(null);

  // Community content state
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);

  // Moderation queue state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [processingReport, setProcessingReport] = useState<string | null>(null);

  // Calculate pending reports count
  const pendingReportsCount = reports.filter(
    (r) => r.status === "pending"
  ).length;

  // Pro status
  const isPro = settings.pro?.isPro ?? false;

  const handleTogglePro = () => {
    const newProStatus = !isPro;
    settingsManager.updateSettings({
      pro: {
        ...settings.pro,
        isPro: newProStatus,
        features: {
          advancedNotifications: newProStatus,
          themePacks: newProStatus,
          socialFeatures: newProStatus,
          bloopersAccess: newProStatus,
          extrasAccess: newProStatus,
        },
      },
    });
  };

  const handleFetchVideos = async () => {
    if (!showId) return;

    setLoading(true);
    try {
      const bloopersResult = await extrasProvider.fetchBloopers(
        showId,
        selectedShow
      );
      const extrasResult = await extrasProvider.fetchExtras(
        showId,
        selectedShow
      );

      const allVideos = [...bloopersResult.videos, ...extrasResult.videos];
      setVideos(allVideos);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVideo = (videoId: string) => {
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId ? { ...video, status: "approved" as const } : video
      )
    );
  };

  const handleRejectVideo = (videoId: string) => {
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId ? { ...video, status: "rejected" as const } : video
      )
    );
  };

  const handleBulkApprove = () => {
    setVideos((prev) =>
      prev.map((video) => ({ ...video, status: "approved" as const }))
    );
  };

  const handleBulkReject = () => {
    setVideos((prev) =>
      prev.map((video) => ({ ...video, status: "rejected" as const }))
    );
  };

  // UGC Management Functions
  const handleApproveUGC = (submissionId: string) => {
    setUgcSubmissions((prev) =>
      prev.map((submission) =>
        submission.id === submissionId
          ? { ...submission, status: "approved" as const }
          : submission
      )
    );
  };

  const handleRejectUGC = (submissionId: string, reason: string) => {
    setUgcSubmissions((prev) =>
      prev.map((submission) =>
        submission.id === submissionId
          ? {
              ...submission,
              status: "rejected" as const,
              rejectionReason: reason,
            }
          : submission
      )
    );
  };

  const loadUGCSubmissions = () => {
    // Mock data for demonstration - in production, this would fetch from your backend
    const mockSubmissions: UGCSubmission[] = [
      {
        id: "1",
        type: "comment",
        showName: "The Office",
        content: "Michael Scott is the best boss ever!",
        submittedBy: "user123",
        submittedAt: "2024-01-15T10:30:00Z",
        status: "pending",
      },
      {
        id: "2",
        type: "video",
        showName: "Stranger Things",
        content: "Behind the scenes footage from season 4",
        submittedBy: "user456",
        submittedAt: "2024-01-15T11:45:00Z",
        status: "pending",
      },
    ];
    setUgcSubmissions(mockSubmissions);
  };

  useEffect(() => {
    loadUGCSubmissions();
  }, []);

  // Fetch posts for community management
  useEffect(() => {
    if (activeTab !== "community") return;

    const postsRef = collection(db, "posts");
    const postsQuery = query(
      postsRef,
      orderBy("publishedAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
      },
      (error) => {
        console.error("Error fetching posts:", error);
      }
    );

    return () => unsubscribe();
  }, [activeTab]);

  // Fetch comments for selected post
  useEffect(() => {
    if (!selectedPostId || activeTab !== "community") {
      setPostComments([]);
      return;
    }

    const commentsRef = collection(db, "posts", selectedPostId, "comments");
    const commentsQuery = query(
      commentsRef,
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPostComments(commentsData);
      },
      (error) => {
        console.error("Error fetching comments:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedPostId, activeTab]);

  // Load digest config when admin tab is active
  useEffect(() => {
    if (activeTab !== "admin" || !isAdmin) {
      return;
    }

    const loadDigestConfig = async () => {
      setDigestConfigLoading(true);
      try {
        const configDoc = await getDoc(doc(db, "digestConfig", "current"));
        if (configDoc.exists()) {
          const data = configDoc.data();
          setDigestConfig({
            title: data.title || "",
            intro: data.intro || "",
            productPulseChanged: data.productPulseChanged || "",
            productPulseNext: data.productPulseNext || "",
            productPulseHowTo: data.productPulseHowTo || "",
            productPulseBonus: data.productPulseBonus || "",
            tipHeadline: data.tipHeadline || "",
            tipBody: data.tipBody || "",
            footerNote: data.footerNote || "",
            isActive: data.isActive !== undefined ? data.isActive : false,
            autoSendEnabled:
              data.autoSendEnabled !== undefined ? data.autoSendEnabled : false,
            autoSendDay: data.autoSendDay || "friday",
            autoSendTime: data.autoSendTime || "09:00",
            lastAutoSentAt: data.lastAutoSentAt || null,
            lastAutoSentCount: data.lastAutoSentCount || null,
            lastManualSentAt: data.lastManualSentAt || null,
            lastManualSentCount: data.lastManualSentCount || null,
          });
        } else {
          // Set defaults if no config exists
          setDigestConfig({
            title: "🎬 Flicklet Weekly — We actually shipped things.",
            intro: "Here's your Flicklet update in under a minute.",
            productPulseChanged: "Ratings now stick between sessions.",
            productPulseNext:
              "• Smarter discovery rails • Swipe gestures that don't argue with gravity",
            productPulseHowTo: "Tap ★ once. It remembers now.",
            productPulseBonus:
              "Library loads faster so you spend less time staring at spinners.",
            tipHeadline: "The One Thing You Didn't Know You Needed",
            tipBody:
              "Hold your finger on a card to reorder your list. Saves 10 clicks and a small piece of your soul.",
            footerNote: "Was this worth your 42 seconds?",
            isActive: false,
            autoSendEnabled: false,
            autoSendDay: "friday",
            autoSendTime: "09:00",
            lastAutoSentAt: null,
            lastAutoSentCount: null,
            lastManualSentAt: null,
            lastManualSentCount: null,
          });
        }
      } catch (error) {
        console.error("Error loading digest config:", error);
        alert(
          "Failed to load digest config: " +
            (error instanceof Error ? error.message : String(error))
        );
      } finally {
        setDigestConfigLoading(false);
      }
    };

    loadDigestConfig();
  }, [activeTab, isAdmin]);

  const handleSaveDigestConfig = async () => {
    setDigestConfigSaving(true);
    try {
      // Ensure isActive is explicitly set (not undefined)
      const configToSave = {
        ...digestConfig,
        isActive: digestConfig.isActive === true,
      };

      await setDoc(doc(db, "digestConfig", "current"), configToSave);

      // Verify it was saved correctly
      const verifyDoc = await getDoc(doc(db, "digestConfig", "current"));
      if (verifyDoc.exists()) {
        const savedData = verifyDoc.data();
        console.log(
          "[AdminExtrasPage] Config saved. isActive:",
          savedData.isActive
        );
        alert(
          `Digest config saved successfully! Active: ${savedData.isActive ? "Yes" : "No"}`
        );
      } else {
        alert(
          "Warning: Config was saved but could not be verified. Please try again."
        );
      }
    } catch (error) {
      console.error("Error saving digest config:", error);
      alert(
        "Failed to save digest config: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setDigestConfigSaving(false);
    }
  };

  const handleSendDigestNow = async () => {
    // Verify config exists and is active before attempting to send
    const configDoc = await getDoc(doc(db, "digestConfig", "current"));
    if (!configDoc.exists()) {
      alert(
        "No digest config found. Please save a digest configuration first."
      );
      return;
    }

    const configData = configDoc.data();
    if (configData.isActive !== true) {
      alert(
        "Digest config is not active. Please enable the 'Active' checkbox and save the configuration first."
      );
      return;
    }

    if (!digestConfig.isActive) {
      alert("Digest must be active to send. Please enable 'Active' first.");
      return;
    }

    setDigestSendNowBusy(true);
    setDigestSendNowResult(null);
    try {
      const { httpsCallable } = await import("firebase/functions");
      const { functions } = await import("../lib/firebaseBootstrap");
      const sendDigestNow = httpsCallable(functions, "sendDigestNow");

      const result = await sendDigestNow({});
      const data = result.data as {
        ok: boolean;
        sentCount?: number;
        distinctEmails?: number;
      };

      if (data.ok) {
        setDigestSendNowResult({
          ok: true,
          sentCount: data.sentCount,
          distinctEmails: data.distinctEmails,
        });
        // Reload config to get updated stats
        const updatedConfigDoc = await getDoc(
          doc(db, "digestConfig", "current")
        );
        if (updatedConfigDoc.exists()) {
          const updatedConfigData = updatedConfigDoc.data();
          setDigestConfig((prev) => ({
            ...prev,
            lastManualSentAt: updatedConfigData.lastManualSentAt || null,
            lastManualSentCount: updatedConfigData.lastManualSentCount || null,
          }));
        }
      } else {
        setDigestSendNowResult({
          ok: false,
          error: "Unknown error",
        });
      }
    } catch (error: any) {
      console.error("[AdminExtrasPage] Failed to send digest:", error);
      const errorMessage = error.message || String(error);
      setDigestSendNowResult({
        ok: false,
        error: errorMessage,
      });
      // Show alert with helpful message
      if (
        errorMessage.includes("No active digest config") ||
        errorMessage.includes("No digest config")
      ) {
        alert(
          "Error: " +
            errorMessage +
            "\n\nPlease ensure:\n1. The 'Active' checkbox is checked\n2. You have clicked 'Save Digest Config'\n3. The save was successful"
        );
      }
    } finally {
      setDigestSendNowBusy(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    console.log("[AdminExtrasPage] Delete post clicked:", {
      postId,
      isAdmin,
      adminLoading,
    });

    if (adminLoading) {
      alert("Please wait while we verify your admin status...");
      return;
    }

    if (!isAdmin) {
      console.error("[AdminExtrasPage] User is not an admin:", {
        isAdmin,
        adminLoading,
      });
      alert(
        "Only admins can delete posts. If you believe this is an error, please refresh the page."
      );
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this post? This will also delete all comments."
      )
    ) {
      return;
    }

    try {
      console.log("[AdminExtrasPage] Deleting post:", postId);
      await deleteDoc(doc(db, "posts", postId));
      console.log("[AdminExtrasPage] Post deleted successfully");
      alert("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(
        "Failed to delete post: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  const handleGenerateInsights = async () => {
    if (!insightsTmdbId) {
      alert("Please enter a TMDB ID");
      return;
    }

    setInsightsGenerating(true);
    setInsightsResult(null);

    try {
      // Parse genres (comma-separated)
      const genresArray = insightsGenres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      // Build metadata object
      const metadata = {
        tmdbId: parseInt(insightsTmdbId),
        id: parseInt(insightsTmdbId),
        title: insightsTitle || "Unknown Title",
        mediaType: insightsMediaType,
        genres: genresArray,
        year: insightsYear ? parseInt(insightsYear) : null,
        runtimeMins: insightsRuntime ? parseInt(insightsRuntime) : null,
      };

      // Call Firebase callable function (which securely calls Netlify function)
      const { getFunctions, httpsCallable } = await import(
        "firebase/functions"
      );
      const functions = getFunctions();
      const ingestGoofs = httpsCallable(functions, "ingestGoofs");

      const result = await ingestGoofs({
        mode: "single",
        tmdbId: insightsTmdbId,
        metadata: metadata,
      });

      const data = result.data as any;
      setInsightsResult({
        success: data.success || true,
        itemsGenerated: data.itemsGenerated || 0,
      });

      // Clear form
      setInsightsTmdbId("");
      setInsightsTitle("");
      setInsightsGenres("");
      setInsightsYear("");
      setInsightsRuntime("");
    } catch (error: any) {
      console.error("Failed to generate insights:", error);
      setInsightsResult({
        success: false,
        error: error.message || String(error),
      });
    } finally {
      setInsightsGenerating(false);
    }
  };

  const handleBulkIngestion = async () => {
    // Confirm before running bulk ingestion
    const confirmed = window.confirm(
      "Run bulk goofs ingestion now? This will process all titles in Firestore and may take a while."
    );

    if (!confirmed) {
      return;
    }

    setBulkIngestionRunning(true);
    setBulkIngestionResult(null);

    try {
      const { getFunctions, httpsCallable } = await import(
        "firebase/functions"
      );
      const functions = getFunctions();
      const ingestGoofs = httpsCallable(functions, "ingestGoofs");

      const result = await ingestGoofs({
        mode: "bulk",
      });

      const data = result.data as any;
      setBulkIngestionResult({
        success: data.success || true,
        total: data.total || 0,
        succeeded: data.succeeded || data.count || 0,
        failed: data.failed || 0,
      });
    } catch (error: any) {
      console.error("Failed to run bulk ingestion:", error);

      // Extract error message from Firebase callable function error
      let errorMessage = "Unknown error";
      if (error) {
        // Firebase callable functions return error with code and message
        if (error.message) {
          errorMessage = error.message;
        } else if (error.code) {
          errorMessage = `Error code: ${error.code}`;
        } else if (typeof error === "string") {
          errorMessage = error;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }

      setBulkIngestionResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setBulkIngestionRunning(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    console.log("[AdminExtrasPage] Delete comment clicked:", {
      commentId,
      selectedPostId,
      isAdmin,
      adminLoading,
    });

    if (adminLoading) {
      alert("Please wait while we verify your admin status...");
      return;
    }

    if (!isAdmin) {
      console.error("[AdminExtrasPage] User is not an admin:", {
        isAdmin,
        adminLoading,
      });
      alert(
        "Only admins can delete comments. If you believe this is an error, please refresh the page."
      );
      return;
    }

    if (!selectedPostId) {
      alert("No post selected");
      return;
    }

    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      console.log("[AdminExtrasPage] Deleting comment:", {
        commentId,
        postId: selectedPostId,
      });
      await deleteDoc(doc(db, "posts", selectedPostId, "comments", commentId));
      console.log("[AdminExtrasPage] Comment deleted successfully");
      alert("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert(
        "Failed to delete comment: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  const pendingCount = videos.filter((v) => v.status === "pending").length;
  const approvedCount = videos.filter((v) => v.status === "approved").length;
  const rejectedCount = videos.filter((v) => v.status === "rejected").length;
  const pendingUGC = ugcSubmissions.filter(
    (s) => s.status === "pending"
  ).length;

  return (
    <>
      <style>{`
        /* Root container - SettingsPage provides padding, so no padding here */
        .admin-extras-root {
          min-height: auto;
          width: 100%;
          background: transparent;
          color: var(--text);
        }

        /* Tabs - Real pills - normalized spacing */
        .admin-extras-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
          position: relative;
          contain: layout style;
        }
        
        /* Ensure tabs don't overflow parent container */
        .admin-extras-tabs button {
          flex-shrink: 0;
        }

        .admin-extras-tabs::-webkit-scrollbar {
          display: none;
        }

        .admin-extras-tab {
          white-space: nowrap;
          border-radius: 9999px;
          padding: 0.35rem 0.9rem;
          font-size: 0.85rem;
          border: 1px solid var(--line, #d1d5db);
          background: var(--card, #f9fafb);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          max-width: fit-content;
        }

        .admin-extras-tab:hover {
          background: var(--btn, #f3f4f6);
        }

        .admin-extras-tab--active {
          border-color: var(--accent-primary, #3b82f6);
          background: var(--accent-primary, #3b82f6);
          color: #fff;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .admin-extras-tab--active:hover {
          background: var(--accent-primary, #3b82f6);
          opacity: 0.95;
        }

        /* Compact sections */
        .admin-extras-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Form fields - stack on mobile */
        @media (max-width: 900px) {
          .admin-extras-section--auto .admin-extras-fields {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
        }

        @media (min-width: 901px) {
          .admin-extras-section--auto .admin-extras-fields {
            display: flex;
            flex-direction: row;
            gap: 0.75rem;
            align-items: center;
          }
        }

        /* Counts row - compact badges */
        .admin-extras-counts-row {
          display: flex;
          flex-wrap: nowrap;
          gap: 0.5rem;
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }

        .admin-extras-counts-row span {
          padding: 0.2rem 0.45rem;
          border-radius: 9999px;
          background: var(--card, #f3f4f6);
          border: 1px solid var(--line, #e2e8f0);
          color: var(--text);
          white-space: nowrap;
        }

        /* Helper text */
        .admin-extras-helper {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: var(--muted, #6b7280);
          text-align: center;
        }


        /* Mobile: Touch-friendly buttons and prevent horizontal scroll */
        @media (max-width: 900px) {
          .admin-extras-root {
            overflow-x: hidden;
            max-width: 100%;
          }
          
          /* Ensure all buttons are touch-friendly (minimum 44px height) */
          .admin-extras-root button,
          .admin-extras-root input[type="button"],
          .admin-extras-root input[type="submit"] {
            min-height: 44px;
            padding: 12px 16px;
            font-size: 16px;
          }
          
          /* Ensure text inputs are touch-friendly */
          .admin-extras-root input[type="text"],
          .admin-extras-root input[type="number"],
          .admin-extras-root textarea,
          .admin-extras-root select {
            min-height: 44px;
            font-size: 16px;
            padding: 12px;
          }
          
          /* Prevent horizontal scrolling */
          .admin-extras-section {
            overflow-x: hidden;
            width: 100%;
          }
          
          /* Ensure content wraps instead of scrolling horizontally */
          .admin-extras-counts-row {
            flex-wrap: wrap;
          }
        }
      `}</style>
      <div className="admin-extras-root space-y-6">
        {/* Main heading - matches other Settings sections */}
        <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          {activeTab === "community"
            ? "Community Content Management"
            : activeTab === "moderation"
              ? "Moderation Queue"
              : activeTab === "content"
                ? "Auto Content"
                : activeTab === "insights"
                  ? "Insights & Easter Eggs"
                  : activeTab === "comments"
                    ? "Marquee Comments"
                    : activeTab === "videos"
                      ? "Video Submissions"
                      : activeTab === "pro"
                        ? "Pro Status"
                        : activeTab === "admin"
                          ? "Admin Management"
                          : "Admin"}
        </h3>

        {/* Helper text based on active tab */}
        {activeTab === "community" && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Manage all community posts and comments. This is not limited to
            reported content.
          </p>
        )}
        {activeTab === "moderation" && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Items hidden here are removed from Community for regular users. Use
            this to review reports and hide/unhide content.
          </p>
        )}

        {/* Tabs - Dropdown on mobile, horizontal pills on desktop */}
        {isMobile ? (
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
            style={{
              width: "100%",
              maxWidth: "240px",
              padding: "8px 12px",
              fontSize: "15px",
              borderRadius: "8px",
              backgroundColor: "var(--card)",
              border: "1px solid var(--line)",
              color: "var(--text)",
              minHeight: "40px",
              WebkitAppearance: "none",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              paddingRight: "32px",
            }}
          >
            <option value="community">Community Content</option>
            {isAdmin && (
              <option value="moderation">
                Moderation
                {pendingReportsCount > 0 ? ` (${pendingReportsCount})` : ""}
              </option>
            )}
            <option value="content">Auto Content</option>
            <option value="insights">Insights & Easter Eggs</option>
            <option value="comments">Marquee Comments ({pendingUGC})</option>
            <option value="videos">Video Submissions ({pendingUGC})</option>
            <option value="pro">Pro Status</option>
            {isAdmin && <option value="admin">Admin Management</option>}
          </select>
        ) : (
          <div
            className="admin-extras-tabs"
            style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
          >
            <button
              onClick={() => setActiveTab("community")}
              className={`admin-extras-tab ${activeTab === "community" ? "admin-extras-tab--active" : ""}`}
              title="Community Content"
            >
              Community Content
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("moderation")}
                className={`admin-extras-tab ${activeTab === "moderation" ? "admin-extras-tab--active" : ""}`}
                title="Moderation Queue"
              >
                Moderation
                {pendingReportsCount > 0 && (
                  <span style={{ marginLeft: "0.25rem", fontWeight: "bold" }}>
                    ({pendingReportsCount})
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab("content")}
              className={`admin-extras-tab ${activeTab === "content" ? "admin-extras-tab--active" : ""}`}
              title="Auto Content"
            >
              Auto Content
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`admin-extras-tab ${activeTab === "insights" ? "admin-extras-tab--active" : ""}`}
              title="Insights & Easter Eggs"
            >
              Insights & Easter Eggs
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`admin-extras-tab ${activeTab === "comments" ? "admin-extras-tab--active" : ""}`}
              title={`Marquee Comments (${pendingUGC})`}
            >
              Marquee Comments ({pendingUGC})
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`admin-extras-tab ${activeTab === "videos" ? "admin-extras-tab--active" : ""}`}
              title={`Video Submissions (${pendingUGC})`}
            >
              Video Submissions ({pendingUGC})
            </button>
            <button
              onClick={() => setActiveTab("pro")}
              className={`admin-extras-tab ${activeTab === "pro" ? "admin-extras-tab--active" : ""}`}
              title="Pro Status"
            >
              Pro Status
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`admin-extras-tab ${activeTab === "admin" ? "admin-extras-tab--active" : ""}`}
                title="Admin Management"
              >
                Admin Management
              </button>
            )}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "insights" && (
          <div className="space-y-6">
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--line)",
              }}
            >
              <h4
                className="text-lg font-medium mb-3"
                style={{ color: "var(--text)" }}
              >
                Generate Insights & Easter Eggs
              </h4>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                Generate original &quot;Insights &amp; Easter Eggs&quot; content
                from title metadata. Content is generated using templates +
                metadata, NOT from external copyrighted sources.
                <br />
                <br />
                <strong>Data Flow:</strong> Admin triggers ingestion → Netlify
                function fetches/transforms data → Writes to Firestore → Clients
                read from Firestore (no direct external API calls).
              </p>

              <div
                className="space-y-3"
                style={{ gap: isMobile ? "0.75rem" : "1rem" }}
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    TMDB ID (required)
                  </label>
                  <input
                    type="text"
                    value={insightsTmdbId}
                    onChange={(e) => setInsightsTmdbId(e.target.value)}
                    placeholder="e.g., 1399"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    style={{
                      borderColor: "var(--line)",
                      backgroundColor: "var(--card)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={insightsTitle}
                    onChange={(e) => setInsightsTitle(e.target.value)}
                    placeholder="e.g., Game of Thrones"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    style={{
                      borderColor: "var(--line)",
                      backgroundColor: "var(--card)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Media Type
                  </label>
                  <select
                    value={insightsMediaType}
                    onChange={(e) =>
                      setInsightsMediaType(e.target.value as "movie" | "tv")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    style={{
                      borderColor: "var(--line)",
                      backgroundColor: "var(--card)",
                      color: "var(--text)",
                    }}
                  >
                    <option value="tv">TV Show</option>
                    <option value="movie">Movie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Genres (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={insightsGenres}
                    onChange={(e) => setInsightsGenres(e.target.value)}
                    placeholder="e.g., drama, fantasy, action"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    style={{
                      borderColor: "var(--line)",
                      backgroundColor: "var(--card)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                <div
                  className={`${isMobile ? "flex flex-col gap-3" : "grid grid-cols-2 gap-4"}`}
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Year
                    </label>
                    <input
                      type="text"
                      value={insightsYear}
                      onChange={(e) => setInsightsYear(e.target.value)}
                      placeholder="e.g., 2011"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      style={{
                        borderColor: "var(--line)",
                        backgroundColor: "var(--card)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Runtime (minutes)
                    </label>
                    <input
                      type="text"
                      value={insightsRuntime}
                      onChange={(e) => setInsightsRuntime(e.target.value)}
                      placeholder="e.g., 60"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      style={{
                        borderColor: "var(--line)",
                        backgroundColor: "var(--card)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>

                <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                  Use this for one-off fixes or testing a specific TMDB ID.
                </p>

                <button
                  onClick={handleGenerateInsights}
                  disabled={
                    insightsGenerating ||
                    !insightsTmdbId ||
                    bulkIngestionRunning
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {insightsGenerating ? "Generating..." : "Generate Insights"}
                </button>

                {insightsResult && (
                  <div
                    className={`p-4 rounded ${
                      insightsResult.success
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                    style={{
                      backgroundColor: insightsResult.success
                        ? "var(--card)"
                        : "var(--card)",
                      borderColor: "var(--line)",
                    }}
                  >
                    {insightsResult.success ? (
                      <p
                        className="text-sm text-green-800"
                        style={{ color: "var(--text)" }}
                      >
                        ✅ Successfully generated{" "}
                        {insightsResult.itemsGenerated} insights and saved to
                        Firestore. Users will see them the next time they open
                        the Insights &amp; Easter Eggs modal.
                      </p>
                    ) : (
                      <p
                        className="text-sm text-red-800"
                        style={{ color: "var(--text)" }}
                      >
                        ❌ Error: {insightsResult.error || "Unknown error"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Bulk Ingestion Section */}
              <div
                className="mt-6 pt-6"
                style={{
                  borderTop: "1px solid var(--line)",
                }}
              >
                <h5
                  className="text-md font-medium mb-2"
                  style={{ color: "var(--text)" }}
                >
                  Bulk Ingestion
                </h5>
                <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                  Use this to refresh goofs/insights for all configured shows.
                  Fetches titles from Firestore (titles collection or user
                  watchlists) and processes them automatically. No TMDB IDs
                  required.
                </p>

                <button
                  onClick={handleBulkIngestion}
                  disabled={
                    bulkIngestionRunning ||
                    insightsGenerating ||
                    bulkIngestionRunning
                  }
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkIngestionRunning
                    ? "Running bulk ingestion..."
                    : "Run bulk goofs ingestion"}
                </button>

                {bulkIngestionResult && (
                  <div
                    className={`mt-4 p-4 rounded ${
                      bulkIngestionResult.success
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                    style={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--line)",
                    }}
                  >
                    {bulkIngestionResult.success ? (
                      <div className="text-sm" style={{ color: "var(--text)" }}>
                        <p className="mb-2">✅ Bulk ingestion complete!</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            Total titles processed:{" "}
                            {bulkIngestionResult.total || 0}
                          </li>
                          <li>
                            Successfully updated:{" "}
                            {bulkIngestionResult.succeeded || 0}
                          </li>
                          {bulkIngestionResult.failed !== undefined &&
                            bulkIngestionResult.failed > 0 && (
                              <li style={{ color: "var(--muted)" }}>
                                Failed: {bulkIngestionResult.failed}
                              </li>
                            )}
                        </ul>
                        <p
                          className="mt-2 text-xs"
                          style={{ color: "var(--muted)" }}
                        >
                          Users will see updated insights the next time they
                          open the Insights &amp; Easter Eggs modal.
                        </p>
                      </div>
                    ) : (
                      <p
                        className="text-sm text-red-800"
                        style={{ color: "var(--text)" }}
                      >
                        ❌ Error: {bulkIngestionResult.error || "Unknown error"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="admin-extras-section admin-extras-section--auto">
              <div className="admin-extras-fields">
                <input
                  type="text"
                  placeholder="Show Title"
                  value={selectedShow}
                  onChange={(e) => setSelectedShow(e.target.value)}
                  className="px-3 py-2 border rounded flex-1"
                  style={{
                    borderColor: "var(--line)",
                    backgroundColor: "var(--card)",
                    color: "var(--text)",
                  }}
                />
                <input
                  type="number"
                  placeholder="Show ID"
                  value={showId || ""}
                  onChange={(e) => setShowId(parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border rounded flex-1"
                  style={{
                    borderColor: "var(--line)",
                    backgroundColor: "var(--card)",
                    color: "var(--text)",
                  }}
                />
                <button
                  onClick={handleFetchVideos}
                  disabled={loading || !showId}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  style={{ flexShrink: 0 }}
                >
                  {loading ? "Fetching..." : "Fetch Videos"}
                </button>
              </div>

              {/* Stats - Horizontal badge row */}
              <div className="admin-extras-counts-row">
                <span>Pending: {pendingCount}</span>
                <span>Approved: {approvedCount}</span>
                <span>Rejected: {rejectedCount}</span>
              </div>
            </div>

            {/* Bulk Actions */}
            {videos.length > 0 && (
              <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
                <button
                  onClick={handleBulkApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve All
                </button>
                <button
                  onClick={handleBulkReject}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject All
                </button>
              </div>
            )}

            {/* Videos List */}
            <div
              className={`grid grid-cols-1 ${isMobile ? "" : "md:grid-cols-2 lg:grid-cols-3"} gap-4`}
            >
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`border rounded-lg ${isMobile ? "p-2.5" : "p-4"} ${
                    video.status === "approved"
                      ? "border-green-500 bg-green-50"
                      : video.status === "rejected"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                  }`}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {video.channelName}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        video.category === "bloopers"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {video.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {video.provider}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveVideo(video.id)}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectVideo(video.id)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <a
                      href={video.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {videos.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                Enter a show title and ID, then click "Fetch Videos" to get
                started.
              </div>
            )}
          </div>
        )}

        {/* Marquee Comments Tab */}
        {activeTab === "comments" && (
          <div className="space-y-6">
            {ugcSubmissions
              .filter((s) => s.type === "comment")
              .map((submission) => (
                <div
                  key={submission.id}
                  className={`border rounded-lg p-4 ${
                    submission.status === "approved"
                      ? "border-green-500 bg-green-50"
                      : submission.status === "rejected"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{submission.showName}</h3>
                      <p
                        className="text-sm text-gray-600"
                        style={{ color: "var(--muted)" }}
                      >
                        By {submission.submittedBy} •{" "}
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        submission.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : submission.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{submission.content}</p>
                  {submission.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveUGC(submission.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt("Rejection reason:");
                          if (reason) handleRejectUGC(submission.id, reason);
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {submission.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2">
                      Rejected: {submission.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            {ugcSubmissions.filter((s) => s.type === "comment").length ===
              0 && (
              <div className="text-center py-8 text-gray-500">
                No marquee comment submissions found.
              </div>
            )}
          </div>
        )}

        {/* Video Submissions Tab */}
        {activeTab === "videos" && (
          <div className="space-y-6">
            {ugcSubmissions
              .filter((s) => s.type === "video")
              .map((submission) => (
                <div
                  key={submission.id}
                  className={`border rounded-lg p-4 ${
                    submission.status === "approved"
                      ? "border-green-500 bg-green-50"
                      : submission.status === "rejected"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{submission.showName}</h3>
                      <p
                        className="text-sm text-gray-600"
                        style={{ color: "var(--muted)" }}
                      >
                        By {submission.submittedBy} •{" "}
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        submission.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : submission.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{submission.content}</p>
                  {submission.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveUGC(submission.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt("Rejection reason:");
                          if (reason) handleRejectUGC(submission.id, reason);
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {submission.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2">
                      Rejected: {submission.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            {ugcSubmissions.filter((s) => s.type === "video").length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No video submissions found.
              </div>
            )}
          </div>
        )}

        {/* Community Content Tab */}
        {activeTab === "community" && (
          <div className="space-y-6">
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--line)",
              }}
            >
              {adminLoading ? (
                <p
                  className="text-sm text-yellow-600 mb-4"
                  style={{ color: "var(--muted)" }}
                >
                  ⏳ Verifying admin status...
                </p>
              ) : isAdmin ? (
                <p
                  className="text-sm text-green-600 mb-4"
                  style={{ color: "var(--text)" }}
                >
                  ✓ Admin verified. You can delete any post or comment.
                </p>
              ) : (
                <div
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--line)",
                  }}
                >
                  <p
                    className="text-sm text-red-600 mb-2"
                    style={{ color: "var(--text)" }}
                  >
                    ⚠️ Admin status not verified. Delete actions are disabled.
                  </p>
                  <p
                    className="text-xs text-red-500 mb-3"
                    style={{ color: "var(--muted)" }}
                  >
                    Your Firebase Auth token does not have the admin role claim.
                    This needs to be set via a Cloud Function or Firebase
                    Console.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={async () => {
                        try {
                          const { auth } = await import(
                            "../lib/firebaseBootstrap"
                          );
                          if (!auth.currentUser) {
                            alert("You must be signed in to grant admin role");
                            return;
                          }

                          // Get the ID token
                          const token = await auth.currentUser.getIdToken();

                          // Call the HTTP function
                          const functionUrl = import.meta.env.DEV
                            ? "http://localhost:5001/flicklet-71dff/us-central1/setAdminRole"
                            : "https://us-central1-flicklet-71dff.cloudfunctions.net/setAdminRole";

                          console.log(
                            "[AdminExtrasPage] Calling setAdminRole function..."
                          );

                          const response = await fetch(functionUrl, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            credentials: "include",
                          });

                          console.log(
                            "[AdminExtrasPage] Response status:",
                            response.status,
                            response.statusText
                          );
                          console.log(
                            "[AdminExtrasPage] Response headers:",
                            Object.fromEntries(response.headers.entries())
                          );

                          const responseText = await response.text();
                          console.log(
                            "[AdminExtrasPage] Response text:",
                            responseText
                          );

                          if (!response.ok) {
                            let errorData;
                            try {
                              errorData = JSON.parse(responseText);
                            } catch {
                              errorData = {
                                error:
                                  responseText || `HTTP ${response.status}`,
                              };
                            }
                            throw new Error(
                              errorData.error || `HTTP ${response.status}`
                            );
                          }

                          let result;
                          try {
                            result = JSON.parse(responseText);
                          } catch (e) {
                            console.error(
                              "[AdminExtrasPage] Failed to parse JSON:",
                              e,
                              "Response text:",
                              responseText
                            );
                            throw new Error(
                              "Invalid response format from server"
                            );
                          }

                          console.log(
                            "[AdminExtrasPage] setAdminRole result:",
                            result
                          );
                          alert(
                            "Admin role granted! Please sign out and sign back in for it to take effect."
                          );
                        } catch (error: any) {
                          console.error(
                            "[AdminExtrasPage] Failed to set admin role:",
                            error
                          );
                          if (
                            error.message?.includes("CORS") ||
                            error.message?.includes("Failed to fetch")
                          ) {
                            alert(
                              "CORS error: Cannot call Cloud Function.\n\n" +
                                "The function may need to be redeployed. Please try:\n" +
                                "1. Redeploy functions: 'firebase deploy --only functions'\n" +
                                "2. Or use Firebase Console to set admin role directly"
                            );
                          } else {
                            alert(
                              "Failed to set admin role: " +
                                (error.message || String(error))
                            );
                          }
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Grant Admin Role
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { auth } = await import(
                            "../lib/firebaseBootstrap"
                          );
                          if (auth.currentUser) {
                            console.log(
                              "[AdminExtrasPage] Refreshing token..."
                            );
                            const token =
                              await auth.currentUser.getIdTokenResult(true); // Force refresh
                            console.log(
                              "[AdminExtrasPage] Token claims after refresh:",
                              token.claims
                            );
                            console.log(
                              "[AdminExtrasPage] Role:",
                              token.claims.role
                            );
                            if (token.claims.role === "admin") {
                              alert("Admin role verified! Reloading page...");
                              window.location.reload();
                            } else {
                              alert(
                                "Admin role still not found in token. Please grant the role first, then sign out and sign back in."
                              );
                            }
                          }
                        } catch (error) {
                          console.error("Failed to refresh token:", error);
                          alert(
                            "Failed to refresh token. Please try logging out and back in."
                          );
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Refresh Admin Token
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { auth } = await import(
                            "../lib/firebaseBootstrap"
                          );
                          if (auth.currentUser) {
                            const token =
                              await auth.currentUser.getIdTokenResult();
                            console.log(
                              "[AdminExtrasPage] Current token claims:",
                              token.claims
                            );
                            console.log(
                              "[AdminExtrasPage] Full token result:",
                              token
                            );
                            alert(
                              `Token claims logged to console. Role: ${token.claims.role || "not set"}`
                            );
                          }
                        } catch (error) {
                          console.error("Failed to get token:", error);
                        }
                      }}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Check Token (Console)
                    </button>
                  </div>
                </div>
              )}

              {/* Posts List */}
              <div className="mb-4">
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: "var(--text)" }}
                >
                  Posts ({posts.length})
                </h3>
                <div className="space-y-2">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                      style={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--line)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {post.title || "Untitled"}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          By {post.authorName || "Unknown"} •{" "}
                          {post.publishedAt?.toDate?.()?.toLocaleDateString() ||
                            "Unknown date"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {post.commentCount || 0} comments •{" "}
                          {post.voteCount || 0} votes
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() =>
                            setSelectedPostId(
                              post.id === selectedPostId ? null : post.id
                            )
                          }
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          {selectedPostId === post.id
                            ? "Hide Comments"
                            : "View Comments"}
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {posts.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No posts found
                    </p>
                  )}
                </div>
              </div>

              {/* Comments for Selected Post */}
              {selectedPostId && (
                <div className="mt-4">
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: "var(--text)" }}
                  >
                    Comments ({postComments.length})
                  </h3>
                  <div className="space-y-2">
                    {postComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 bg-white rounded border border-gray-200"
                        style={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--line)",
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {comment.authorName || "Anonymous"}
                            </p>
                            <p
                              className="text-sm text-gray-600 mt-1 whitespace-pre-wrap"
                              style={{ color: "var(--text)" }}
                            >
                              {comment.body}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {comment.createdAt
                                ?.toDate?.()
                                ?.toLocaleDateString() || "Unknown date"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {postComments.length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        No comments for this post
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pro Status Tab */}
        {activeTab === "pro" && (
          <div className="space-y-6">
            <div
              className="bg-gray-100 rounded-lg p-6"
              style={{ backgroundColor: "var(--card)" }}
            >
              <h2 className="text-2xl font-bold mb-4">Pro Status Management</h2>

              <div className="space-y-4">
                <div
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--line)",
                  }}
                >
                  <div>
                    <h3
                      className="text-lg font-semibold mb-1"
                      style={{ color: "var(--text)" }}
                    >
                      Pro Status
                    </h3>
                    <p
                      className="text-sm text-gray-600"
                      style={{ color: "var(--muted)" }}
                    >
                      Current status:{" "}
                      <strong
                        className={isPro ? "text-green-600" : "text-gray-500"}
                      >
                        {isPro ? "Pro Enabled" : "Pro Disabled"}
                      </strong>
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPro}
                      onChange={handleTogglePro}
                      className="sr-only peer"
                    />
                    <div
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                      style={{
                        backgroundColor: "var(--btn)",
                        borderColor: "var(--line)",
                      }}
                    ></div>
                  </label>
                </div>

                {isPro && (
                  <div
                    className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
                    style={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--line)",
                    }}
                  >
                    <h4
                      className="font-semibold text-green-800 mb-2"
                      style={{ color: "var(--text)" }}
                    >
                      Pro Features Enabled:
                    </h4>
                    <ul
                      className="list-disc list-inside space-y-1 text-sm text-green-700"
                      style={{ color: "var(--text)" }}
                    >
                      <li>Advanced Notifications</li>
                      <li>Theme Packs</li>
                      <li>Social Features</li>
                      <li>Bloopers Access</li>
                      <li>Extras Access</li>
                      <li>3 FlickWord games per day (vs 1 for free)</li>
                      <li>50 Trivia questions (vs 10 for free)</li>
                    </ul>
                  </div>
                )}

                {!isPro && (
                  <div
                    className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    style={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--line)",
                    }}
                  >
                    <h4
                      className="font-semibold text-gray-800 mb-2"
                      style={{ color: "var(--text)" }}
                    >
                      Free Tier Limitations:
                    </h4>
                    <ul
                      className="list-disc list-inside space-y-1 text-sm text-gray-700"
                      style={{ color: "var(--text)" }}
                    >
                      <li>1 FlickWord game per day</li>
                      <li>10 Trivia questions per day</li>
                      <li>No advanced notifications</li>
                      <li>No theme packs</li>
                      <li>No social features</li>
                      <li>No bloopers/extras access</li>
                    </ul>
                  </div>
                )}

                <div
                  className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--line)",
                  }}
                >
                  <p
                    className="text-sm text-blue-800"
                    style={{ color: "var(--text)" }}
                  >
                    <strong>Note:</strong> This toggle controls Pro status for
                    the current user. Changes are saved immediately to
                    localStorage and will persist across sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Moderation Queue Tab */}
        {activeTab === "moderation" && isAdmin && (
          <ModerationQueue
            reports={reports}
            reportsLoading={reportsLoading}
            processingReport={processingReport}
            onLoadReports={async () => {
              setReportsLoading(true);
              try {
                const allReports = await getAllReports();
                setReports(allReports);
              } catch (error) {
                console.error("Failed to load reports:", error);
                alert("Failed to load reports. Please try again.");
              } finally {
                setReportsLoading(false);
              }
            }}
            onUpdateStatus={async (reportId, status) => {
              setProcessingReport(reportId);
              try {
                await updateReportStatus(reportId, status);
                // Reload reports
                const allReports = await getAllReports();
                setReports(allReports);
              } catch (error) {
                console.error("Failed to update report status:", error);
                alert("Failed to update report status. Please try again.");
              } finally {
                setProcessingReport(null);
              }
            }}
            onToggleHidden={async (report) => {
              setProcessingReport(report.id);
              try {
                if (report.itemType === "post") {
                  // Get current hidden state
                  const postRef = doc(db, "posts", report.itemId);
                  const postSnap = await getDoc(postRef);
                  const currentHidden = postSnap.data()?.hidden || false;
                  await toggleItemHidden(report.itemId, "post", !currentHidden);
                } else {
                  // For comments, we need to find the postId
                  // This is a limitation - we'll need to store postId in reports or query for it
                  // For now, let's add a helper to find postId from commentId
                  const postsRef = collection(db, "posts");
                  const postsSnapshot = await getDocs(postsRef);
                  let foundPostId: string | null = null;

                  for (const postDoc of postsSnapshot.docs) {
                    const commentsRef = collection(
                      db,
                      "posts",
                      postDoc.id,
                      "comments"
                    );
                    const commentDoc = doc(commentsRef, report.itemId);
                    const commentSnap = await getDoc(commentDoc);
                    if (commentSnap.exists()) {
                      foundPostId = postDoc.id;
                      break;
                    }
                  }

                  if (foundPostId) {
                    const commentRef = doc(
                      db,
                      "posts",
                      foundPostId,
                      "comments",
                      report.itemId
                    );
                    const commentSnap = await getDoc(commentRef);
                    const currentHidden = commentSnap.data()?.hidden || false;
                    await toggleCommentHidden(
                      foundPostId,
                      report.itemId,
                      !currentHidden
                    );
                  } else {
                    throw new Error("Could not find post for comment");
                  }
                }
                // Reload reports
                const allReports = await getAllReports();
                setReports(allReports);
              } catch (error) {
                console.error("Failed to toggle hidden status:", error);
                alert("Failed to toggle hidden status. Please try again.");
              } finally {
                setProcessingReport(null);
              }
            }}
          />
        )}

        {/* Admin Management Tab */}
        {activeTab === "admin" && isAdmin && (
          <div className="space-y-6">
            {/* Weekly Digest Config */}
            <div
              className="bg-gray-100 rounded-lg p-6"
              style={{ backgroundColor: "var(--card)" }}
            >
              <h2 className="text-2xl font-bold mb-4">
                Weekly Digest Email Configuration
              </h2>
              <p
                className="text-sm text-gray-600 mb-4"
                style={{ color: "var(--muted)" }}
              >
                Configure the content for the weekly digest email sent to
                subscribers.
              </p>

              {digestConfigLoading ? (
                <div className="text-center py-4">Loading config...</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={digestConfig.isActive}
                        onChange={(e) =>
                          setDigestConfig({
                            ...digestConfig,
                            isActive: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="font-medium">
                        Active (emails will be sent when enabled)
                      </span>
                    </label>
                  </div>

                  <div
                    className="border-t border-gray-300 pt-4"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <h3 className="font-semibold mb-3">
                      Automatic Send Settings
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={digestConfig.autoSendEnabled}
                            onChange={(e) =>
                              setDigestConfig({
                                ...digestConfig,
                                autoSendEnabled: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="font-medium">
                            Automatic weekly send enabled
                          </span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Day of week (for weekly send)
                        </label>
                        <select
                          value={digestConfig.autoSendDay}
                          onChange={(e) =>
                            setDigestConfig({
                              ...digestConfig,
                              autoSendDay: e.target.value,
                            })
                          }
                          disabled={!digestConfig.autoSendEnabled}
                          className="w-full px-3 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            borderColor: "var(--line)",
                            backgroundColor: "var(--card)",
                            color: "var(--text)",
                          }}
                        >
                          <option value="monday">Monday</option>
                          <option value="tuesday">Tuesday</option>
                          <option value="wednesday">Wednesday</option>
                          <option value="thursday">Thursday</option>
                          <option value="friday">Friday</option>
                          <option value="saturday">Saturday</option>
                          <option value="sunday">Sunday</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Time of day
                        </label>
                        <input
                          type="time"
                          value={digestConfig.autoSendTime}
                          onChange={(e) =>
                            setDigestConfig({
                              ...digestConfig,
                              autoSendTime: e.target.value,
                            })
                          }
                          disabled={!digestConfig.autoSendEnabled}
                          className="w-full px-3 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            borderColor: "var(--line)",
                            backgroundColor: "var(--card)",
                            color: "var(--text)",
                          }}
                        />
                      </div>

                      <p
                        className="text-xs text-gray-500 italic"
                        style={{ color: "var(--muted)" }}
                      >
                        Current backend schedule still uses a fixed cron
                        trigger; this day/time is stored in config and will be
                        fully honored in a later update. The On/Off toggle is
                        effective now: when off, the automatic send is skipped.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Subject / Title
                    </label>
                    <input
                      type="text"
                      value={digestConfig.title}
                      onChange={(e) =>
                        setDigestConfig({
                          ...digestConfig,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      style={{
                        borderColor: "var(--line)",
                        backgroundColor: "var(--card)",
                        color: "var(--text)",
                      }}
                      placeholder="🎬 Flicklet Weekly — We actually shipped things."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Intro Text
                    </label>
                    <textarea
                      value={digestConfig.intro}
                      onChange={(e) =>
                        setDigestConfig({
                          ...digestConfig,
                          intro: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      style={{
                        borderColor: "var(--line)",
                        backgroundColor: "var(--card)",
                        color: "var(--text)",
                      }}
                      placeholder="Here's your Flicklet update in under a minute."
                    />
                  </div>

                  <div
                    className="border-t border-gray-300 pt-4"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <h3 className="font-semibold mb-3">
                      Product Pulse Section
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          What Changed (🔧)
                        </label>
                        <input
                          type="text"
                          value={digestConfig.productPulseChanged}
                          onChange={(e) =>
                            setDigestConfig({
                              ...digestConfig,
                              productPulseChanged: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          style={{
                            borderColor: "var(--line)",
                            backgroundColor: "var(--card)",
                            color: "var(--text)",
                          }}
                          placeholder="Ratings now stick between sessions."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          What's Next (👀)
                        </label>
                        <input
                          type="text"
                          value={digestConfig.productPulseNext}
                          onChange={(e) =>
                            setDigestConfig({
                              ...digestConfig,
                              productPulseNext: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          style={{
                            borderColor: "var(--line)",
                            backgroundColor: "var(--card)",
                            color: "var(--text)",
                          }}
                          placeholder="• Smarter discovery rails • Swipe gestures that don't argue with gravity"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          How to Use It
                        </label>
                        <input
                          type="text"
                          value={digestConfig.productPulseHowTo}
                          onChange={(e) =>
                            setDigestConfig({
                              ...digestConfig,
                              productPulseHowTo: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          style={{
                            borderColor: "var(--line)",
                            backgroundColor: "var(--card)",
                            color: "var(--text)",
                          }}
                          placeholder="Tap ★ once. It remembers now."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Hidden Bonus
                        </label>
                        <input
                          type="text"
                          value={digestConfig.productPulseBonus}
                          onChange={(e) =>
                            setDigestConfig({
                              ...digestConfig,
                              productPulseBonus: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          style={{
                            borderColor: "var(--line)",
                            backgroundColor: "var(--card)",
                            color: "var(--text)",
                          }}
                          placeholder="Library loads faster so you spend less time staring at spinners."
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="border-t border-gray-300 pt-4"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <h3 className="font-semibold mb-3">Tip Section</h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tip Headline
                        </label>
                        <input
                          type="text"
                          value={digestConfig.tipHeadline}
                          onChange={(e) =>
                            setDigestConfig({
                              ...digestConfig,
                              tipHeadline: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          style={{
                            borderColor: "var(--line)",
                            backgroundColor: "var(--card)",
                            color: "var(--text)",
                          }}
                          placeholder="The One Thing You Didn't Know You Needed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tip Body
                        </label>
                        <textarea
                          value={digestConfig.tipBody}
                          onChange={(e) =>
                            setDigestConfig({
                              ...digestConfig,
                              tipBody: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          style={{
                            borderColor: "var(--line)",
                            backgroundColor: "var(--card)",
                            color: "var(--text)",
                          }}
                          placeholder="Hold your finger on a card to reorder your list. Saves 10 clicks and a small piece of your soul."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Footer Note
                    </label>
                    <input
                      type="text"
                      value={digestConfig.footerNote}
                      onChange={(e) =>
                        setDigestConfig({
                          ...digestConfig,
                          footerNote: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      style={{
                        borderColor: "var(--line)",
                        backgroundColor: "var(--card)",
                        color: "var(--text)",
                      }}
                      placeholder="Was this worth your 42 seconds?"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDigestConfig}
                      disabled={digestConfigSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {digestConfigSaving ? "Saving..." : "Save Digest Config"}
                    </button>

                    <button
                      onClick={handleSendDigestNow}
                      disabled={digestSendNowBusy || !digestConfig.isActive}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {digestSendNowBusy ? "Sending..." : "Send digest now"}
                    </button>
                  </div>

                  {digestSendNowResult && (
                    <div
                      className={`mt-4 p-3 rounded ${
                        digestSendNowResult.ok
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      {digestSendNowResult.ok ? (
                        <p
                          className="text-sm text-green-800"
                          style={{ color: "var(--text)" }}
                        >
                          Manual send completed: {digestSendNowResult.sentCount}{" "}
                          emails sent to {digestSendNowResult.distinctEmails}{" "}
                          unique addresses.
                        </p>
                      ) : (
                        <p
                          className="text-sm text-red-800"
                          style={{ color: "var(--text)" }}
                        >
                          Error: {digestSendNowResult.error || "Unknown error"}
                        </p>
                      )}
                    </div>
                  )}

                  <div
                    className="border-t border-gray-300 pt-4 mt-4"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <h3 className="font-semibold mb-3">Send Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Last automatic send:</strong>
                        <br />
                        Time:{" "}
                        {digestConfig.lastAutoSentAt
                          ? new Date(
                              digestConfig.lastAutoSentAt.toMillis?.() ||
                                digestConfig.lastAutoSentAt.seconds * 1000
                            ).toLocaleString()
                          : "never"}
                        <br />
                        Sent to: {digestConfig.lastAutoSentCount ?? 0} unique
                        email(s)
                      </div>
                      <div>
                        <strong>Last manual send:</strong>
                        <br />
                        Time:{" "}
                        {digestConfig.lastManualSentAt
                          ? new Date(
                              digestConfig.lastManualSentAt.toMillis?.() ||
                                digestConfig.lastManualSentAt.seconds * 1000
                            ).toLocaleString()
                          : "never"}
                        <br />
                        Sent to: {digestConfig.lastManualSentCount ?? 0} unique
                        email(s)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Role Management */}
            <div
              className="bg-gray-100 rounded-lg p-6"
              style={{ backgroundColor: "var(--card)" }}
            >
              <h2 className="text-2xl font-bold mb-4">
                Grant Admin Role to Other Users
              </h2>
              <p
                className="text-sm text-gray-600 mb-4"
                style={{ color: "var(--muted)" }}
              >
                Enter a user's email address or user ID to grant or revoke admin
                role.
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="adminEmail"
                    className="block text-sm font-medium mb-2"
                  >
                    User Email
                  </label>
                  <input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    style={{
                      borderColor: "var(--line)",
                      backgroundColor: "var(--card)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                <div
                  className="text-center text-gray-500"
                  style={{ color: "var(--muted)" }}
                >
                  OR
                </div>

                <div>
                  <label
                    htmlFor="adminUserId"
                    className="block text-sm font-medium mb-2"
                  >
                    User ID (Firebase UID)
                  </label>
                  <input
                    id="adminUserId"
                    type="text"
                    value={adminUserId}
                    onChange={(e) => setAdminUserId(e.target.value)}
                    placeholder="M48zRZYH4AbPu79JMxtYVO1w4vo2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    style={{
                      borderColor: "var(--line)",
                      backgroundColor: "var(--card)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!adminEmail && !adminUserId) {
                        alert("Please enter either an email or user ID");
                        return;
                      }

                      setAdminManagementLoading(true);
                      try {
                        const { httpsCallable } = await import(
                          "firebase/functions"
                        );
                        const { functions } = await import(
                          "../lib/firebaseBootstrap"
                        );
                        const manageAdminRole = httpsCallable(
                          functions,
                          "manageAdminRole"
                        );

                        // First, get user ID from email if needed
                        if (adminEmail && !adminUserId) {
                          // For email, we need to look up the user ID
                          // Since we can't do this directly from client, we'll need to
                          // modify the function to accept email, or use Admin SDK
                          // For now, let's require user ID for email lookup
                          alert(
                            "Please use User ID for now, or use Firebase Console to grant by email."
                          );
                          setAdminManagementLoading(false);
                          return;
                        }

                        if (!adminUserId) {
                          alert("Please enter a user ID");
                          setAdminManagementLoading(false);
                          return;
                        }

                        const result = await manageAdminRole({
                          userId: adminUserId,
                          grant: true,
                        });

                        console.log(
                          "[AdminExtrasPage] Admin role granted:",
                          result.data
                        );
                        alert(
                          `Admin role granted to user ${adminUserId}. They need to sign out and sign back in for it to take effect.`
                        );
                        setAdminEmail("");
                        setAdminUserId("");
                      } catch (error: any) {
                        console.error(
                          "[AdminExtrasPage] Failed to grant admin role:",
                          error
                        );
                        alert(
                          "Failed to grant admin role: " +
                            (error.message || String(error))
                        );
                      } finally {
                        setAdminManagementLoading(false);
                      }
                    }}
                    disabled={adminManagementLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {adminManagementLoading
                      ? "Granting..."
                      : "Grant Admin Role"}
                  </button>

                  <button
                    onClick={async () => {
                      if (!adminUserId) {
                        alert("Please enter a user ID to revoke admin role");
                        return;
                      }

                      setAdminManagementLoading(true);
                      try {
                        const { httpsCallable } = await import(
                          "firebase/functions"
                        );
                        const { functions } = await import(
                          "../lib/firebaseBootstrap"
                        );
                        const manageAdminRole = httpsCallable(
                          functions,
                          "manageAdminRole"
                        );

                        const result = await manageAdminRole({
                          userId: adminUserId,
                          grant: false,
                        });

                        console.log(
                          "[AdminExtrasPage] Admin role revoked:",
                          result.data
                        );
                        alert(
                          `Admin role revoked from user ${adminUserId}. They need to sign out and sign back in for it to take effect.`
                        );
                        setAdminEmail("");
                        setAdminUserId("");
                      } catch (error: any) {
                        console.error(
                          "[AdminExtrasPage] Failed to revoke admin role:",
                          error
                        );
                        alert(
                          "Failed to revoke admin role: " +
                            (error.message || String(error))
                        );
                      } finally {
                        setAdminManagementLoading(false);
                      }
                    }}
                    disabled={adminManagementLoading || !adminUserId}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {adminManagementLoading
                      ? "Revoking..."
                      : "Revoke Admin Role"}
                  </button>
                </div>

                <div
                  className="mt-4 p-3 bg-blue-50 rounded border border-blue-200"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--line)",
                  }}
                >
                  <p
                    className="text-sm text-blue-800"
                    style={{ color: "var(--text)" }}
                  >
                    <strong>Note:</strong> Users must sign out and sign back in
                    for admin role changes to take effect. You can find user IDs
                    in Firebase Console → Authentication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
