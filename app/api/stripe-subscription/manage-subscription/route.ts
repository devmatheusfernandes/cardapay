export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticação
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    console.log('Creating portal session for user:', userId);

    // 2. Buscar dados do usuário
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error('User document not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const customerId = userData?.stripeCustomerId;

    if (!customerId) {
      console.error('No Stripe customer ID found for user');
      return NextResponse.json(
        { error: 'No subscription found' }, 
        { status: 400 }
      );
    }

    console.log('Found Stripe customer ID:', customerId);

    // 3. Verificar se o cliente existe no Stripe
    try {
      const customer = await stripe.customers.retrieve(customerId);
      console.log('Stripe customer verified:', customer.id);
    } catch (stripeError) {
      console.error('Stripe customer verification failed:', stripeError);
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // 4. Criar sessão do portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription`
    });

    console.log('Portal session created successfully:', session.url);
    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Error in portal creation:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        error: error.message || 'Failed to create portal session',
        details: error.raw?.message || null
      },
      { status: 500 }
    );
  }
}