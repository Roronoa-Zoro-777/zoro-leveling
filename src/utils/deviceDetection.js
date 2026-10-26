/**
 * deviceDetection.js
 * Comprehensive OS, device, architecture, and browser detection for the Download page.
 * Uses modern User-Agent Client Hints (navigator.userAgentData) when available,
 * falling back gracefully to navigator.userAgent and navigator.platform.
 */

export function detectDevice() {
  if (typeof window === 'undefined') {
    return {
      os: 'windows',
      osName: 'Windows',
      arch: 'x64',
      isMobile: false,
      browser: 'unknown',
      isStandalone: false,
    };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const uaData = navigator.userAgentData;

  let os = 'windows';
  let osName = 'Windows';
  let arch = 'x64';
  let isMobile = false;

  // 1. Android Detection
  if (/android/i.test(ua)) {
    os = 'android';
    osName = 'Android';
    isMobile = true;
  }
  // 2. iOS Detection (iPhone, iPad, iPod)
  else if (/iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    os = 'ios';
    osName = 'iOS';
    isMobile = true;
  }
  // 3. macOS Detection
  else if (/macintosh|mac os x/i.test(ua) || platform.toUpperCase().indexOf('MAC') >= 0) {
    os = 'macos';
    osName = 'macOS';
    isMobile = false;
    // Attempt Apple Silicon detection
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 0) {
      arch = 'arm64';
    }
  }
  // 4. Linux Detection
  else if (/linux/i.test(ua) || /x11/i.test(platform)) {
    os = 'linux';
    osName = 'Linux';
    isMobile = false;
  }
  // 5. Windows Detection (Default)
  else if (/windows|win32|win64/i.test(ua) || /win/i.test(platform)) {
    os = 'windows';
    osName = 'Windows';
    isMobile = false;
  }

  // Modern Client Hints override if available
  if (uaData && uaData.platform) {
    const p = uaData.platform.toLowerCase();
    if (p.includes('win')) {
      os = 'windows';
      osName = 'Windows';
      isMobile = !!uaData.mobile;
    } else if (p.includes('mac')) {
      os = 'macos';
      osName = 'macOS';
      isMobile = !!uaData.mobile;
    } else if (p.includes('android')) {
      os = 'android';
      osName = 'Android';
      isMobile = true;
    } else if (p.includes('linux')) {
      os = 'linux';
      osName = 'Linux';
      isMobile = !!uaData.mobile;
    }
  }

  // Browser Detection
  let browser = 'Browser';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  // Standalone / PWA / Installed Detection
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  return {
    os,
    osName,
    arch,
    isMobile,
    browser,
    isStandalone,
    userAgent: ua,
  };
}
