import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Suppress Firebase heartbeat IndexedDB errors (harmless internal SDK noise)
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = String(args[0] ?? '');
  if (
    msg.includes('firebase-heartbeat-store') ||
    msg.includes('idb-get') ||
    msg.includes('idb-set')
  ) return;
  originalConsoleError.apply(console, args);
};

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_DATABASE_ID',
] as const;

function validateFirebaseConfig() {
  for (const varName of REQUIRED_VARS) {
    if (!import.meta.env[varName]) {
      console.error(`Firebase config error: missing environment variable "${varName}". Check your .env file.`);
    }
  }
}

validateFirebaseConfig();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, import.meta.env.VITE_FIREBASE_DATABASE_ID);
export const googleProvider = new GoogleAuthProvider();

// Connection test as per critical constraint
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection successful");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Firebase Error: The client is offline. This usually means the Firebase project is not yet provisioned, the configuration is incorrect, or the network is blocked.");
        console.error("Configuration being used:", { ...firebaseConfig, apiKey: '***' });
      } else {
        console.error("Firebase Initial Connection Error:", error.message);
      }
    }
  }
}

testConnection();

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
};
export type { User };
