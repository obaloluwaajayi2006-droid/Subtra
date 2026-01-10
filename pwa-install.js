// PWA Install Prompt Handler
let deferredPrompt;
let installBanner = null;

// Capture the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event for later use
  deferredPrompt = e;

  // Show custom install banner
  showInstallBanner();
});

function showInstallBanner() {
  // Check if banner already exists
  if (document.getElementById('pwa-install-banner')) {
    return;
  }

  // Create banner HTML
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(168, 85, 247, 0.95));
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(139, 92, 246, 0.3);
      padding: 16px;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-family: 'Outfit', sans-serif;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    ">
      <div style="flex: 1;">
        <div style="
          font-weight: 600;
          color: white;
          font-size: 14px;
          margin-bottom: 4px;
        ">Install Subtra</div>
        <div style="
          color: rgba(255, 255, 255, 0.9);
          font-size: 12px;
        ">subtra.vercel.app</div>
      </div>
      <button id="pwa-install-btn" style="
        background: white;
        color: #8b5cf6;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
        font-family: 'Outfit', sans-serif;
      " onmouseover="this.style.opacity='0.9'; this.style.transform='scale(1.05)'" onmouseout="this.style.opacity='1'; this.style.transform='scale(1)'">
        Install
      </button>
      <button id="pwa-close-btn" style="
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(banner);
  installBanner = banner;

  // Install button click handler
  document.getElementById('pwa-install-btn').addEventListener('click', installApp);

  // Close button click handler
  document.getElementById('pwa-close-btn').addEventListener('click', closeBanner);
}

function installApp() {
  if (!deferredPrompt) {
    return;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
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

// Add animation style
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Track app installation
window.addEventListener('appinstalled', () => {
  console.log('Subtra was installed');
  closeBanner();
  deferredPrompt = null;
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Check if app is running as standalone (installed)
if (window.navigator.standalone === true) {
  console.log('App is running as installed PWA');
}

// Handle app visibility
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('App hidden');
  } else {
    console.log('App visible');
  }
});
