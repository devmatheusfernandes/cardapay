// import { NextRequest, NextResponse } from 'next/server';
// import { headers } from 'next/headers';
// import Stripe from 'stripe';
// import { stripe } from '@/lib/stripe';
// import { adminDb } from '@/lib/firebase-admin';
// import { Timestamp } from 'firebase-admin/firestore';

// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

// export async function POST(req: NextRequest) {
//   const body = await req.text();
//   const signature = (await headers()).get('Stripe-Signature') as string;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
//   } catch (error: any) {
//     console.error(`❌ Webhook signature verification failed: ${error.message}`);
//     return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
//   }

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object as Stripe.Checkout.Session;

//     try {
//       const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items.data.price.product'] });

//       const lineItems = sessionWithLineItems.line_items?.data;
//       const metadata = session.metadata;

//       if (!lineItems || !metadata?.restaurantId) {
//         throw new Error('Required session data not found.');
//       }

//       // Generate confirmation code for delivery orders
//       const isDelivery = metadata.isDelivery === 'true';
//       const confirmationCode = isDelivery
//         ? Math.floor(1000 + Math.random() * 9000).toString()
//         : undefined;

//       const orderData = {
//         restaurantId: metadata.restaurantId,
//         items: lineItems.map(item => {
//             const product = item.price?.product as Stripe.Product;
//             return {
//                 name: product.name,
//                 quantity: item.quantity || 0,
//                 price: (item.price?.unit_amount || 0) / 100,
//             };
//         }),
//         totalAmount: (session.amount_total || 0) / 100,
//         status: 'Pending',
//         createdAt: Timestamp.now(),
//         // Add delivery info
//         isDelivery,
//         deliveryAddress: metadata.deliveryAddress || null,
//         // Add confirmation code for delivery orders
//         confirmationCode,
//       };

//       await adminDb.collection('orders').doc(session.id).set(orderData);
//       console.log(`✅ Order ${session.id} created successfully${confirmationCode ? ` with confirmation code: ${confirmationCode}` : ''}.`);

//     } catch (error: any) {
//       console.error(`Error handling checkout session: ${error.message}`);
//       return new NextResponse('Internal Server Error', { status: 500 });
//     }
//   }

