import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// This is the Base64 encoded service account key from your .env.local file
const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string;

// Decode the Base64 string into a regular JSON string
const decodedServiceAccount = Buffer.from(encodedServiceAccount, 'base64').toString('utf-8');

// Parse the decoded JSON string
const serviceAccount = JSON.parse(decodedServiceAccount);


// Initialize Firebase Admin SDK if it hasn't been already
if (!getApps().length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

// Export the initialized admin instance's firestore database
export const adminDb = admin.firestore();
