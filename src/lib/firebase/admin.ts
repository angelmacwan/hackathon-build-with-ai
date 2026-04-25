import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, type Storage } from 'firebase-admin/storage';

function createAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    let serviceAccount: object;
    try {
      const decoded = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
    } catch {
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or base64-encoded JSON.');
      }
    }
    return initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// Lazy singletons — initialization is deferred until first use so that
// the module can be imported without crashing if the env var is absent.
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: Storage | null = null;

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) _auth = getAdminAuth(createAdminApp());
    return (_auth as any)[prop];
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) _db = getAdminFirestore(createAdminApp());
    return (_db as any)[prop];
  },
});

export const adminStorage: Storage = new Proxy({} as Storage, {
  get(_, prop) {
    if (!_storage) _storage = getAdminStorage(createAdminApp());
    return (_storage as any)[prop];
  },
});
