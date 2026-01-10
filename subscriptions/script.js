// ===============================
// SHARED IMPORTS & SETUP
// ===============================
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
// UI SETUP
// ===============================

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");
const subsContainer = document.getElementById("subscriptions");
const addSubForm = document.getElementById("addSubForm");
const editSubForm = document.getElementById("editSubForm");
const deleteMessageEl = document.getElementById("deleteMessage");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const cycleFilter = document.getElementById("cycleFilter");
const searchInput = document.getElementById("searchInput");

let editModal, deleteModal;
let currentEditId = null;
let deleteTargetId = null;
let allSubscriptions = [];

// ===============================
// HELPER FUNCTIONS
// ===============================

function calculateNextBillingDate(startDate, cycle) {
  const date = new Date(startDate);
  if (cycle === "monthly") date.setMonth(date.getMonth() + 1);
  if (cycle === "yearly") date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";
}

// ===============================
// SIDEBAR & NAVIGATION
// ===============================

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
// SUBSCRIPTIONS MANAGEMENT
// ===============================

async function loadSubscriptions(userId) {
  try {
    subsContainer.innerHTML = '<p class="text-muted text-center py-4">Loading...</p>';

    const snapshot = await getDocs(collection(db, "users", userId, "subscriptions"));

    if (snapshot.empty) {
      subsContainer.innerHTML = '<div class="col-12"><p class="text-muted text-center py-4"><i class="fas fa-inbox"></i><br>No subscriptions yet. Create one to get started!</p></div>';
      document.getElementById("subCount").textContent = "0";
      return;
    }

    allSubscriptions = [];
    subsContainer.innerHTML = "";

    snapshot.forEach((snap) => {
      const sub = snap.data();
      allSubscriptions.push({ id: snap.id, ...sub });
    });

    document.getElementById("subCount").textContent = snapshot.size;
    displaySubscriptions(allSubscriptions);

  } catch (error) {
    console.error("Error loading subscriptions:", error);
    showToast({ title: "Error", message: "Failed to load subscriptions", type: "error" });
  }
}

function displaySubscriptions(subscriptions) {
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

  // Attach event listeners
  attachEventListeners();
}

function attachEventListeners() {
  document.querySelectorAll(".sub-btn.toggle").forEach(btn => {
    btn.addEventListener("click", async () => {
      const subId = btn.getAttribute("data-id");
      const sub = allSubscriptions.find(s => s.id === subId);
      const userId = auth.currentUser.uid;

      const ref = doc(db, "users", userId, "subscriptions", subId);
      const isPaused = sub.isActive === false;

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

      loadSubscriptions(userId);
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

function filterSubscriptions() {
  const category = categoryFilter.value;
  const status = statusFilter.value;
  const cycle = cycleFilter.value;
  const search = searchInput.value.toLowerCase();

  const filtered = allSubscriptions.filter(sub => {
    const matchCategory = !category || sub.category === category;
    const matchStatus = !status || (status === "active" ? sub.isActive !== false : sub.isActive === false);
    const matchCycle = !cycle || sub.billingCycle === cycle;
    const matchSearch = !search || sub.name.toLowerCase().includes(search);

    return matchCategory && matchStatus && matchCycle && matchSearch;
  });

  displaySubscriptions(filtered);
}

categoryFilter.addEventListener("change", filterSubscriptions);
statusFilter.addEventListener("change", filterSubscriptions);
cycleFilter.addEventListener("change", filterSubscriptions);
searchInput.addEventListener("input", filterSubscriptions);

// ===============================
// FORM HANDLERS
// ===============================

addSubForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = auth.currentUser.uid;

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
    await addDoc(collection(db, "users", userId, "subscriptions"), {
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
    loadSubscriptions(userId);
  } catch (error) {
    console.error("Error adding subscription:", error);
    showToast({ title: "Error", message: "Failed to add subscription", type: "error" });
  }
});

editSubForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = auth.currentUser.uid;

  try {
    await updateDoc(
      doc(db, "users", userId, "subscriptions", currentEditId),
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
    loadSubscriptions(userId);
  } catch (error) {
    console.error("Error updating subscription:", error);
    showToast({ title: "Error", message: "Failed to update subscription", type: "error" });
  }
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!deleteTargetId) return;
  const userId = auth.currentUser.uid;

  try {
    await deleteDoc(doc(db, "users", userId, "subscriptions", deleteTargetId));

    showToast({ title: "Deleted", message: "Subscription removed successfully", type: "success" });
    deleteTargetId = null;
    deleteModal.hide();
    loadSubscriptions(userId);
  } catch (error) {
    console.error("Error deleting subscription:", error);
    showToast({ title: "Error", message: "Failed to delete subscription", type: "error" });
  }
});

// ===============================
// AUTH & INITIALIZATION
// ===============================

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../signin/index.html";
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

  editModal = new bootstrap.Modal(document.getElementById("editSubModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteSubModal"));

  loadSubscriptions(user.uid);
});
