import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

// Helper para obter o ID do usuário autenticado a partir do token da sessão
async function getUserId(req: NextRequest) {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        const decodedToken = await auth().verifyIdToken(idToken);
        return decodedToken.uid;
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const restaurantOwnerId = await getUserId(req);
        if (!restaurantOwnerId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { code } = await req.json();
        if (!code) {
            return NextResponse.json({ error: 'Driver code is required.' }, { status: 400 });
        }

        // 1. Encontre o entregador pelo código
        const driversRef = adminDb.collection('drivers');
        const q = driversRef.where('code', '==', code.toUpperCase()).limit(1);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            throw new Error("Nenhum entregador encontrado com este código.");
        }

        const driverDoc = querySnapshot.docs[0];
        const driverData = driverDoc.data();

        if (driverData.restaurantId) {
            throw new Error("Este entregador já está associado a um restaurante.");
        }

        // 2. Associe o entregador ao restaurante
        await driverDoc.ref.update({ restaurantId: restaurantOwnerId });

        return NextResponse.json({ message: `Entregador ${driverData.name} adicionado com sucesso!` });

    } catch (error: any) {
        console.error('Error associating driver:', error);
        return NextResponse.json({ error: error.message || 'Failed to add driver.' }, { status: 500 });
    }
}
