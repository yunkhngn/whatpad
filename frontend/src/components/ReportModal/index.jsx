import React, { useState } from 'react';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, onSubmit, type, entityId }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ type, entity_id: entityId, reason: reason.trim() });
      setReason('');
      onClose();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'story':
        return 'Report Story';
      case 'chapter':
        return 'Report Chapter';
      case 'comment':
        return 'Report Comment';
      default:
        return 'Report Content';
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>{getTitle()}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-modal-body">
            <label htmlFor="reason">
              Please explain why you're reporting this content:
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue..."
              rows="6"
              required
              disabled={loading}
            />
          </div>

          <div className="report-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
