const toastContainer = document.getElementById("toastContainer");

function showToast({
  title,
  message,
  type = "info",
  duration = 4000
}) {
  const toast = document.createElement("div");
  toast.className = `custom-toast toast-${type}`;

  const icons = {
    success: "✓",
    error: "!",
    warning: "!",
    info: "i",
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <h6>${title}</h6>
      <p>${message}</p>
    </div>
    <button class="toast-close">&times;</button>
  `;

  toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector(".toast-close");

  closeBtn.addEventListener("click", () => {
    toast.remove();
  });

  setTimeout(() => {
    toast.remove();
  }, duration);
}


import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyD27SHH096KUpTNTp2K7kViRELHD6ALHH8",
  authDomain: "subtra-da8c1.firebaseapp.com",
  projectId: "subtra-da8c1",
  storageBucket: "subtra-da8c1.firebasestorage.app",
  messagingSenderId: "795601435114",
  appId: "1:795601435114:web:aaa12d19869dc00a5dda93"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const form = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

// LOGIN
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    showToast({
      title: "Login successful!",
      message: `Welcome back ${user.email}! Redirecting you to dashboard...`,
      type: "success"
    });
    console.log("Logged in user UID:", user.uid);
    window.location.href = "../dashboard/index.html";

  } catch (error) {
    console.error(error);
    showToast({
      title: "Login error!",
      message: error.message,
      type: "error"
    });
  }
});


// Google Sign-In
const googleBtn = document.getElementById("googleBtn");

googleBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL || null,
        createdAt: new Date()
      });
    }

    showToast({
      title: "Welcome",
      message: `Welcome ${user.displayName || user.email}!`,
      type: "success"
    });

    setTimeout(() => {
      window.location.href = "../dashboard/index.html";
    }, 1500);

  } catch (error) {
    console.error(error);
    showToast({
      title: "Google Log-In Failed",
      message: error.message,
      type: "error"
    });
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(reg => console.log("Service Worker registered", reg))
      .catch(err => console.error("SW registration failed:", err));
  });
}

// show install button for PWA
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  console.log(choice.outcome);
  deferredPrompt = null;
  installBtn.style.display = 'none';
});
