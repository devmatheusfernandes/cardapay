import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

async function getUserId(req: NextRequest) {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        try {
            const decodedToken = await auth().verifyIdToken(idToken);
            return decodedToken.uid;
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const restaurantOwnerId = await getUserId(req);
        if (!restaurantOwnerId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { waiterId } = await req.json();
        if (!waiterId) {
            return NextResponse.json({ error: 'Waiter ID is required.' }, { status: 400 });
        }

        // Get the waiter document to verify ownership
        const waiterRef = adminDb.collection('waiters').doc(waiterId);
        const waiterDoc = await waiterRef.get();

        if (!waiterDoc.exists) {
            return NextResponse.json({ error: 'Waiter not found.' }, { status: 404 });
        }

        const waiterData = waiterDoc.data();
        
        // Verify that the waiter belongs to this restaurant
        if (waiterData?.restaurantId !== restaurantOwnerId) {
            return NextResponse.json({ error: 'Unauthorized to remove this waiter.' }, { status: 403 });
        }

        // Remove the waiter from the restaurant by setting restaurantId to null
        await waiterRef.update({ restaurantId: null });

        return NextResponse.json({ 
            message: `Waiter ${waiterData.name} removed from restaurant successfully.` 
        });

    } catch (error: any) {
        console.error('Error removing waiter:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to remove waiter.' 
        }, { status: 500 });
    }
}
