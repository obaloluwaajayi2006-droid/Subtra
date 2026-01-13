// ===============================
// SHARED IMPORTS & SETUP
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD27SHH096KUpTNTp2K7kViRELHD6ALHH8",
  authDomain: "subtra-da8c1.firebaseapp.com",
  projectId: "subtra-da8c1",
  storageBucket: "subtra-da8c1.appspot.com",
  messagingSenderId: "795601435114",
  appId: "1:795601435114:web:aaa12d19869dc00a5dda93"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// DARK MODE (MOVED FROM DASHBOARD)
// ===============================

const darkModeToggle = document.getElementById("darkModeToggle");
const savedTheme = localStorage.getItem("theme");

// Sync toggle with current body state
if (document.body.classList.contains("dark-mode")) {
  darkModeToggle.checked = true;
} else if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  darkModeToggle.checked = true;
} else if (savedTheme === "light") {
  document.body.classList.remove("dark-mode");
  darkModeToggle.checked = false;
}

darkModeToggle.addEventListener("change", () => {
  if (darkModeToggle.checked) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
  }
});

// ===============================
// UI SETUP (Sidebar, Navigation, etc)
// ===============================

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.add("active");
  sidebarOverlay.classList.add("active");
});

sidebarClose.addEventListener("click", () => {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
});

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
});

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
  });
});

profileBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".user-profile")) {
    profileDropdown.classList.remove("active");
  }
});

document.getElementById("logoutDropdown").addEventListener("click", (e) => {
  e.preventDefault();
  auth.signOut();
});

document.getElementById("logoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  auth.signOut();
});

// ===============================
// TOAST NOTIFICATIONS
// ===============================

const toastContainer = document.getElementById("toastContainer");

function showToast({ title, message, type = "info", duration = 4000 }) {
  const toast = document.createElement("div");
  toast.className = `custom-toast toast-${type}`;
  const icons = { success: "✓", error: "!", warning: "⚠", info: "i" };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <h6>${title}</h6>
      <p>${message}</p>
    </div>
    <button class="toast-close">&times;</button>
  `;

  toastContainer.appendChild(toast);
  toast.querySelector(".toast-close").onclick = () => toast.remove();
  setTimeout(() => toast.remove(), duration);
}

// ===============================
// SETTINGS HANDLERS
// ===============================

document.getElementById("exportBtn").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const snapshot = await getDocs(collection(db, "users", user.uid, "subscriptions"));

    let csv = "Name,Amount,Currency,Billing Cycle,Category,Status,Next Billing Date\n";

    snapshot.forEach(doc => {
      const sub = doc.data();
      csv += `"${sub.name}",${sub.amount},"${sub.currency}","${sub.billingCycle}","${sub.category}","${sub.isActive === false ? 'Paused' : 'Active'}","${sub.nextBillingDate}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subtra-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    showToast({ title: "Success", message: "Your data has been exported", type: "success" });
  } catch (error) {
    console.error("Error exporting data:", error);
    showToast({ title: "Error", message: "Failed to export data", type: "error" });
  }
});

document.getElementById("deleteAccountBtn").addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to delete your account? This action cannot be undone.");
  if (confirmed) {
    showToast({ title: "Info", message: "Account deletion not yet implemented", type: "info" });
  }
});

// ===============================
// AUTH & INITIALIZATION
// ===============================

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/signin";
    return;
  }

  const userName = user.displayName || user.email?.split("@")[0] || "User";
  const userAvatarEl = document.getElementById("userAvatar");

  // Update avatar with photo if available, otherwise show initial
  if (user.photoURL) {
    userAvatarEl.style.backgroundImage = `url('${user.photoURL}')`;
    userAvatarEl.style.backgroundSize = 'cover';
    userAvatarEl.style.backgroundPosition = 'center';
    userAvatarEl.textContent = '';
  } else {
    userAvatarEl.textContent = userName.charAt(0).toUpperCase();
  }
  document.getElementById("subCount").textContent = "0";

  // Load subscription count
  getDocs(collection(db, "users", user.uid, "subscriptions")).then(snapshot => {
    document.getElementById("subCount").textContent = snapshot.size;
  });
});
