import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminPendingStories,
  getChapterReports,
  getCommentReports,
  getBannedUsers,
  approveStory,
  rejectStory,
  approveChapter,
  unapproveChapter,
  getAllChaptersForStory,
  approveReport,
  rejectReport,
  unbanUser,
} from '../../services/api';
import './AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stories tab state
  const [stories, setStories] = useState([]);
  const [storiesPage, setStoriesPage] = useState(1);
  const [storiesTotal, setStoriesTotal] = useState(0);
  const [expandedStories, setExpandedStories] = useState({});
  const [pendingChapters, setPendingChapters] = useState({});
  const [approvedChapters, setApprovedChapters] = useState({});
  const [chapterPages, setChapterPages] = useState({}); // Track pagination per story
  
  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingStoryId, setRejectingStoryId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTime, setFilterTime] = useState('all');

  // Chapter reports tab state
  const [chapterReports, setChapterReports] = useState([]);
  const [chapterReportsPage, setChapterReportsPage] = useState(1);
  const [chapterReportsTotal, setChapterReportsTotal] = useState(0);

  // Comment reports tab state
  const [commentReports, setCommentReports] = useState([]);
  const [commentReportsPage, setCommentReportsPage] = useState(1);
  const [commentReportsTotal, setCommentReportsTotal] = useState(0);

  // Banned users tab state
  const [bannedUsers, setBannedUsers] = useState([]);
  const [bannedUsersPage, setBannedUsersPage] = useState(1);
  const [bannedUsersTotal, setBannedUsersTotal] = useState(0);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { 
        page: storiesPage, 
        size: 10,
        timeFilter: filterTime
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      console.log('[Admin] Fetching stories with params:', params);
      
      const { stories, total } = await getAdminPendingStories(params);
      setStories(stories);
      setStoriesTotal(total);
      
      console.log('[Admin] Received:', stories.length, 'stories, total:', total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapterReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const { reports, total } = await getChapterReports({ page: chapterReportsPage, size: 20 });
      setChapterReports(reports);
      setChapterReportsTotal(total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const { reports, total } = await getCommentReports({ page: commentReportsPage, size: 20 });
      setCommentReports(reports);
      setCommentReportsTotal(total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBannedUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { banned_users, total } = await getBannedUsers({ page: bannedUsersPage, size: 20 });
      setBannedUsers(banned_users || []);
      setBannedUsersTotal(total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (activeTab === 'stories') {
        setStoriesPage(1); // Reset to first page on search
      }
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeTab]);

  // Fetch data when dependencies change
  useEffect(() => {
    if (activeTab === 'stories') {
      fetchStories();
    } else if (activeTab === 'chapters') {
      fetchChapterReports();
    } else if (activeTab === 'comments') {
      fetchCommentReports();
    } else if (activeTab === 'banned') {
      fetchBannedUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, storiesPage, searchQuery, filterTime, chapterReportsPage, commentReportsPage, bannedUsersPage]);

  // Real-time update interval (30 seconds)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (activeTab === 'stories') {
        fetchStories();
      } else if (activeTab === 'chapters') {
        fetchChapterReports();
      } else if (activeTab === 'comments') {
        fetchCommentReports();
      } else if (activeTab === 'banned') {
        fetchBannedUsers();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, storiesPage, searchQuery, filterTime, chapterReportsPage, commentReportsPage, bannedUsersPage]);

  const handleApproveStory = async (storyId) => {
    try {
      await approveStory(storyId);
      alert('Story approved successfully!');
      fetchStories();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRejectStory = async (storyId) => {
    setRejectingStoryId(storyId);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await rejectStory(rejectingStoryId, rejectionReason);
      alert('Story rejected successfully!');
      setShowRejectModal(false);
      setRejectingStoryId(null);
      setRejectionReason('');
      fetchStories();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancelReject = () => {
    setShowRejectModal(false);
    setRejectingStoryId(null);
    setRejectionReason('');
  };

  const handleToggleStoryExpand = async (storyId) => {
    const isExpanded = expandedStories[storyId];
    
    if (!isExpanded) {
      // Fetch all chapters (both pending and approved) for this story
      try {
        const { pendingChapters, approvedChapters } = await getAllChaptersForStory(storyId);
        setPendingChapters(prev => ({ ...prev, [storyId]: pendingChapters }));
        setChapterPages(prev => ({ ...prev, [storyId]: 1 })); // Initialize page to 1
        setApprovedChapters(prev => ({ ...prev, [storyId]: approvedChapters }));
      } catch (err) {
        console.error('Error fetching chapters:', err);
      }
    }
    
    setExpandedStories(prev => ({ ...prev, [storyId]: !isExpanded }));
  };

  const handleApproveChapter = async (chapterId, storyId) => {
    try {
      await approveChapter(chapterId);
      alert('Chapter approved successfully!');
      
      // Refresh chapters for this story
      const { pendingChapters, approvedChapters } = await getAllChaptersForStory(storyId);
      setPendingChapters(prev => ({ ...prev, [storyId]: pendingChapters }));
      setApprovedChapters(prev => ({ ...prev, [storyId]: approvedChapters }));
      
      // Refresh the stories list
      fetchStories();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUnapproveChapter = async (chapterId, storyId) => {
    if (!window.confirm('Are you sure you want to unapprove this chapter? It will go back to the pending queue.')) {
      return;
    }
    try {
      await unapproveChapter(chapterId);
      alert('Chapter unapproved successfully!');
      
      // Refresh chapters for this story
      const { pendingChapters, approvedChapters } = await getAllChaptersForStory(storyId);
      setPendingChapters(prev => ({ ...prev, [storyId]: pendingChapters }));
      setApprovedChapters(prev => ({ ...prev, [storyId]: approvedChapters }));
      
      fetchStories();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleApproveReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to approve this report? This will delete the content and may ban the user.')) {
      return;
    }
    try {
      await approveReport(reportId);
      alert('Report approved and action taken!');
      if (activeTab === 'chapters') {
        fetchChapterReports();
      } else if (activeTab === 'comments') {
        fetchCommentReports();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRejectReport = async (reportId) => {
    try {
      await rejectReport(reportId);
      alert('Report rejected!');
      if (activeTab === 'chapters') {
        fetchChapterReports();
      } else if (activeTab === 'comments') {
        fetchCommentReports();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUnbanUser = async (banId) => {
    if (!window.confirm('Are you sure you want to unban this user?')) {
      return;
    }
    try {
      await unbanUser(banId);
      alert('User unbanned successfully!');
      fetchBannedUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleTimeFilterChange = (e) => {
    setFilterTime(e.target.value);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          Pending Stories
        </button>
        <button
          className={`tab-button ${activeTab === 'chapters' ? 'active' : ''}`}
          onClick={() => setActiveTab('chapters')}
        >
          Reported Chapters
        </button>
        <button
          className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Reported Comments
        </button>
        <button
          className={`tab-button ${activeTab === 'banned' ? 'active' : ''}`}
          onClick={() => setActiveTab('banned')}
        >
          Banned Users
        </button>
      </div>

      <div className="admin-content">
        {error && <div className="error-message">{error}</div>}

        {/* Stories Tab */}
        {activeTab === 'stories' && (
          <div className="stories-tab">
            <div className="tab-info">
              <h2>Stories Management</h2>
              <p className="total-count">Total: {storiesTotal} {storiesTotal === 1 ? 'story' : 'stories'}</p>
            </div>
            
            <div className="filter-bar">
              <div className="search-section">
                <label htmlFor="search-input">Search:</label>
                <input
                  type="text"
                  id="search-input"
                  placeholder="Search by title, author, tags..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
              
              <div className="filter-section">
                <div className="filter-group">
                  <label htmlFor="time-filter">Time:</label>
                  <select id="time-filter" value={filterTime} onChange={handleTimeFilterChange}>
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <div className="stories-list">
                  {stories.length === 0 ? (
                    <p>No pending stories found.</p>
                  ) : (
                    stories.map((story) => (
                      <div key={story.id} className="story-item">
                        <div 
                          className="story-thumbnail clickable"
                          onClick={() => navigate(`/story/${story.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          {story.cover_image_url ? (
                            <img src={story.cover_image_url} alt={story.title} />
                          ) : (
                            <div className="placeholder-thumbnail">No Cover</div>
                          )}
                        </div>
                        <div className="story-info">
                          <h3 
                            onClick={() => navigate(`/story/${story.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            {story.title}
                          </h3>
                          <p className="story-author">By {story.author_name}</p>
                          <p className="story-description">{story.description}</p>
                          <div className="story-tags">
                            {story.tags?.map((tag) => (
                              <span key={tag.id} className="tag">
                                {tag.name}
                              </span>
                            ))}
                          </div>
                          <p className="story-meta">
                            Chapters: {story.chapter_count} | Published: {story.published ? 'Yes' : 'No'} | Approved: {story.approved ? 'Yes' : 'No'}
                          </p>
                          
                          {/* Show chapters section */}
                          {expandedStories[story.id] && (
                            <div className="pending-chapters-section">
                              <h4>Chapters:</h4>
                              {pendingChapters[story.id] || approvedChapters[story.id] ? (
                                <>
                                  {/* Pending Chapters */}
                                  {pendingChapters[story.id] && pendingChapters[story.id].length > 0 && (
                                    <div className="chapter-group">
                                      <h5 className="chapter-group-title">Pending Approval ({pendingChapters[story.id].length}):</h5>
                                      <div className="pending-chapters-list">
                                        {pendingChapters[story.id]
                                          .slice(
                                            ((chapterPages[story.id] || 1) - 1) * 5,
                                            (chapterPages[story.id] || 1) * 5
                                          )
                                          .map((chapter) => (
                                            <div key={chapter.id} className="pending-chapter-item">
                                              <span>{chapter.chapter_number}. {chapter.title}</span>
                                              <button
                                                className="btn-approve-small"
                                                onClick={() => handleApproveChapter(chapter.id, story.id)}
                                              >
                                                Approve
                                              </button>
                                            </div>
                                          ))}
                                      </div>
                                      {pendingChapters[story.id].length > 5 && (
                                        <div className="chapter-pagination">
                                          <button
                                            disabled={(chapterPages[story.id] || 1) === 1}
                                            onClick={() =>
                                              setChapterPages((prev) => ({
                                                ...prev,
                                                [story.id]: (prev[story.id] || 1) - 1,
                                              }))
                                            }
                                          >
                                            Previous
                                          </button>
                                          <span>
                                            Page {chapterPages[story.id] || 1} of{' '}
                                            {Math.ceil(pendingChapters[story.id].length / 5)}
                                          </span>
                                          <button
                                            disabled={
                                              (chapterPages[story.id] || 1) >=
                                              Math.ceil(pendingChapters[story.id].length / 5)
                                            }
                                            onClick={() =>
                                              setChapterPages((prev) => ({
                                                ...prev,
                                                [story.id]: (prev[story.id] || 1) + 1,
                                              }))
                                            }
                                          >
                                            Next
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Approved Chapters */}
                                  {approvedChapters[story.id] && approvedChapters[story.id].length > 0 && (
                                    <div className="chapter-group">
                                      <h5 className="chapter-group-title">Approved ({approvedChapters[story.id].length}):</h5>
                                      <div className="pending-chapters-list">
                                        {approvedChapters[story.id].map((chapter) => (
                                          <div key={chapter.id} className="pending-chapter-item approved">
                                            <span>{chapter.chapter_number}. {chapter.title}</span>
                                            <button
                                              className="btn-unapprove-small"
                                              onClick={() => handleUnapproveChapter(chapter.id, story.id)}
                                            >
                                              Unapprove
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {(!pendingChapters[story.id] || pendingChapters[story.id].length === 0) && 
                                   (!approvedChapters[story.id] || approvedChapters[story.id].length === 0) && (
                                    <p>No published chapters found.</p>
                                  )}
                                </>
                              ) : (
                                <p>Loading...</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="story-actions">
                          {!story.approved && story.published && (
                            <>
                              <button
                                className="btn-approve"
                                onClick={() => handleApproveStory(story.id)}
                              >
                                Approve Story
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => handleRejectStory(story.id)}
                              >
                                Reject Story
                              </button>
                            </>
                          )}
                          <button
                            className="btn-toggle"
                            onClick={() => handleToggleStoryExpand(story.id)}
                          >
                            {expandedStories[story.id] ? 'Hide Chapters' : 'Show Pending Chapters'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {storiesTotal > 10 && (
                  <div className="pagination">
                    <button
                      disabled={storiesPage === 1}
                      onClick={() => setStoriesPage(storiesPage - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {storiesPage} of {Math.ceil(storiesTotal / 10)}
                    </span>
                    <button
                      disabled={storiesPage >= Math.ceil(storiesTotal / 10)}
                      onClick={() => setStoriesPage(storiesPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Chapter Reports Tab */}
        {activeTab === 'chapters' && (
          <div className="reports-tab">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <div className="reports-list">
                  {chapterReports.length === 0 ? (
                    <p>No reported chapters found.</p>
                  ) : (
                    chapterReports.map((report) => (
                      <div key={report.id} className="report-item">
                        <div className="report-thumbnail">
                          {report.story?.cover_image_url ? (
                            <img src={report.story.cover_image_url} alt={report.story.title} />
                          ) : (
                            <div className="placeholder-thumbnail">No Cover</div>
                          )}
                        </div>
                        <div className="report-info">
                          <h3>Chapter: {report.chapter?.title}</h3>
                          <p className="report-story">Story: {report.story?.title}</p>
                          <p className="report-reason">
                            <strong>Reason:</strong> {report.reason}
                          </p>
                          <p className="report-meta">
                            Reported by: {report.reporter_name} on{' '}
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="report-actions">
                          <button
                            className="btn-approve-report"
                            onClick={() => handleApproveReport(report.id)}
                          >
                            Approve (Delete Chapter)
                          </button>
                          <button
                            className="btn-reject-report"
                            onClick={() => handleRejectReport(report.id)}
                          >
                            Reject Report
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {chapterReportsTotal > 20 && (
                  <div className="pagination">
                    <button
                      disabled={chapterReportsPage === 1}
                      onClick={() => setChapterReportsPage(chapterReportsPage - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {chapterReportsPage} of {Math.ceil(chapterReportsTotal / 20)}
                    </span>
                    <button
                      disabled={chapterReportsPage >= Math.ceil(chapterReportsTotal / 20)}
                      onClick={() => setChapterReportsPage(chapterReportsPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Comment Reports Tab */}
        {activeTab === 'comments' && (
          <div className="reports-tab">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <div className="reports-list">
                  {commentReports.length === 0 ? (
                    <p>No reported comments found.</p>
                  ) : (
                    commentReports.map((report) => (
                      <div key={report.id} className="report-item">
                        <div className="report-info full-width">
                          <div className="comment-content">
                            <strong>Comment:</strong> {report.comment?.content}
                          </div>
                          <p className="comment-author">
                            By: {report.commenter_name}
                          </p>
                          <p className="report-reason">
                            <strong>Reason:</strong> {report.reason}
                          </p>
                          <p className="report-meta">
                            Reported by: {report.reporter_name} on{' '}
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="report-actions">
                          <button
                            className="btn-approve-report"
                            onClick={() => handleApproveReport(report.id)}
                          >
                            Approve (Delete & Ban User)
                          </button>
                          <button
                            className="btn-reject-report"
                            onClick={() => handleRejectReport(report.id)}
                          >
                            Reject Report
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {commentReportsTotal > 20 && (
                  <div className="pagination">
                    <button
                      disabled={commentReportsPage === 1}
                      onClick={() => setCommentReportsPage(commentReportsPage - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {commentReportsPage} of {Math.ceil(commentReportsTotal / 20)}
                    </span>
                    <button
                      disabled={commentReportsPage >= Math.ceil(commentReportsTotal / 20)}
                      onClick={() => setCommentReportsPage(commentReportsPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Banned Users Tab */}
        {activeTab === 'banned' && (
          <div className="banned-tab">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <div className="banned-list">
                  {bannedUsers.length === 0 ? (
                    <p>No banned users found.</p>
                  ) : (
                    bannedUsers.map((ban) => (
                      <div key={ban.id} className="banned-item">
                        <div className="banned-info">
                          <h3>{ban.user?.username}</h3>
                          <p className="ban-reason">
                            <strong>Reason:</strong> {ban.reason}
                          </p>
                          <p className="ban-meta">
                            Banned by: {ban.banned_by_name} on{' '}
                            {new Date(ban.banned_at).toLocaleDateString()}
                          </p>
                          <p className="ban-until">
                            <strong>Ban expires:</strong>{' '}
                            {new Date(ban.ban_until).toLocaleString()}
                          </p>
                        </div>
                        <div className="banned-actions">
                          <button
                            className="btn-unban"
                            onClick={() => handleUnbanUser(ban.id)}
                          >
                            Unban User
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {bannedUsersTotal > 20 && (
                  <div className="pagination">
                    <button
                      disabled={bannedUsersPage === 1}
                      onClick={() => setBannedUsersPage(bannedUsersPage - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {bannedUsersPage} of {Math.ceil(bannedUsersTotal / 20)}
                    </span>
                    <button
                      disabled={bannedUsersPage >= Math.ceil(bannedUsersTotal / 20)}
                      onClick={() => setBannedUsersPage(bannedUsersPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={handleCancelReject}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Story</h2>
            <p>Please provide a reason for rejecting this story:</p>
            <textarea
              className="rejection-reason-input"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={5}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCancelReject}>
                Cancel
              </button>
              <button className="btn-confirm-reject" onClick={handleConfirmReject}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
