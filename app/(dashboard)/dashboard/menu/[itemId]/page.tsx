// app/(dashboard)/dashboard/menu/[itemId]/page.tsx

'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMenu, MenuItem, MenuItemData, MenuTemplate, SizeOption, AddonOption, StuffedCrustOption, DietaryTag, SpicinessLevel } from '@/lib/hooks/useMenu';
import { LoaderCircle, ArrowLeft, Save, Trash2, UploadCloud, PlusCircle, XCircle, Copy } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Instale: npm install uuid @types/uuid
import toast from 'react-hot-toast';

// --- ESTADO INICIAL PARA UM NOVO ITEM ---
const initialItemData: MenuItemData = {
    name: '',
    description: '',
    category: '',
    basePrice: 0,
    sizes: [],
    allowMultipleFlavors: false,
    stuffedCrust: { available: false, options: [] },
    addons: [],
    removableIngredients: [],
    suggestedDrinks: [],
    suggestedDesserts: [],
    availability: { seg: null, ter: null, qua: null, qui: null, sex: null, sab: null, dom: null },
    stock: null,
    averagePrepTime: 0,
    isDishOfDay: false,
    inStock: true,
    dietaryTags: [],
    spiciness: 'nenhum',
    isPopular: false,
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function MenuItemFormPage() {
    const { itemId } = useParams<{ itemId: string }>();
    const router = useRouter();
    const { getItemById, saveItem, deleteItem, menuTemplates, saveAsTemplate } = useMenu();

    const [item, setItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState<MenuItemData>(initialItemData);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const isNewItem = itemId === 'new';

    useEffect(() => {
        if (!isNewItem) {
            const fetchItem = async () => {
                const fetchedItem = await getItemById(itemId);
                if (fetchedItem) {
                    setItem(fetchedItem);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id, ownerId, imageUrl, imagePath, ...data } = fetchedItem;
                    setFormData(data);
                    setImagePreview(imageUrl || null);
                }
                setIsLoading(false);
            };
            fetchItem();
        } else {
            setIsLoading(false);
        }
    }, [itemId, getItemById, isNewItem]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // --- LÓGICA PARA CARREGAR MODELOS ---
    const loadFromTemplate = (templateId: string) => {
        const template = menuTemplates.find(t => t.id === templateId);
        if (!template) return;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ownerId, templateName, ...templateData } = template;
        setFormData({
            ...initialItemData, // Reseta para garantir que não haja lixo de estados anteriores
            ...templateData,
            name: formData.name, // Mantém o nome que o usuário já digitou
            basePrice: formData.basePrice, // Mantém o preço que o usuário já digitou
            inStock: true, // Sempre começa em estoque
        });
        toast.success(`Modelo "${template.templateName}" carregado!`);
    }

    // --- LÓGICA PARA SUBMETER O FORMULÁRIO ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await saveItem(itemId, formData, imageFile);
        setIsSaving(false);
    };

    // --- LÓGICA PARA EXCLUIR ---
    const handleDelete = async () => {
        if (isNewItem || !item) return;
        if (window.confirm(`Tem certeza que quer excluir "${item.name}"?`)) {
            setIsSaving(true);
            await deleteItem(item);
            // O hook já redireciona
        }
    };
    
    // --- LÓGICA PARA SALVAR COMO MODELO ---
    const handleSaveAsTemplate = async () => {
        const templateName = prompt("Qual o nome deste modelo? (ex: 'Modelo Pizza', 'Modelo Hambúrguer')");
        if(templateName) {
            setIsSaving(true);
            await saveAsTemplate({ ...formData, templateName });
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><LoaderCircle className="h-12 w-12 animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                {/* Cabeçalho Fixo */}
                <header className="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 py-4 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                                <ArrowLeft className="w-5 h-5" />
                                Voltar para o Cardápio
                            </button>
                            <h1 className="text-3xl font-bold text-slate-800 mt-2">
                                {isNewItem ? 'Adicionar Novo Item' : `Editando: ${item?.name}`}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isNewItem && (
                                <button type="button" onClick={handleDelete} disabled={isSaving} className="p-2 text-slate-500 hover:text-red-600 transition disabled:opacity-50">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                            <button type="button" onClick={handleSaveAsTemplate} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-500 text-white rounded-lg shadow-md hover:bg-amber-600 transition disabled:opacity-50">
                                <Copy className="w-4 h-4" /> Salvar como Modelo
                            </button>
                            <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400">
                                {isSaving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="space-y-6">
                    {/* --- Card de Carregar Modelo --- */}
                    {isNewItem && menuTemplates.length > 0 && (
                        <Card title="Comece com um Modelo">
                           <div className="flex items-center gap-2">
                               <select 
                                 defaultValue=""
                                 onChange={(e) => loadFromTemplate(e.target.value)}
                                 className="flex-grow p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                               >
                                 <option value="" disabled>Selecione um modelo para carregar...</option>
                                 {menuTemplates.map(t => <option key={t.id} value={t.id}>{t.templateName}</option>)}
                               </select>
                           </div>
                        </Card>
                    )}
                    
                    {/* --- Card: Informações Básicas --- */}
                    <Card title="1. Informações Básicas">
                        <ImageUploader preview={imagePreview} setPreview={setImagePreview} setFile={setImageFile} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <InputField label="Nome do Prato" name="name" value={formData.name} onChange={handleInputChange} required />
                            <InputField label="Categoria" name="category" value={formData.category} onChange={handleInputChange} placeholder="Ex: Pizza, Lanche, Sobremesa" required />
                        </div>
                        <TextAreaField label="Descrição" name="description" value={formData.description} onChange={handleInputChange} placeholder="Ingredientes, modo de preparo, etc." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <InputField label="Preço Base (R$)" name="basePrice" type="number" step="0.01" value={formData.basePrice} onChange={handleInputChange} required />
                            <InputField label="Preço Promocional (R$)" name="promoPrice" type="number" step="0.01" value={formData.promoPrice || ''} onChange={handleInputChange} placeholder="Deixe em branco se não houver" />
                        </div>
                    </Card>

                    {/* --- Card: Variações --- */}
                    <Card title="2. Variações do Prato">
                        {/* Gerenciador de Tamanhos */}
                        <DynamicListManager<SizeOption>
                            title="Tamanhos"
                            items={formData.sizes}
                            setItems={items => setFormData(prev => ({...prev, sizes: items}))}
                            newItemFactory={() => ({ id: uuidv4(), name: '', price: 0})}
                            renderItem={(item, onChange) => (
                                <>
                                    <input type="text" value={item.name} onChange={e => onChange('name', e.target.value)} placeholder="Nome (Ex: Pequena)" className="p-2 border rounded-md w-full" />
                                    <input type="number" value={item.price} onChange={e => onChange('price', parseFloat(e.target.value))} placeholder="Preço" className="p-2 border rounded-md w-full" />
                                </>
                            )}
                        />
                        {/* Gerenciador de Bordas Recheadas */}
                        <CheckboxWithDynamicList<StuffedCrustOption>
                            title="Opções da Borda"
                            checkboxLabel="Oferece borda recheada?"
                            isChecked={formData.stuffedCrust.available}
                            setIsChecked={checked => setFormData(p => ({...p, stuffedCrust: {...p.stuffedCrust, available: checked}}))}
                            items={formData.stuffedCrust.options}
                            setItems={items => setFormData(p => ({...p, stuffedCrust: {...p.stuffedCrust, options: items}}))}
                            newItemFactory={() => ({ id: uuidv4(), name: '', price: 0})}
                            renderItem={(item, onChange) => (
                                <>
                                    <input type="text" value={item.name} onChange={e => onChange('name', e.target.value)} placeholder="Sabor (Ex: Catupiry)" className="p-2 border rounded-md w-full" />
                                    <input type="number" value={item.price} onChange={e => onChange('price', parseFloat(e.target.value))} placeholder="Preço Adicional" className="p-2 border rounded-md w-full" />
                                </>
                            )}
                        />
                        {/* Outras Variações */}
                        <div className="mt-4">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input type="checkbox" name="allowMultipleFlavors" checked={formData.allowMultipleFlavors} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            Permitir múltiplos sabores (para pizza, açaí, etc.)
                          </label>
                        </div>
                    </Card>

                    {/* --- Card: Complementos e Ingredientes --- */}
                    <Card title="3. Complementos e Ingredientes">
                        {/* Gerenciador de Adicionais */}
                        <DynamicListManager<AddonOption>
                            title="Complementos / Adicionais"
                            items={formData.addons}
                            setItems={items => setFormData(prev => ({...prev, addons: items}))}
                            newItemFactory={() => ({ id: uuidv4(), name: '', price: 0})}
                            renderItem={(item, onChange) => (
                                <>
                                    <input type="text" value={item.name} onChange={e => onChange('name', e.target.value)} placeholder="Nome (Ex: Bacon, Ovo)" className="p-2 border rounded-md w-full" />
                                    <input type="number" value={item.price} onChange={e => onChange('price', parseFloat(e.target.value))} placeholder="Preço Adicional" className="p-2 border rounded-md w-full" />
                                </>
                            )}
                        />
                        {/* Gerenciador de Ingredientes a Remover */}
                        <DynamicListManager<string>
                            title="Ingredientes Removíveis"
                            items={formData.removableIngredients}
                            setItems={items => setFormData(prev => ({...prev, removableIngredients: items}))}
                            newItemFactory={() => ''}
                            renderItem={(item, onChange) => (
                                <input type="text" value={item} onChange={e => onChange(null, e.target.value)} placeholder="Ex: Cebola, Picles" className="p-2 border rounded-md w-full" />
                            )}
                        />
                    </Card>

                    {/* --- Card: Configurações Avançadas --- */}
                    <Card title="4. Configurações Avançadas">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Tempo Médio de Preparo (minutos)" name="averagePrepTime" type="number" value={formData.averagePrepTime} onChange={handleInputChange} />
                        <InputField label="Quantidade em Estoque" name="stock" type="number" value={formData.stock === null ? '' : formData.stock} onChange={e => setFormData(p => ({...p, stock: e.target.value === '' ? null : parseInt(e.target.value)}))} placeholder="Deixe em branco para ilimitado" />
                      </div>
                      <div className="mt-4 space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input type="checkbox" name="isDishOfDay" checked={formData.isDishOfDay} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            Marcar como Prato do Dia / Promoção
                          </label>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input type="checkbox" name="isPopular" checked={formData.isPopular} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            Marcar como "Mais Pedido"
                          </label>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            Disponível para venda (em estoque)
                          </label>
                      </div>
                    </Card>
                    
                    {/* --- Card: Etiquetas e Filtros --- */}
                    <Card title="5. Etiquetas e Filtros">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Etiquetas de Dieta</label>
                          <div className="flex flex-wrap gap-2">
                            {(['vegano', 'vegetariano', 'sem-gluten', 'low-carb'] as DietaryTag[]).map(tag => (
                              <label key={tag} className="flex items-center gap-2 capitalize">
                                <input 
                                  type="checkbox" 
                                  checked={formData.dietaryTags.includes(tag)}
                                  onChange={e => {
                                    const newTags = e.target.checked 
                                      ? [...formData.dietaryTags, tag]
                                      : formData.dietaryTags.filter(t => t !== tag);
                                    setFormData(p => ({...p, dietaryTags: newTags}));
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                {tag.replace('-', ' ')}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4">
                            <SelectField
                                label="Nível de Picância"
                                name="spiciness"
                                value={formData.spiciness}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'nenhum', label: 'Nenhum' },
                                    { value: 'leve', label: 'Leve' },
                                    { value: 'médio', label: 'Médio' },
                                    { value: 'forte', label: 'Forte' },
                                ]}
                            />
                        </div>
                    </Card>

                </main>
            </form>
        </div>
    );
}


// --- COMPONENTES DE UI INTERNOS (para organização) ---

const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-3">{title}</h2>
        <div className="space-y-4">{children}</div>
    </div>
);

const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input id={props.name} {...props} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
);

const TextAreaField = ({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <div className="mt-4">
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea id={props.name} {...props} rows={3} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
);

const SelectField = ({ label, options, ...props }: { label: string, options: {value: string, label: string}[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <select id={props.name} {...props} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const ImageUploader = ({ preview, setPreview, setFile }: { preview: string | null, setPreview: (p: string | null) => void, setFile: (f: File | null) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Imagem do Prato</label>
            <div
                className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                {preview ? (
                    <img src={preview} alt="Pré-visualização" className="w-full h-full object-cover rounded-md" />
                ) : (
                    <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12" />
                        <p>Clique para enviar uma imagem</p>
                        <p className="text-xs">PNG, JPG até 5MB</p>
                    </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/png, image/jpeg" />
        </div>
    );
};

// Componente Genérico para Listas Dinâmicas (Tamanhos, Adicionais, etc)
type ItemWithValue = { id: string, [key: string]: any } | string;
interface DynamicListManagerProps<T extends ItemWithValue> {
    title: string;
    items: T[];
    setItems: (items: T[]) => void;
    newItemFactory: () => T;
    renderItem: (item: T, onChange: (field: keyof T | null, value: any) => void) => React.ReactNode;
}
function DynamicListManager<T extends ItemWithValue>({ title, items, setItems, newItemFactory, renderItem }: DynamicListManagerProps<T>) {
    const addItem = () => setItems([...items, newItemFactory()]);
    const removeItem = (idToRemove: string) => setItems(items.filter(item => (typeof item === 'string' ? item !== idToRemove : item.id !== idToRemove)));
    
    // --- CÓDIGO MODIFICADO ABAIXO ---
    const updateItem = (idToUpdate: string, field: keyof T | null, value: any) => {
        setItems(items.map(item => {
            // Verifica primeiro se o item é um objeto e se o ID corresponde
            if (typeof item === 'object' && item !== null && 'id' in item && item.id === idToUpdate) {
                return { ...item, [field!]: value };
            }
            // Depois, verifica se é uma string e se corresponde
            if (typeof item === 'string' && item === idToUpdate) {
                return value;
            }
            // Se não for o item a ser atualizado, retorna ele mesmo
            return item;
        }));
    };

    return (
        <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">{title}</label>
            <div className="space-y-2 mt-1">
                {items.map((item) => {
                    const id = typeof item === 'string' ? item : item.id;
                    return (
                        <div key={id} className="flex items-center gap-2">
                            <div className="flex-grow grid grid-cols-2 gap-2">
                                {renderItem(item, (field, value) => updateItem(id, field, value))}
                            </div>
                            <button type="button" onClick={() => removeItem(id)} className="text-red-500 hover:text-red-700">
                                <XCircle className="w-5 h-5"/>
                            </button>
                        </div>
                    );
                })}
            </div>
            <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
                <PlusCircle className="w-4 h-4" /> Adicionar
            </button>
        </div>
    );
}

// Componente para um checkbox que, quando marcado, revela uma lista dinâmica
interface CheckboxWithDynamicListProps<T extends ItemWithValue> extends DynamicListManagerProps<T> {
    checkboxLabel: string;
    isChecked: boolean;
    setIsChecked: (checked: boolean) => void;
}
function CheckboxWithDynamicList<T extends ItemWithValue>(props: CheckboxWithDynamicListProps<T>) {
    const { checkboxLabel, isChecked, setIsChecked, ...listProps } = props;
    return (
        <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={isChecked} onChange={e => setIsChecked(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                {checkboxLabel}
            </label>
            {isChecked && <div className="pl-6 mt-2"><DynamicListManager {...listProps} /></div>}
        </div>
    );
}