/**
 * downloadLinks.js
 * Centralized configuration for all downloadable app installers, versions,
 * checksums, file sizes, and release metadata.
 * 
 * Edit this file to update release links, file sizes, or version numbers.
 */

export const APP_RELEASE_CONFIG = {
  version: '2.4.0',
  releaseDate: 'October 2026',
  releaseNotesUrl: 'https://github.com/Roronoa-Zoro-777/zoro-leveling/releases/tag/v2.4.0',
  githubRepoUrl: 'https://github.com/Roronoa-Zoro-777/zoro-leveling',
  
  // Platform-specific download targets
  platforms: {
    windows: {
      name: 'Windows',
      icon: '🪟',
      osLabel: 'Windows 10 / 11 (64-bit)',
      primary: {
        label: 'Download for Windows',
        format: '.exe (Installer)',
        filename: 'ZoroLevel-Setup-2.4.0.exe',
        size: '68.4 MB',
        url: 'https://github.com/Roronoa-Zoro-777/zoro-leveling/releases/download/v2.4.0/ZoroLevel-Setup-2.4.0.exe',
        sha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
      },
      secondary: {
        label: 'MSI Package',
        format: '.msi (Enterprise)',
        filename: 'ZoroLevel-2.4.0.msi',
        size: '72.1 MB',
        url: 'https://github.com/Roronoa-Zoro-777/zoro-leveling/releases/download/v2.4.0/ZoroLevel-2.4.0.msi',
        sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      },
      installSteps: [
        'Download the ZoroLevel-Setup-2.4.0.exe installer.',
        'Run the executable. If Windows SmartScreen shows a prompt, click "More info" and "Run anyway".',
        'Follow the on-screen setup. ZoroLevel launches automatically and saves data to permanent AppData.',
      ],
      systemRequirements: 'Windows 10 version 1903 or higher, Windows 11 (x64 / ARM64 via emulation)',
    },

    macos: {
      name: 'macOS',
      icon: '🍎',
      osLabel: 'macOS 12 Monterey or later',
      primary: {
        label: 'Download for macOS',
        format: '.dmg (Universal)',
        filename: 'ZoroLevel-2.4.0-Universal.dmg',
        size: '66.8 MB',
        url: 'https://github.com/Roronoa-Zoro-777/zoro-leveling/releases/download/v2.4.0/ZoroLevel-2.4.0-Universal.dmg',
        sha256: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      },
      secondary: {
        label: 'Apple Silicon (.dmg)',
        format: 'Apple Silicon (M1/M2/M3/M4)',
        filename: 'ZoroLevel-2.4.0-arm64.dmg',
        size: '63.2 MB',
        url: 'https://github.com/Roronoa-Zoro-777/zoro-leveling/releases/download/v2.4.0/ZoroLevel-2.4.0-arm64.dmg',
        sha256: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
      },
      installSteps: [
        'Open the downloaded ZoroLevel-2.4.0-Universal.dmg file.',
        'Drag the ZoroLevel icon into your Applications folder.',
        'Launch ZoroLevel from Applications or Spotlight. On first run, choose "Open" if Gatekeeper prompts.',
      ],
      systemRequirements: 'macOS 12 (Monterey), macOS 13 (Ventura), macOS 14 (Sonoma), or macOS 15 (Sequoia)',
    },

    linux: {
      name: 'Linux',
      icon: '🐧',
      osLabel: 'Any modern 64-bit Linux distribution',
      primary: {
        label: 'Download for Linux',
        format: '.AppImage (Universal)',
        filename: 'ZoroLevel-2.4.0.AppImage',
        size: '74.5 MB',
        url: 'https://github.com/Roronoa-Zoro-777/zoro-leveling/releases/download/v2.4.0/ZoroLevel-2.4.0.AppImage',
        sha256: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      },
      secondary: {
        label: 'Debian / Ubuntu (.deb)',
        format: '.deb Package',
        filename: 'zorolevel_2.4.0_amd64.deb',
        size: '61.9 MB',
        url: 'https://github.com/Roronoa-Zoro-777/zoro-leveling/releases/download/v2.4.0/zorolevel_2.4.0_amd64.deb',
        sha256: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      },
      installSteps: [
        'For AppImage: Right-click ZoroLevel.AppImage → Properties → Permissions → check "Allow executing file as program", or run `chmod +x ZoroLevel-2.4.0.AppImage && ./ZoroLevel-2.4.0.AppImage`.',
        'For Debian/Ubuntu: Open terminal and run `sudo dpkg -i zorolevel_2.4.0_amd64.deb`.',
      ],
      systemRequirements: 'GLIBC 2.28+, systemd or SysVinit, X11 or Wayland',
    },

    android: {
      name: 'Android',
      icon: '🤖',
      osLabel: 'Android 8.0 Oreo or higher',
      primary: {
        label: 'Download APK',
        format: '.apk (Direct Download)',
        filename: 'ZoroLevel-2.4.0.apk',
        size: '18.6 MB',
        url: 'https://github.com/Roronoa-Zoro-777/zoro-leveling/releases/download/v2.4.0/ZoroLevel-2.4.0.apk',
        sha256: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
      },
      secondary: {
        label: 'Google Play Store',
        format: 'Official Store',
        filename: 'Google Play Listing',
        size: '~19 MB',
        url: 'https://play.google.com/store/apps/details?id=com.zorolevel.app',
        isStore: true,
      },
      installSteps: [
        'Download the ZoroLevel-2.4.0.apk file directly to your Android device.',
        'Tap the downloaded notification. If prompted, allow "Install unknown apps" for your browser.',
        'Tap "Install". The app will appear in your app drawer and stores all data in private internal SQLite/IndexedDB.',
      ],
      systemRequirements: 'Android 8.0 (API 26) or higher',
    },

    ios: {
      name: 'iOS',
      icon: '📱',
      osLabel: 'iPhone & iPad (iOS 15.0+)',
      primary: {
        label: 'App Store / TestFlight',
        format: 'Apple App Store',
        filename: 'TestFlight Beta',
        size: '~22 MB',
        url: 'https://testflight.apple.com/join/zorolevel',
        isStore: true,
      },
      secondary: {
        label: 'Install as PWA',
        format: 'Instant Safari PWA',
        filename: 'Web App',
        size: '< 3 MB',
        isPwaAction: true,
      },
      installSteps: [
        'Option A (TestFlight Beta): Tap the TestFlight link above and tap "Accept" and "Install".',
        'Option B (Instant Safari PWA): Open this website in Safari, tap the Share icon (square with arrow) at the bottom, and tap "Add to Home Screen".',
        'Once added, launch from your home screen for full offline mode and native app container.',
      ],
      systemRequirements: 'iOS / iPadOS 15.0 or later',
    },

    pwa: {
      name: 'Web App (PWA)',
      icon: '🌐',
      osLabel: 'Any browser on Desktop or Mobile',
      primary: {
        label: 'Install Web App',
        format: 'Progressive Web App',
        filename: 'PWA Container',
        size: '~2.8 MB (Precached)',
        isPwaAction: true,
      },
      installSteps: [
        'Chrome / Edge / Brave: Click the Install icon in the address bar (or menu → "Install ZoroLevel").',
        'Safari on iOS: Tap Share → "Add to Home Screen".',
        'Chrome on Android: Tap menu (3 dots) → "Install app" or "Add to Home screen".',
        'The app works 100% offline with persistent IndexedDB storage granted by your device.',
      ],
      systemRequirements: 'Any modern browser with Service Worker and IndexedDB support',
    },
  },
};
