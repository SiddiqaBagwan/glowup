import React, { useState, useRef, useCallback } from 'react';

export default function BeforeAfterSlider({
  afterCanvas,
  beforeCanvas,
  isComparingToggle,
  onToggleCompare
}) {
  const [splitPos, setSplitPos] = useState(50); // 50% split by default
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const updateSplitFromEvent = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPos(percentage);
  }, []);

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      updateSplitFromEvent(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateSplitFromEvent(e.clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      className="split-slider-container"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
    >
      {/* After Layer (Full) */}
      <div className="slider-layer layer-after">
        {afterCanvas}
        <span className="split-label label-after">After</span>
      </div>

      {/* Before Layer (Clipped to splitPos) */}
      <div
        className="slider-layer layer-before"
        style={{
          clipPath: `inset(0 calc(100% - ${splitPos}%) 0 0)`
        }}
      >
        {beforeCanvas}
        <span className="split-label label-before">Before</span>
      </div>

      {/* Draggable Divider Handle */}
      <div
        className="slider-divider-line"
        style={{ left: `${splitPos}%` }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="slider-handle-bubble">
          <span className="handle-chevron">‹›</span>
        </div>
      </div>
    </div>
  );
}
