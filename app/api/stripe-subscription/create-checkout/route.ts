export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { auth } from "firebase-admin";
import Stripe from "stripe";

const PLANS: Record<
  "monthly" | "semiannual" | "annual",
  Stripe.Checkout.SessionCreateParams.LineItem
> = {
  monthly: {
    price_data: {
      currency: "brl",
      product_data: {
        name: "Plano Mensal - Restaurante Digital",
        description: "Assinatura mensal por 1 ano",
      },
      unit_amount: 5990,
      recurring: { interval: "month" },
    },
    quantity: 1,
  },
  semiannual: {
    price_data: {
      currency: "brl",
      product_data: {
        name: "Plano Semestral - Restaurante Digital",
        description: "Assinatura semestral por 1 ano (2 pagamentos)",
      },
      unit_amount: 29940,
      recurring: { interval: "month", interval_count: 6 },
    },
    quantity: 1,
  },
  annual: {
    price_data: {
      currency: "brl",
      product_data: {
        name: "Plano Anual - Restaurante Digital",
        description: "Assinatura anual com pagamento único",
      },
      unit_amount: 54000,
      recurring: { interval: "year" },
    },
    quantity: 1,
  },
};

// Helper for authenticated user
async function getUserId(req: NextRequest) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return null;

    const idToken = authorization.split("Bearer ")[1];
    if (!idToken) return null;

    const decodedToken = await auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}

// Safe JSON parser
async function safeJson<T = any>(req: NextRequest): Promise<T> {
  try {
    return await req.json();
  } catch {
    return {} as T;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserId(req);
    if (!user) {
      console.error("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid: userId, email } = user;

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error("NEXT_PUBLIC_BASE_URL environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const body = await safeJson<{ planId?: keyof typeof PLANS }>(req);
    const planId = body.planId;

    if (!planId || !PLANS[planId]) {
      return NextResponse.json(
        { error: "Plano inválido ou não informado" },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();
    let customerId = userData?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUid: userId },
      });
      customerId = customer.id;
      await adminDb.collection("users").doc(userId).set(
        { stripeCustomerId: customerId, email },
        { merge: true }
      );
    }

    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (existingSubscriptions.data.length > 0) {
      return NextResponse.json(
        { error: "Você já possui uma assinatura ativa" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [PLANS[planId]],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription`,
      metadata: { userId, firebaseUid: userId, planType: planId },
      subscription_data: {
        metadata: { userId, firebaseUid: userId, planType: planId },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to generate checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Unexpected error in checkout creation:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserId(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid: userId } = user;

    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      return NextResponse.json({
        hasSubscription: false,
        status: null,
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: "all",
      limit: 10,
    });

    const activeSubscription = subscriptions.data.find((sub) =>
      ["active", "trialing", "past_due"].includes(sub.status)
    ) as Stripe.Subscription;

    return NextResponse.json({
      hasSubscription: !!activeSubscription,
      status: activeSubscription?.status || null,
      currentPeriodEnd: activeSubscription
        ? new Date(
            (activeSubscription as any).current_period_end * 1000
          ).toISOString()
        : null,
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { error: "Failed to check subscription" },
      { status: 500 }
    );
  }
}
