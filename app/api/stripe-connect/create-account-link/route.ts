import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

// Helper to get the authenticated user from the session token
async function getUserId(req: NextRequest) {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await auth().verifyIdToken(idToken);
        return decodedToken.uid;
    }
    return null;
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
                // You can pre-fill email and other details here
            });
            accountId = account.id;
            await restaurantRef.update({ stripeAccountId: accountId });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
