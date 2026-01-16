/**
 * Firebase Configuration for Subtra PWA
 * Initialize Firebase app and export instances for use across the application
 * 
 * IMPORTANT: Replace these config values with your own Firebase project credentials
 * Get these from: Firebase Console -> Project Settings -> Your apps -> Web app config
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD27SHH096KUpTNTp2K7kViRELHD6ALHH8",
  authDomain: "subtra-da8c1.firebaseapp.com",
  projectId: "subtra-da8c1",
  storageBucket: "subtra-da8c1.appspot.com",
  messagingSenderId: "795601435114",
  appId: "1:795601435114:web:aaa12d19869dc00a5dda93"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
export const db = firebase.firestore();
export const messaging = firebase.messaging();
export const auth = firebase.auth();
export const analytics = firebase.analytics();

// Enable offline persistence for Firestore
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open
      console.warn('Firestore: Multiple tabs open, offline persistence disabled.');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support
      console.warn('Firestore: Browser does not support offline persistence.');
    }
  });

console.log('✓ Firebase initialized successfully');
