// APPLY SAVED THEME

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
}


// SIDEBAR TOGGLE (MOBILE)

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarOverlay = document.getElementById("sidebarOverlay");

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

// Close sidebar when nav link is clicked
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
  });
});

// PROFILE DROPDOWN

const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");

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


// Toast notification
const toastContainer = document.getElementById("toastContainer");

function showToast({ title, message, type = "info", duration = 4000 }) {
  const toast = document.createElement("div");
  toast.className = `custom-toast toast-${type}`;

  const icons = { success: "✓", error: "!", warning: "!", info: "i" };

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

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD27SHH096KUpTNTp2K7kViRELHD6ALHH8",
  authDomain: "subtra-da8c1.firebaseapp.com",
  projectId: "subtra-da8c1",
  storageBucket: "subtra-da8c1.appspot.com",
  messagingSenderId: "795601435114",
  appId: "1:795601435114:web:aaa12d19869dc00a5dda93"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// HELPER FUNCTIONS

function calculateNextBillingDate(startDate, cycle) {
  const date = new Date(startDate);
  if (cycle === "monthly") date.setMonth(date.getMonth() + 1);
  if (cycle === "yearly") date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";
}

// Elements
const subsContainer = document.getElementById("subscriptions");
const addSubForm = document.getElementById("addSubForm");
const editSubForm = document.getElementById("editSubForm");
const deleteMessageEl = document.getElementById("deleteMessage");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const userNameEl = document.getElementById("userName");
const userAvatarEl = document.getElementById("userAvatar");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const exportBtn = document.getElementById("exportBtn");

let editModal, deleteModal;
let currentEditId = null;
let deleteTargetId = null;
let allSubscriptions = [];

// Auth
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../signin/index.html";
    return;
  }

  // Set user info
  const userName = user.displayName || user.email?.split("@")[0] || "User";
  userNameEl.textContent = userName;

  // Update avatar with photo if available, otherwise show initial
  if (user.photoURL) {
    userAvatarEl.style.backgroundImage = `url('${user.photoURL}')`;
    userAvatarEl.style.backgroundSize = 'cover';
    userAvatarEl.style.backgroundPosition = 'center';
    userAvatarEl.textContent = '';
  } else {
    userAvatarEl.textContent = userName.charAt(0).toUpperCase();
  }

  editModal = new bootstrap.Modal(document.getElementById("editSubModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteSubModal"));

  loadDashboard(user.uid);

  // Add subscription
  addSubForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      name: addSubForm.subName.value.trim(),
      amount: Number(addSubForm.subAmount.value),
      currency: addSubForm.subCurrency.value,
      billingCycle: addSubForm.subCycle.value,
      startDate: addSubForm.subStartDate.value,
      category: addSubForm.subCategory.value,
      reminderPreference: addSubForm.subReminder.value
    };

    try {
      await addDoc(collection(db, "users", user.uid, "subscriptions"), {
        ...formData,
        nextBillingDate: calculateNextBillingDate(formData.startDate, formData.billingCycle),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      showToast({ title: "Success", message: "Subscription added successfully", type: "success" });
      addSubForm.reset();
      const addModal = bootstrap.Modal.getInstance(document.getElementById("addSubModal"));
      addModal.hide();
      loadDashboard(user.uid);
    } catch (error) {
      console.error("Error adding subscription:", error);
      showToast({ title: "Error", message: "Failed to add subscription", type: "error" });
    }
  });

  // Edit subscription
  editSubForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      await updateDoc(
        doc(db, "users", user.uid, "subscriptions", currentEditId),
        {
          name: editSubForm.name.value,
          amount: Number(editSubForm.amount.value),
          currency: editSubForm.currency.value,
          billingCycle: editSubForm.billingCycle.value,
          category: editSubForm.category.value,
          reminderPreference: editSubForm.reminderPreference.value,
          updatedAt: serverTimestamp()
        }
      );

      showToast({ title: "Updated", message: "Subscription updated successfully", type: "success" });
      editModal.hide();
      loadDashboard(user.uid);
    } catch (error) {
      console.error("Error updating subscription:", error);
      showToast({ title: "Error", message: "Failed to update subscription", type: "error" });
    }
  });

  // Delete subscription
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!deleteTargetId) return;

    try {
      await deleteDoc(
        doc(db, "users", user.uid, "subscriptions", deleteTargetId)
      );

      showToast({ title: "Deleted", message: "Subscription removed successfully", type: "success" });
      deleteTargetId = null;
      deleteModal.hide();
      loadDashboard(user.uid);
    } catch (error) {
      console.error("Error deleting subscription:", error);
      showToast({ title: "Error", message: "Failed to delete subscription", type: "error" });
    }
  });

  // Export
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        let csv = "Name,Amount,Currency,Billing Cycle,Category,Status,Next Billing Date\n";

        allSubscriptions.forEach(sub => {
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
  }

  // Logout
  document.getElementById("logoutLink").addEventListener("click", (e) => {
    e.preventDefault();
    auth.signOut();
  });
});

