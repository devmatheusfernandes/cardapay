export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

// Helper to get authenticated user ID from the session token
async function getUserId(req: NextRequest) {
  const authorization = req.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    try {
      const idToken = authorization.split('Bearer ')[1];
      const decodedToken = await auth().verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (err) {
      console.error('Token verification failed:', err);
    }
  }
  return null;
}

// Safe JSON parsing helper (not used here yet, but kept for consistency)
async function safeJson<T = any>(req: NextRequest): Promise<T> {
  try {
    return await req.json();
  } catch {
    return {} as T;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const restaurantRef = adminDb.collection('restaurants').doc(userId);
    const restaurantDoc = await restaurantRef.get();
    const restaurantData = restaurantDoc.data();

    let accountId = restaurantData?.stripeAccountId;

    // 1. Create a Stripe account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        // Optionally pre-fill email and other details here
      });
      accountId = account.id;
      await restaurantRef.update({ stripeAccountId: accountId });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 2. Create an account link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/profile`,
      return_url: `${appUrl}/dashboard/profile?stripe_return=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Error creating Stripe Connect link:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
