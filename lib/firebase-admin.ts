import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Validate required environment variables
const requiredEnvVars = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
  clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL,
};

// Check if all required variables are present
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key, _]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
}

// Method 1: Use individual environment variables (RECOMMENDED)
const serviceAccount = {
  projectId: requiredEnvVars.projectId!,
  privateKeyId: requiredEnvVars.privateKeyId!,
  privateKey: requiredEnvVars.privateKey!.replace(/\\n/g, '\n'), // Handle newlines properly
  clientEmail: requiredEnvVars.clientEmail!,
  clientId: requiredEnvVars.clientId!,
  authUri: "https://accounts.google.com/o/oauth2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
  authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
  clientX509CertUrl: requiredEnvVars.clientCertUrl!,
};

// Initialize Firebase Admin SDK if it hasn't been already
if (!getApps().length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    throw error;
  }
}

// Export the initialized admin instance's firestore database
export const adminDb = admin.firestore();