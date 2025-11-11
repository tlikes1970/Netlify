import { useState, useEffect } from 'react';
import { ExtrasVideo } from '../lib/extras/types';
import { extrasProvider } from '../lib/extras/extrasProvider';
import { useSettings, settingsManager } from '../lib/settings';

interface UGCSubmission {
  id: string;
  type: 'comment' | 'video';
  showName: string;
  content: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
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
  const [videos, setVideos] = useState<ExtrasVideo[]>([]);
  const [ugcSubmissions, setUgcSubmissions] = useState<UGCSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShow, setSelectedShow] = useState<string>('');
  const [showId, setShowId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'content' | 'comments' | 'videos' | 'pro'>('content');
  
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
      const bloopersResult = await extrasProvider.fetchBloopers(showId, selectedShow);
      const extrasResult = await extrasProvider.fetchExtras(showId, selectedShow);
      
      const allVideos = [...bloopersResult.videos, ...extrasResult.videos];
      setVideos(allVideos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVideo = (videoId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId ? { ...video, status: 'approved' as const } : video
    ));
  };

  const handleRejectVideo = (videoId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId ? { ...video, status: 'rejected' as const } : video
    ));
  };

  const handleBulkApprove = () => {
    setVideos(prev => prev.map(video => ({ ...video, status: 'approved' as const })));
  };

  const handleBulkReject = () => {
    setVideos(prev => prev.map(video => ({ ...video, status: 'rejected' as const })));
  };

  // UGC Management Functions
  const handleApproveUGC = (submissionId: string) => {
    setUgcSubmissions(prev => prev.map(submission => 
      submission.id === submissionId ? { ...submission, status: 'approved' as const } : submission
    ));
  };

  const handleRejectUGC = (submissionId: string, reason: string) => {
    setUgcSubmissions(prev => prev.map(submission => 
      submission.id === submissionId ? { ...submission, status: 'rejected' as const, rejectionReason: reason } : submission
    ));
  };

  const loadUGCSubmissions = () => {
    // Mock data for demonstration - in production, this would fetch from your backend
    const mockSubmissions: UGCSubmission[] = [
      {
        id: '1',
        type: 'comment',
        showName: 'The Office',
        content: 'Michael Scott is the best boss ever!',
        submittedBy: 'user123',
        submittedAt: '2024-01-15T10:30:00Z',
        status: 'pending'
      },
      {
        id: '2',
        type: 'video',
        showName: 'Stranger Things',
        content: 'Behind the scenes footage from season 4',
        submittedBy: 'user456',
        submittedAt: '2024-01-15T11:45:00Z',
        status: 'pending'
      }
    ];
    setUgcSubmissions(mockSubmissions);
  };

  useEffect(() => {
    loadUGCSubmissions();
  }, []);

  const pendingCount = videos.filter(v => v.status === 'pending').length;
  const approvedCount = videos.filter(v => v.status === 'approved').length;
  const rejectedCount = videos.filter(v => v.status === 'rejected').length;
  const pendingUGC = ugcSubmissions.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin - Content Management</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'content'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Auto Content
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'comments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Marquee Comments ({pendingUGC})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'videos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Video Submissions ({pendingUGC})
          </button>
          <button
            onClick={() => setActiveTab('pro')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'pro'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Pro Status
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'content' && (
          <>
            {/* Controls */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
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
                  value={showId || ''}
                  onChange={(e) => setShowId(parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border rounded"
                />
                <button
                  onClick={handleFetchVideos}
                  disabled={loading || !showId}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Fetching...' : 'Fetch Videos'}
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
                video.status === 'approved' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                video.status === 'rejected' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                'border-gray-300 dark:border-gray-600'
              }`}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-32 object-cover rounded mb-2"
              />
              <h3 className="font-medium text-sm mb-1 line-clamp-2">{video.title}</h3>
              <p className="text-xs text-gray-500 mb-2">{video.channelName}</p>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  video.category === 'bloopers' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {video.category}
                </span>
                <span className="text-xs text-gray-400">{video.provider}</span>
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
            Enter a show title and ID, then click "Fetch Videos" to get started.
          </div>
        )}
          </>
        )}

        {/* Marquee Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Marquee Comment Submissions</h2>
            {ugcSubmissions.filter(s => s.type === 'comment').map((submission) => (
              <div
                key={submission.id}
                className={`border rounded-lg p-4 ${
                  submission.status === 'approved' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                  submission.status === 'rejected' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{submission.showName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      By {submission.submittedBy} • {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.status}
                  </span>
                </div>
                <p className="text-sm mb-3">{submission.content}</p>
                {submission.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveUGC(submission.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleRejectUGC(submission.id, reason);
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {submission.rejectionReason && (
                  <p className="text-xs text-red-600 mt-2">Rejected: {submission.rejectionReason}</p>
                )}
              </div>
            ))}
            {ugcSubmissions.filter(s => s.type === 'comment').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No marquee comment submissions found.
              </div>
            )}
          </div>
        )}

        {/* Video Submissions Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Video Submissions</h2>
            {ugcSubmissions.filter(s => s.type === 'video').map((submission) => (
              <div
                key={submission.id}
                className={`border rounded-lg p-4 ${
                  submission.status === 'approved' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                  submission.status === 'rejected' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{submission.showName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      By {submission.submittedBy} • {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.status}
                  </span>
                </div>
                <p className="text-sm mb-3">{submission.content}</p>
                {submission.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveUGC(submission.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleRejectUGC(submission.id, reason);
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {submission.rejectionReason && (
                  <p className="text-xs text-red-600 mt-2">Rejected: {submission.rejectionReason}</p>
                )}
              </div>
            ))}
            {ugcSubmissions.filter(s => s.type === 'video').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No video submissions found.
              </div>
            )}
          </div>
        )}

        {/* Pro Status Tab */}
        {activeTab === 'pro' && (
          <div className="space-y-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Pro Status Management</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Pro Status</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current status: <strong className={isPro ? 'text-green-600' : 'text-gray-500'}>
                        {isPro ? 'Pro Enabled' : 'Pro Disabled'}
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {isPro && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Pro Features Enabled:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700 dark:text-green-300">
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
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Free Tier Limitations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>1 FlickWord game per day</li>
                      <li>10 Trivia questions per day</li>
                      <li>No advanced notifications</li>
                      <li>No theme packs</li>
                      <li>No social features</li>
                      <li>No bloopers/extras access</li>
                    </ul>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> This toggle controls Pro status for the current user. Changes are saved immediately to localStorage and will persist across sessions.
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
