import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// Firebase configuration (same as in signin/script.js)
const firebaseConfig = {
  apiKey: "AIzaSyD27SHH096KUpTNTp2K7kViRELHD6ALHH8",
  authDomain: "subtra-da8c1.firebaseapp.com",
  projectId: "subtra-da8c1",
  storageBucket: "subtra-da8c1.firebasestorage.app",
  messagingSenderId: "795601435114",
  appId: "1:795601435114:web:aaa12d19869dc00a5dda93"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create toast container if it doesn't exist
function ensureToastContainer() {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText = `
      position: fixed;
      top: 100px;
      right: 30px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }
  return container;
}

// Create and show redirect toast with countdown
function showRedirectToast(secondsToRedirect = 10) {
  const container = ensureToastContainer();

  const toast = document.createElement("div");
  toast.className = "redirect-toast";
  toast.style.cssText = `
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(139, 92, 246, 0.85));
    border: 1px solid rgba(139, 92, 246, 0.6);
    border-radius: 12px;
    padding: 20px;
    color: white;
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 12px 48px rgba(139, 92, 246, 0.3);
    backdrop-filter: blur(10px);
    animation: slideIn 0.4s ease;
  `;

  let remainingSeconds = secondsToRedirect;

  const contentHTML = `
    <div style="margin-bottom: 15px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
        <i class="fas fa-check-circle" style="font-size: 1.3rem;"></i>
        <div>
          <h6 style="margin: 0; font-weight: 700; font-size: 1rem;">You're logged in!</h6>
          <p style="margin: 0; font-size: 0.9rem; opacity: 0.95;">Redirecting to dashboard...</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
        <div style="
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          overflow: hidden;
        ">
          <div class="countdown-bar" style="
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 2px;
            width: 100%;
            transition: width 0.1s linear;
          "></div>
        </div>
        <span class="countdown-text" style="
          font-weight: 700;
          font-size: 0.95rem;
          min-width: 30px;
        ">${remainingSeconds}s</span>
      </div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="cancel-redirect-btn" style="
        flex: 1;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
      ">
        Stay Here
      </button>
      <button class="continue-redirect-btn" style="
        flex: 1;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
      ">
        Go Now
      </button>
    </div>
  `;

  toast.innerHTML = contentHTML;
  container.appendChild(toast);

  // Get countdown elements
  const countdownText = toast.querySelector(".countdown-text");
  const countdownBar = toast.querySelector(".countdown-bar");
  const cancelBtn = toast.querySelector(".cancel-redirect-btn");
  const continueBtn = toast.querySelector(".continue-redirect-btn");

  // Cancel button hover effect
  cancelBtn.addEventListener("mouseenter", () => {
    cancelBtn.style.background = "rgba(255, 255, 255, 0.3)";
  });
  cancelBtn.addEventListener("mouseleave", () => {
    cancelBtn.style.background = "rgba(255, 255, 255, 0.2)";
  });

  // Continue button hover effect
  continueBtn.addEventListener("mouseenter", () => {
    continueBtn.style.background = "rgba(255, 255, 255, 0.35)";
  });
  continueBtn.addEventListener("mouseleave", () => {
    continueBtn.style.background = "rgba(255, 255, 255, 0.25)";
  });

  let redirectTimeout;
  let isRedirecting = true;

  // Update countdown
  const interval = setInterval(() => {
    remainingSeconds--;
    const percentage = (remainingSeconds / secondsToRedirect) * 100;

    countdownText.textContent = `${remainingSeconds}s`;
    countdownBar.style.width = `${percentage}%`;

    if (remainingSeconds <= 0) {
      clearInterval(interval);
      if (isRedirecting) {
        window.location.href = "./dashboard/index.html";
      }
    }
  }, 1000);

  // Cancel button handler
  cancelBtn.addEventListener("click", () => {
    isRedirecting = false;
    clearInterval(interval);
    toast.style.animation = "slideOut 0.4s ease forwards";
    setTimeout(() => {
      toast.remove();
    }, 400);
  });

  // Continue button handler
  continueBtn.addEventListener("click", () => {
    isRedirecting = false;
    clearInterval(interval);
    window.location.href = "./dashboard/index.html";
  });

  // Add CSS animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `;
  if (!document.querySelector("style[data-redirect-toast]")) {
    style.setAttribute("data-redirect-toast", "true");
    document.head.appendChild(style);
  }
}

// Check if user is logged in
console.log("[Auth Redirect] Script loaded and checking auth state...");

const initAuthCheck = () => {
  onAuthStateChanged(auth, (user) => {
    console.log("[Auth Redirect] Auth state changed. User:", user ? user.email : "Not logged in");
    if (user) {
      console.log("[Auth Redirect] User logged in! Showing redirect toast...");
      // User is logged in, show redirect toast
      showRedirectToast(10); // 10 seconds countdown
    } else {
      console.log("[Auth Redirect] No user logged in, staying on landing page");
    }
  });
};

// Initialize immediately if DOM is ready, otherwise wait
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuthCheck);
} else {
  initAuthCheck();
}
