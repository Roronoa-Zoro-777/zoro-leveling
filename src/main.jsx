import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import './index.css'
import App from './App.jsx'

// Global pointer tracking for Apple Liquid Glass dynamic specular highlights
if (typeof window !== 'undefined') {
  let ticking = false;
  window.addEventListener('pointermove', (e) => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const x = Math.round((e.clientX / window.innerWidth) * 100);
        const y = Math.round((e.clientY / window.innerHeight) * 100);
        document.documentElement.style.setProperty('--mx', `${x}%`);
        document.documentElement.style.setProperty('--my', `${y}%`);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
