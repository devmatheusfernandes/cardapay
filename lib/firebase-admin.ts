import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string;

if (!encodedServiceAccount) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not defined');
}

let serviceAccount;
try {
  // Decode the Base64 string
  const decodedServiceAccount = Buffer.from(encodedServiceAccount, 'base64').toString('utf-8');
  
  // Parse the JSON
  serviceAccount = JSON.parse(decodedServiceAccount);
} catch (error) {
  console.error('Error decoding service account:', error);
  throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
}


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