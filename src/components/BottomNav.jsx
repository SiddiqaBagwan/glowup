import React from 'react';
import { HomeIcon, HistoryIcon, LipsIcon, UserIcon } from './Icons';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'try', label: 'Try', icon: LipsIcon, isPrimary: true },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="bottom-nav-container" aria-label="Bottom Navigation">
      <div className="bottom-nav-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-item primary-try-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-label="Try Lipstick Makeup"
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="primary-try-inner">
                  <LipsIcon size={24} color="#FFFFFF" />
                </div>
                <span className="nav-label primary-label">Try</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-icon-wrapper">
                <Icon size={21} />
              </div>
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
