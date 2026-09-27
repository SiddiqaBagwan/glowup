import React from 'react';
import { ArrowLeftIcon, SparklesIcon, UserIcon } from './Icons';

export default function Header({ 
  activeTab, 
  onBack, 
  onOpenAuth, 
  user 
}) {
  const showBack = activeTab !== 'home';

  return (
    <header className="glowup-header">
      <div className="header-left">
        {showBack ? (
          <button 
            type="button" 
            className="icon-button back-btn" 
            onClick={onBack}
            aria-label="Go back to Home"
          >
            <ArrowLeftIcon size={20} />
          </button>
        ) : (
          <div className="brand-sparkle-pill">
            <SparklesIcon size={14} className="sparkle-gold" />
            <span>Virtual Beauty</span>
          </div>
        )}
      </div>

      <div className="header-center">
        <h1 className="brand-logo" onClick={onBack} style={{ cursor: 'pointer' }}>
          <span className="brand-sparkle">✨</span> GlowUp
        </h1>
      </div>

      <div className="header-right">
        <button 
          type="button" 
          className="user-pill-btn" 
          onClick={onOpenAuth}
          aria-label="User Account"
        >
          {user ? (
            <span className="user-name-abbr">{user.name.charAt(0)}</span>
          ) : (
            <UserIcon size={18} />
          )}
        </button>
      </div>
    </header>
  );
}
