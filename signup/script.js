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
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase config
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

// Password regex
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function isValidPassword(password) {
  return passwordRegex.test(password);
}

// Email signup
const form = document.getElementById("signupForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const displayName = `${firstName} ${lastName}`;

  // Password validation
  if (!isValidPassword(password)) {
    showToast({
      title: "Password Requirements",
      message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      type: "error"
    });
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      displayName,
      email,
      createdAt: new Date()
    });
    showToast({
      title: "Account created successfully!",
      message: `Welcome ${displayName}! Redirecting you to signin...`,
      type: "success"
    });
    window.location.href = "/signin";

  } catch (error) {
    console.error(error);
    showToast({
      title: "Signup error!",
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
      window.location.href = "/dashboard";
    }, 1500);

  } catch (error) {
    console.error(error);
    showToast({
      title: "Google Sign-In Failed",
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


