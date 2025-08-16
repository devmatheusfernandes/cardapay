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
        const driverId = await getUserId(req);
        if (!driverId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the driver document to verify current status
        const driverRef = adminDb.collection('drivers').doc(driverId);
        const driverDoc = await driverRef.get();

        if (!driverDoc.exists) {
            return NextResponse.json({ error: 'Driver not found.' }, { status: 404 });
        }

        const driverData = driverDoc.data();
        
        // Check if the driver is currently associated with a restaurant
        if (!driverData?.restaurantId) {
            return NextResponse.json({ error: 'Driver is not currently associated with any restaurant.' }, { status: 400 });
        }

        // Remove the driver from the restaurant by setting restaurantId to null
        await driverRef.update({ restaurantId: null });

        return NextResponse.json({ 
            message: 'Successfully removed from restaurant. You can now be associated with a different restaurant.' 
        });

    } catch (error: any) {
        console.error('Error removing driver from restaurant:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to remove from restaurant.' 
        }, { status: 500 });
    }
}
