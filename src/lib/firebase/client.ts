/**
 * Firebase Client SDK — browser-safe initialization.
 * Singleton pattern prevents double-initialization in hot reload.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCQz1Fz1uJhCmkTTcaDcx1XpTF5EMkJ_vA",
  authDomain: "build-with-ai-e2358.firebaseapp.com",
  projectId: "build-with-ai-e2358",
  storageBucket: "build-with-ai-e2358.firebasestorage.app",
  messagingSenderId: "949995634094",
  appId: "1:949995634094:web:3b66c555dbb28b86c49c3f"
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
