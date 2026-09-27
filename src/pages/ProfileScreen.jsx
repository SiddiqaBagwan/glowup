import React from 'react';
import { UserIcon, SparklesIcon, BookmarkIcon } from '../components/Icons';

export default function ProfileScreen({
  user,
  onOpenEditProfile,
  onOpenAuth,
  onLogout,
  savedLooksCount = 0,
  onViewHistory,
  onClearHistory
}) {
  return (
    <div className="screen-content profile-screen animate-fade-in">
      <div className="section-title-wrap">
        <h2 className="screen-title">Profile</h2>
      </div>

      {/* User Card */}
      <div className="profile-card">
        <div className="profile-avatar-circle">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">
              <UserIcon size={38} />
            </div>
          )}
        </div>

        <div className="profile-info">
          <h3 className="profile-name">{user ? user.name : 'Beauty Lover'}</h3>
          <p className="profile-username">{user ? user.username : '@glowup_guest'}</p>
          <span className="guest-badge">
            <SparklesIcon size={12} />
            {user ? 'Member' : 'Guest Mode'}
          </span>
        </div>

        <button
          type="button"
          className="btn-edit-profile"
          onClick={onOpenEditProfile}
        >
          Edit Profile
        </button>
      </div>

      {/* Stats / Quick Summary */}
      <div className="profile-quick-stats">
        <div className="stat-card" onClick={onViewHistory}>
          <BookmarkIcon size={20} className="stat-icon" />
          <div className="stat-content">
            <span className="stat-number">{savedLooksCount}</span>
            <span className="stat-label">Saved Looks</span>
          </div>
        </div>
      </div>

      {/* Settings & Info Section */}
      <div className="profile-section-card">
        <h4 className="card-subheading">Settings & Preferences</h4>
        
        <div className="profile-menu-list">
          <div className="menu-item-row">
            <div className="menu-item-info">
              <span className="menu-item-title">Local Processing</span>
              <span className="menu-item-desc">Photos are processed directly in your browser</span>
            </div>
            <span className="status-tag active">Enabled</span>
          </div>

          <div className="menu-item-row">
            <div className="menu-item-info">
              <span className="menu-item-title">Default Lighting</span>
              <span className="menu-item-desc">Balanced auto normalization</span>
            </div>
            <span className="status-tag">Auto</span>
          </div>

          <div className="menu-item-row">
            <div className="menu-item-info">
              <span className="menu-item-title">Saved Looks Storage</span>
              <span className="menu-item-desc">{savedLooksCount} look{savedLooksCount === 1 ? '' : 's'} stored on this device</span>
            </div>
            {savedLooksCount > 0 && (
              <button
                type="button"
                className="status-tag danger-tag"
                onClick={onClearHistory}
                title="Clear saved looks"
              >
                Clear
              </button>
            )}
          </div>

          <div className="menu-item-row">
            <div className="menu-item-info">
              <span className="menu-item-title">About GlowUp</span>
              <span className="menu-item-desc">Version 0.1.0 • Mobile-first Virtual Try-On</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Action */}
      <div className="profile-auth-action">
        {user ? (
          <button
            type="button"
            className="btn-outline-danger"
            onClick={onLogout}
          >
            Log Out
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenAuth}
          >
            <span>Log In / Sign Up</span>
          </button>
        )}
      </div>
    </div>
  );
}
