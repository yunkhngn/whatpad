import React from 'react';
import './CreateStoryLayout.css';

const CreateStoryLayout = ({ children }) => {
  return (
    <div className="create-story-layout">
      <div className="create-story-container">
        {children}
      </div>
    </div>
  );
};

export default CreateStoryLayout;
