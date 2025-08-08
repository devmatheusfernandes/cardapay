// app/api/mock/renew-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    // ✅ Parse body
    const body = await req.json();
    const { subscriptionId, planType } = body;

    if (!subscriptionId || !planType) {
      return NextResponse.json(
        { error: 'subscriptionId and planType are required' },
        { status: 400 }
      );
    }

    // ✅ Mock Stripe subscription retrieval
    const subscription: Partial<Stripe.Subscription> = {
      id: subscriptionId,
      customer: 'cus_mock123',
      status: 'active',
     
    };

    // ✅ Ensure current_period_end exists and is a number
    if (
      !('current_period_end' in subscription) ||
      typeof subscription.current_period_end !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid subscription data - missing period end' },
        { status: 400 }
      );
    }

    // ✅ Calculate expiration
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    const now = new Date();
    const daysUntilExpiration = Math.floor(
      (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // ✅ Only allow renewal if expiring in <= 30 days
    if (daysUntilExpiration > 30) {
      return NextResponse.json(
        {
          error: 'Subscription not eligible for renewal yet',
          daysRemaining: daysUntilExpiration,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
        },
        { status: 400 }
      );
    }

    // ✅ Mock renewal session creation
    const mockCheckoutUrl = `https://mock-checkout.stripe.com/session_${Date.now()}`;

    return NextResponse.json({
      message: 'Renewal session created',
      checkoutUrl: mockCheckoutUrl,
      subscriptionId: subscription.id,
      daysUntilExpiration,
    });
  } catch (error) {
    console.error('Error in mock subscription renewal:', error);
    return NextResponse.json(
      { error: 'Failed to process renewal' },
      { status: 500 }
    );
  }
}
