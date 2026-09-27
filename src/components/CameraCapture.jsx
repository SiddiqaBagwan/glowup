import React, { useRef, useState, useEffect } from 'react';
import { CameraIcon, CloseIcon } from './Icons';

export default function CameraCapture({ isOpen, onClose, onPhotoCaptured }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (selfie) or 'environment'

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setErrorMsg(null);
    setIsReady(false);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 960 },
          height: { ideal: 1280 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsReady(true);
        };
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was denied. You can enable camera in browser settings or upload a selfie directly.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera detected on this device. Please use the upload photo option.');
      } else {
        setErrorMsg('Unable to access camera. Please choose a photo from your gallery instead.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !isReady) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');

    // If front camera, mirror image so it behaves like a natural mirror selfie
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCamera();
    onPhotoCaptured(dataUrl);
    onClose();
  };

  const toggleCameraFlip = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-backdrop" onClick={onClose}>
      <div className="camera-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="camera-top-bar">
          <span className="camera-modal-title">Take Selfie</span>
          <button type="button" className="camera-close-btn" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Viewport */}
        <div className="camera-viewport-wrap">
          {errorMsg ? (
            <div className="camera-error-box">
              <p className="camera-error-text">{errorMsg}</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                style={{ marginTop: '12px' }}
              >
                Choose Photo from Gallery
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`camera-video-stream ${facingMode === 'user' ? 'mirror' : ''}`}
              />
              <div className="camera-face-guide">
                <div className="face-oval-guide"></div>
                <span className="guide-hint">Align your face inside the oval</span>
              </div>
            </>
          )}
        </div>

        {/* Bottom controls */}
        {!errorMsg && (
          <div className="camera-controls-bar">
            <button
              type="button"
              className="camera-flip-btn"
              onClick={toggleCameraFlip}
              title="Flip camera"
            >
              🔄
            </button>

            <button
              type="button"
              className="camera-shutter-btn"
              onClick={captureSnapshot}
              disabled={!isReady}
              aria-label="Capture photo"
            >
              <div className="shutter-inner"></div>
            </button>

            <div className="camera-spacer"></div>
          </div>
        )}
      </div>
    </div>
  );
}
