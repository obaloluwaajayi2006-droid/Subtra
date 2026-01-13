// Profile functionality

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

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
const storage = getStorage(app);

let currentUser = null;
let userData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1 (555) 123-4567',
  country: 'United States',
  timezone: 'EST (UTC-5)',
  joinedDate: 'January 2024',
  isGoogleUser: false
};

// Initialize profile with user data from Firebase
async function loadUserProfile() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    currentUser = user;

    try {
      // Get user data from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        // Parse display name
        const displayName = data.displayName || user.displayName || '';
        const nameParts = displayName.split(' ');

        userData = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          country: data.country || '',
          timezone: data.timezone || '',
          joinedDate: data.joinedDate ? formatDate(data.joinedDate.toDate()) : formatDate(user.metadata.creationTime),
          isGoogleUser: !!data.photoURL
        };
      } else {
        // New user, use auth data
        const displayName = user.displayName || '';
        const nameParts = displayName.split(' ');

        userData = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email || '',
          phone: '',
          country: '',
          timezone: '',
          joinedDate: formatDate(user.metadata.creationTime),
          isGoogleUser: !!user.photoURL
        };
      }

      // Update UI with user data
      updateProfileUI();

      // Fetch subscription count
      try {
        const subsSnapshot = await getDocs(collection(db, "users", user.uid, "subscriptions"));
        const subCount = subsSnapshot.size;
        const subCountElement = document.getElementById('subCount');
        if (subCountElement) {
          subCountElement.textContent = subCount;
        }
      } catch (error) {
        console.error('Error fetching subscription count:', error);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      showToast('Error loading profile', 'error');
    }
  });
}

function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

// Helper function to update all avatar elements
function updateAllAvatars() {
  const firstLetter = userData.firstName.charAt(0).toUpperCase();
  const avatarElements = document.querySelectorAll('[data-avatar], .avatar, #profileAvatar, #userAvatar');

  avatarElements.forEach(el => {
    if (currentUser.photoURL) {
      el.style.backgroundImage = `url('${currentUser.photoURL}')`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
    } else {
      el.style.backgroundImage = 'none';
      el.textContent = firstLetter;
    }
  });
}

function updateProfileUI() {
  updateAllAvatars();

  // Update profile header
  document.getElementById('displayName').textContent = `${userData.firstName} ${userData.lastName}`;
  document.getElementById('displayEmail').textContent = userData.email;
  document.getElementById('joinedDate').textContent = `Joined ${userData.joinedDate}`;

  // Update info display
  document.getElementById('infoFullName').textContent = `${userData.firstName} ${userData.lastName}`;
  document.getElementById('infoEmail').textContent = userData.email;
  document.getElementById('infoPhone').textContent = userData.phone || 'Not provided';
  document.getElementById('infoCountry').textContent = userData.country || 'Not provided';
  document.getElementById('infoTimezone').textContent = userData.timezone || 'Not provided';
  document.getElementById('infoMemberSince').textContent = userData.joinedDate;
}

// Tab switching
document.querySelectorAll('.profile-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');

    // Remove active class from all tabs and buttons
    document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    // Add active class to clicked button and corresponding tab
    btn.classList.add('active');
    document.getElementById(tabName).classList.add('active');
  });
});

// Edit personal info
const editPersonalBtn = document.getElementById('editPersonalBtn');
const cancelPersonalBtn = document.getElementById('cancelPersonalBtn');
const personalDisplay = document.getElementById('personalDisplay');
const personalForm = document.getElementById('personalForm');
const personalFormElement = document.getElementById('personalForm');

editPersonalBtn.addEventListener('click', () => {
  personalDisplay.style.display = 'none';
  personalForm.classList.add('show');
  editPersonalBtn.style.display = 'none';

  // Populate form with current values
  document.getElementById('firstName').value = userData.firstName;
  document.getElementById('lastName').value = userData.lastName;
  document.getElementById('emailInput').value = userData.email;
  document.getElementById('phoneInput').value = userData.phone;
  document.getElementById('countryInput').value = userData.country;
  document.getElementById('timezoneInput').value = userData.timezone;
});

