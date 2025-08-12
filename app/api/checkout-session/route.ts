import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { CartItem, SelectedOptions } from '@/lib/context/CartContext';

interface RequestBody {
    cartItems: CartItem[];
    restaurantId: string; 
    isDelivery: boolean;
    deliveryAddress: string;
}

function createDescriptionFromOptions(options: SelectedOptions): string {
    const parts: string[] = [];
    if (options.size) {
        parts.push(`Tamanho: ${options.size.name}`);
    }
    if (options.addons && options.addons.length > 0) {
        const addonNames = options.addons.map(a => a.name).join(', ');
        parts.push(`Adicionais: ${addonNames}`);
    }
    if (options.stuffedCrust) {
        parts.push(`Borda: ${options.stuffedCrust.name}`);
    }
    return parts.join(' | ');
}

export async function POST(req: NextRequest) {
  try {
    const { cartItems, restaurantId, isDelivery, deliveryAddress } = (await req.json()) as RequestBody;

    if (!cartItems || cartItems.length === 0 || !restaurantId) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }

    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'brl',
        product_data: { 
            name: item.name, 
            images: item.imageUrl ? [item.imageUrl] : [],
            description: createDescriptionFromOptions(item.options) || undefined,
        },
        unit_amount: Math.round(item.finalPrice * 100),
      },
      quantity: item.quantity,
    }));
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cardapay.vercel.app/';
    
    const referer = req.headers.get('referer');
    const restaurantSlug = referer ? new URL(referer).pathname : '/';

    // 1. Criar uma versão "enxuta" do carrinho para economizar espaço nos metadados
    const leanCartForMetadata = cartItems.map(item => ({
      pid: item.productId,
      qty: item.quantity,
      price: item.finalPrice,
      opts: {
        size: item.options.size?.id,
        addons: item.options.addons?.map(a => a.id),
        stuffedCrust: item.options.stuffedCrust?.id,
        notes: item.options.notes || undefined,
      }
    }));

    const cartJson = JSON.stringify(leanCartForMetadata);

    // 2. Preparar o objeto de metadados base
    const metadata: { [key: string]: string } = {
        restaurantId: restaurantId,
        isDelivery: String(isDelivery),
        deliveryAddress: deliveryAddress || 'N/A', // Garante que não seja nulo
    };

    // 3. Lógica para dividir os metadados do carrinho se forem muito grandes
    const MAX_METADATA_VALUE_LENGTH = 490; // Um pouco menos que 500 para segurança
    if (cartJson.length > MAX_METADATA_VALUE_LENGTH) {
        // Divide a string em pedaços
        const chunks = cartJson.match(new RegExp(`.{1,${MAX_METADATA_VALUE_LENGTH}}`, 'g')) || [];
        
        // Limite para não exceder o total de chaves de metadados do Stripe (50)
        if (chunks.length > 10) { 
            throw new Error("O carrinho é muito grande para ser processado. Por favor, divida em pedidos menores.");
        }
        
        // Adiciona cada pedaço como um campo de metadados separado
        chunks.forEach((chunk, index) => {
            metadata[`cartItems_${index}`] = chunk;
        });
        // Guarda o número de pedaços para facilitar a reconstrução depois
        metadata['cartItems_chunks'] = chunks.length.toString(); 
    } else {
        // Se couber, salva em um único campo
        metadata.cartItems = cartJson;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${restaurantSlug}`,
      metadata: metadata, // Usa o objeto de metadados construído
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Erro ao criar a sessão Stripe:', error);
    const errorMessage = error.message.includes("carrinho é muito grande") 
      ? error.message 
      : 'Erro ao criar a sessão de checkout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
