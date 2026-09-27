import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, UploadIcon, CompareIcon, BookmarkIcon, SunIcon, ShareIcon, DownloadIcon } from '../components/Icons';
import { LIPSTICK_SHADES, LIGHTING_PRESETS, LIPSTICK_FINISHES, SHADE_CATEGORIES } from '../utils/shades';
import { processUploadedFile, SAMPLE_SELFIE_URL, loadImage } from '../utils/imageUtils';
import { shareLook, downloadLook } from '../utils/shareUtils';
import { detectFaceAndLips } from '../utils/faceDetector';
import { renderLipstickOnCanvas } from '../utils/lipstickRenderer';
import { EYELINER_STYLES, EYELINER_COLORS, renderEyelinerOnCanvas } from '../utils/eyelinerRenderer';
import { renderContourOnCanvas } from '../utils/contourRenderer';
import { renderBlushOnCanvas, } from '../utils/blushRenderer';
import { CONTOUR_SHADES } from '../utils/contourData';
import { BLUSH_SHADES, BLUSH_CATEGORIES } from '../utils/blushData';
import CameraCapture from '../components/CameraCapture';
import BeforeAfterSlider from '../components/BeforeAfterSlider';

export default function TryOnStudioScreen({
  photo,
  onPhotoChange,
  selectedShade,
  setSelectedShade,
  intensity,
  setIntensity,
  selectedLighting,
  setSelectedLighting,
  makeupMode = 'lipstick',
  setMakeupMode = () => {},
  eyelinerStyle = 'classic',
  setEyelinerStyle = () => {},
  eyelinerColor = EYELINER_COLORS[0],
  setEyelinerColor = () => {},
  eyelinerThickness = 50,
  setEyelinerThickness = () => {},
  eyelinerWing = 50,
  setEyelinerWing = () => {},
  // Contour props
  selectedContour,
  setSelectedContour = () => {},
  contourIntensity = 50,
  setContourIntensity = () => {},
  isContourActive = false,
  setIsContourActive = () => {},
  // Blush props
  selectedBlush,
  setSelectedBlush = () => {},
  blushIntensity = 50,
  setBlushIntensity = () => {},
  blushFinish = 'natural',
  setBlushFinish = () => {},
  isBlushActive = false,
  setIsBlushActive = () => {},
  onSaveLook
}) {
  const [compareMode, setCompareMode] = useState('off'); // 'off' | 'slider' | 'toggle'
  const [isComparingToggle, setIsComparingToggle] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [finish, setFinish] = useState('satin');
  const [toastMsg, setToastMsg] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Nude');

  const fileInputRef = useRef(null);
  const afterCanvasRef = useRef(null);
  const beforeCanvasRef = useRef(null);

  // Stage 3 & 4 States
  const [isDetecting, setIsDetecting] = useState(false);
  const [lipData, setLipData] = useState(null);
  const [eyeData, setEyeData] = useState(null);
  const [faceStructure, setFaceStructure] = useState(null);
  const [eyesDetected, setEyesDetected] = useState(true);
  const [detectionError, setDetectionError] = useState(null);
  const [detectionWarning, setDetectionWarning] = useState(null);
  const [blushCategory, setBlushCategory] = useState('All');
  const [showLipOutlines, setShowLipOutlines] = useState(false);

  // Automatically trigger lip detection when photo changes
  useEffect(() => {
    let isCancelled = false;

    async function runDetection() {
      if (!photo) {
        setLipData(null);
        setDetectionError(null);
        setDetectionWarning(null);
        return;
      }

      try {
        setIsDetecting(true);
        setDetectionError(null);
        setDetectionWarning(null);

        const img = await loadImage(photo);
        if (isCancelled) return;

        const result = await detectFaceAndLips(img);
        if (isCancelled) return;

        if (result.success) {
          setLipData(result.lipLandmarks);
          setEyeData(result.eyeLandmarks || null);
          setFaceStructure(result.faceStructureLandmarks || null);
          setEyesDetected(result.eyesDetected !== false);
          if (result.warning) {
            setDetectionWarning(result.warning);
          }
        } else {
          setLipData(null);
          setEyeData(null);
          setFaceStructure(null);
          setEyesDetected(false);
          setDetectionError(result.error);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Detection error:', err);
          setDetectionError("We couldn't detect lips clearly. Try a front-facing selfie with good lighting.");
        }
      } finally {
        if (!isCancelled) {
          setIsDetecting(false);
        }
      }
    }

    runDetection();

    return () => {
      isCancelled = true;
    };
  }, [photo]);

  // 4-Layer Rendering Pipeline: Contour → Blush → Lipstick → Eyeliner
  useEffect(() => {
    if (!photo) return;
    let isCancelled = false;

    loadImage(photo)
      .then((img) => {
        if (isCancelled) return;

        const renderLayered = (isBefore) => {
          // Layer 1 — Contour (first so it sits under blush and lipstick)
          const contourCanvas = renderContourOnCanvas(
            img,
            isContourActive ? faceStructure : null,
            selectedContour?.hex || '#765847',
            contourIntensity,
            { isBefore, lighting: selectedLighting }
          );

          // Layer 2 — Blush on top of contour
          const blushCanvas = renderBlushOnCanvas(
            contourCanvas,
            isBlushActive ? faceStructure : null,
            selectedBlush?.hex || '#E8A0A8',
            blushIntensity,
            { isBefore, skipLighting: true, finish: blushFinish }
          );

          // Layer 3 — Lipstick on top of blush
          const lipCanvas = renderLipstickOnCanvas(
            blushCanvas,
            lipData,
            selectedShade.hex,
            intensity,
            { isBefore, finish, skipLighting: true }
          );

          // Layer 4 — Eyeliner on top of everything
          const finalCanvas = renderEyelinerOnCanvas(
            lipCanvas,
            eyeData,
            eyelinerColor.hex,
            isBefore ? 0 : intensity,
            {
              isBefore,
              style: eyelinerStyle,
              thickness: eyelinerThickness,
              wingLength: eyelinerWing,
              skipLighting: true
            }
          );

          return finalCanvas;
        };

        // After canvas — all layers applied
        if (afterCanvasRef.current) {
          const rendered = renderLayered(isComparingToggle);
          const c = afterCanvasRef.current;
          c.width = rendered.width;
          c.height = rendered.height;
          const ctx = c.getContext('2d');
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.drawImage(rendered, 0, 0);
        }

        // Before canvas — always clean original
        if (beforeCanvasRef.current) {
          const rendered = renderLayered(true);
          const c = beforeCanvasRef.current;
          c.width = rendered.width;
          c.height = rendered.height;
          const ctx = c.getContext('2d');
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.drawImage(rendered, 0, 0);
        }
      })
      .catch((err) => {
        console.warn('Canvas rendering error:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    photo,
    lipData,
    eyeData,
    faceStructure,
    selectedShade,
    intensity,
    isComparingToggle,
    finish,
    selectedLighting,
    eyelinerStyle,
    eyelinerColor,
    eyelinerThickness,
    eyelinerWing,
    isContourActive,
    selectedContour,
    contourIntensity,
    isBlushActive,
    selectedBlush,
    blushIntensity,
    blushFinish
  ]);

  // Intensity labels helper
  const getIntensityLabel = (val) => {
    if (val < 35) return 'Sheer';
    if (val > 70) return 'Bold';
    return 'Natural';
  };

  const handleUploadClick = () => {
    setUploadError(null);
    setDetectionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setUploadError(null);
      setDetectionError(null);
      const processed = await processUploadedFile(file);
      onPhotoChange(processed.dataUrl);
    } catch (err) {
      setUploadError(err.message || 'Could not process this photo. Please try another.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUseSamplePhoto = () => {
    setUploadError(null);
    setDetectionError(null);
    onPhotoChange(SAMPLE_SELFIE_URL);
  };

  const handleCameraPhoto = (dataUrl) => {
    setUploadError(null);
    setDetectionError(null);
    onPhotoChange(dataUrl);
  };

  // Get the rendered canvas image data URL
  const getRenderedPhotoData = () => {
    if (afterCanvasRef.current) {
      try {
        return afterCanvasRef.current.toDataURL('image/jpeg', 0.94);
      } catch (e) {
        console.warn('Could not export canvas data:', e);
      }
    }
    return photo;
  };

  const currentEyelinerStyleObj = EYELINER_STYLES.find((s) => s.id === eyelinerStyle) || EYELINER_STYLES[1];
  // Look title reflects combined makeup
  const currentLookTitle = `${selectedShade.name} + ${currentEyelinerStyleObj.label} Eyeliner`;

  // Share look via Web Share API (with image file when supported)
  const handleShare = async () => {
    const finalPhotoData = getRenderedPhotoData();
    // Save to history first
    onSaveLook(finalPhotoData);

    setIsSharing(true);
    try {
      const result = await shareLook(finalPhotoData, currentLookTitle);
      if (result.success) {
        if (result.method === 'clipboard') {
          setToastMsg('🔗 Link copied! Paste it anywhere to share.');
        } else {
          setToastMsg(`✨ "${currentLookTitle}" look shared!`);
        }
      } else if (result.method !== 'aborted') {
        // Fallback: just download if sharing completely failed
        downloadLook(finalPhotoData, currentLookTitle);
        setToastMsg(`💾 Saved! Share it from your Photos app.`);
      }
    } finally {
      setIsSharing(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  // Always-available download button
  const handleDownload = () => {
    const finalPhotoData = getRenderedPhotoData();
    onSaveLook(finalPhotoData);
    downloadLook(finalPhotoData, currentLookTitle);
    setToastMsg(`✨ "${currentLookTitle}" saved to device!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Reset all makeup layers back to defaults (photo stays loaded)
  const handleReset = () => {
    const defaultShade = LIPSTICK_SHADES.find((s) => s.id === 'rose-nude') || LIPSTICK_SHADES[0];
    setSelectedShade(defaultShade);
    setIntensity(50);
    setFinish('satin');
    setEyelinerStyle('classic');
    setEyelinerColor(EYELINER_COLORS[0]);
    setEyelinerThickness(50);
    setEyelinerWing(50);
    setIsContourActive(false);
    setContourIntensity(50);
    setIsBlushActive(false);
    setBlushIntensity(50);
    setBlushFinish('natural');
    setCompareMode('off');
    setIsComparingToggle(false);
    setToastMsg('↺ Makeup reset');
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleToggleComparison = () => {
    if (compareMode === 'off') {
      setCompareMode('slider');
    } else if (compareMode === 'slider') {
      setCompareMode('toggle');
      setIsComparingToggle(true);
    } else {
      setCompareMode('off');
      setIsComparingToggle(false);
    }
  };


  // Convert normalized landmark array to SVG polygon points
  const getSvgPoints = (points) => {
    if (!points || !points.length) return '';
    return points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ');
  };

  return (
    <div className="screen-content tryon-screen animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="glowup-toast-banner animate-fade-in">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="hidden-selfie-input"
      />

      <div className="studio-header-strip">
        <h2 className="studio-title">Your Look</h2>
        <span className="studio-shade-badge" style={{ backgroundColor: `${selectedShade.hex}22`, color: selectedShade.hex }}>
          {selectedShade.name}
        </span>
      </div>

      {/* Main Large Photo Canvas / Preview Box */}
      <div className="studio-viewport-card">
        {isLoading ? (
          <div className="photo-loading-box">
            <div className="beauty-spinner"></div>
            <p className="loading-label">Preparing your photo...</p>
          </div>
        ) : photo ? (
          <div className="photo-render-wrapper">
            {/* Draggable Split Slider View */}
            {compareMode === 'slider' ? (
              <BeforeAfterSlider
                afterCanvas={<canvas ref={afterCanvasRef} className="preview-canvas" />}
                beforeCanvas={<canvas ref={beforeCanvasRef} className="preview-canvas" />}
              />
            ) : (
              <>
                {/* Standard View */}
                <canvas ref={afterCanvasRef} className="preview-canvas" />
                {/* Hidden reference canvas for split view */}
                <canvas ref={beforeCanvasRef} style={{ display: 'none' }} />
              </>
            )}

            {/* SVG Landmark Overlay for Inspection */}
            {lipData && showLipOutlines && (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="lip-landmark-overlay"
              >
                <polygon
                  points={getSvgPoints(lipData.outerContour)}
                  fill="none"
                  stroke="#F4A58A"
                  strokeWidth="0.8"
                  strokeDasharray="1.5,1.5"
                />
                <polygon
                  points={getSvgPoints(lipData.innerContour)}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="0.6"
                />
              </svg>
            )}

            {/* Non-intrusive status pills */}
            {isDetecting && (
              <div className="detecting-pill">
                <span className="detect-spinner"></span>
                <span>{makeupMode === 'eyeliner' ? 'Detecting eyes... ✨' : 'Detecting lips... ✨'}</span>
              </div>
            )}

            {/* Warning banner */}
            {detectionWarning && !detectionError && !isDetecting && (
              <div className="detection-warning-banner">
                <span>💡 {detectionWarning}</span>
              </div>
            )}

            {/* Eyeliner Specific Warning if eyes not detected */}
            {!detectionError && !isDetecting && makeupMode === 'eyeliner' && !eyesDetected && (
              <div className="detection-warning-banner">
                <span>💡 We couldn't detect your eyes clearly. Try a front-facing photo with your eyes open.</span>
              </div>
            )}

            {/* Error Overlay if face/features not detected */}
            {detectionError && (
              <div className="detection-error-overlay">
                <div className="detection-error-content">
                  <div className="error-icon-wrap">🔍</div>
                  <h4 className="error-title">Clear face not found</h4>
                  <p className="error-desc">
                    {makeupMode === 'eyeliner'
                      ? "We couldn't detect your eyes clearly. Try a front-facing photo with your eyes open."
                      : detectionError}
                  </p>
                  <div className="error-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleUploadClick}
                      style={{ height: '40px', fontSize: '13px' }}
                    >
                      Choose Another Photo
                    </button>
                    <button
                      type="button"
                      className="btn-sample-photo"
                      onClick={handleUseSamplePhoto}
                      style={{ color: '#FFFFFF', marginTop: '6px' }}
                    >
                      Try with model portrait
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Top overlay controls */}
            <div className="viewport-overlay-controls">
              <span className={`comparing-badge ${compareMode !== 'off' ? 'active' : ''}`}>
                {compareMode === 'slider'
                  ? 'Drag Split Slider ‹›'
                  : isComparingToggle
                  ? 'Original (Before)'
                  : 'Lipstick Applied (After)'}
              </span>
              <div className="viewport-top-actions">
                {lipData && (
                  <button
                    type="button"
                    className={`btn-icon-pill ${showLipOutlines ? 'active' : ''}`}
                    onClick={() => setShowLipOutlines(!showLipOutlines)}
                    title="Toggle lip landmarks outline"
                  >
                    👄 {showLipOutlines ? 'Hide Mesh' : 'Show Mesh'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-change-photo"
                  onClick={handleUploadClick}
                  title="Change or retake photo"
                >
                  Change Photo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="photo-placeholder-box">
            <div className="placeholder-content">
              <div className="camera-circle-badge">
                <CameraIcon size={32} />
              </div>
              <h3 className="placeholder-headline">Add your selfie</h3>
              <p className="placeholder-sub">
                Snap or upload a photo to see <span style={{ color: selectedShade.hex, fontWeight: 600 }}>{selectedShade.name}</span> lipstick on you.
              </p>

              {uploadError && (
                <div className="upload-error-pill">
                  {uploadError}
                </div>
              )}

              <div className="placeholder-actions">
                <button 
                  type="button" 
                  className="btn-studio-upload"
                  onClick={handleUploadClick}
                  id="btn-upload-photo"
                >
                  <UploadIcon size={18} />
                  <span>Upload Photo</span>
                </button>
                <button 
                  type="button" 
                  className="btn-studio-camera"
                  onClick={() => setIsCameraOpen(true)}
                  id="btn-open-camera"
                >
                  <CameraIcon size={18} />
                  <span>Take Selfie</span>
                </button>
              </div>

              <button
                type="button"
                className="btn-sample-photo"
                onClick={handleUseSamplePhoto}
              >
                ✨ Try with demo model portrait
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Makeup Mode Selector ── */}
      <div className="studio-section makeup-mode-section">
        <div className="section-label-row">
          <span className="studio-label">Makeup</span>
          {/* Active layer pills */}
          <div className="active-layers-badges">
            {isContourActive && <span className="layer-badge contour-badge">Contour ✓</span>}
            {isBlushActive && <span className="layer-badge blush-badge">Blush ✓</span>}
          </div>
        </div>
        <div className="makeup-mode-pill-strip" role="radiogroup" aria-label="Makeup Mode">
          <button
            type="button"
            className={`makeup-mode-pill ${makeupMode === 'lipstick' ? 'active' : ''}`}
            onClick={() => setMakeupMode('lipstick')}
            role="radio"
            aria-checked={makeupMode === 'lipstick'}
            id="btn-mode-lipstick"
          >
            <span className="mode-pill-icon">💋</span>
            <span>Lipstick</span>
          </button>
          <button
            type="button"
            className={`makeup-mode-pill ${makeupMode === 'eyeliner' ? 'active' : ''}`}
            onClick={() => setMakeupMode('eyeliner')}
            role="radio"
            aria-checked={makeupMode === 'eyeliner'}
            id="btn-mode-eyeliner"
          >
            <span className="mode-pill-icon">👁</span>
            <span>Eyeliner</span>
          </button>
          <button
            type="button"
            className={`makeup-mode-pill ${makeupMode === 'contour' ? 'active' : ''} ${isContourActive ? 'layer-on' : ''}`}
            onClick={() => setMakeupMode('contour')}
            role="radio"
            aria-checked={makeupMode === 'contour'}
            id="btn-mode-contour"
          >
            <span className="mode-pill-icon">✦</span>
            <span>Contour</span>
          </button>
          <button
            type="button"
            className={`makeup-mode-pill ${makeupMode === 'blush' ? 'active' : ''} ${isBlushActive ? 'layer-on' : ''}`}
            onClick={() => setMakeupMode('blush')}
            role="radio"
            aria-checked={makeupMode === 'blush'}
            id="btn-mode-blush"
          >
            <span className="mode-pill-icon">🌸</span>
            <span>Blush</span>
          </button>
        </div>
      </div>

      {/* Lighting Adjustment Bar */}
      <div className="studio-section lighting-section">
        <div className="section-label-row">
          <span className="studio-label">
            <SunIcon size={15} />
            <span>Lighting</span>
          </span>
          <span className="preset-selected-label">{selectedLighting}</span>
        </div>
        <div className="lighting-pill-list">
          {LIGHTING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`lighting-pill ${selectedLighting === preset.id ? 'active' : ''}`}
              onClick={() => setSelectedLighting(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lipstick Mode Controls ────────────────────────────────────────── */}
      {makeupMode === 'lipstick' && (
        <div className="studio-section lipstick-section animate-fade-in">
          {/* Selected shade name + description header */}
          <div className="shade-header-row">
            <div className="shade-header-name-wrap">
              <span className="shade-selected-name">{selectedShade.name}</span>
              <span className="shade-selected-desc">{selectedShade.description}</span>
            </div>
            <span
              className="shade-selected-hex"
              style={{ color: selectedShade.hex }}
            >
              {selectedShade.hex}
            </span>
          </div>

          {/* Finish Selector Strip */}
          <div className="finish-strip">
            {LIPSTICK_FINISHES.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`finish-pill ${finish === f.id ? 'active' : ''}`}
                onClick={() => setFinish(f.id)}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Category Tabs — horizontally scrollable */}
          <div className="shade-category-scroll" role="tablist" aria-label="Shade categories">
            {SHADE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                className={`shade-cat-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Shade Swatches — 4 per category */}
          <div className="shades-grid" role="tabpanel">
            {LIPSTICK_SHADES.filter((s) => s.category === selectedCategory).map((shade) => {
              const isSelected = selectedShade.id === shade.id;
              return (
                <button
                  key={shade.id}
                  type="button"
                  className={`shade-swatch-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedShade(shade)}
                  aria-label={`Select ${shade.name}`}
                  aria-pressed={isSelected}
                >
                  <div
                    className="swatch-bubble"
                    style={{ backgroundColor: shade.hex }}
                  >
                    {isSelected && <span className="swatch-check">✓</span>}
                  </div>
                  <span className="swatch-name">{shade.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Contour Mode Controls ─────────────────────────────────────────── */}
      {makeupMode === 'contour' && (
        <div className="studio-section contour-section animate-fade-in">
          {/* Toggle On/Off */}
          <div className="layer-toggle-row">
            <div className="layer-toggle-info">
              <span className="layer-toggle-title">Contour</span>
              <span className="layer-toggle-desc">
                {isContourActive ? `${selectedContour?.name || 'Selected'} — on` : 'Off — tap to enable'}
              </span>
            </div>
            <button
              type="button"
              className={`layer-toggle-switch ${isContourActive ? 'on' : ''}`}
              onClick={() => setIsContourActive(!isContourActive)}
              aria-pressed={isContourActive}
              id="btn-toggle-contour"
            >
              {isContourActive ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Shade Swatches */}
          <div className="eyeliner-subhead">Shade</div>
          <div className="contour-swatches-row">
            {CONTOUR_SHADES.map((shade) => {
              const isSel = selectedContour?.id === shade.id;
              return (
                <button
                  key={shade.id}
                  type="button"
                  className={`shade-swatch-item ${isSel ? 'selected' : ''}`}
                  onClick={() => { setSelectedContour(shade); setIsContourActive(true); }}
                  aria-label={`Select ${shade.name} contour`}
                  aria-pressed={isSel}
                >
                  <div className="swatch-bubble" style={{ backgroundColor: shade.hex }}>
                    {isSel && <span className="swatch-check">✓</span>}
                  </div>
                  <span className="swatch-name">{shade.name}</span>
                </button>
              );
            })}
          </div>

          {/* Intensity Slider */}
          {isContourActive && (
            <div className="eyeliner-control-group animate-fade-in">
              <div className="section-label-row">
                <span className="studio-label">Intensity</span>
                <span className="intensity-state-label">
                  {contourIntensity < 35 ? 'Subtle' : contourIntensity > 70 ? 'Bold' : 'Natural'} ({contourIntensity}%)
                </span>
              </div>
              <div className="intensity-slider-wrap">
                <span className="slider-endpoint">Subtle</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={contourIntensity}
                  onChange={(e) => setContourIntensity(Number(e.target.value))}
                  className="studio-range-slider"
                  aria-label="Contour Intensity"
                />
                <span className="slider-endpoint">Bold</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Blush Mode Controls ───────────────────────────────────────────── */}
      {makeupMode === 'blush' && (
        <div className="studio-section blush-section animate-fade-in">
          {/* Toggle On/Off */}
          <div className="layer-toggle-row">
            <div className="layer-toggle-info">
              <span className="layer-toggle-title">Blush</span>
              <span className="layer-toggle-desc">
                {isBlushActive ? `${selectedBlush?.name || 'Selected'} — on` : 'Off — tap to enable'}
              </span>
            </div>
            <button
              type="button"
              className={`layer-toggle-switch ${isBlushActive ? 'on' : ''}`}
              onClick={() => setIsBlushActive(!isBlushActive)}
              aria-pressed={isBlushActive}
              id="btn-toggle-blush"
            >
              {isBlushActive ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Finish Toggle */}
          <div className="finish-strip">
            <button
              type="button"
              className={`finish-pill ${blushFinish === 'natural' ? 'active' : ''}`}
              onClick={() => setBlushFinish('natural')}
            >
              <span>🌿</span><span>Natural</span>
            </button>
            <button
              type="button"
              className={`finish-pill ${blushFinish === 'glow' ? 'active' : ''}`}
              onClick={() => setBlushFinish('glow')}
            >
              <span>✨</span><span>Glow</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="shade-category-scroll" role="tablist" aria-label="Blush categories">
            {BLUSH_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={blushCategory === cat.id}
                className={`shade-cat-tab ${blushCategory === cat.id ? 'active' : ''}`}
                onClick={() => setBlushCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Blush Shade Swatches */}
          <div className="shades-grid" role="tabpanel">
            {BLUSH_SHADES
              .filter((s) => blushCategory === 'All' || s.category === blushCategory)
              .map((shade) => {
                const isSel = selectedBlush?.id === shade.id;
                return (
                  <button
                    key={shade.id}
                    type="button"
                    className={`shade-swatch-item ${isSel ? 'selected' : ''}`}
                    onClick={() => { setSelectedBlush(shade); setIsBlushActive(true); }}
                    aria-label={`Select ${shade.name} blush`}
                    aria-pressed={isSel}
                  >
                    <div className="swatch-bubble" style={{ backgroundColor: shade.hex }}>
                      {isSel && <span className="swatch-check">✓</span>}
                    </div>
                    <span className="swatch-name">{shade.name}</span>
                  </button>
                );
              })}
          </div>

          {/* Intensity Slider */}
          {isBlushActive && (
            <div className="eyeliner-control-group animate-fade-in">
              <div className="section-label-row">
                <span className="studio-label">Intensity</span>
                <span className="intensity-state-label">
                  {blushIntensity < 35 ? 'Sheer' : blushIntensity > 70 ? 'Flushed' : 'Natural'} ({blushIntensity}%)
                </span>
              </div>
              <div className="intensity-slider-wrap">
                <span className="slider-endpoint">Sheer</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={blushIntensity}
                  onChange={(e) => setBlushIntensity(Number(e.target.value))}
                  className="studio-range-slider"
                  aria-label="Blush Intensity"
                />
                <span className="slider-endpoint">Flushed</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Eyeliner Mode Controls ────────────────────────────────────────── */}
      {makeupMode === 'eyeliner' && (
        <div className="studio-section eyeliner-section animate-fade-in">
          {/* Header Row: Selected style & color info */}
          <div className="eyeliner-header-row">
            <div className="eyeliner-header-info">
              <span className="eyeliner-selected-style">
                {currentEyelinerStyleObj.label} Eyeliner
              </span>
              <span className="eyeliner-selected-desc">
                {currentEyelinerStyleObj.desc}
              </span>
            </div>
            <span
              className="eyeliner-color-badge"
              style={{ color: eyelinerColor.hex, borderColor: eyelinerColor.hex }}
            >
              <span className="color-badge-dot" style={{ backgroundColor: eyelinerColor.hex }}></span>
              {eyelinerColor.name}
            </span>
          </div>

          {/* Eyeliner Style Selector */}
          <div className="eyeliner-subhead">Style</div>
          <div className="eyeliner-styles-scroll" role="tablist" aria-label="Eyeliner Styles">
            {EYELINER_STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                role="tab"
                aria-selected={eyelinerStyle === st.id}
                className={`eyeliner-style-tab ${eyelinerStyle === st.id ? 'active' : ''}`}
                onClick={() => setEyelinerStyle(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Eyeliner Color Swatches */}
          <div className="eyeliner-subhead">Color</div>
          <div className="eyeliner-colors-row">
            {EYELINER_COLORS.map((col) => {
              const isSelected = eyelinerColor.id === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  className={`eyeliner-color-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setEyelinerColor(col)}
                  aria-label={`Select ${col.name} eyeliner`}
                  aria-pressed={isSelected}
                >
                  <div
                    className="eyeliner-color-bubble"
                    style={{ backgroundColor: col.hex }}
                  >
                    {isSelected && <span className="swatch-check">✓</span>}
                  </div>
                  <span className="eyeliner-color-label">{col.name}</span>
                </button>
              );
            })}
          </div>

          {/* Thickness Slider */}
          <div className="eyeliner-control-group">
            <div className="section-label-row">
              <span className="studio-label">Thickness</span>
              <span className="intensity-state-label">
                {eyelinerThickness < 35 ? 'Thin' : eyelinerThickness > 70 ? 'Bold' : 'Medium'} ({eyelinerThickness}%)
              </span>
            </div>
            <div className="intensity-slider-wrap">
              <span className="slider-endpoint">Thin</span>
              <input
                type="range"
                min="10"
                max="100"
                value={eyelinerThickness}
                onChange={(e) => setEyelinerThickness(Number(e.target.value))}
                className="studio-range-slider"
                aria-label="Eyeliner Thickness"
              />
              <span className="slider-endpoint">Bold</span>
            </div>
          </div>

          {/* Wing Length Slider (Only shown for Winged and Cat Eye styles) */}
          {(eyelinerStyle === 'winged' || eyelinerStyle === 'cateye') && (
            <div className="eyeliner-control-group animate-fade-in">
              <div className="section-label-row">
                <span className="studio-label">Wing Length</span>
                <span className="intensity-state-label">
                  {eyelinerWing < 35 ? 'Short' : eyelinerWing > 70 ? 'Long' : 'Medium'} ({eyelinerWing}%)
                </span>
              </div>
              <div className="intensity-slider-wrap">
                <span className="slider-endpoint">Short</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={eyelinerWing}
                  onChange={(e) => setEyelinerWing(Number(e.target.value))}
                  className="studio-range-slider"
                  aria-label="Wing Length"
                />
                <span className="slider-endpoint">Long</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intensity Slider with Click-to-Snap */}
      <div className="studio-section intensity-section">
        <div className="section-label-row">
          <span className="studio-label">Intensity</span>
          <span className="intensity-state-label">{getIntensityLabel(intensity)} ({intensity}%)</span>
        </div>

        <div className="intensity-slider-wrap">
          <button
            type="button"
            className="slider-endpoint sheer"
            onClick={() => setIntensity(25)}
            title="Set to sheer"
          >
            Sheer
          </button>
          <input
            type="range"
            min="10"
            max="100"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="glowup-slider"
            style={{
              background: `linear-gradient(to right, ${selectedShade.hex} ${(intensity - 10) * 100 / 90}%, #F0DFD7 ${(intensity - 10) * 100 / 90}%)`
            }}
          />
          <button
            type="button"
            className="slider-endpoint bold"
            onClick={() => setIntensity(85)}
            title="Set to bold"
          >
            Bold
          </button>
        </div>
      </div>

      {/* Studio Action Controls */}
      <div className="studio-action-strip">
        <button
          type="button"
          className={`btn-studio-action compare-btn ${compareMode !== 'off' ? 'active' : ''}`}
          onClick={handleToggleComparison}
          disabled={!photo || !!detectionError}
          title="Toggle before and after"
        >
          <CompareIcon size={18} />
          <span>
            {compareMode === 'off'
              ? 'Before / After'
              : compareMode === 'slider'
              ? 'Quick Toggle'
              : 'Exit Compare'}
          </span>
        </button>

        <button
          type="button"
          className="btn-studio-action share-btn"
          onClick={handleShare}
          disabled={!photo || !!detectionError || isSharing}
          title="Share your look"
        >
          {isSharing ? (
            <span className="detect-spinner" style={{ width: 16, height: 16 }} />
          ) : (
            <ShareIcon size={18} />
          )}
          <span>{isSharing ? 'Sharing…' : 'Share Look'}</span>
        </button>

        <button
          type="button"
          className="btn-studio-action download-btn"
          onClick={handleDownload}
          disabled={!photo || !!detectionError}
          title="Download photo to device"
        >
          <DownloadIcon size={18} />
          <span>Save</span>
        </button>

        <button
          type="button"
          className="btn-studio-action reset-btn"
          onClick={handleReset}
          disabled={!photo}
          title="Reset all makeup"
          id="btn-reset-makeup"
        >
          <span style={{ fontSize: '16px' }}>↺</span>
          <span>Reset</span>
        </button>
      </div>

      {/* Camera Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handleCameraPhoto}
      />
    </div>
  );
}