// Load dashboard (PAUSE / RESUME + BADGES)
async function loadDashboard(userId) {
  const upcomingRenewals = document.getElementById("upcomingRenewals");
  const categoryBreakdown = document.getElementById("categoryBreakdown");
  const monthlySpendEl = document.getElementById("monthlySpend");
  const yearlySpendEl = document.getElementById("yearlySpend");
  const potentialSavingsEl = document.getElementById("potentialSavings");
  const subCountEl = document.getElementById("subCount");

  try {
    subsContainer.innerHTML = '<p class="text-muted text-center py-4">Loading...</p>';

    const snapshot = await getDocs(collection(db, "users", userId, "subscriptions"));

    if (snapshot.empty) {
      subsContainer.innerHTML = '<div class="col-12"><p class="text-muted text-center py-4"><i class="fas fa-inbox"></i><br>No subscriptions yet. Add one to get started!</p></div>';
      upcomingRenewals.innerHTML = '<p class="text-muted text-center py-4">No upcoming renewals</p>';
      categoryBreakdown.innerHTML = '<p class="text-muted text-center py-4">No subscriptions</p>';
      monthlySpendEl.textContent = "₦0.00";
      yearlySpendEl.textContent = "₦0.00";
      potentialSavingsEl.textContent = "₦0.00";
      subCountEl.textContent = "0";
      allSubscriptions = [];
      return;
    }

    let totalMonthly = 0;
    let totalPaused = 0;
    let upcomingList = [];
    let categoryMap = {};
    allSubscriptions = [];

    const TODAY = new Date();
    TODAY.setHours(0, 0, 0, 0);
    const RENEWING_SOON_DAYS = 7;

    // Process all subscriptions
    snapshot.forEach((snap) => {
      const sub = snap.data();
      allSubscriptions.push({ id: snap.id, ...sub });

      const isPaused = sub.isActive === false;

      // Check if subscription is expired
      let isExpired = false;
      if (sub.nextBillingDate) {
        const nextDateParts = sub.nextBillingDate.split('-');
        const next = new Date(parseInt(nextDateParts[0]), parseInt(nextDateParts[1]) - 1, parseInt(nextDateParts[2]));
        next.setHours(0, 0, 0, 0);

        if (next < TODAY) {
          isExpired = true;
        }
      }

      // Skip expired subscriptions from calculations
      if (isExpired) {
        return;
      }

      // Calculate totals
      const monthlyAmount = sub.billingCycle === "yearly" ? sub.amount / 12 : sub.amount;
      if (!isPaused) {
        totalMonthly += monthlyAmount;
      } else {
        totalPaused += monthlyAmount;
      }

      // Category breakdown
      categoryMap[sub.category] = (categoryMap[sub.category] || 0) + monthlyAmount;

      // Status logic for upcoming renewals
      if (!isPaused && sub.nextBillingDate) {
        const next = new Date(sub.nextBillingDate);
        const diffDays = Math.ceil((next - TODAY) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= RENEWING_SOON_DAYS) {
          upcomingList.push({
            name: sub.name,
            date: sub.nextBillingDate,
            amount: sub.amount,
            currency: sub.currency,
            id: snap.id,
            data: sub
          });
        }
      }
    });

    // Count active subscriptions (exclude expired)
    const activeSubCount = allSubscriptions.filter(sub => {
      if (sub.nextBillingDate) {
        const nextDateParts = sub.nextBillingDate.split('-');
        const next = new Date(parseInt(nextDateParts[0]), parseInt(nextDateParts[1]) - 1, parseInt(nextDateParts[2]));
        next.setHours(0, 0, 0, 0);
        return next >= TODAY;
      }
      return true;
    }).length;

    // Update metrics
    monthlySpendEl.textContent = `₦${totalMonthly.toFixed(2)}`;
    yearlySpendEl.textContent = `₦${(totalMonthly * 12).toFixed(2)}`;
    potentialSavingsEl.textContent = `₦${totalPaused.toFixed(2)}`;
    subCountEl.textContent = activeSubCount;

    // Display subscriptions with initial filters
    displayDashboardSubscriptions(allSubscriptions);

    // Upcoming renewals
    if (upcomingList.length > 0) {
      upcomingRenewals.innerHTML = upcomingList.map(item => `
        <div class="renewal-item">
          <div class="renewal-info">
            <h5>${item.name}</h5>
            <p>${item.currency} ${item.amount.toFixed(2)}</p>
          </div>
          <div class="renewal-date">${formatDate(item.date)}</div>
        </div>
      `).join("");
    } else {
      upcomingRenewals.innerHTML = '<p class="text-muted text-center py-4">No upcoming renewals in the next 7 days</p>';
    }

    // Category breakdown
    if (Object.keys(categoryMap).length > 0) {
      categoryBreakdown.innerHTML = Object.entries(categoryMap).map(([cat, amount]) => `
        <div class="category-item">
          <span class="category-name">${cat}</span>
          <span class="category-amount">₦${amount.toFixed(2)}</span>
        </div>
      `).join("");
    } else {
      categoryBreakdown.innerHTML = '<p class="text-muted text-center py-4">No subscriptions to analyze</p>';
    }

  } catch (error) {
    console.error("Error loading dashboard:", error);
    showToast({ title: "Error", message: "Failed to load subscriptions", type: "error" });
  }
}

