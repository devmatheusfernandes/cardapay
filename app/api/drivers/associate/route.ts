export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

// Get authenticated user's ID from token
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
    const restaurantOwnerId = await getUserId(req);
    if (!restaurantOwnerId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await safeJson<{ code?: string }>(req);
    const code = body.code?.trim();

    if (!code) {
      return NextResponse.json(
        { error: 'Driver code is required.' },
        { status: 400 }
      );
    }

    // 1. Find driver by code
    const driversRef = adminDb.collection('drivers');
    const q = driversRef.where('code', '==', code.toUpperCase()).limit(1);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Nenhum entregador encontrado com este código.' },
        { status: 404 }
      );
    }

    const driverDoc = querySnapshot.docs[0];
    const driverData = driverDoc.data();

    if (driverData.restaurantId) {
      return NextResponse.json(
        { error: 'Este entregador já está associado a um restaurante.' },
        { status: 400 }
      );
    }

    // 2. Associate driver with restaurant
    await driverDoc.ref.update({ restaurantId: restaurantOwnerId });

    return NextResponse.json({
      message: `Entregador ${driverData.name} adicionado com sucesso!`,
    });
  } catch (error: any) {
    console.error('Error associating driver:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add driver.' },
      { status: 500 }
    );
  }
}
