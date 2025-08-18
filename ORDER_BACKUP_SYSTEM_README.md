# 🛡️ Sistema de Backup de Pedidos - CardaPay

## 📋 Visão Geral

O Sistema de Backup de Pedidos é uma solução robusta que garante que todos os pedidos sejam preservados mesmo em caso de falhas durante o processo de checkout. Ele salva automaticamente os dados dos pedidos em **dois locais**:

1. **Local Storage** (navegador do cliente)
2. **Firebase** (coleção `backup_orders`)

## 🎯 Objetivos

- **Recuperação de Pedidos**: Garantir que nenhum pedido seja perdido
- **Suporte ao Cliente**: Permitir que a equipe ajude clientes com problemas
- **Auditoria**: Rastrear todo o processo de pedido
- **Resiliência**: Sistema que funciona mesmo com falhas de rede ou servidor

## 🔄 Como Funciona

### 1. **Antes do Checkout**

```typescript
// Gerar ID único para o pedido
const orderId = uuidv4();

// Criar backup antes de prosseguir
const backupSuccess = await createBackupOrder(
  orderId,
  "pending",
  restaurantId,
  user?.uid,
  cartItems,
  cartTotal,
  isDelivery,
  deliveryAddress
);
```

### 2. **Durante o Checkout**

- O `backupOrderId` é enviado para a API de checkout
- Incluído nos metadados do Stripe
- Preservado durante todo o processo de pagamento

### 3. **Após o Pagamento**

- **Sucesso**: Backup atualizado para status "completed"
- **Falha**: Backup atualizado para status "failed" com detalhes do erro

## 🏗️ Arquitetura

### **Hook: `useOrderBackup`**

```typescript
export const useOrderBackup = () => {
  // Funções principais
  const createBackupOrder = async (...);
  const updateOrderStatus = async (...);
  const markOrderCompleted = async (...);
  const markOrderFailed = async (...);

  // Funções de recuperação
  const getBackupOrders = async (...);
  const getFailedOrders = async (...);
  const exportBackupOrders = async (...);

  return { ... };
};
```

### **Interface: `BackupOrder`**

```typescript
export interface BackupOrder {
  id: string; // ID único do pedido
  sessionId?: string; // ID da sessão Stripe
  restaurantId: string; // ID do restaurante
  clientId?: string; // ID do cliente (se logado)
  items: any[]; // Itens do pedido
  totalAmount: number; // Valor total
  status: "pending" | "processing" | "completed" | "failed" | "backup";
  createdAt: Date; // Data de criação
  isDelivery: boolean; // Se é entrega
  deliveryAddress?: string; // Endereço de entrega
  confirmationCode?: string; // Código de confirmação
  metadata?: {
    // Metadados adicionais
    stripeSessionId?: string;
    paymentIntentId?: string;
    error?: string;
    backupReason?: string;
  };
}
```

## 📁 Estrutura de Arquivos

```
lib/
├── hooks/
│   └── useOrderBackup.ts          # Hook principal do sistema
├── context/
│   └── CartContext.tsx            # Contexto do carrinho (modificado)
└── firebase.ts                     # Configuração do Firebase

app/
├── components/
│   ├── restaurantSlug/
│   │   └── CartSidebar.tsx        # Sidebar do carrinho (modificado)
│   └── shared/
│       └── BackupOrdersManager.tsx # Gerenciador de pedidos de backup
├── api/
│   ├── checkout-session/
│   │   └── route.ts               # API de checkout (modificada)
│   └── stripe-webhook/
│       └── route.ts               # Webhook Stripe (modificado)
└── (dashboard)/
    └── dashboard/
        └── backup-orders/
            └── page.tsx            # Página de pedidos de backup
```

## 🚀 Implementação

### **1. Integração no Carrinho**

