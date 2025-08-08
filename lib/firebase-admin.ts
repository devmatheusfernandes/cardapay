import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

function parseServiceAccount() {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables.');
  }

  raw = raw.trim();

  // Remove surrounding quotes if present
  if (raw.startsWith('"') && raw.endsWith('"')) {
    raw = raw.slice(1, -1);
  }

  // Try JSON first (handles raw JSON with escaped newlines)
  try {
    return JSON.parse(raw);
  } catch {
    // If JSON fails, try Base64 decode
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is neither valid JSON nor valid Base64-encoded JSON.');
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