function displayDashboardSubscriptions(subscriptions) {
  if (subscriptions.length === 0) {
    subsContainer.innerHTML = '<div class="col-12"><p class="text-muted text-center py-4"><i class="fas fa-search"></i><br>No subscriptions match your filters</p></div>';
    return;
  }

  subsContainer.innerHTML = subscriptions.map(sub => {
    const isPaused = sub.isActive === false;
    let statusClass = "active";
    let statusLabel = "Active";
    let isExpired = false;

    // First check if subscription is expired (highest priority)
    if (sub.nextBillingDate) {
      // Get today's date at start of day (no time component)
      const TODAY = new Date();
      TODAY.setHours(0, 0, 0, 0);

      // Parse the next billing date (assuming YYYY-MM-DD format)
      const nextDateParts = sub.nextBillingDate.split('-');
      const next = new Date(parseInt(nextDateParts[0]), parseInt(nextDateParts[1]) - 1, parseInt(nextDateParts[2]));
      next.setHours(0, 0, 0, 0);

      // Compare dates
      if (next < TODAY) {
        // Subscription has expired
        isExpired = true;
        statusClass = "expired";
        statusLabel = "Expired";
      }
    }

    // If not expired, check other statuses
    if (!isExpired) {
      if (isPaused) {
        statusClass = "paused";
        statusLabel = "Paused";
      } else if (sub.nextBillingDate) {
        const TODAY = new Date();
        TODAY.setHours(0, 0, 0, 0);

        const nextDateParts = sub.nextBillingDate.split('-');
        const next = new Date(parseInt(nextDateParts[0]), parseInt(nextDateParts[1]) - 1, parseInt(nextDateParts[2]));
        next.setHours(0, 0, 0, 0);

        const diffTime = next - TODAY;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 7) {
          // Renewing soon
          statusClass = "renewing";
          statusLabel = "Renewing Soon";
        }
      }
    }

    return `
      <div class="subscription-card${isPaused ? " paused" : ""}${isExpired ? " expired" : ""}">
        <div class="sub-header">
          <h5 class="sub-name">${sub.name}</h5>
          <span class="sub-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="sub-amount">${sub.currency} ${sub.amount.toFixed(2)}</div>
        <p class="sub-cycle">${sub.billingCycle}</p>
        <p class="sub-info">
          <i class="fas fa-calendar-check"></i> Next billing: ${formatDate(sub.nextBillingDate)}
        </p>
        <div class="sub-actions">
          <button class="sub-btn toggle" data-id="${sub.id}">
            <i class="fas fa-${isPaused || isExpired ? 'play' : 'pause'}"></i> ${isPaused || isExpired ? 'Resume' : 'Pause'}
          </button>
          <button class="sub-btn edit" data-id="${sub.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="sub-btn delete" data-id="${sub.id}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  }).join("");

  attachDashboardEventListeners();
}

function attachDashboardEventListeners() {
  const userId = auth.currentUser.uid;

  document.querySelectorAll(".sub-btn.toggle").forEach(btn => {
    btn.addEventListener("click", async () => {
      const subId = btn.getAttribute("data-id");
      const sub = allSubscriptions.find(s => s.id === subId);
      const isPaused = sub.isActive === false;

      const ref = doc(db, "users", userId, "subscriptions", subId);

      if (isPaused) {
        await updateDoc(ref, {
          isActive: true,
          nextBillingDate: calculateNextBillingDate(
            new Date().toISOString().split("T")[0],
            sub.billingCycle
          ),
          updatedAt: serverTimestamp()
        });
        showToast({ title: "Resumed", message: `${sub.name} is active again`, type: "success" });
      } else {
        await updateDoc(ref, {
          isActive: false,
          updatedAt: serverTimestamp()
        });
        showToast({ title: "Paused", message: `${sub.name} has been paused`, type: "warning" });
      }
      loadDashboard(userId);
    });
  });

  document.querySelectorAll(".sub-btn.edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const subId = btn.getAttribute("data-id");
      const sub = allSubscriptions.find(s => s.id === subId);

      currentEditId = subId;
      editSubForm.name.value = sub.name;
      editSubForm.amount.value = sub.amount;
      editSubForm.currency.value = sub.currency;
      editSubForm.billingCycle.value = sub.billingCycle;
      editSubForm.category.value = sub.category;
      editSubForm.reminderPreference.value = sub.reminderPreference;

      editModal.show();
    });
  });

  document.querySelectorAll(".sub-btn.delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const subId = btn.getAttribute("data-id");
      const sub = allSubscriptions.find(s => s.id === subId);

      deleteTargetId = subId;
      deleteMessageEl.textContent = `Delete "${sub.name}"? This action cannot be undone.`;
      deleteModal.show();
    });
  });
}

function filterDashboardSubscriptions() {
  const category = categoryFilter.value;
  const status = statusFilter.value;

  const filtered = allSubscriptions.filter(sub => {
    const matchCategory = !category || sub.category === category;
    const matchStatus = !status || (status === "active" ? sub.isActive !== false : sub.isActive === false);
    return matchCategory && matchStatus;
  });

  displayDashboardSubscriptions(filtered);
}

categoryFilter.addEventListener("change", filterDashboardSubscriptions);
statusFilter.addEventListener("change", filterDashboardSubscriptions);


