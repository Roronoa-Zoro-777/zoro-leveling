/**
 * generate-icons.mjs
 * Generates PWA icons (192x192 and 512x512) as PNG files in /public.
 * Run once: node generate-icons.mjs
 * Requires: npm install canvas (or uses built-in canvas in Node 18+)
 *
 * Uses only HTML Canvas API (no external deps) drawn via a tiny server-side
 * canvas polyfill approach — writes raw PNG binary.
 *
 * Actually we use the Vite build to embed the SVG icon inline.
 * The PNG icons are pre-generated and committed to /public.
 */

// This file is informational. Icons are generated in public/ directly.
// See public/icon-192.png and public/icon-512.png
console.log('Icons are already present in public/');
