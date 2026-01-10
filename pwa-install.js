// PWA Install Prompt Handler
let deferredPrompt;
let installBanner = null;

// Check initial state
console.log('=== PWA Install Script Starting ===');
console.log('HTTPS:', window.location.protocol === 'https:');
console.log('Localhost:', window.location.hostname === 'localhost');
console.log('Service Worker Support:', 'serviceWorker' in navigator);

// Capture the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✓ beforeinstallprompt event FIRED - PWA is installable!');
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner(true);
});

// Show banner on load (with fallback for Vercel)
window.addEventListener('load', () => {
  console.log('✓ Page loaded');
  console.log('Service Worker supported:', 'serviceWorker' in navigator);
  console.log('Manifest present:', document.querySelector('link[rel="manifest"]') !== null);

  // Debug: Check manifest file
  fetch('/manifest.json')
    .then(r => {
      console.log('✓ Manifest accessible:', r.status);
      return r.json();
    })
    .then(m => console.log('✓ Manifest loaded:', m.name))
    .catch(e => console.error('✗ Manifest error:', e));

  // If running on Vercel and deferredPrompt never fired, show fallback after delay
  if (!deferredPrompt && window.location.hostname.includes('vercel')) {
    console.log('⚠ No beforeinstallprompt on Vercel - showing fallback banner');
    setTimeout(() => {
      if (!deferredPrompt && !installBanner) {
        showInstallBanner(false);
      }
    }, 2000);
  }

  // FORCE show banner on Vercel regardless (for debugging/guaranteed visibility)
  if (window.location.hostname.includes('vercel') && !installBanner) {
    console.log('🔧 Force-showing install banner on Vercel (3 sec delay)');
    setTimeout(() => {
      if (!installBanner) {
        showInstallBanner(false);
      }
    }, 3000);
  }
});

function showInstallBanner(hasPrompt = true) {
  if (document.getElementById('pwa-install-banner')) {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 -4px 20px rgba(139, 92, 246, 0.3);
    ">
      <div style="flex: 1; min-width: 0;">
        <div style="
          font-weight: 700;
          color: white;
          font-size: 15px;
          margin-bottom: 4px;
          letter-spacing: 0.3px;
        ">Install Subtra</div>
        <div style="
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          opacity: 0.95;
        ">subtra.vercel.app</div>
      </div>
      <button id="pwa-install-btn" style="
        background: white;
        color: #8b5cf6;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Outfit', sans-serif;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      " onmouseover="this.style.transform='scale(1.08)'; this.style.opacity='0.95';" onmouseout="this.style.transform='scale(1)'; this.style.opacity='1';">
        Install
      </button>
      <button id="pwa-close-btn" style="
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      " onmouseover="this.style.opacity='0.7';" onmouseout="this.style.opacity='1';">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(banner);
  installBanner = banner;

  document.getElementById('pwa-install-btn').addEventListener('click', installApp);
  document.getElementById('pwa-close-btn').addEventListener('click', closeBanner);

  console.log('✓ Install banner displayed');
}

function installApp() {
  if (!deferredPrompt) {
    console.log('No native install prompt available');
    console.log('Showing browser install instructions');

    // Show helpful message based on browser/platform
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (userAgent.includes('chrome')) {
      instructions = 'Click the install icon in your address bar, or:\n1. Menu (⋮) → "Install Subtra"';
    } else if (userAgent.includes('safari')) {
      instructions = 'Safari: Tap Share → "Add to Home Screen"';
    } else if (userAgent.includes('firefox')) {
      instructions = 'Firefox: Menu (≡) → "Install" or look for the install prompt';
    } else {
      instructions = 'Look for an install option in your browser menu or address bar';
    }

    alert('📱 Install Subtra\n\n' + instructions + '\n\nIf you don\'t see an install option, try:\n- Using Chrome, Edge, or Safari\n- Making sure you\'re on HTTPS');
    return;
  }

  deferredPrompt.prompt();

  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('✓ User accepted install');
    } else {
      console.log('User dismissed install');
    }
    deferredPrompt = null;
    closeBanner();
  });
}

function closeBanner() {
  if (installBanner) {
    installBanner.style.animation = 'slideDown 0.3s ease forwards';
    setTimeout(() => {
      installBanner.remove();
      installBanner = null;
    }, 300);
  }
}

// Add animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
  
  @media (max-width: 480px) {
    #pwa-install-banner {
      padding: 12px !important;
    }
    #pwa-install-banner div:first-child {
      font-size: 13px !important;
    }
    #pwa-install-btn {
      padding: 8px 16px !important;
      font-size: 13px !important;
    }
  }
`;
document.head.appendChild(style);

window.addEventListener('appinstalled', () => {
  console.log('✓ App installed successfully!');
  closeBanner();
  deferredPrompt = null;
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then(registration => {
        console.log('✓ Service Worker registered:', registration);
        console.log('✓ Service Worker scope:', registration.scope);

        // Check if SW is active
        if (registration.active) {
          console.log('✓ Service Worker is ACTIVE');
        } else if (registration.installing) {
          console.log('⏳ Service Worker is INSTALLING');
        } else if (registration.waiting) {
          console.log('⏳ Service Worker is WAITING');
        }
      })
      .catch(error => {
        console.error('✗ Service Worker registration failed:', error);
      });
  });
} else {
  console.log('⚠ Service Worker not supported');
}

// Add comprehensive PWA diagnostics
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log('\n=== PWA Installation Diagnostics ===');
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);
    console.log('deferredPrompt:', deferredPrompt ? '✓ Available' : '✗ Not available');
    console.log('Service Worker:', 'serviceWorker' in navigator ? '✓ Supported' : '✗ Not supported');
    console.log('Manifest link:', document.querySelector('link[rel="manifest"]') ? '✓ Found' : '✗ Missing');
    console.log('Display mode:', getComputedStyle(document.documentElement).getPropertyValue('--display') || 'N/A');
    console.log('\nIf beforeinstallprompt didn\'t fire:');
    console.log('- Service worker may not be active yet');
    console.log('- Try hard-refreshing (Ctrl+Shift+R)');
    console.log('- Check DevTools > Application > Service Workers');
    console.log('- Check DevTools > Application > Manifest');
  }, 5000);
});