```typescript
// CartSidebar.tsx
const handleCheckout = async () => {
  // 1. Gerar ID único
  const orderId = uuidv4();

  // 2. Criar backup
  const backupSuccess = await createBackupOrder(
    orderId,
    "pending",
    restaurantId,
    user?.uid,
    cartItems,
    cartTotal,
    isDelivery,
    deliveryAddress
  );

  // 3. Continuar com checkout
  const response = await fetch("/api/checkout-session", {
    body: JSON.stringify({
      // ... outros dados
      backupOrderId: orderId, // Incluir ID do backup
    }),
  });
};
```

### **2. API de Checkout**

```typescript
// checkout-session/route.ts
export async function POST(req: NextRequest) {
  const { backupOrderId, ...otherData } = await req.json();

  // Incluir no metadata do Stripe
  const metadata = {
    // ... outros metadados
    backupOrderId: backupOrderId, // Para o webhook
  };

  // Criar sessão Stripe
  const session = await stripe.checkout.sessions.create({
    metadata,
    // ... outras configurações
  });
}
```

### **3. Webhook Stripe**

```typescript
// stripe-webhook/route.ts
async function handleOrderPayment(session: Stripe.Checkout.Session) {
  try {
    // ... processar pedido

    // Atualizar backup para "completed"
    if (metadata.backupOrderId) {
      await adminDb
        .collection("backup_orders")
        .doc(metadata.backupOrderId)
        .update({
          status: "completed",
          sessionId: session.id,
          // ... outros dados
        });
    }
  } catch (error) {
    // Atualizar backup para "failed"
    if (metadata.backupOrderId) {
      await adminDb
        .collection("backup_orders")
        .doc(metadata.backupOrderId)
        .update({
          status: "failed",
          error: error.message,
          // ... outros dados
        });
    }
    throw error;
  }
}
```

## 🎨 Interface do Usuário

### **Componente: `BackupOrdersManager`**

- **Visualização**: Lista todos os pedidos de backup
- **Filtros**: Por status, restaurante, cliente
- **Busca**: Por ID, cliente ou itens
- **Ações**: Ver detalhes, exportar, limpar antigos

### **Funcionalidades**

- ✅ **Status em Tempo Real**: Atualização automática de status
- 🔍 **Busca Avançada**: Filtros múltiplos
- 📊 **Visualização Detalhada**: Modal com informações completas
- 📥 **Exportação**: JSON para análise externa
- 🧹 **Limpeza Automática**: Remove backups antigos (>30 dias)

## 🔧 Configuração

### **1. Firebase**

```typescript
// Coleção: backup_orders
// Índices recomendados:
// - restaurantId (ascending)
// - status (ascending)
// - createdAt (descending)
// - clientId (ascending)
```

### **2. Variáveis de Ambiente**

```bash
# Já configuradas no projeto
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_ADMIN_PROJECT_ID=...
```

### **3. Dependências**

```json
{
  "uuid": "^9.0.0",
  "react-hot-toast": "^2.4.1",
  "framer-motion": "^10.16.4"
}
```

## 📊 Status dos Pedidos

| Status       | Descrição             | Cor         | Ação       |
| ------------ | --------------------- | ----------- | ---------- |
| `pending`    | Aguardando pagamento  | 🟡 Amarelo  | Monitorar  |
| `processing` | Processando pagamento | 🔵 Azul     | Aguardar   |
| `completed`  | Pagamento confirmado  | 🟢 Verde    | Finalizado |
| `failed`     | Falha no pagamento    | 🔴 Vermelho | Investigar |
| `backup`     | Backup criado         | ⚪ Cinza    | Verificar  |

## 🚨 Cenários de Falha

### **1. Falha na Criação do Backup**

```typescript
if (!backupSuccess) {
  console.warn("⚠️ Order backup failed, but continuing with checkout");
  toast.warning("⚠️ Backup do pedido falhou, mas continuando...");
  // Continua com checkout mesmo sem backup
}
```

### **2. Falha no Webhook**

```typescript
try {
  // Processar pedido
} catch (error) {
  // Atualizar backup para "failed"
  if (metadata.backupOrderId) {
    await updateBackupStatus(metadata.backupOrderId, "failed", error);
  }
  // Re-lançar erro para retry do Stripe
  throw error;
}
```

