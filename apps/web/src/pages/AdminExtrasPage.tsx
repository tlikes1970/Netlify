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
} from "firebase/firestore";
import { db } from "../lib/firebaseBootstrap";
import { ExtrasVideo } from "../lib/extras/types";
import { extrasProvider } from "../lib/extras/extrasProvider";
import { useSettings, settingsManager } from "../lib/settings";
import { useAdminRole } from "../hooks/useAdminRole";

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

export default function AdminExtrasPage() {
  const settings = useSettings();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [videos, setVideos] = useState<ExtrasVideo[]>([]);
  const [ugcSubmissions, setUgcSubmissions] = useState<UGCSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShow, setSelectedShow] = useState<string>("");
  const [showId, setShowId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<
    "content" | "comments" | "videos" | "pro" | "community" | "admin"
  >("content");

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
            autoSendEnabled: data.autoSendEnabled !== undefined ? data.autoSendEnabled : false,
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
            productPulseNext: "• Smarter discovery rails • Swipe gestures that don't argue with gravity",
            productPulseHowTo: "Tap ★ once. It remembers now.",
            productPulseBonus: "Library loads faster so you spend less time staring at spinners.",
            tipHeadline: "The One Thing You Didn't Know You Needed",
            tipBody: "Hold your finger on a card to reorder your list. Saves 10 clicks and a small piece of your soul.",
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
        alert("Failed to load digest config: " + (error instanceof Error ? error.message : String(error)));
      } finally {
        setDigestConfigLoading(false);
      }
    };

    loadDigestConfig();
  }, [activeTab, isAdmin]);

  const handleSaveDigestConfig = async () => {
    setDigestConfigSaving(true);
    try {
      await setDoc(doc(db, "digestConfig", "current"), digestConfig);
      alert("Digest config saved successfully!");
    } catch (error) {
      console.error("Error saving digest config:", error);
      alert("Failed to save digest config: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setDigestConfigSaving(false);
    }
  };

  const handleSendDigestNow = async () => {
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
      const data = result.data as { ok: boolean; sentCount?: number; distinctEmails?: number };

      if (data.ok) {
        setDigestSendNowResult({
          ok: true,
          sentCount: data.sentCount,
          distinctEmails: data.distinctEmails,
        });
        // Reload config to get updated stats
        const configDoc = await getDoc(doc(db, "digestConfig", "current"));
        if (configDoc.exists()) {
          const configData = configDoc.data();
          setDigestConfig((prev) => ({
            ...prev,
            lastManualSentAt: configData.lastManualSentAt || null,
            lastManualSentCount: configData.lastManualSentCount || null,
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
      setDigestSendNowResult({
        ok: false,
        error: error.message || String(error),
      });
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
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin - Content Management</h1>

        {/* Tabs */}
        <div className="flex border-b mb-6" style={{ borderColor: "var(--line)" }}>
          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2 font-medium ${
              activeTab === "content"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            style={activeTab !== "content" ? { color: "var(--muted)" } : undefined}
            onMouseEnter={(e) => {
              if (activeTab !== "content") {
                e.currentTarget.style.color = "var(--text)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "content") {
                e.currentTarget.style.color = "var(--muted)";
              }
            }}
          >
            Auto Content
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-2 font-medium ${
              activeTab === "comments"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            style={activeTab !== "comments" ? { color: "var(--muted)" } : undefined}
            onMouseEnter={(e) => {
              if (activeTab !== "comments") {
                e.currentTarget.style.color = "var(--text)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "comments") {
                e.currentTarget.style.color = "var(--muted)";
              }
            }}
          >
            Marquee Comments ({pendingUGC})
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-4 py-2 font-medium ${
              activeTab === "videos"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            style={activeTab !== "videos" ? { color: "var(--muted)" } : undefined}
            onMouseEnter={(e) => {
              if (activeTab !== "videos") {
                e.currentTarget.style.color = "var(--text)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "videos") {
                e.currentTarget.style.color = "var(--muted)";
              }
            }}
          >
            Video Submissions ({pendingUGC})
          </button>
          <button
            onClick={() => setActiveTab("pro")}
            className={`px-4 py-2 font-medium ${
              activeTab === "pro"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            style={activeTab !== "pro" ? { color: "var(--muted)" } : undefined}
            onMouseEnter={(e) => {
              if (activeTab !== "pro") {
                e.currentTarget.style.color = "var(--text)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "pro") {
                e.currentTarget.style.color = "var(--muted)";
              }
            }}
          >
            Pro Status
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`px-4 py-2 font-medium ${
              activeTab === "community"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            style={activeTab !== "community" ? { color: "var(--muted)" } : undefined}
            onMouseEnter={(e) => {
              if (activeTab !== "community") {
                e.currentTarget.style.color = "var(--text)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "community") {
                e.currentTarget.style.color = "var(--muted)";
              }
            }}
          >
            Community Content
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 font-medium ${
                activeTab === "admin"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={activeTab !== "admin" ? { color: "var(--muted)" } : undefined}
              onMouseEnter={(e) => {
                if (activeTab !== "admin") {
                  e.currentTarget.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "admin") {
                  e.currentTarget.style.color = "var(--muted)";
                }
              }}
            >
              Admin Management
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "content" && (
          <>
            {/* Controls */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6" style={{ backgroundColor: "var(--card)" }}>
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Show Title"
                  value={selectedShow}
                  onChange={(e) => setSelectedShow(e.target.value)}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Show ID"
                  value={showId || ""}
                  onChange={(e) => setShowId(parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border rounded"
                />
                <button
                  onClick={handleFetchVideos}
                  disabled={loading || !showId}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Fetching..." : "Fetch Videos"}
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <span>Pending: {pendingCount}</span>
                <span>Approved: {approvedCount}</span>
                <span>Rejected: {rejectedCount}</span>
              </div>
            </div>

            {/* Bulk Actions */}
            {videos.length > 0 && (
              <div className="flex gap-2 mb-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`border rounded-lg p-4 ${
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
          </>
        )}

        {/* Marquee Comments Tab */}
        {activeTab === "comments" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Marquee Comment Submissions
            </h2>
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
                      <p className="text-sm text-gray-600" style={{ color: "var(--muted)" }}>
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
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Video Submissions</h2>
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
                      <p className="text-sm text-gray-600" style={{ color: "var(--muted)" }}>
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
            <div className="bg-gray-100 rounded-lg p-6" style={{ backgroundColor: "var(--card)" }}>
              <h2 className="text-2xl font-bold mb-4">
                Community Content Management
              </h2>
              {adminLoading ? (
                <p className="text-sm text-yellow-600 mb-4" style={{ color: "var(--muted)" }}>
                  ⏳ Verifying admin status...
                </p>
              ) : isAdmin ? (
                <p className="text-sm text-green-600 mb-4" style={{ color: "var(--text)" }}>
                  ✓ Admin verified. You can delete any post or comment.
                </p>
              ) : (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded" style={{ backgroundColor: "var(--card)", borderColor: "var(--line)" }}>
                  <p className="text-sm text-red-600 mb-2" style={{ color: "var(--text)" }}>
                    ⚠️ Admin status not verified. Delete actions are disabled.
                  </p>
                  <p className="text-xs text-red-500 mb-3" style={{ color: "var(--muted)" }}>
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
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">
                  Posts ({posts.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--line)" }}
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
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Comments ({postComments.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {postComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 bg-white rounded border border-gray-200"
                        style={{ backgroundColor: "var(--card)", borderColor: "var(--line)" }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {comment.authorName || "Anonymous"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap" style={{ color: "var(--text)" }}>
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
            <div className="bg-gray-100 rounded-lg p-6" style={{ backgroundColor: "var(--card)" }}>
              <h2 className="text-2xl font-bold mb-4">Pro Status Management</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200" style={{ backgroundColor: "var(--card)", borderColor: "var(--line)" }}>
                  <div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Pro Status</h3>
                    <p className="text-sm text-gray-600" style={{ color: "var(--muted)" }}>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" style={{ backgroundColor: "var(--btn)", borderColor: "var(--line)" }}></div>
                  </label>
                </div>

                {isPro && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200" style={{ backgroundColor: "var(--card)", borderColor: "var(--line)" }}>
                    <h4 className="font-semibold text-green-800 mb-2" style={{ color: "var(--text)" }}>
                      Pro Features Enabled:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700" style={{ color: "var(--text)" }}>
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
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200" style={{ backgroundColor: "var(--card)", borderColor: "var(--line)" }}>
                    <h4 className="font-semibold text-gray-800 mb-2" style={{ color: "var(--text)" }}>
                      Free Tier Limitations:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700" style={{ color: "var(--text)" }}>
                      <li>1 FlickWord game per day</li>
                      <li>10 Trivia questions per day</li>
                      <li>No advanced notifications</li>
                      <li>No theme packs</li>
                      <li>No social features</li>
                      <li>No bloopers/extras access</li>
                    </ul>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200" style={{ backgroundColor: "var(--card)", borderColor: "var(--line)" }}>
                  <p className="text-sm text-blue-800" style={{ color: "var(--text)" }}>
                    <strong>Note:</strong> This toggle controls Pro status for
                    the current user. Changes are saved immediately to
                    localStorage and will persist across sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === "admin" && isAdmin && (
          <div className="space-y-6">
            {/* Weekly Digest Config */}
            <div className="bg-gray-100 rounded-lg p-6" style={{ backgroundColor: "var(--card)" }}>
              <h2 className="text-2xl font-bold mb-4">
                Weekly Digest Email Configuration
              </h2>
              <p className="text-sm text-gray-600 mb-4" style={{ color: "var(--muted)" }}>
                Configure the content for the weekly digest email sent to subscribers.
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

                  <div className="border-t border-gray-300 pt-4" style={{ borderColor: "var(--line)" }}>
                    <h3 className="font-semibold mb-3">Automatic Send Settings</h3>

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
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
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
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
                        />
                      </div>

                      <p className="text-xs text-gray-500 italic" style={{ color: "var(--muted)" }}>
                        Current backend schedule still uses a fixed cron trigger; this day/time is stored in config and will be fully honored in a later update. The On/Off toggle is effective now: when off, the automatic send is skipped.
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
                        setDigestConfig({ ...digestConfig, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
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
                        setDigestConfig({ ...digestConfig, intro: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
                      placeholder="Here's your Flicklet update in under a minute."
                    />
                  </div>

                  <div className="border-t border-gray-300 pt-4" style={{ borderColor: "var(--line)" }}>
                    <h3 className="font-semibold mb-3">Product Pulse Section</h3>

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
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
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
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
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
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
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
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
                          placeholder="Library loads faster so you spend less time staring at spinners."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-300 pt-4" style={{ borderColor: "var(--line)" }}>
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
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
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
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
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
                      style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
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
                        <p className="text-sm text-green-800" style={{ color: "var(--text)" }}>
                          Manual send completed: {digestSendNowResult.sentCount} emails sent to {digestSendNowResult.distinctEmails} unique addresses.
                        </p>
                      ) : (
                        <p className="text-sm text-red-800" style={{ color: "var(--text)" }}>
                          Error: {digestSendNowResult.error || "Unknown error"}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="border-t border-gray-300 pt-4 mt-4" style={{ borderColor: "var(--line)" }}>
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
                        Sent to: {digestConfig.lastAutoSentCount ?? 0} unique email(s)
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
                        Sent to: {digestConfig.lastManualSentCount ?? 0} unique email(s)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Role Management */}
            <div className="bg-gray-100 rounded-lg p-6" style={{ backgroundColor: "var(--card)" }}>
              <h2 className="text-2xl font-bold mb-4">
                Grant Admin Role to Other Users
              </h2>
              <p className="text-sm text-gray-600 mb-4" style={{ color: "var(--muted)" }}>
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
                    style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
                  />
                </div>

                <div className="text-center text-gray-500" style={{ color: "var(--muted)" }}>
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
                    style={{ borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--text)" }}
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

                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200" style={{ backgroundColor: "var(--card)", borderColor: "var(--line)" }}>
                  <p className="text-sm text-blue-800" style={{ color: "var(--text)" }}>
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
    </div>
  );
}
