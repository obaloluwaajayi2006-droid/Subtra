// ===============================
// SHARED IMPORTS & SETUP
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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
// 🎨 APPLY SAVED THEME
// ===============================

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
}

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
// ANALYTICS DATA & CHARTS
// ===============================

let categoryChart, trendChart;

async function loadAnalytics(userId) {
  try {
    const snapshot = await getDocs(collection(db, "users", userId, "subscriptions"));

    if (snapshot.empty) {
      document.getElementById("totalActive").textContent = "0";
      document.getElementById("totalPaused").textContent = "0";
      document.getElementById("avgCost").textContent = "₦0";
      document.getElementById("yearlySavings").textContent = "₦0";
      return;
    }

    let categoryData = {};
    let totalActive = 0;
    let totalPaused = 0;
    let totalMonthly = 0;
    let pausedMonthly = 0;
    let subscriptions = [];

    // Process subscriptions
    snapshot.forEach(doc => {
      const sub = doc.data();
      subscriptions.push(sub);

      const monthlyAmount = sub.billingCycle === "yearly" ? sub.amount / 12 : sub.amount;

      if (sub.isActive === false) {
        totalPaused++;
        pausedMonthly += monthlyAmount;
      } else {
        totalActive++;
        totalMonthly += monthlyAmount;
      }

      if (!categoryData[sub.category]) {
        categoryData[sub.category] = { count: 0, monthly: 0 };
      }
      categoryData[sub.category].count++;
      categoryData[sub.category].monthly += monthlyAmount;
    });

    // Update metrics
    document.getElementById("totalActive").textContent = totalActive;
    document.getElementById("totalPaused").textContent = totalPaused;
    document.getElementById("avgCost").textContent = `₦${(totalMonthly / (totalActive || 1)).toFixed(2)}`;
    document.getElementById("yearlySavings").textContent = `₦${(pausedMonthly * 12).toFixed(2)}`;
    document.getElementById("subCount").textContent = snapshot.size;

    // Update category chart
    updateCategoryChart(categoryData);

    // Update trend chart
    updateTrendChart(totalMonthly);

    // Update table
    updateCategoryTable(categoryData, totalMonthly);

  } catch (error) {
    console.error("Error loading analytics:", error);
    showToast({ title: "Error", message: "Failed to load analytics", type: "error" });
  }
}

function updateCategoryChart(categoryData) {
  const ctx = document.getElementById("categoryChart").getContext("2d");
  const labels = Object.keys(categoryData);
  const data = labels.map(cat => categoryData[cat].monthly);
  const colors = ["#10b981", "#3b82f6", "#f97316", "#8b5cf6"];

  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: "white",
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
            font: { size: 12 },
            color: "#e4e4e7"
          }
        }
      }
    }
  });
}

function updateTrendChart(totalMonthly) {
  const ctx = document.getElementById("trendChart").getContext("2d");
  const now = new Date();
  const currentMonth = now.getMonth();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Generate data for last 6 months
  const data = [];
  const labels = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), currentMonth - i, 1);
    labels.push(months[date.getMonth()]);
    // Only show actual spending for current month
    data.push(i === 0 ? totalMonthly : 0);
  }

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Monthly Spending",
        data: data,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: { size: 12 },
            color: "#e4e4e7"
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function updateCategoryTable(categoryData, total) {
  const tableBody = document.getElementById("categoryTable");
  const rows = Object.entries(categoryData).map(([cat, data]) => {
    const percentage = ((data.monthly / total) * 100).toFixed(1);
    return `
      <tr>
        <td><strong>${cat}</strong></td>
        <td><span class="badge bg-success">${data.count}</span></td>
        <td>₦${data.monthly.toFixed(2)}</td>
        <td>₦${(data.monthly * 12).toFixed(2)}</td>
        <td><span class="badge bg-success">${percentage}%</span></td>
      </tr>
    `;
  }).join("");

  tableBody.innerHTML = rows || '<tr><td colspan="5" class="text-center text-muted py-4">No data available</td></tr>';
}

// ===============================
// AUTH & PAGE LOAD
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

  loadAnalytics(user.uid);
});
