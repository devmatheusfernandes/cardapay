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

        const { driverId } = await req.json();
        if (!driverId) {
            return NextResponse.json({ error: 'Driver ID is required.' }, { status: 400 });
        }

        // Get the driver document to verify ownership
        const driverRef = adminDb.collection('drivers').doc(driverId);
        const driverDoc = await driverRef.get();

        if (!driverDoc.exists) {
            return NextResponse.json({ error: 'Driver not found.' }, { status: 404 });
        }

        const driverData = driverDoc.data();
        
        // Verify that the driver belongs to this restaurant
        if (driverData?.restaurantId !== restaurantOwnerId) {
            return NextResponse.json({ error: 'Unauthorized to remove this driver.' }, { status: 403 });
        }

        // Remove the driver from the restaurant by setting restaurantId to null
        await driverRef.update({ restaurantId: null });

        return NextResponse.json({ 
            message: `Driver ${driverData.name} removed from restaurant successfully.` 
        });

    } catch (error: any) {
        console.error('Error removing driver:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to remove driver.' 
        }, { status: 500 });
    }
}
