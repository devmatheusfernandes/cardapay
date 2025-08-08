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

// Helper para pegar o userId autenticado via Bearer token
async function getUserId(req: NextRequest) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    const idToken = authorization.split("Bearer ")[1];
    if (!idToken) {
      return null;
    }

    const decodedToken = await auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Autenticação do usuário
    const user = await getUserId(req);
    if (!user) {
      console.error("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid: userId, email } = user;
    console.log("Creating subscription for user:", userId, email);

    // Verifica variáveis de ambiente
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error("NEXT_PUBLIC_BASE_URL environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Recebe o plano da requisição com tipagem correta
    const body = await req.json();
    const planId = body.planId as keyof typeof PLANS;

    if (!planId || !PLANS[planId]) {
      return NextResponse.json(
        { error: "Plano inválido ou não informado" },
        { status: 400 }
      );
    }

    // Busca dados do usuário no Firestore
    let userData;
    try {
      const userDoc = await adminDb.collection("users").doc(userId).get();
      userData = userDoc.data();
      console.log("User data retrieved:", {
        hasData: !!userData,
        customerId: userData?.stripeCustomerId,
      });
    } catch (error) {
      console.error("Error fetching user data from Firestore:", error);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    let customerId = userData?.stripeCustomerId;

    // Cria cliente no Stripe se não existir
    if (!customerId) {
      try {
        console.log("Creating new Stripe customer for:", email);
        const customer = await stripe.customers.create({
          email,
          metadata: { firebaseUid: userId },
        });
        customerId = customer.id;
        console.log("Created Stripe customer:", customerId);

        await adminDb.collection("users").doc(userId).set(
          {
            stripeCustomerId: customerId,
            email: email,
          },
          { merge: true }
        );
        console.log("Updated user document with Stripe customer ID");
      } catch (error) {
        console.error("Error creating Stripe customer:", error);
        return NextResponse.json(
          { error: "Failed to create customer" },
          { status: 500 }
        );
      }
    }

    // Verifica se já existe assinatura ativa
    try {
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (existingSubscriptions.data.length > 0) {
        console.log(
          "User already has active subscription:",
          existingSubscriptions.data[0].id
        );
        return NextResponse.json(
          { error: "Você já possui uma assinatura ativa" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error checking existing subscriptions:", error);
    }

    // Cria sessão de checkout com base no plano selecionado
    try {
      console.log(
        `Creating Stripe checkout session for customer: ${customerId} with plan: ${planId}`
      );

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [PLANS[planId]],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription`,
        metadata: {
          userId,
          firebaseUid: userId,
          planType: planId,
        },
        subscription_data: {
          trial_period_days: 7, // ✨ Trial period added here
          metadata: {
            userId,
            firebaseUid: userId,
            planType: planId,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: "required",
      });

      console.log("Stripe checkout session created:", session.id);

      if (!session.url) {
        console.error("Stripe session created but no URL returned");
        return NextResponse.json(
          { error: "Failed to generate checkout URL" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        url: session.url,
        sessionId: session.id,
      });
    } catch (stripeError: any) {
      console.error("Stripe error details:", {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param,
      });

      return NextResponse.json(
        { error: "Erro ao processar pagamento. Tente novamente." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unexpected error in checkout creation:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Método GET para verificar status da assinatura
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