/**
 * Firebase Client SDK — browser-safe initialization.
 * Singleton pattern prevents double-initialization in hot reload.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCQz1Fz1uJhCmkTTcaDcx1XpTF5EMkJ_vA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "build-with-ai-e2358.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "build-with-ai-e2358",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "build-with-ai-e2358.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "949995634094",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:949995634094:web:3b66c555dbb28b86c49c3f"
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

export const auth: Auth = getAuth(app);
// Ensure persistence is set to local
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
