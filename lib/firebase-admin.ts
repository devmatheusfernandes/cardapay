import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables.');
  }

  try {
    // Try Base64 decode first
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    // If Base64 decoding fails, assume it's raw JSON
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is neither valid Base64 nor valid JSON.');
    }
  }
}

if (!getApps().length) {
  try {
    const serviceAccount = parseServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.stack || error);
    throw error;
  }
}

export const adminDb = admin.firestore();
export { admin };
