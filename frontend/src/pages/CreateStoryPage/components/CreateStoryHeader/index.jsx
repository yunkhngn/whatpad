import React from 'react';

const CreateStoryHeader = ({ onCancel, onSave, isSaving, disabled }) => {
  return (
    <div className="create-story-header">
      <div className="header-content">
        <button 
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          <i className="bi bi-x-lg me-2"></i>
          Cancel
        </button>
        <h1 className="header-title">Create New Story</h1>
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

export default CreateStoryHeader;
