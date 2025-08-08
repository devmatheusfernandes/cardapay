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

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserId(req);
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const restaurantRef = adminDb.collection('restaurants').doc(userId);
        const restaurantDoc = await restaurantRef.get();
        const restaurantData = restaurantDoc.data();

        const accountId = restaurantData?.stripeAccountId;

        if (!accountId) {
            return NextResponse.json({ status: 'not_connected' });
        }

        // Retrieve the full account object from Stripe
        const account = await stripe.accounts.retrieve(accountId);

        return NextResponse.json({
            status: 'connected',
            details_submitted: account.details_submitted,
            payouts_enabled: account.payouts_enabled,
            charges_enabled: account.charges_enabled,
        });

    } catch (error: any) {
        console.error('Error fetching Stripe account status:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