//   return new NextResponse(null, { status: 200 });
// }

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

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

  try {
    switch (event.type) {
      // Handle one-time payments (existing orders)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment") {
          // Handle one-time payment (existing order logic)
          await handleOrderPayment(session);
        } else if (session.mode === "subscription") {
          // Handle subscription checkout completion
          await handleSubscriptionCheckout(session);
        }
        break;
      }

      // Handle subscription lifecycle events
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Check if this invoice is related to a subscription
        if (invoice.lines?.data?.some((line) => line.subscription)) {
          await handleSubscriptionPaymentSucceeded(invoice);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // Check if this invoice is related to a subscription
        if (invoice.lines?.data?.some((line) => line.subscription)) {
          await handleSubscriptionPaymentFailed(invoice);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error(`Error handling webhook event ${event.type}:`, error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}

// Existing order payment handler
async function handleOrderPayment(session: Stripe.Checkout.Session) {
  const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
    session.id,
    {
      expand: ["line_items.data.price.product"],
    }
  );

  const lineItems = sessionWithLineItems.line_items?.data;
  const metadata = session.metadata;

  if (!lineItems || !metadata?.restaurantId) {
    throw new Error("Required session data not found.");
  }

  // Generate confirmation code for delivery orders
  const isDelivery = metadata.isDelivery === "true";
  const confirmationCode = isDelivery
    ? Math.floor(1000 + Math.random() * 9000).toString()
    : undefined;

  const orderData = {
    restaurantId: metadata.restaurantId,
    items: lineItems.map((item) => {
      const product = item.price?.product as Stripe.Product;
      return {
        name: product.name,
        quantity: item.quantity || 0,
        price: (item.price?.unit_amount || 0) / 100,
      };
    }),
    totalAmount: (session.amount_total || 0) / 100,
    status: "Pending",
    createdAt: Timestamp.now(),
    isDelivery,
    deliveryAddress: metadata.deliveryAddress || null,
    confirmationCode,
  };

  await adminDb.collection("orders").doc(session.id).set(orderData);
  console.log(
    `✅ Order ${session.id} created successfully${
      confirmationCode ? ` with confirmation code: ${confirmationCode}` : ""
    }.`
  );
}

// Handle subscription checkout completion
async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    throw new Error("User ID not found in session metadata");
  }

  // The subscription will be handled by the subscription.created event
  console.log(
    `✅ Subscription checkout completed for user ${userId}, session: ${session.id}`
  );
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const usersSnapshot = await adminDb
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .get();

  if (usersSnapshot.empty) {
    throw new Error(`User not found for customer ID: ${customerId}`);
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  // Get current period end from subscription items
  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  const currentPeriodStart =
    subscription.items?.data?.[0]?.current_period_start;

  const subscriptionData = {
    subscriptionStatus: subscription.status,
    stripeSubscriptionId: subscription.id,
    subscriptionStartDate: subscription.start_date
      ? new Date(subscription.start_date * 1000).toISOString()
      : null,
    subscriptionEndDate: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null,
    updatedAt: Timestamp.now(),
  };

  await adminDb.collection("users").doc(userId).update(subscriptionData);
  console.log(`✅ Subscription created for user ${userId}: ${subscription.id}`);
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const usersSnapshot = await adminDb
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .get();

  if (usersSnapshot.empty) {
    throw new Error(`User not found for customer ID: ${customerId}`);
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  // Get current period end from subscription items
  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;

  const subscriptionData = {
    subscriptionStatus: subscription.status,
    subscriptionStartDate: subscription.start_date
      ? new Date(subscription.start_date * 1000).toISOString()
      : null,
    subscriptionEndDate: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null,
    updatedAt: Timestamp.now(),
  };

  await adminDb.collection("users").doc(userId).update(subscriptionData);
  console.log(
    `✅ Subscription updated for user ${userId}: ${subscription.id} - Status: ${subscription.status}`
  );
}

// Handle subscription deleted/canceled
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const usersSnapshot = await adminDb
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .get();

  if (usersSnapshot.empty) {
    throw new Error(`User not found for customer ID: ${customerId}`);
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  // Get current period end from subscription items
  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;

  const subscriptionData = {
    subscriptionStatus: "canceled",
    subscriptionEndDate: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null,
    updatedAt: Timestamp.now(),
  };

  await adminDb.collection("users").doc(userId).update(subscriptionData);
  console.log(
    `✅ Subscription canceled for user ${userId}: ${subscription.id}`
  );
}

// Handle successful subscription payment
async function handleSubscriptionPaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const usersSnapshot = await adminDb
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .get();

  if (usersSnapshot.empty) {
    console.error(`User not found for customer ID: ${customerId}`);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  // Get subscription ID from invoice line items
  const subscriptionId = invoice.lines?.data?.[0]?.subscription as string;

  if (!subscriptionId) {
    console.error(`No subscription ID found in invoice: ${invoice.id}`);
    return;
  }

  // Get the subscription to update period end date
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;

  const subscriptionData = {
    subscriptionStatus: "active",
    subscriptionEndDate: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null,
    updatedAt: Timestamp.now(),
  };

  await adminDb.collection("users").doc(userId).update(subscriptionData);
  console.log(
    `✅ Subscription payment succeeded for user ${userId}: ${subscriptionId}`
  );
}

// Handle failed subscription payment
async function handleSubscriptionPaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const usersSnapshot = await adminDb
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .get();

  if (usersSnapshot.empty) {
    console.error(`User not found for customer ID: ${customerId}`);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  // Get subscription ID from invoice line items
  const subscriptionId = invoice.lines?.data?.[0]?.subscription as string;

  const subscriptionData = {
    subscriptionStatus: "past_due",
    updatedAt: Timestamp.now(),
  };

  await adminDb.collection("users").doc(userId).update(subscriptionData);
  console.log(
    `❌ Subscription payment failed for user ${userId}: ${
      subscriptionId || "unknown"
    }`
  );
}
