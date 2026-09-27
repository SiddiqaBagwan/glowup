import React from 'react';
import { CameraIcon, SparklesIcon, LipsIcon } from '../components/Icons';
import { LIPSTICK_SHADES } from '../utils/shades';
import { track } from '@vercel/analytics';

export default function HomeScreen({ onStartTry, onSelectShade, onGetSuggestion, photo }) {
  const popularShades = LIPSTICK_SHADES.slice(0, 5);

  const handleSuggestion = () => {
    if (onGetSuggestion) {
      onGetSuggestion();
    } else {
      const randomShade = LIPSTICK_SHADES[Math.floor(Math.random() * LIPSTICK_SHADES.length)];
      onSelectShade(randomShade);
      onStartTry();
    }
  };

  return (
    <div className="screen-content home-screen animate-fade-in">
      {/* Hero Header Area */}
      <section className="hero-header">
        <div className="hero-badge">
          <SparklesIcon size={14} />
          <span>Virtual Lipstick Studio</span>
        </div>
        <h2 className="hero-headline">Find your look.</h2>
        <p className="hero-subtext">Try makeup on yourself before you wear it.</p>
      </section>

      {/* Main Visual Feature Card */}
      <section className="hero-visual-card" onClick={onStartTry} style={{ cursor: 'pointer' }}>
        <div className="visual-preview-box">
          <div className="visual-photo-placeholder">
            {photo ? (
              <img src={photo} alt="Your current look" className="preview-image" />
            ) : (
              /* Friendly illustrated face portrait placeholder */
              <div className="face-illustration">
                <div className="face-glow-circle"></div>
                <div className="face-outline">
                  <div className="face-eyes">
                    <span className="eye left"></span>
                    <span className="eye right"></span>
                  </div>
                  <div className="face-smile-highlight">
                    <div className="face-lips-preview"></div>
                  </div>
                </div>
              </div>
            )}
            <div className="visual-floating-tag">
              <span className="live-dot"></span> {photo ? 'Photo ready • Tap to try' : 'Real-time lip try-on'}
            </div>
          </div>

          <div className="quick-shade-strip">
            <span className="quick-strip-label">Popular shades:</span>
            <div className="quick-swatches">
              {popularShades.map((shade) => (
                <button
                  key={shade.id}
                  type="button"
                  className="quick-swatch-circle"
                  style={{ backgroundColor: shade.hex }}
                  title={shade.name}
                  onClick={() => {
                    onSelectShade(shade);
                    track('lipstick_selected', {
                      shade: shade.id,
                      shadeName: shade.name,
                      finish: 'satin',
                      intensity: 50,
                      source: 'home_quick_swatch'
                    });
                    onStartTry();
                  }}
                  aria-label={`Try ${shade.name}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Primary Action Buttons */}
      <section className="hero-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onStartTry}
          id="btn-try-makeup"
        >
          <CameraIcon size={20} />
          <span>📸 Try Makeup</span>
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleSuggestion}
          id="btn-get-suggestion"
        >
          <SparklesIcon size={18} />
          <span>✨ Get a Suggestion</span>
        </button>

        <p className="hero-disclaimer">
          No sign-up needed to try it.
        </p>
      </section>

      {/* Trust & Privacy Card */}
      <section className="privacy-pill-card">
        <div className="privacy-icon-wrap">🔒</div>
        <div className="privacy-text">
          <strong>100% Private on Your Device</strong>
          <p>Your photos stay right inside your browser session.</p>
        </div>
      </section>
    </div>
  );
}
