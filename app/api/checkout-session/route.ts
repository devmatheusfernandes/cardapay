import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

interface RequestBody {
    cartItems: CartItem[];
    restaurantId: string; 
    isDelivery: boolean;
    deliveryAddress: string;
}

export async function POST(req: NextRequest) {
  try {
    const { cartItems, restaurantId, isDelivery, deliveryAddress } = (await req.json()) as RequestBody;

    if (!cartItems || cartItems.length === 0 || !restaurantId) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name, images: item.imageUrl ? [item.imageUrl] : [] },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${req.headers.get('referer')?.split('/').pop() || ''}`,
      metadata: {
        restaurantId: restaurantId,
        isDelivery: String(isDelivery), // Metadata values must be strings
        deliveryAddress: deliveryAddress,
      },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Error creating Stripe session:', error);
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
  }
}
