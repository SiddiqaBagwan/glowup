import React, { useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeScreen from './pages/HomeScreen';
import TryOnStudioScreen from './pages/TryOnStudioScreen';
import HistoryScreen from './pages/HistoryScreen';
import ProfileScreen from './pages/ProfileScreen';
import AuthModal from './components/AuthModal';
import EditProfileModal from './components/EditProfileModal';
import InstallBanner from './components/InstallBanner';
import SuggestionScreen from './pages/SuggestionScreen';
import { LIPSTICK_SHADES } from './utils/shades';
import { EYELINER_COLORS } from './utils/eyelinerRenderer';
import { CONTOUR_SHADES } from './utils/contourData';
import { BLUSH_SHADES } from './utils/blushData';
import { track } from '@vercel/analytics';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedShade, setSelectedShade] = useState(
    LIPSTICK_SHADES.find((s) => s.id === 'rose-nude') || LIPSTICK_SHADES[0]
  );
  const [intensity, setIntensity] = useState(50);
  const [selectedLighting, setSelectedLighting] = useState('auto');
  const [makeupMode, setMakeupMode] = useState('lipstick'); // 'lipstick' | 'eyeliner' | 'contour' | 'blush'
  const [eyelinerStyle, setEyelinerStyle] = useState('classic');
  const [eyelinerColor, setEyelinerColor] = useState(EYELINER_COLORS[0]);
  const [eyelinerThickness, setEyelinerThickness] = useState(50);
  const [eyelinerWing, setEyelinerWing] = useState(50);
  
  // Independent layer activation
  const [isLipstickActive, setIsLipstickActive] = useState(true);
  const [isEyelinerActive, setIsEyelinerActive] = useState(true);

  // Contour State
  const [selectedContour, setSelectedContour] = useState(CONTOUR_SHADES[2]); // Neutral Brown
  const [contourIntensity, setContourIntensity] = useState(50);
  const [isContourActive, setIsContourActive] = useState(false);

  // Blush State
  const [selectedBlush, setSelectedBlush] = useState(BLUSH_SHADES[0]); // Soft Pink
  const [blushIntensity, setBlushIntensity] = useState(50);
  const [blushFinish, setBlushFinish] = useState('natural'); // 'natural' | 'glow'
  const [isBlushActive, setIsBlushActive] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // User state (guest mode by default)
  const [user, setUser] = useState(null);

  // Active photo state (client-side data URL)
  const [photo, setPhoto] = useState(null);

  // Load saved looks from localStorage with fallback
  const [savedLooks, setSavedLooks] = useState(() => {
    try {
      const stored = localStorage.getItem('glowup_saved_looks');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read saved looks from localStorage:', e);
    }
    return [
      {
        id: 'look-1',
        shade: LIPSTICK_SHADES.find((s) => s.id === 'rose-nude') || LIPSTICK_SHADES[0],
        intensity: 55,
        lighting: 'Natural',
        date: 'Yesterday'
      }
    ];
  });

  const handleStartTry = () => {
    track('try_makeup', { source: 'home' });
    setActiveTab('try');
  };

  const handleStartSuggestion = () => {
    track('ai_suggestion', { source: 'home' });
    setActiveTab('suggest');
  };

  const handleSelectAndTrySuggestion = (shade, photoData) => {
    setSelectedShade(shade);
    if (photoData) {
      setPhoto(photoData);
    }
    track('try_makeup', { source: 'suggestion' });
    setActiveTab('try');
  };

  const handleSelectShade = (shade) => {
    setSelectedShade(shade);
  };

  const handleSaveLook = (renderedImageData) => {
    const newLook = {
      id: `look-${Date.now()}`,
      title: `${selectedShade.name} + ${eyelinerStyle} eyeliner`,
      // Both layers always saved
      shade: selectedShade,
      eyeliner: {
        style: eyelinerStyle,
        color: eyelinerColor,
        thickness: eyelinerThickness,
        wingLength: eyelinerWing
      },
      intensity,
      lighting: selectedLighting,
      thumbnail: renderedImageData || photo,
      date: 'Just now'
    };
    const updated = [newLook, ...savedLooks];
    setSavedLooks(updated);
    try {
      localStorage.setItem('glowup_saved_looks', JSON.stringify(updated.slice(0, 25)));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const handleSelectHistoryLook = (look) => {
    // Restore lipstick layer
    if (look.shade) setSelectedShade(look.shade);
    // Restore eyeliner layer
    if (look.eyeliner?.style) setEyelinerStyle(look.eyeliner.style);
    if (look.eyeliner?.color) setEyelinerColor(look.eyeliner.color);
    if (look.eyeliner?.thickness) setEyelinerThickness(look.eyeliner.thickness);
    if (look.eyeliner?.wingLength) setEyelinerWing(look.eyeliner.wingLength);
    // Restore shared settings
    setIntensity(look.intensity || 50);
    if (look.lighting) setSelectedLighting(look.lighting.toLowerCase());
    if (look.thumbnail) setPhoto(look.thumbnail);
    track('try_makeup', { source: 'history' });
    setActiveTab('try');
  };

  const handleDeleteLook = (lookId) => {
    const updated = savedLooks.filter((l) => l.id !== lookId);
    setSavedLooks(updated);
    try {
      localStorage.setItem('glowup_saved_looks', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage delete error:', e);
    }
  };

  const handleClearAllLooks = () => {
    if (window.confirm('Clear all your saved looks from this device?')) {
      setSavedLooks([]);
      try {
        localStorage.removeItem('glowup_saved_looks');
      } catch (e) {
        console.warn('LocalStorage clear error:', e);
      }
    }
  };

  const handleSaveUser = (userData) => {
    setUser(userData);
    try {
      if (userData) {
        localStorage.setItem('glowup_user_profile', JSON.stringify(userData));
      } else {
        localStorage.removeItem('glowup_user_profile');
      }
    } catch (e) {
      console.warn('LocalStorage user save error:', e);
    }
  };

  const handleLogout = () => {
    handleSaveUser(null);
  };

  return (
    <div className="glowup-mobile-frame">
      <Header
        activeTab={activeTab}
        onBack={() => setActiveTab('home')}
        onOpenAuth={() => (user ? setActiveTab('profile') : setIsAuthModalOpen(true))}
        user={user}
      />

      <main className="app-viewport">
        {activeTab === 'home' && (
          <HomeScreen
            onStartTry={handleStartTry}
            onSelectShade={handleSelectShade}
            onGetSuggestion={handleStartSuggestion}
            photo={photo}
          />
        )}

        {activeTab === 'suggest' && (
          <SuggestionScreen
            photo={photo}
            onPhotoChange={setPhoto}
            onSelectAndTry={handleSelectAndTrySuggestion}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'try' && (
          <TryOnStudioScreen
            photo={photo}
            onPhotoChange={setPhoto}
            selectedShade={selectedShade}
            setSelectedShade={setSelectedShade}
            intensity={intensity}
            setIntensity={setIntensity}
            selectedLighting={selectedLighting}
            setSelectedLighting={setSelectedLighting}
            makeupMode={makeupMode}
            setMakeupMode={setMakeupMode}
            eyelinerStyle={eyelinerStyle}
            setEyelinerStyle={setEyelinerStyle}
            eyelinerColor={eyelinerColor}
            setEyelinerColor={setEyelinerColor}
            eyelinerThickness={eyelinerThickness}
            setEyelinerThickness={setEyelinerThickness}
            eyelinerWing={eyelinerWing}
            setEyelinerWing={setEyelinerWing}
            selectedContour={selectedContour}
            setSelectedContour={setSelectedContour}
            contourIntensity={contourIntensity}
            setContourIntensity={setContourIntensity}
            isContourActive={isContourActive}
            setIsContourActive={setIsContourActive}
            selectedBlush={selectedBlush}
            setSelectedBlush={setSelectedBlush}
            blushIntensity={blushIntensity}
            setBlushIntensity={setBlushIntensity}
            blushFinish={blushFinish}
            setBlushFinish={setBlushFinish}
            isBlushActive={isBlushActive}
            setIsBlushActive={setIsBlushActive}
            onSaveLook={handleSaveLook}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            savedLooks={savedLooks}
            onSelectLook={handleSelectHistoryLook}
            onStartTry={handleStartTry}
            onDeleteLook={handleDeleteLook}
            onClearAllLooks={handleClearAllLooks}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            user={user}
            savedLooksCount={savedLooks.length}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onViewHistory={() => setActiveTab('history')}
            onClearHistory={handleClearAllLooks}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleSaveUser}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        onSaveUser={handleSaveUser}
      />

      {/* PWA Install Banner */}
      <InstallBanner />
    </div>
  );
}
