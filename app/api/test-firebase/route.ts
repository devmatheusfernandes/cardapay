import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Testando conexão com Firebase Admin...');
    
    // Teste 1: Verificar se adminDb está disponível
    console.log('🔑 adminDb disponível:', !!adminDb);
    
    // Teste 2: Tentar fazer uma operação simples
    const testDoc = await adminDb.collection("test").doc("connection-test").get();
    console.log('✅ Conexão com Firebase Admin bem-sucedida!');
    
    // Teste 3: Verificar variáveis de ambiente
    const envVars = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID ? 'Presente' : 'Ausente',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'Presente' : 'Ausente',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'Presente' : 'Ausente',
      clientId: process.env.FIREBASE_CLIENT_ID ? 'Presente' : 'Ausente',
      clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL ? 'Presente' : 'Ausente',
    };
    
    console.log('🔧 Variáveis de ambiente:', envVars);
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin funcionando corretamente',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVars
    });
    
  } catch (error: any) {
    console.error('❌ Erro no teste do Firebase Admin:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}
