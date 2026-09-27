import React, { useState, useEffect } from 'react';
import { InstallIcon } from './Icons';
import { initInstallPrompt, triggerInstallPrompt, isRunningAsPWA } from '../utils/shareUtils';

/**
 * Subtle bottom banner that appears when the browser supports PWA installation.
 * Auto-hides after 12 seconds or when dismissed.
 */
export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isRunningAsPWA()) return;

    // Don't show if user already dismissed this session
    try {
      if (sessionStorage.getItem('glowup_install_dismissed')) return;
    } catch {}

    initInstallPrompt(() => {
      // Delay slightly so the app has time to load first
      setTimeout(() => setVisible(true), 3000);
    });
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const outcome = await triggerInstallPrompt();
    setIsInstalling(false);
    setVisible(false);
    if (outcome === 'accepted') {
      // Mark as installed so we don't show again
      try { sessionStorage.setItem('glowup_install_dismissed', '1'); } catch {}
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem('glowup_install_dismissed', '1'); } catch {}
  };

  if (!visible) return null;

  return (
    <div className="install-banner animate-slide-up" role="status" aria-live="polite">
      <div className="install-banner-icon">
        <InstallIcon size={20} />
      </div>
      <div className="install-banner-text">
        <strong>Add GlowUp to your Home Screen</strong>
        <span>One tap away — no App Store needed</span>
      </div>
      <div className="install-banner-actions">
        <button
          type="button"
          className="btn-install-yes"
          onClick={handleInstall}
          disabled={isInstalling}
        >
          {isInstalling ? '…' : 'Add'}
        </button>
        <button
          type="button"
          className="btn-install-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
