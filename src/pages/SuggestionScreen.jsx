import React, { useState, useEffect, useRef } from 'react';
import { CameraIcon, UploadIcon, SparklesIcon, ArrowLeftIcon, LipsIcon } from '../components/Icons';
import CameraCapture from '../components/CameraCapture';
import { SAMPLE_SELFIE_URL, processUploadedFile } from '../utils/imageUtils';
import { analyzePhotoForSuggestions } from '../utils/shadeRecommender';
import { track } from '@vercel/analytics';

export default function SuggestionScreen({
  photo,
  onPhotoChange,
  onSelectAndTry,
  onBack
}) {
  const [activePhoto, setActivePhoto] = useState(photo || null);
  const [step, setStep] = useState(photo ? 'analyzing' : 'upload'); // 'upload' | 'analyzing' | 'results'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  // If a photo was already provided or changed, trigger analysis
  useEffect(() => {
    if (activePhoto && step === 'analyzing') {
      let isCancelled = false;

      async function runAnalysis() {
        try {
          // Subtle minimum delay for smooth and pleasant transition
          const [result] = await Promise.all([
            analyzePhotoForSuggestions(activePhoto),
            new Promise((resolve) => setTimeout(resolve, 800))
          ]);

          if (!isCancelled) {
            setAnalysisResult(result);
            setStep('results');
          }
        } catch (err) {
          console.warn('Analysis error:', err);
          if (!isCancelled) {
            // Never crash: provide fallback suggestions
            setAnalysisResult({
              success: true,
              undertone: 'Neutral',
              lightingQuality: 'Natural Light',
              warning: "We couldn't get a clear read from this photo. Try a front-facing photo in natural light.",
              recommendations: []
            });
            setStep('results');
          }
        }
      }

      runAnalysis();

      return () => {
        isCancelled = true;
      };
    }
  }, [activePhoto, step]);

  const handleStartAnalysis = (photoData) => {
    track('ai_suggestion', { source: 'photo_analysis' });
    setErrorMsg(null);
    setActivePhoto(photoData);
    if (onPhotoChange) {
      onPhotoChange(photoData);
    }
    setStep('analyzing');
  };

  const handleUploadClick = () => {
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await processUploadedFile(file);
      handleStartAnalysis(processed.dataUrl);
    } catch (err) {
      setErrorMsg(err.message || 'Could not process this photo. Please try another.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUseSample = () => {
    handleStartAnalysis(SAMPLE_SELFIE_URL);
  };

  const handleCameraPhoto = (dataUrl) => {
    setIsCameraOpen(false);
    handleStartAnalysis(dataUrl);
  };

  const handleTryShade = (shade) => {
    track('lipstick_selected', {
      shade: shade.id,
      shadeName: shade.name,
      finish: 'satin',
      intensity: 50,
      source: 'ai_suggestion'
    });
    onSelectAndTry(shade, activePhoto);
  };

  const handleReset = () => {
    setStep('upload');
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="screen-content suggestion-screen animate-fade-in">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handleCameraPhoto}
      />

      {/* Screen Header */}
      <div className="suggestion-top-bar">
        <button
          type="button"
          className="suggestion-back-btn"
          onClick={onBack}
          aria-label="Back to Home"
        >
          <ArrowLeftIcon size={18} />
          <span>Back</span>
        </button>

        <div className="suggestion-pill-badge">
          <SparklesIcon size={14} />
          <span>AI Suggestions</span>
        </div>
      </div>

      {/* ── STEP 1: Upload / Capture ────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="suggestion-upload-container animate-fade-in">
          <div className="suggestion-hero-text">
            <h2 className="suggestion-title">Find your ideal shades ✨</h2>
            <p className="suggestion-subtitle">
              Upload or snap a selfie to discover 3 lipstick shades tailored to the tones visible in your photo.
            </p>
          </div>

          {errorMsg && (
            <div className="suggestion-error-banner">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          <div className="suggestion-options-card">
            <button
              type="button"
              className="suggestion-action-btn primary"
              onClick={() => setIsCameraOpen(true)}
              id="btn-suggest-camera"
            >
              <div className="action-btn-icon-wrap">
                <CameraIcon size={22} />
              </div>
              <div className="action-btn-text">
                <strong>Take a Selfie</strong>
                <span>Use your front camera</span>
              </div>
            </button>

            <button
              type="button"
              className="suggestion-action-btn"
              onClick={handleUploadClick}
              id="btn-suggest-upload"
            >
              <div className="action-btn-icon-wrap">
                <UploadIcon size={22} />
              </div>
              <div className="action-btn-text">
                <strong>Upload Photo</strong>
                <span>Choose from your device</span>
              </div>
            </button>

            {photo && (
              <button
                type="button"
                className="suggestion-action-btn current-photo-btn"
                onClick={() => handleStartAnalysis(photo)}
              >
                <div className="action-btn-thumbnail">
                  <img src={photo} alt="Current active look" />
                </div>
                <div className="action-btn-text">
                  <strong>Use Current Photo</strong>
                  <span>Analyze your existing selfie</span>
                </div>
              </button>
            )}

            <div className="suggestion-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="suggestion-sample-btn"
              onClick={handleUseSample}
              id="btn-suggest-sample"
            >
              <span>✨ Try with Sample Selfie</span>
            </button>
          </div>

          <p className="suggestion-privacy-note">
            🔒 100% on-device. Your photo is analyzed right here in your browser and never leaves your device.
          </p>
        </div>
      )}

      {/* ── STEP 2: Loading State ──────────────────────────────────────────── */}
      {step === 'analyzing' && (
        <div className="suggestion-loading-container animate-fade-in">
          <div className="suggestion-loader-box">
            <div className="suggestion-glow-ring">
              <div className="suggestion-inner-avatar">
                {activePhoto ? (
                  <img src={activePhoto} alt="Analyzing selfie" className="loader-avatar-img" />
                ) : (
                  <SparklesIcon size={32} />
                )}
              </div>
            </div>

            <div className="suggestion-loading-text">
              <h3 className="loading-headline">Finding shades for you ✨</h3>
              <p className="loading-subtext">Analyzing visible tones and lighting balance...</p>
            </div>

            <div className="loading-pulse-bar">
              <div className="loading-pulse-indicator"></div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Results ────────────────────────────────────────────────── */}
      {step === 'results' && analysisResult && (
        <div className="suggestion-results-container animate-fade-in">
          {/* Header */}
          <div className="results-intro">
            <h2 className="results-title">✨ Your suggested shades</h2>
            <p className="results-subtitle">
              Based on the tones visible in your photo, you could try:
            </p>
          </div>

          {/* Photo Thumbnail + Analysis Meta Tag */}
          <div className="results-meta-strip">
            {activePhoto && (
              <img src={activePhoto} alt="Analyzed photo" className="results-photo-thumb" />
            )}
            <div className="results-meta-info">
              <span className="results-tone-badge">
                {analysisResult.undertone} undertone tones • {analysisResult.lightingQuality}
              </span>
              <p className="results-meta-desc">
                {analysisResult.warning ? (
                  <span className="results-warning-text">💡 {analysisResult.warning}</span>
                ) : (
                  '3 diverse shades selected to complement your visible tones.'
                )}
              </p>
            </div>
          </div>

          {/* Top 3 Shade Cards */}
          <div className="suggested-cards-list">
            {analysisResult.recommendations.map((rec, index) => {
              const shade = rec.shade;
              return (
                <div key={shade.id || index} className="suggested-shade-card">
                  <div className="card-swatch-col">
                    <div
                      className="card-swatch-bubble"
                      style={{ backgroundColor: shade.hex }}
                    >
                      <div className="swatch-shine"></div>
                    </div>
                  </div>

                  <div className="card-info-col">
                    <div className="card-title-row">
                      <h4 className="card-shade-name">{shade.name}</h4>
                      <span className="card-category-tag">{shade.category}</span>
                    </div>
                    <p className="card-reason">{rec.reason}</p>
                  </div>

                  <div className="card-action-col">
                    <button
                      type="button"
                      className="btn-try-shade"
                      onClick={() => handleTryShade(shade)}
                      aria-label={`Try ${shade.name}`}
                    >
                      <LipsIcon size={14} />
                      <span>Try this shade</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Retake / Try Another button */}
          <div className="results-footer-actions">
            <button
              type="button"
              className="btn-retake-photo"
              onClick={handleReset}
            >
              <span>🔄 Try another photo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
