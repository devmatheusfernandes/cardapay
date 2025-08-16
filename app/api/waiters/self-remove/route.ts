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
        const waiterId = await getUserId(req);
        if (!waiterId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the waiter document to verify current status
        const waiterRef = adminDb.collection('waiters').doc(waiterId);
        const waiterDoc = await waiterRef.get();

        if (!waiterDoc.exists) {
            return NextResponse.json({ error: 'Waiter not found.' }, { status: 404 });
        }

        const waiterData = waiterDoc.data();
        
        // Check if the waiter is currently associated with a restaurant
        if (!waiterData?.restaurantId) {
            return NextResponse.json({ error: 'Waiter is not currently associated with any restaurant.' }, { status: 400 });
        }

        // Remove the waiter from the restaurant by setting restaurantId to null
        await waiterRef.update({ restaurantId: null });

        return NextResponse.json({ 
            message: 'Successfully removed from restaurant. You can now be associated with a different restaurant.' 
        });

    } catch (error: any) {
        console.error('Error removing waiter from restaurant:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to remove from restaurant.' 
        }, { status: 500 });
    }
}