### **3. Falha na API de Checkout**

```typescript
try {
  const response = await fetch("/api/checkout-session", {...});
  if (!response.ok) {
    throw new Error("Falha ao criar sessão de checkout");
  }
} catch (error) {
  // Backup já foi criado, pode ser recuperado
  console.error("Checkout failed, but backup exists:", error);
}
```

## 🛠️ Manutenção

### **Limpeza Automática**

```typescript
// Remove backups com mais de 30 dias
const cleanupOldBackups = () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filteredOrders = orders.filter(
    (order) => new Date(order.createdAt) > thirtyDaysAgo
  );
};
```

### **Exportação para Suporte**

```typescript
const exportBackupOrders = () => {
  const orders = getBackupOrders();
  const dataStr = JSON.stringify(orders, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cardapay-backup-orders-${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();
};
```

## 📈 Métricas e Monitoramento

### **Logs Importantes**

```typescript
// ✅ Sucesso
console.log(`✅ Order ${orderId} fully backed up`);
console.log(`✅ Backup order ${backupOrderId} updated to completed`);

// ⚠️ Avisos
console.warn("⚠️ Order backup failed, but continuing with checkout");
console.warn("⚠️ Failed to update backup order, but main order succeeded");

// ❌ Erros
console.error("❌ Failed to backup order:", error);
console.error("❌ Error creating order:", error);
```

### **Indicadores de Saúde**

- **Taxa de Backup**: % de pedidos com backup criado
- **Taxa de Falha**: % de backups que falharam
- **Tempo de Recuperação**: Tempo para resolver problemas
- **Pedidos Órfãos**: Pedidos sem backup correspondente

## 🔒 Segurança

### **1. Autenticação**

- Backup orders só acessíveis por usuários autenticados
- Filtro por `restaurantId` para isolamento
- Validação de permissões no backend

### **2. Dados Sensíveis**

- **NÃO** armazenar dados de cartão
- **NÃO** armazenar senhas
- **SIM** armazenar metadados de pagamento (IDs do Stripe)

### **3. Privacidade**

- Dados do cliente limitados ao necessário
- Limpeza automática de dados antigos
- Exportação controlada para suporte

## 🚀 Próximos Passos

### **Melhorias Futuras**

1. **Notificações**: Alertas para pedidos falhados
2. **Retry Automático**: Tentativas automáticas de recuperação
3. **Dashboard Avançado**: Métricas e análises
4. **Integração com Suporte**: Sistema de tickets
5. **Backup em Nuvem**: Sincronização com serviços externos

### **Monitoramento**

1. **Alertas**: Falhas críticas no sistema
2. **Métricas**: Dashboard de performance
3. **Logs**: Centralização e análise
4. **Health Checks**: Verificações automáticas

## 📞 Suporte

### **Como Usar**

1. Acesse `/dashboard/backup-orders`
2. Visualize todos os pedidos de backup
3. Filtre por status ou busque por termo
4. Exporte dados para análise
5. Gerencie pedidos falhados

### **Solução de Problemas**

1. **Pedido não aparece**: Verificar filtros e busca
2. **Status não atualiza**: Verificar logs do webhook
3. **Exportação falha**: Verificar permissões do navegador
4. **Limpeza não funciona**: Verificar data de criação

---

## 🎉 Conclusão

O Sistema de Backup de Pedidos garante que **nenhum pedido seja perdido**, mesmo em cenários de falha. Ele fornece:

- ✅ **Resiliência**: Sistema que funciona mesmo com problemas
- 🔍 **Rastreabilidade**: Histórico completo de todos os pedidos
- 🛠️ **Suporte**: Ferramentas para ajudar clientes
- 📊 **Visibilidade**: Dashboard completo para monitoramento

Este sistema é essencial para manter a confiança dos clientes e a operação do restaurante, mesmo em situações adversas.
