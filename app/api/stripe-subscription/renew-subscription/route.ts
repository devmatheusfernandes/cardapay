import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { auth as adminAuth } from 'firebase-admin';

async function getUserId(req: NextRequest) {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await adminAuth().verifyIdToken(idToken);
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

        const userDoc = await adminDb.collection('users').doc(userId).get();
        const customerId = userDoc.data()?.stripeCustomerId;

        if (!customerId) {
            throw new Error('Stripe customer ID not found.');
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cardapay.vercel.app';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${appUrl}/dashboard/subscription`,
        });

        return NextResponse.json({ url: portalSession.url });

    } catch (error: any) {
        console.error('Error creating portal session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
