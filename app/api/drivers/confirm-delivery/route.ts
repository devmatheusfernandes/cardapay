export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

// Helper to get user ID from request token
async function getUserId(req: NextRequest) {
  const authorization = req.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    try {
      const idToken = authorization.split('Bearer ')[1];
      const decodedToken = await auth().verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (err) {
      console.error('Token verification failed:', err);
    }
  }
  return null;
}

// Safe JSON parsing helper
async function safeJson<T = any>(req: NextRequest): Promise<T> {
  try {
    return await req.json();
  } catch {
    return {} as T;
  }
}

export async function POST(req: NextRequest) {
  try {
    const driverId = await getUserId(req);
    if (!driverId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await safeJson<{ orderId?: string; confirmationCode?: string }>(req);
    const orderId = body.orderId?.trim();
    const confirmationCode = body.confirmationCode?.trim();

    if (!orderId || !confirmationCode) {
      return NextResponse.json(
        { error: 'Order ID and code are required.' },
        { status: 400 }
      );
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    const orderData = orderDoc.data();

    if (orderData?.assignedDriverId !== driverId) {
      return NextResponse.json(
        { error: 'Você não está autorizado a modificar este pedido.' },
        { status: 403 }
      );
    }

    if (orderData?.confirmationCode !== confirmationCode) {
      return NextResponse.json(
        { error: 'Código de confirmação inválido.' },
        { status: 400 }
      );
    }

    await orderRef.update({ status: 'Completed' });

    return NextResponse.json({ message: 'Entrega confirmada com sucesso!' });
  } catch (error: any) {
    console.error('Error confirming delivery:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao confirmar a entrega.' },
      { status: 500 }
    );
  }
}
