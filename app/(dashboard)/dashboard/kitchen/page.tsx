'use client';

import { useMemo } from 'react';
import { useOrders, Order, OrderItem } from '@/lib/hooks/useOrders';
import { useMenu, MenuItem } from '@/lib/hooks/useMenu';
import { LoaderCircle, ChefHat, Clock, Truck, Store, User, Check, MessageSquare, Plus, Package, XCircle, HelpCircle, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import TimeAgo from 'react-timeago';
// @ts-ignore
import ptBrStrings from 'react-timeago/lib/language-strings/pt-br';
// @ts-ignore
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';
import SubscriptionGuard from '@/app/components/guards/SubscriptionGuard';

const formatter = buildFormatter(ptBrStrings);


// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function KitchenPage() {
    const { orders, isLoading: isLoadingOrders, updateOrderStatus } = useOrders();
    const { menuItems, isLoading: isLoadingMenu } = useMenu();

    const kitchenOrders = useMemo(() => {
        return orders
            .filter(order => order.status === 'In Progress')
            .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    }, [orders]);

    if (isLoadingOrders || isLoadingMenu) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoaderCircle className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <SubscriptionGuard>
            <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50">
                <div className="flex items-center gap-4 mb-8">
                    <ChefHat className="w-8 h-8 text-slate-700" />
                    <h1 className="text-3xl font-bold text-slate-800">Cozinha</h1>
                </div>

                {kitchenOrders.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center">
                        <div className="text-center">
                            <ChefHat className="mx-auto h-20 w-20 text-slate-300" />
                            <h2 className="mt-4 text-2xl font-semibold text-slate-700">Nenhum pedido na cozinha</h2>
                            <p className="mt-1 text-slate-500">Novos pedidos aparecerão aqui.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {kitchenOrders.map(order => (
                                <KitchenOrderCard 
                                    key={order.id} 
                                    order={order} 
                                    onUpdateStatus={updateOrderStatus}
                                    menuItems={menuItems}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SubscriptionGuard>
    );
}

// --- CARD DE PEDIDO PARA A COZINHA ---
const KitchenOrderCard = ({ order, onUpdateStatus, menuItems }: { order: Order; onUpdateStatus: (id: string, newStatus: Order['status']) => void; menuItems: MenuItem[] }) => {
    
    let nextAction;
    if (order.source === 'waiter') {
        nextAction = { text: 'Pronto para Servir', onClick: () => onUpdateStatus(order.id, 'Ready to Serve'), color: 'bg-green-500 hover:bg-green-600', icon: Check }
    } else if (order.isDelivery) {
        nextAction = { text: 'Pronto para Entrega', onClick: () => onUpdateStatus(order.id, 'Ready for Delivery'), color: 'bg-cyan-500 hover:bg-cyan-600', icon: Truck }
    } else {
        nextAction = { text: 'Pronto para Retirada', onClick: () => onUpdateStatus(order.id, 'Ready for Pickup'), color: 'bg-purple-500 hover:bg-purple-600', icon: Store }
    }

    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-md border border-slate-200 p-4 flex flex-col h-full">
            <div className="flex justify-between items-start">
                <p className="text-lg font-bold text-slate-800">
                    {order.source === 'waiter' ? `Mesa ${order.tableId}` : `Pedido #${order.id.substring(0, 6)}`}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3"/>
                    <TimeAgo date={order.createdAt.toDate()} formatter={formatter} />
                </p>
            </div>
            {order.source === 'waiter' && <div className="mt-1 text-xs font-semibold text-slate-500 flex items-center gap-1.5"><User className="w-3 h-3" /> Pedido do Garçom</div>}

            <div className="my-3 py-3 border-t border-b border-slate-100 space-y-3 text-sm text-slate-700 flex-grow">
                {order.items.map((item, index) => {
                    const fullMenuItem = menuItems.find(mi => mi.id === item.productId);
                    return <OrderItemDetailsResolver key={index} item={item} fullMenuItem={fullMenuItem} orderSource={order.source} />
                })}
            </div>

            <div className="mt-auto">
                <button onClick={nextAction.onClick} className={`w-full flex items-center justify-center gap-2 py-3 px-3 text-sm font-semibold text-white rounded-lg shadow-sm transition ${nextAction.color}`}>
                    <nextAction.icon className="w-4 h-4" />
                    {nextAction.text}
                </button>
            </div>
        </motion.div>
    );
};

// --- COMPONENTE "RESOLVER" PARA EXIBIR OS DETALHES DE CADA ITEM ---
// Componente corrigido para OrderItemDetailsResolver
const OrderItemDetailsResolver = ({
    item,
    fullMenuItem,
    orderSource
}: {
    item: OrderItem;
    fullMenuItem: MenuItem | undefined;
    orderSource?: string;
}) => {

    if (!fullMenuItem) {
        return (
             <div className="border-l-2 border-red-300 pl-3 text-red-600">
                <div className="flex items-center gap-2">
                    <span className="font-bold bg-red-100 px-2 py-0.5 rounded-full text-xs">{item.quantity}x</span>
                    <span className="font-semibold">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs mt-2">
                    <HelpCircle className="w-3 h-3"/> Item não encontrado no cardápio.
                </div>
             </div>
        )
    }

    // --- LÓGICA DE NORMALIZAÇÃO CORRIGIDA ---
    const options = item.options;

    // Normalização do tamanho
    const sizeDetails = item.selectedSize || (options?.size 
        ? fullMenuItem.sizes?.find(s => s.id === options.size) 
        : undefined);

    // CORREÇÃO: Normalização da borda recheada
    // Primeiro, verifica se existe selectedStuffedCrust no item
    let crustDetails = item.selectedStuffedCrust;
    
    // Se não existir, tenta encontrar através das options
    if (!crustDetails && options?.stuffedCrust) {
        // Verifica se stuffedCrust está disponível no item do menu
        if (fullMenuItem.stuffedCrust?.available && fullMenuItem.stuffedCrust.options) {
            crustDetails = fullMenuItem.stuffedCrust.options.find(c => 
                c.id === options.stuffedCrust || c.name === options.stuffedCrust
            );
        }
    }

    // CORREÇÃO: Normalização dos adicionais
    let addonDetails: any[] = [];
    
    // Primeiro, verifica se existe selectedAddons no item
    if (item.selectedAddons && Array.isArray(item.selectedAddons)) {
        addonDetails = item.selectedAddons;
    } 
    // Se não existir, tenta encontrar através das options
    else if (options?.addons && Array.isArray(options.addons)) {
        addonDetails = options.addons
            .map(addonId => fullMenuItem.addons?.find(a => a.id === addonId))
            .filter(Boolean);
    }

    // CORREÇÃO: Normalização dos ingredientes removidos
    let removedIngredients: string[] = [];
    
    // Primeiro, verifica se existe removedIngredients no item
    if (item.removedIngredients && Array.isArray(item.removedIngredients)) {
        removedIngredients = item.removedIngredients;
    }
    // Se não existir, tenta encontrar através das options
    else if (options?.removableIngredients && Array.isArray(options.removableIngredients)) {
        removedIngredients = options.removableIngredients;
    }

    // Normalização das observações
    const notes = item.notes || options?.notes;

    // Verifica se é um item padrão (sem customizações)
    const isStandard = !sizeDetails && 
                       !crustDetails && 
                       (!addonDetails || addonDetails.length === 0) && 
                       (!removedIngredients || removedIngredients.length === 0) && 
                       !notes;

    return (
        <div className="border-l-2 border-indigo-200 pl-3">
            <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-xs">{item.quantity}x</span>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    {orderSource === 'waiter' && item.seat && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">P{item.seat}</span>
                    )}
                </div>
            </div>

            <div className="space-y-1.5 ml-1">
                {isStandard ? (
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        <Check className="w-3 h-3" /> Padrão
                     </span>
                ) : (
                    <>
                        {sizeDetails && (
                            <div className="flex items-center gap-1.5 text-xs">
                                <Package className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                <span className="text-orange-700 font-medium">Tamanho: {sizeDetails.name}</span>
                            </div>
                        )}
                        
                        {/* CORREÇÃO: Exibição da borda recheada */}
                        {crustDetails && (
                             <div className="flex items-center gap-1.5 text-xs">
                                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full border border-yellow-500 flex-shrink-0" />
                                <span className="text-yellow-700 font-medium">Borda: {crustDetails.name}</span>
                             </div>
                        )}
                        
                        {addonDetails && addonDetails.length > 0 && (
                             <div className="text-xs">
                                <span className="text-green-700 font-medium flex items-center gap-1.5">
                                    <Plus className="w-3 h-3 text-green-500" /> Adicionar:
                                </span>
                                <span className="ml-4 text-green-600">{addonDetails.map(a => a?.name).join(', ')}</span>                                
                            </div>
                        )}
                        
                        {removedIngredients && removedIngredients.length > 0 && (
                            <div className="text-xs">
                                <span className="text-red-700 font-medium flex items-center gap-1.5">
                                    <Ban className="w-3 h-3 text-red-500" /> Remover:
                                </span>
                                <span className="ml-4 text-red-600">{removedIngredients.join(', ')}</span>
                            </div>
                        )}
                        
                        {notes && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                                    <div>
                                        <div className="text-xs font-semibold text-blue-700 mb-1">Observações:</div>
                                        <div className="text-xs text-blue-800 leading-relaxed">{notes}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};