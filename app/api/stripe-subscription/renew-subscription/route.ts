import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // 2. Get request body
    const body = await req.json();
    const { subscriptionId, planType } = body;

    if (!subscriptionId || !planType) {
      return NextResponse.json(
        { error: 'Subscription ID and plan type are required' },
        { status: 400 }
      );
    }

    // 3. Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const customerId = userData?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No customer record found' },
        { status: 400 }
      );
    }

    // 4. Retrieve the subscription
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } catch {
      return NextResponse.json(
        { error: 'Failed to retrieve subscription' },
        { status: 400 }
      );
    }

    // 5. Verify the subscription belongs to this customer
    if (typeof subscription.customer === 'string'
      ? subscription.customer !== customerId
      : subscription.customer.id !== customerId) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 403 });
    }

    // 6. If canceled → create new subscription checkout
    if (subscription.status === 'canceled') {
      let priceId: string | undefined;
      switch (planType) {
        case 'monthly':
          priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
          break;
        case 'semiannual':
          priceId = process.env.STRIPE_SEMIANNUAL_PRICE_ID;
          break;
        case 'annual':
          priceId = process.env.STRIPE_ANNUAL_PRICE_ID;
          break;
      }

      if (!priceId) {
        return NextResponse.json(
          { error: 'Invalid or unconfigured plan type' },
          { status: 400 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription`,
        metadata: { userId, planType, isRenewal: 'true' },
        subscription_data: { metadata: { userId, planType, isRenewal: 'true' } },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      if (!session.url) {
        return NextResponse.json(
          { error: 'Failed to generate checkout URL' },
          { status: 500 }
        );
      }

      return NextResponse.json({ url: session.url });
    }

    // 7. Check subscription expiration
if (
  !('current_period_end' in subscription) ||
  typeof subscription.current_period_end !== 'number'
) {
  return NextResponse.json(
    { error: 'Invalid subscription data - missing period end' },
    { status: 400 }
  );
}

const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    const daysUntilExpiration = Math.floor(
      (currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration > 30) {
      return NextResponse.json(
        {
          error: 'Subscription is not yet eligible for renewal',
          daysRemaining: daysUntilExpiration,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
        },
        { status: 400 }
      );
    }

    // 8. Ensure subscription has a price ID
    if (!subscription.items?.data?.[0]?.price?.id) {
      return NextResponse.json(
        { error: 'Invalid subscription configuration - no price ID' },
        { status: 400 }
      );
    }

    const priceId = subscription.items.data[0].price.id;

    // 9. Create a renewal checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription`,
      metadata: { userId, planType, isRenewal: 'true', existingSubscriptionId: subscription.id },
      subscription_data: { metadata: { userId, planType, isRenewal: 'true', existingSubscriptionId: subscription.id } },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to generate checkout URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to process renewal',
        details: error.raw?.message || null,
      },
      { status: 500 }
    );
  }
}
