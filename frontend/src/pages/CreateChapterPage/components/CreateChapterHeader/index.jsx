import React from 'react';

const CreateChapterHeader = ({ storyTitle, onCancel, onSave, isSaving, disabled }) => {
  return (
    <div className="create-chapter-header">
      <div className="header-content">
        <button 
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          <i className="bi bi-x-lg me-2"></i>
          Cancel
        </button>
        <div className="header-info">
          <h1 className="header-title">Create New Chapter</h1>
          {storyTitle && <p className="story-title">{storyTitle}</p>}
        </div>
        <button 
          className="btn btn-primary"
          onClick={onSave}
          disabled={disabled || isSaving}
        >
          {isSaving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-2"></i>
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateChapterHeader;
