import React, { useEffect, useState } from 'react';
import { checkUserBanStatus } from '../../services/api';
import './BanAlert.css';

const BanAlert = ({ userId }) => {
  const [banInfo, setBanInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkBan = async () => {
      try {
        const response = await checkUserBanStatus(userId);
        if (response.banned) {
          setBanInfo(response.ban);
          setIsVisible(true);
        }
      } catch (err) {
        console.error('Error checking ban status:', err);
      }
    };

    if (userId) {
      checkBan();
    }
  }, [userId]);

  if (!isVisible || !banInfo) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="ban-alert-overlay">
      <div className="ban-alert">
        <div className="ban-alert-icon">⚠️</div>
        <h2>Account Temporarily Restricted</h2>
        <div className="ban-alert-content">
          <p className="ban-reason">
            <strong>Reason:</strong> {banInfo.reason}
          </p>
          <p className="ban-duration">
            Your account has been restricted from certain actions until:{' '}
            <strong>{formatDate(banInfo.ban_until)}</strong>
          </p>
          <p className="ban-message">
            During this time, you may not be able to post comments or perform certain actions.
            Please review our community guidelines.
          </p>
        </div>
        <button className="btn-close-alert" onClick={() => setIsVisible(false)}>
          I Understand
        </button>
      </div>
    </div>
  );
};

export default BanAlert;
