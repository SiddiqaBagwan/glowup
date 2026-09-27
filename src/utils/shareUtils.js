/**
 * GlowUp Share Utilities
 * Handles Web Share API, clipboard fallback, and "Add to Home Screen" prompting.
 */

/**
 * Attempts to share the rendered look photo using the Web Share API.
 * Falls back gracefully: tries Files > URL > clipboard on progressive failure.
 *
 * @param {string} imageDataUrl - The canvas data URL of the look (jpeg)
 * @param {string} shadeName - E.g. "Rose Nude"
 * @returns {Promise<{ success: boolean, method: string, error?: string }>}
 */
export async function shareLook(imageDataUrl, shadeName) {
  const shareText = `✨ I just tried "${shadeName}" lipstick with GlowUp! Try it yourself →`;
  const shareUrl = window.location.href;

  // Attempt 1: Web Share API with Files (best — opens native share sheet with image)
  if (navigator.share && navigator.canShare) {
    try {
      const blob = await dataUrlToBlob(imageDataUrl);
      const file = new File([blob], `GlowUp-${shadeName.replace(/\s+/g, '-')}.jpg`, {
        type: 'image/jpeg',
      });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `My GlowUp Look — ${shadeName}`,
          text: shareText,
          files: [file],
        });
        return { success: true, method: 'web-share-files' };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'aborted', error: 'User cancelled sharing.' };
      }
      // Fall through to next method
    }
  }

  // Attempt 2: Web Share API without files (URL only)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `My GlowUp Look — ${shadeName}`,
        text: shareText,
        url: shareUrl,
      });
      return { success: true, method: 'web-share-url' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'aborted', error: 'User cancelled sharing.' };
      }
      // Fall through
    }
  }

  // Attempt 3: Clipboard copy + trigger download
  try {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    return { success: true, method: 'clipboard' };
  } catch {
    return {
      success: false,
      method: 'none',
      error: 'Sharing not supported on this browser.',
    };
  }
}

/**
 * Download the image as a JPEG file. Always works as a fallback.
 */
export function downloadLook(imageDataUrl, shadeName) {
  try {
    const link = document.createElement('a');
    link.download = `GlowUp-${shadeName.replace(/\s+/g, '-')}.jpg`;
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert a data URL to a Blob object.
 */
export async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

// ─── PWA Install Prompt ───────────────────────────────────────────────────────

let deferredInstallPrompt = null;

/**
 * Call once on app init to capture the beforeinstallprompt event.
 * Returns a function to trigger the prompt later.
 */
export function initInstallPrompt(onPromptAvailable) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (typeof onPromptAvailable === 'function') {
      onPromptAvailable();
    }
  });
}

/**
 * Trigger the native "Add to Home Screen" prompt.
 * @returns {Promise<'accepted'|'dismissed'|'unavailable'>}
 */
export async function triggerInstallPrompt() {
  if (!deferredInstallPrompt) return 'unavailable';
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return outcome; // 'accepted' | 'dismissed'
}

/**
 * Returns true if the app is already running in standalone PWA mode.
 */
export function isRunningAsPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}
