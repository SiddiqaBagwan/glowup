import React, { useState, useRef } from 'react';
import { CloseIcon, UserIcon, CameraIcon } from './Icons';

export default function EditProfileModal({ isOpen, onClose, user, onSaveUser }) {
  const [name, setName] = useState(user?.name || 'Beauty Lover');
  const [username, setUsername] = useState(user?.username || '@glowup_guest');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const avatarInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveUser({
      ...(user || {}),
      name: name.trim() || 'Beauty Lover',
      username: username.startsWith('@') ? username.trim() : `@${username.trim()}`,
      avatar
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <input
          type="file"
          ref={avatarInputRef}
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: 'none' }}
        />

        <div className="modal-header">
          <h3 className="modal-title" style={{ margin: 0, fontSize: '18px' }}>Edit Profile</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body auth-form">
          <div
            className="profile-edit-avatar-wrap"
            onClick={() => avatarInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          >
            <div className="avatar-edit-circle">
              {avatar ? (
                <img src={avatar} alt="Avatar preview" className="avatar-edit-img" />
              ) : (
                <UserIcon size={32} />
              )}
              <div className="avatar-edit-badge">
                <CameraIcon size={14} />
              </div>
            </div>
            <span className="avatar-hint">Tap to change photo</span>
          </div>

          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Your name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="@username"
            />
          </div>

          <button type="submit" className="btn-primary auth-submit-btn">
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
