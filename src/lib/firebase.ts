import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Emulator mode always uses a "demo-" project, which Firebase guarantees never touches real
// cloud resources — even if .env.local holds a real project's config.
if (useEmulators) {
  firebaseConfig.apiKey = 'demo-api-key';
  firebaseConfig.authDomain = 'localhost';
  firebaseConfig.projectId = 'demo-companai';
  firebaseConfig.appId = 'demo-app-id';
}

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const missing = requiredKeys.filter((k) => !firebaseConfig[k]);
if (missing.length > 0) {
  throw new Error(
    `Missing Firebase configuration. Copy .env.example to .env.local and fill in your Firebase project values. Missing keys: ${missing.join(', ')}`
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Optional fields are often undefined (e.g. a prompt section the AI left out);
// drop them instead of letting Firestore reject the whole write.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
