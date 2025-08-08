import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

async function getUserId(req: NextRequest) {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await auth().verifyIdToken(idToken); // Fixed typo here
        return decodedToken.uid;
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const driverId = await getUserId(req);
        if (!driverId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { orderId, confirmationCode } = await req.json();
        if (!orderId || !confirmationCode) {
            return NextResponse.json({ error: 'Order ID and code are required.' }, { status: 400 });
        }

        const orderRef = adminDb.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            throw new Error("Pedido não encontrado.");
        }

        const orderData = orderDoc.data();

        if (orderData?.assignedDriverId !== driverId) {
            throw new Error("Você não está autorizado a modificar este pedido.");
        }

        if (orderData?.confirmationCode !== confirmationCode) {
            throw new Error("Código de confirmação inválido.");
        }

        await orderRef.update({ status: 'Completed' });

        return NextResponse.json({ message: 'Entrega confirmada com sucesso!' });

    } catch (error: any) {
        console.error('Error confirming delivery:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
