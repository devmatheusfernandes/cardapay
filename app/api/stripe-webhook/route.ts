import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Definição de tipo para o item reconstruído do carrinho para clareza
interface ReconstructedCartItem {
  pid: string;
  qty: number;
  price: number;
  opts: {
    size?: string;
    addons?: string[];
    stuffedCrust?: string;
    notes?: string;
  };
}

// Função auxiliar para remover valores undefined recursivamente
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  
  return obj;
}

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

async function handleOrderPayment(session: Stripe.Checkout.Session) {
  try {
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

    // 1. RECONSTRUIR O CARRINHO A PARTIR DOS METADADOS
    let reconstructedCartJson = "";
    if (metadata.cartItems_chunks) {
      const totalChunks = parseInt(metadata.cartItems_chunks, 10);
      for (let i = 0; i < totalChunks; i++) {
        reconstructedCartJson += metadata[`cartItems_${i}`];
      }
    } else if (metadata.cartItems) {
      reconstructedCartJson = metadata.cartItems;
    }

    if (!reconstructedCartJson) {
      throw new Error("Cart items not found in session metadata.");
    }
    
    const reconstructedCart: ReconstructedCartItem[] = JSON.parse(reconstructedCartJson);

    // 2. USAR O CARRINHO RECONSTRUÍDO PARA MONTAR OS ITENS DO PEDIDO
    const orderItems = lineItems.map((lineItem, index) => {
      const product = lineItem.price?.product as Stripe.Product;
      const cartItem = reconstructedCart[index];

      if (!cartItem) {
          throw new Error(`Mismatch between line items and cart metadata at index ${index}.`);
      }

      // Construir o item com valores limpos (sem undefined)
      const item: any = {
        productId: cartItem.pid,
        name: product.name,
        quantity: cartItem.qty,
        price: cartItem.price,
        options: cartItem.opts || {}
      };

      // Só adicionar notes se existir e não for undefined/null/vazio
      if (cartItem?.opts?.notes && 
          cartItem.opts.notes !== undefined && 
          cartItem.opts.notes !== null && 
          cartItem.opts.notes.trim() !== '') {
        item.notes = cartItem.opts.notes.trim();
      }

      return item;
    });
    
    const isDelivery = metadata.isDelivery === "true";
    
    const confirmationCode = isDelivery
      ? Math.floor(1000 + Math.random() * 9000).toString()
      : undefined;

    // Construir orderData
    const orderData: any = {
      restaurantId: metadata.restaurantId,
      items: orderItems,
      totalAmount: (session.amount_total || 0) / 100,
      status: "Pending" as const,
      createdAt: Timestamp.now(),
      isDelivery,
      deliveryAddress: isDelivery ? (metadata.deliveryAddress || null) : null
    };

    // Add client ID if available
    if (metadata.clientId) {
      orderData.clientId = metadata.clientId;
    }

    // Só adicionar confirmationCode se existir
    if (confirmationCode) {
      orderData.confirmationCode = confirmationCode;
    }

    // Remove todos os valores undefined antes de salvar
    const cleanOrderData = removeUndefined(orderData);

    // Tentar salvar o pedido
    await adminDb.collection("orders").doc(session.id).set(cleanOrderData);
    
    const orderType = isDelivery ? "delivery" : "pickup";
    console.log(
      `✅ ${orderType} order ${session.id} created successfully${
        confirmationCode ? ` with confirmation code: ${confirmationCode}` : ""
      }.`
    );

  } catch (error: any) {
    console.error("Error processing order payment:", error);
    
    // Salvar o pagamento que falhou para processamento manual
    await saveFailedPayment(session, error);
    
    // Re-lançar o erro para que o webhook retorne 500
    // Isso fará o Stripe tentar novamente
    throw error;
  }
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

// Adicione essa função para salvar pagamentos que falharam
async function saveFailedPayment(session: Stripe.Checkout.Session, error: any) {
  try {
    const failedPaymentData = {
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      amountTotal: session.amount_total,
      metadata: session.metadata,
      error: error.message,
      status: 'payment_succeeded_order_failed',
      createdAt: Timestamp.now(),
      needsManualProcessing: true
    };

    await adminDb.collection("failed_payments").doc(session.id).set(failedPaymentData);
    console.log(`💾 Failed payment saved for manual processing: ${session.id}`);
  } catch (fallbackError) {
    console.error("CRITICAL: Could not save failed payment data:", fallbackError);
  }
}