cancelPersonalBtn.addEventListener('click', () => {
  personalDisplay.style.display = 'block';
  personalForm.classList.remove('show');
  editPersonalBtn.style.display = 'flex';
});

personalFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('emailInput').value;
  const phone = document.getElementById('phoneInput').value;
  const country = document.getElementById('countryInput').value;
  const timezone = document.getElementById('timezoneInput').value;

  try {
    const displayName = `${firstName} ${lastName}`;

    // Update auth profile
    await updateProfile(currentUser, {
      displayName: displayName
    });

    // Update Firestore
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      displayName,
      email,
      phone,
      country,
      timezone
    });

    // Update local userData
    userData = {
      ...userData,
      firstName,
      lastName,
      email,
      phone,
      country,
      timezone
    };

    // Update display values
    updateProfileUI();

    // Show success message
    showToast('Profile updated successfully!', 'success');

    // Hide form
    personalDisplay.style.display = 'block';
    personalForm.classList.remove('show');
    editPersonalBtn.style.display = 'flex';
  } catch (error) {
    console.error('Error updating profile:', error);
    showToast('Error updating profile: ' + error.message, 'error');
  }
});

// Password change
const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      // Reauthenticate user
      const { reauthenticateWithCredential, EmailAuthProvider, updatePassword } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      showToast('Password updated successfully!', 'success');
      passwordForm.reset();
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        showToast('Current password is incorrect', 'error');
      } else {
        showToast('Error updating password: ' + error.message, 'error');
      }
    }
  });
}

// Avatar upload
document.getElementById('uploadAvatarBtn').addEventListener('click', () => {
  document.getElementById('avatarInput').click();
});

document.getElementById('avatarInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      showToast('Uploading image...', 'info');

      // Create a storage reference
      const storageRef = ref(storage, `avatars/${currentUser.uid}_${Date.now()}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get download URL
      const photoURL = await getDownloadURL(snapshot.ref);

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        photoURL: photoURL
      });

      // Update Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        photoURL: photoURL
      });

      // Update all avatar elements across the page
      updateAllAvatars();

      showToast('Avatar updated successfully!', 'success');
      e.target.value = ''; // Reset input
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showToast('Error uploading image: ' + error.message, 'error');
    }
  }
});

// Dropdown menu
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');

profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle('show');
});

document.addEventListener('click', () => {
  profileDropdown.classList.remove('show');
});

// Logout
document.getElementById('logoutDropdown').addEventListener('click', (e) => {
  e.preventDefault();
  if (confirm('Are you sure you want to logout?')) {
    auth.signOut().then(() => {
      window.location.href = '/signin';
    }).catch(error => {
      console.error('Error signing out:', error);
      showToast('Error logging out', 'error');
    });
  }
});

const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
      auth.signOut().then(() => {
        window.location.href = '/signin';
      }).catch(error => {
        console.error('Error signing out:', error);
        showToast('Error logging out', 'error');
      });
    }
  });
}

// Sidebar toggle
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebarClose');

sidebarToggle?.addEventListener('click', () => {
  sidebar.classList.toggle('show');
});

sidebarClose?.addEventListener('click', () => {
  sidebar.classList.remove('show');
});

// Close sidebar when clicking on a nav link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    sidebar.classList.remove('show');
  });
});

// Toast notification function
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;

  const icons = {
    success: '✓',
    error: '!',
    warning: '!',
    info: 'i'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <h6>${type.charAt(0).toUpperCase() + type.slice(1)}</h6>
      <p>${message}</p>
    </div>
    <button class="toast-close">&times;</button>
  `;

  toastContainer.appendChild(toast);
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Dark mode toggle
const themeOptions = document.querySelectorAll('input[name="theme"]');
themeOptions.forEach(option => {
  option.addEventListener('change', (e) => {
    const theme = e.target.value;
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  });
});

// Load saved theme on page load
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    const darkOption = document.querySelector('input[name="theme"][value="dark"]');
    if (darkOption) darkOption.checked = true;
  }
});

// Initialize profile on page load
document.addEventListener('DOMContentLoaded', loadUserProfile);
