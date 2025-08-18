# 🐛 Debug: Pedidos não sendo criados na Vercel

## 🔍 **Problema Identificado**

- ✅ Pagamentos funcionam no Stripe
- ❌ Pedidos não são criados na coleção `orders` do Firebase
- ✅ Funciona localmente com CLI do Stripe

## 🛠️ **Passos para Debug**

### **1. Testar Firebase Admin**

Acesse: `https://seu-dominio.vercel.app/api/test-firebase`

**Resultado esperado:**

```json
{
  "success": true,
  "message": "Firebase Admin funcionando corretamente"
}
```

**Se falhar:** Problema com variáveis de ambiente do Firebase

### **2. Testar Criação de Pedidos**

Acesse: `https://seu-dominio.vercel.app/api/test-order-creation`

**Resultado esperado:**

```json
{
  "success": true,
  "message": "Criação de pedidos funcionando corretamente"
}
```

**Se falhar:** Problema com permissões ou configuração do Firestore

### **3. Verificar Logs da Vercel**

1. Dashboard da Vercel → Functions
2. Clique em `/api/stripe-webhook`
3. Verifique os logs após fazer um pedido

**Logs esperados:**

```
🚀 Webhook recebido - Iniciando processamento
✅ Evento Stripe verificado com sucesso: checkout.session.completed
💰 Processando checkout.session.completed
💳 Modo de pagamento: payment - chamando handleOrderPayment
🎯 handleOrderPayment iniciado para sessão: cs_xxx
✅ Pedido salvo com sucesso no Firebase!
```

### **4. Verificar Webhook no Stripe**

1. Dashboard do Stripe → Webhooks
2. Verifique se a URL está correta: `https://seu-dominio.vercel.app/api/stripe-webhook`
3. Clique no webhook → "Recent deliveries"
4. Verifique se há falhas (status 4xx ou 5xx)

## 🚨 **Possíveis Causas**

### **A. Firebase Admin não inicializa**

- Variáveis de ambiente faltando
- Chave privada mal formatada
- Timeout na conexão

### **B. Webhook falha silenciosamente**

- Erro 500 não retornado
- Timeout da função
- Erro na verificação da assinatura

### **C. Metadados corrompidos**

- Carrinho muito grande
- Caracteres especiais
- Limite de metadados do Stripe

## 🔧 **Soluções**

### **1. Verificar Variáveis de Ambiente na Vercel**

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_CLIENT_ID=xxx
FIREBASE_CLIENT_CERT_URL=xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### **2. Verificar Formato da Chave Privada**

A chave deve estar exatamente como no arquivo JSON do Firebase:

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----
```

### **3. Verificar Regras do Firestore**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow write: if true; // Temporariamente para teste
    }
  }
}
```

## 📊 **Monitoramento**

### **Logs Importantes para Observar**

- `🚀 Webhook recebido`
- `✅ Evento Stripe verificado`
- `🎯 handleOrderPayment iniciado`
- `✅ Pedido salvo com sucesso`

### **Indicadores de Problema**

- Logs parando em algum ponto específico
- Erros de Firebase Admin
- Timeouts da função
- Falhas na verificação da assinatura

## 🆘 **Se Nada Funcionar**

1. **Verificar Logs da Vercel** para identificar o ponto exato da falha
2. **Testar Firebase Admin** com a rota de teste
3. **Verificar Webhook Stripe** para falhas de entrega
4. **Comparar variáveis** entre ambiente local e Vercel
5. **Verificar regras do Firestore** para permissões

## 📞 **Próximos Passos**

Após executar os testes:

1. Compartilhe os resultados das rotas de teste
2. Compartilhe os logs da Vercel
3. Compartilhe qualquer erro encontrado
4. Verificaremos a causa raiz do problema
