import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Testando criação de pedido...');
    
    // Dados de teste
    const testOrderData = {
      restaurantId: "test-restaurant-id",
      items: [
        {
          productId: "test-product-1",
          name: "Produto de Teste",
          quantity: 1,
          price: 25.50,
          options: {}
        }
      ],
      totalAmount: 25.50,
      status: "Pending" as const,
      createdAt: Timestamp.now(),
      isDelivery: false,
      deliveryAddress: null,
      clientId: "test-client-id"
    };
    
    console.log('📝 Dados do pedido de teste:', JSON.stringify(testOrderData, null, 2));
    
    // Tentar salvar o pedido
    const testOrderId = `test-order-${Date.now()}`;
    console.log('💾 Salvando pedido de teste com ID:', testOrderId);
    
    await adminDb.collection("orders").doc(testOrderId).set(testOrderData);
    console.log('✅ Pedido de teste salvo com sucesso!');
    
    // Verificar se foi salvo
    const savedOrder = await adminDb.collection("orders").doc(testOrderId).get();
    console.log('🔍 Pedido salvo existe:', savedOrder.exists);
    
    // Limpar o pedido de teste
    await adminDb.collection("orders").doc(testOrderId).delete();
    console.log('🧹 Pedido de teste removido');
    
    return NextResponse.json({
      success: true,
      message: 'Criação de pedidos funcionando corretamente',
      testOrderId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Erro no teste de criação de pedidos:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
