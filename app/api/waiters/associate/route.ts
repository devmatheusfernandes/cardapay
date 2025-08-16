import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

// Helper para obter o ID do usuário autenticado a partir do token da sessão
async function getUserId(req: NextRequest) {
    console.log('API: getUserId called');
    const authorization = req.headers.get('Authorization');
    console.log('API: Authorization header:', authorization ? 'Present' : 'Missing');
    
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        console.log('API: ID token extracted, length:', idToken.length);
        try {
            const decodedToken = await auth().verifyIdToken(idToken);
            console.log('API: Token verified, user ID:', decodedToken.uid);
            return decodedToken.uid;
        } catch (error) {
            console.error('API: Token verification failed:', error);
            return null;
        }
    }
    console.log('API: No valid authorization header found');
    return null;
}

export async function POST(req: NextRequest) {
    console.log('API: Waiter association request received');
    try {
        const restaurantOwnerId = await getUserId(req);
        console.log('API: Restaurant owner ID:', restaurantOwnerId);
        
        if (!restaurantOwnerId) {
            console.log('API: Unauthorized - no valid user ID');
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { code } = await req.json();
        console.log('API: Waiter code received:', code);
        
        if (!code) {
            console.log('API: No waiter code provided');
            return NextResponse.json({ error: 'Waiter code is required.' }, { status: 400 });
        }

        // 1. Encontre o garçom pelo código
        console.log('API: Searching for waiter with code:', code.toUpperCase());
        const waitersRef = adminDb.collection('waiters');
        const q = waitersRef.where('code', '==', code.toUpperCase()).limit(1);
        const querySnapshot = await q.get();

        console.log('API: Query result - documents found:', querySnapshot.size);

        if (querySnapshot.empty) {
            console.log('API: No waiter found with code:', code);
            throw new Error("Nenhum garçom encontrado com este código.");
        }

        const waiterDoc = querySnapshot.docs[0];
        const waiterData = waiterDoc.data();
        console.log('API: Waiter data found:', waiterData);

        if (waiterData.restaurantId) {
            console.log('API: Waiter already associated with restaurant:', waiterData.restaurantId);
            throw new Error("Este garçom já está associado a um restaurante.");
        }

        // 2. Associe o garçom ao restaurante
        console.log('API: Associating waiter with restaurant:', restaurantOwnerId);
        await waiterDoc.ref.update({ restaurantId: restaurantOwnerId });

        console.log('API: Waiter association successful');
        return NextResponse.json({ message: `Garçom ${waiterData.name} adicionado com sucesso!` });

    } catch (error: any) {
        console.error('API: Error associating waiter:', error);
        return NextResponse.json({ error: error.message || 'Failed to add waiter.' }, { status: 500 });
    }
}
