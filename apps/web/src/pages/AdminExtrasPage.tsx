import { useState, useEffect } from "react";
import { auth, functions } from "../lib/firebaseBootstrap";
import { ExtrasVideo } from "../lib/extras/types";
import { extrasProvider } from "../lib/extras/extrasProvider";
import { useSettings, settingsManager } from "../lib/settings";
import { useAdminRole } from "../hooks/useAdminRole";
import { isMobileNow } from "../lib/isMobile";
import { httpsCallable } from "firebase/functions";
import { clearBillingCache } from "../lib/proStatus";
import AdminUserManagement from "../components/admin/AdminUserManagement";

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


export default function AdminExtrasPage({
  isMobile: isMobileProp,
}: { isMobile?: boolean } = {}) {
  const settings = useSettings();
  const { isAdmin } = useAdminRole();
  const [videos, setVideos] = useState<ExtrasVideo[]>([]);
  const [ugcSubmissions, setUgcSubmissions] = useState<UGCSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShow, setSelectedShow] = useState<string>("");
  const [showId, setShowId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<
    "content" | "comments" | "videos" | "pro" | "admin" | "insights"
  >("content");

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

  // Pro status (settings mirror; useProStatus reads billing/status â€” keep both in sync via manageProStatus)
  const isPro = settings.pro?.isPro ?? false;
  const [proTogglePending, setProTogglePending] = useState(false);

  const handleTogglePro = async () => {
    const user = auth.currentUser;
    if (!user?.uid) {
      alert("You must be signed in to change Pro status.");
      return;
    }
    const newProStatus = !isPro;
    setProTogglePending(true);
    try {
      const manageProStatus = httpsCallable(functions, "manageProStatus");
      await manageProStatus({ userId: user.uid, isPro: newProStatus });
      clearBillingCache();
      await settingsManager.loadSettingsFromFirebase(user.uid);
    } catch (error: unknown) {
      console.error("[AdminExtrasPage] manageProStatus failed:", error);
      const err = error as { message?: string; code?: string };
      alert(
        `Failed to update Pro status: ${err.message || err.code || "Unknown error"}`
      );
    } finally {
      setProTogglePending(false);
    }
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

  const handleGenerateInsights = async () => {
    if (!insightsTmdbId) {
      alert("Please enter a TMDB ID");
      return;
    }

    setInsightsGenerating(true);
    setInsightsResult(null);

    try {
      const genresArray = insightsGenres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const metadata = {
        tmdbId: parseInt(insightsTmdbId),
        id: parseInt(insightsTmdbId),
        title: insightsTitle || "Unknown Title",
        mediaType: insightsMediaType,
        genres: genresArray,
        year: insightsYear ? parseInt(insightsYear) : null,
        runtimeMins: insightsRuntime ? parseInt(insightsRuntime) : null,
      };

      const ingestGoofs = httpsCallable(functions, "ingestGoofs");

      const result = await ingestGoofs({
        mode: "single",
        tmdbId: insightsTmdbId,
        metadata: metadata,
      });

      const data = result.data as {
        success?: boolean;
        itemsGenerated?: number;
      };
      setInsightsResult({
        success: data.success || true,
        itemsGenerated: data.itemsGenerated || 0,
      });

      setInsightsTmdbId("");
      setInsightsTitle("");
      setInsightsGenres("");
      setInsightsYear("");
      setInsightsRuntime("");
    } catch (error: unknown) {
      console.error("Failed to generate insights:", error);
      const err = error as { message?: string };
      setInsightsResult({
        success: false,
        error: err.message || String(error),
      });
    } finally {
      setInsightsGenerating(false);
    }
  };

  const handleBulkIngestion = async () => {
    const confirmed = window.confirm(
      "Run bulk goofs ingestion now? This will process all titles in Firestore and may take a while."
    );

    if (!confirmed) {
      return;
    }

    setBulkIngestionRunning(true);
    setBulkIngestionResult(null);

    try {
      const ingestGoofs = httpsCallable(functions, "ingestGoofs");
      const result = await ingestGoofs({ mode: "bulk" });

      const data = result.data as {
        success?: boolean;
        total?: number;
        succeeded?: number;
        count?: number;
        failed?: number;
      };
      setBulkIngestionResult({
        success: data.success || true,
        total: data.total || 0,
        succeeded: data.succeeded || data.count || 0,
        failed: data.failed || 0,
      });
    } catch (error: unknown) {
      console.error("Failed to run bulk ingestion:", error);
      let errorMessage = "Unknown error";
      const err = error as { message?: string; code?: string };
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code) {
        errorMessage = `Error code: ${err.code}`;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }

      setBulkIngestionResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setBulkIngestionRunning(false);
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
          {activeTab === "content"
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
                <strong>Data Flow:</strong> Admin triggers ingestion â†’ Netlify
                function fetches/transforms data â†’ Writes to Firestore â†’ Clients
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
                        âœ… Successfully generated{" "}
                        {insightsResult.itemsGenerated} insights and saved to
                        Firestore. Users will see them the next time they open
                        the Insights &amp; Easter Eggs modal.
                      </p>
                    ) : (
                      <p
                        className="text-sm text-red-800"
                        style={{ color: "var(--text)" }}
                      >
                        âŒ Error: {insightsResult.error || "Unknown error"}
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
                        <p className="mb-2">âœ… Bulk ingestion complete!</p>
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
                        âŒ Error: {bulkIngestionResult.error || "Unknown error"}
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
                        By {submission.submittedBy} â€¢{" "}
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
                        By {submission.submittedBy} â€¢{" "}
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
                  <label
                    className={`relative inline-flex items-center ${proTogglePending ? "cursor-wait opacity-70" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isPro}
                      disabled={proTogglePending}
                      onChange={() => {
                        void handleTogglePro();
                      }}
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
                      <li>Watch Reminders</li>
                      <li>Theme Packs</li>
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
                      <li>No watch reminders</li>
                      <li>No theme packs</li>
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
                    <strong>Note:</strong> This updates Pro for the signed-in
                    account in Firestore (including billing status used by the
                    app) via the admin backend. It is not for changing other
                    users&apos; accounts from this screen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === "admin" && isAdmin && (
          <div className="space-y-6">
            <AdminUserManagement />
          </div>
        )}

      </div>
    </>
  );
}
