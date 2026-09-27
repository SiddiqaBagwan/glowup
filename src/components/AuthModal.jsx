import React, { useState } from 'react';
import { CloseIcon, SparklesIcon } from './Icons';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    const userName = name || email.split('@')[0] || 'Beauty Lover';
    onLoginSuccess({
      name: userName,
      username: `@${userName.toLowerCase().replace(/\s+/g, '')}`,
      email
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-brand">
            <SparklesIcon size={18} />
            <span>GlowUp Account</span>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          <h3 className="modal-title">
            {isSignUp ? 'Create your profile' : 'Welcome to GlowUp'}
          </h3>
          <p className="modal-subtitle">
            Sign in to sync your favorite lipstick looks across all your devices.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <button type="submit" className="btn-primary auth-submit-btn">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="btn-guest-mode"
            onClick={onClose}
          >
            Continue as Guest (No account needed)
          </button>

          <div className="auth-toggle-row">
            <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
            <button
              type="button"
              className="auth-toggle-link"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
