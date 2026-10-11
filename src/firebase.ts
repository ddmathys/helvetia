import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Configuration publique du projet Firebase « helvetia-be8e9 » (la sécurité repose sur les règles Firestore).
const firebaseConfig = {
  apiKey: 'AIzaSyBLXWMdbdqgb8OrJrEN18Cr0FynikCV9Q8',
  authDomain: 'helvetia-be8e9.firebaseapp.com',
  projectId: 'helvetia-be8e9',
  storageBucket: 'helvetia-be8e9.firebasestorage.app',
  messagingSenderId: '539835501243',
  appId: '1:539835501243:web:757cac28d1aa9a3554779e',
  measurementId: 'G-L9VFNM24E8',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = 'fr';
export const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
