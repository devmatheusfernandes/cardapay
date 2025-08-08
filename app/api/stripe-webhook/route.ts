import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`❌ Webhook signature verification failed: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
        session.id,
        {
          expand: ['line_items.data.price.product'],
        }
      );
      
      const lineItems = sessionWithLineItems.line_items?.data;
      const restaurantId = session.metadata?.restaurantId;

      if (!lineItems || !restaurantId) {
        throw new Error('Required session data not found.');
      }

      const orderData = {
        restaurantId: restaurantId,
        items: lineItems.map(item => {
            const product = item.price?.product as Stripe.Product;
            return {
                name: product.name,
                quantity: item.quantity || 0,
                price: (item.price?.unit_amount || 0) / 100,
            };
        }),
        totalAmount: (session.amount_total || 0) / 100,
        status: 'Pending',
        createdAt: Timestamp.now(),
      };

      // FIX: Use setDoc with the session ID as the document ID
      await adminDb.collection('orders').doc(session.id).set(orderData);
      console.log(`✅ Order ${session.id} created successfully.`);

    } catch (error: any) {
      console.error(`Error handling checkout session: ${error.message}`);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
