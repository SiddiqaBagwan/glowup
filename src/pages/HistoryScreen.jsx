import React from 'react';
import { CameraIcon, LipsIcon, TrashIcon } from '../components/Icons';

export default function HistoryScreen({
  savedLooks = [],
  onSelectLook,
  onStartTry,
  onDeleteLook,
  onClearAllLooks
}) {
  return (
    <div className="screen-content history-screen animate-fade-in">
      <div className="section-title-wrap history-title-row">
        <div>
          <h2 className="screen-title">Saved Looks</h2>
          <p className="screen-subtitle">Your collection of favorite lipstick shades</p>
        </div>
        {savedLooks.length > 0 && (
          <button
            type="button"
            className="btn-clear-history"
            onClick={onClearAllLooks}
            title="Clear saved looks"
          >
            Clear All
          </button>
        )}
      </div>

      {savedLooks.length === 0 ? (
        <div className="empty-history-card">
          <div className="empty-icon-bubble">
            <LipsIcon size={36} color="#D98C8C" />
          </div>
          <h3 className="empty-title">No looks saved yet</h3>
          <p className="empty-desc">
            Try on a lipstick shade in the studio and tap "Save Look" to keep your favorites here!
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onStartTry}
            style={{ marginTop: '16px', maxWidth: '240px' }}
          >
            <CameraIcon size={18} />
            <span>Try a Look</span>
          </button>
        </div>
      ) : (
        <div className="history-grid">
          {savedLooks.map((look) => (
            <div
              key={look.id}
              className="history-card-item"
              onClick={() => onSelectLook(look)}
            >
              {/* Photo Thumbnail or Color Bubble */}
              <div className="history-thumb-wrapper">
                {look.thumbnail ? (
                  <img src={look.thumbnail} alt={look.shade?.name} className="history-thumb-img" />
                ) : (
                  <div
                    className="history-thumb-swatch"
                    style={{ backgroundColor: look.shade?.hex || '#C87F78' }}
                  >
                    <LipsIcon size={24} color="#FFFFFF" />
                  </div>
                )}
                <span
                  className="history-shade-dot"
                  style={{ backgroundColor: look.shade?.hex }}
                  title={look.shade?.name}
                />
              </div>

              {/* Look Metadata */}
              <div className="history-details">
                <div className="history-top-line">
                  <h4 className="history-shade-name">{look.title || look.shade?.name || 'Custom Look'}</h4>
                  <span className="history-date">{look.date || 'Today'}</span>
                </div>
                <p className="history-meta">
                  {look.eyeliner ? `👁 ${look.eyeliner.style} (${look.eyeliner.color?.name || 'Black'}) • ` : ''}Intensity: {look.intensity}% • {look.lighting || 'Auto'} lighting
                </p>
                <div className="history-tags-row">
                  <span className="history-pill-tag">Tap to re-apply</span>
                </div>
              </div>

              {/* Delete Single Look */}
              <button
                type="button"
                className="btn-delete-look"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLook(look.id);
                }}
                aria-label={`Delete ${look.shade?.name} look`}
                title="Delete this look"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
