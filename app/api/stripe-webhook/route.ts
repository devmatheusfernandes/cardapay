import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// This tells Next.js to treat this route as a dynamic function
// and not to try and statically analyze it at build time.
export const dynamic = 'force-dynamic';

// FIX: This explicitly tells Vercel's caching layer to never cache this route.
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

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Retrieve the full session object with line items
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
        session.id,
        {
          expand: ['line_items.data.price.product'],
        }
      );
      
      const lineItems = sessionWithLineItems.line_items?.data;

      if (!lineItems) {
        throw new Error('Line items not found in session.');
      }

      // Extract restaurantId from metadata
      const restaurantId = session.metadata?.restaurantId;
      if (!restaurantId) {
        throw new Error('Restaurant ID not found in session metadata.');
      }

      // Format the order data for Firestore
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

      // Create a new order document in Firestore
      await adminDb.collection('orders').add(orderData);
      console.log(`✅ Order created successfully for session: ${session.id}`);

    } catch (error: any) {
      console.error(`Error handling checkout session: ${error.message}`);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
