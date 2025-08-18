import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { auth as adminAuth } from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticar o usuário
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // 2. Buscar o stripeCustomerId no Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const customerId = userData?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: "Cliente Stripe não encontrado para este usuário." },
        { status: 404 }
      );
    }

    // 3. Buscar assinaturas ativas do usuário no Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    const activeSubscription = subscriptions.data.find((sub) =>
      ["active", "trialing", "past_due"].includes(sub.status)
    );

    if (!activeSubscription) {
      return NextResponse.json(
        { error: "Nenhuma assinatura ativa encontrada para este usuário." },
        { status: 404 }
      );
    }

    // 4. Atualizar a assinatura no Stripe para encerrar o trial
    // O 'trial_end: "now"' encerra o período de teste e inicia o ciclo de cobrança.
    await stripe.subscriptions.update(activeSubscription.id, {
      trial_end: "now",
    });

    console.log(`Subscription ${activeSubscription.id} activated immediately for user ${userId}.`);

    return NextResponse.json({ message: "Assinatura ativada com sucesso." });

  } catch (error: any) {
    console.error("Error activating subscription:", error.message);
    return NextResponse.json(
      { error: "Falha ao ativar a assinatura." },
      { status: 500 }
    );
  }
}