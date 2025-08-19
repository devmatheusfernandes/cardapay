// app/(dashboard)/dashboard/menu/[itemId]/page.tsx
"use client";
import { useState, useEffect, useRef, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useMenu,
  MenuItem,
  MenuItemData,
  MenuTemplate,
  SizeOption,
  StuffedCrustOption,
  DietaryTag,
  SpicinessLevel,
  FlavorOption,
  FlavorCombination,
} from "@/lib/hooks/useMenu";
import {
  LoaderCircle,
  Save,
  Trash2,
  UploadCloud,
  PlusCircle,
  XCircle,
  Copy,
  RotateCcw,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { AddonOption } from "@/lib/hooks/useOrders";

// --- Component Imports ---
import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import ActionButton from "@/app/components/shared/ActionButton";
import BackButton from "@/app/components/shared/BackButton";
import Loading from "@/app/components/shared/Loading";
import Modal from "@/app/components/ui/Modal";

// --- ESTADO INICIAL PARA UM NOVO ITEM ---
const initialItemData: MenuItemData = {
  name: "",
  description: "",
  category: "",
  basePrice: 0,
  sizes: [],
  allowMultipleFlavors: false,
  // New flavor fields
  availableFlavors: [],
  flavorCombinations: [],
  maxFlavors: 4,
  stuffedCrust: { available: false, options: [] },
  addons: [],
  removableIngredients: [],
  suggestedDrinks: [],
  suggestedDesserts: [],
  availability: {
    seg: null,
    ter: null,
    qua: null,
    qui: null,
    sex: null,
    sab: null,
    dom: null,
  },
  stock: null,
  averagePrepTime: 0,
  isDishOfDay: false,
  inStock: true,
  dietaryTags: [],
  spiciness: "nenhum",
  isPopular: false,
};

// --- FUNÇÕES DE LOCAL STORAGE ---
const STORAGE_KEY = "cardapay_menu_item_draft";

const saveToLocalStorage = (data: MenuItemData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Could not save to localStorage:", error);
  }
};

const loadFromLocalStorage = (): MenuItemData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Could not load from localStorage:", error);
    return null;
  }
};

const clearLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Could not clear localStorage:", error);
  }
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function MenuItemFormPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const router = useRouter();
  const { getItemById, saveItem, deleteItem, menuTemplates, saveAsTemplate } =
    useMenu();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemData>(initialItemData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const isNewItem = itemId === "new";

  // --- EFEITO PARA CARREGAR DADOS INICIAIS ---
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
      // Para novos itens, tenta carregar do localStorage
      const savedData = loadFromLocalStorage();
      if (savedData) {
        setFormData(savedData);
        setHasUnsavedChanges(true);
        toast.success("Dados salvos anteriormente foram restaurados!");
      }
      setIsLoading(false);
    }
  }, [itemId, getItemById, isNewItem]);

  // --- EFEITO PARA SALVAR AUTOMATICAMENTE NO LOCAL STORAGE ---
  useEffect(() => {
    if (!isLoading && isNewItem && hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        setIsAutoSaving(true);
        saveToLocalStorage(formData);
        // Simula um pequeno delay para mostrar o indicador
        setTimeout(() => setIsAutoSaving(false), 500);
      }, 1000); // Salva após 1 segundo de inatividade

      return () => clearTimeout(timeoutId);
    }
  }, [formData, isLoading, isNewItem, hasUnsavedChanges]);

  // --- EFEITO PARA DETECTAR MUDANÇAS ---
  useEffect(() => {
    if (!isLoading) {
      setHasUnsavedChanges(true);
    }
  }, [formData, isLoading]);

  // --- EFEITO PARA AVISAR SOBRE MUDANÇAS NÃO SALVAS ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "Você tem alterações não salvas. Tem certeza que quer sair?";
        return "Você tem alterações não salvas. Tem certeza que quer sair?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // --- EFEITO PARA LIMPEZA AO DESMONTAR ---
  useEffect(() => {
    return () => {
      // Se o usuário sair sem salvar, mantém os dados no localStorage
      // Eles serão limpos apenas quando salvar com sucesso ou descartar
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- LÓGICA PARA CARREGAR MODELOS ---
  const loadFromTemplate = (templateId: string) => {
    const template = menuTemplates.find((t) => t.id === templateId);
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
  };

  // --- LÓGICA PARA SUBMETER O FORMULÁRIO ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveItem(itemId, formData, imageFile);
    setIsSaving(false);
    // Limpa o localStorage após salvar com sucesso
    if (isNewItem) {
      clearLocalStorage();
      setHasUnsavedChanges(false);
      toast.success(
        "Item salvo com sucesso! Rascunho removido do armazenamento local."
      );
    }
  };

  // --- LÓGICA PARA DESCARTAR ALTERAÇÕES ---
  const handleDiscard = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      // Se não há mudanças, apenas volta para a página anterior
      router.back();
    }
  };

  const confirmDiscard = () => {
    if (isNewItem) {
      // Para novos itens, limpa o localStorage e reseta o formulário
      clearLocalStorage();
      setFormData(initialItemData);
      setImageFile(null);
      setImagePreview(null);
      setHasUnsavedChanges(false);
      toast.success("Formulário resetado!");
    } else {
      // Para itens existentes, recarrega os dados originais
      if (item) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ownerId, imageUrl, imagePath, ...data } = item;
        setFormData(data);
        setImagePreview(imageUrl || null);
        setImageFile(null);
        setHasUnsavedChanges(false);
        toast.success("Alterações descartadas!");
      }
    }
    setShowDiscardModal(false);
  };

  // --- LÓGICA PARA EXCLUIR ---
  const handleDelete = async () => {
    if (isNewItem || !item) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (item) {
      setIsSaving(true);
      await deleteItem(item);
      // O hook já redireciona
    }
    setShowDeleteModal(false);
  };

  // --- LÓGICA PARA SALVAR COMO MODELO ---
  const handleSaveAsTemplate = async () => {
    setShowSaveTemplateModal(true);
  };

  const confirmSaveAsTemplate = async () => {
    if (templateName.trim()) {
      setIsSaving(true);
      await saveAsTemplate({ ...formData, templateName: templateName.trim() });
      setIsSaving(false);
      setTemplateName("");
      setShowSaveTemplateModal(false);
      toast.success(`Modelo "${templateName.trim()}" salvo com sucesso!`);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SectionContainer>
      <form onSubmit={handleSubmit} className="w-full mx-auto">
        {/* Cabeçalho Fixo */}
        <header className="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 py-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mt-2">
                {isNewItem ? "Adicionar Novo Item" : `Editando: ${item?.name}`}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                {hasUnsavedChanges && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    Alterações não salvas
                  </p>
                )}
                {isAutoSaving && (
                  <p className="text-sm text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Salvando automaticamente...
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isNewItem && (
                <ActionButton
                  label=""
                  onClick={handleDelete}
                  disabled={isSaving}
                  variant="danger"
                  icon={<Trash2 className="w-5 h-5" />}
                />
              )}
              <ActionButton
                label="Descartar"
                onClick={handleDiscard}
                disabled={isSaving}
                variant="secondary"
                icon={<RotateCcw className="w-4 h-4" />}
              />
              <ActionButton
                label="Salvar como Modelo"
                onClick={handleSaveAsTemplate}
                disabled={isSaving}
                variant="warning"
                icon={<Copy className="w-4 h-4" />}
              />
              <ActionButton
                label={isSaving ? "Salvando..." : "Salvar"}
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                icon={<Save className="w-5 h-5" />}
                variant="success"
              />
            </div>
          </div>
        </header>

        <main className="space-y-6">
          {/* --- Card de Carregar Modelo --- */}
          {isNewItem && menuTemplates.length > 0 && (
            <SubContainer variant="white" className="p-6">
              <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-3">
                Comece com um Modelo
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => loadFromTemplate(e.target.value)}
                    className="flex-grow p-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="" disabled>
                      Selecione um modelo para carregar...
                    </option>
                    {menuTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.templateName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </SubContainer>
          )}

          {/* --- Card: Informações Básicas --- */}
          <SubContainer variant="white" className="p-6">
            <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-3">
              1. Informações Básicas
            </h2>
            <div className="space-y-4">
              <ImageUploader
                preview={imagePreview}
                setPreview={setImagePreview}
                setFile={setImageFile}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <InputField
                  label="Nome do Prato"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Categoria"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Ex: Pizza, Lanche, Sobremesa"
                  required
                />
              </div>
              <TextAreaField
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Ingredientes, modo de preparo, etc."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <InputField
                  label="Preço Base (R$)"
                  name="basePrice"
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Preço Promocional (R$)"
                  name="promoPrice"
                  type="number"
                  step="0.01"
                  value={formData.promoPrice || ""}
                  onChange={handleInputChange}
                  placeholder="Deixe em branco se não houver"
                />
              </div>
            </div>
          </SubContainer>

          {/* --- Card: Variações --- */}
          <SubContainer variant="white" className="p-6">
            <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-3">
              2. Variações do Prato
            </h2>
            <div className="space-y-4">
              <DynamicListManager<SizeOption>
                title="Tamanhos"
                items={formData.sizes}
                setItems={(items) =>
                  setFormData((prev) => ({ ...prev, sizes: items }))
                }
                newItemFactory={() => ({ id: uuidv4(), name: "", price: 0 })}
                renderItem={(item, onChange) => (
                  <>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      placeholder="Nome (Ex: Pequena)"
                      className="p-2 border rounded-md w-full"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        onChange("price", parseFloat(e.target.value))
                      }
                      placeholder="Preço"
                      className="p-2 border rounded-md w-full"
                    />
                  </>
                )}
              />
              <CheckboxWithDynamicList<StuffedCrustOption>
                title="Opções da Borda"
                checkboxLabel="Oferece borda recheada?"
                isChecked={formData.stuffedCrust.available}
                setIsChecked={(checked) =>
                  setFormData((p) => ({
                    ...p,
                    stuffedCrust: { ...p.stuffedCrust, available: checked },
                  }))
                }
                items={formData.stuffedCrust.options}
                setItems={(items) =>
                  setFormData((p) => ({
                    ...p,
                    stuffedCrust: { ...p.stuffedCrust, options: items },
                  }))
                }
                newItemFactory={() => ({ id: uuidv4(), name: "", price: 0 })}
                renderItem={(item, onChange) => (
                  <>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      placeholder="Sabor (Ex: Catupiry)"
                      className="p-2 border rounded-md w-full"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        onChange("price", parseFloat(e.target.value))
                      }
                      placeholder="Preço Adicional"
                      className="p-2 border rounded-md w-full"
                    />
                  </>
                )}
              />
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="allowMultipleFlavors"
                    checked={formData.allowMultipleFlavors}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Permitir múltiplos sabores (para pizza, açaí, etc.)
                </label>
              </div>

              {/* Flavor Management Section - Only show when allowMultipleFlavors is true */}
              {formData.allowMultipleFlavors && (
                <div className="mt-6 space-y-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-700">
                      Configuração de Sabores
                    </h3>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-slate-600">
                        Máximo de sabores:
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="8"
                        value={formData.maxFlavors}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            maxFlavors: parseInt(e.target.value) || 4,
                          }))
                        }
                        className="w-16 p-1 border rounded text-center text-sm"
                      />
                    </div>
                  </div>

                  {/* Available Flavors */}
                  <div>
                    <h4 className="text-md font-medium text-slate-600 mb-3">
                      Sabores Disponíveis
                    </h4>
                    <DynamicListManager<FlavorOption>
                      title=""
                      items={formData.availableFlavors}
                      setItems={(items) =>
                        setFormData((prev) => ({
                          ...prev,
                          availableFlavors: items,
                        }))
                      }
                      newItemFactory={() => ({
                        id: uuidv4(),
                        name: "",
                        price: 0,
                        description: "",
                        available: true,
                      })}
                      renderItem={(item, onChange) => (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => onChange("name", e.target.value)}
                            placeholder="Nome do sabor"
                            className="p-2 border rounded-md w-full"
                          />
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              onChange("price", parseFloat(e.target.value) || 0)
                            }
                            placeholder="Preço adicional"
                            className="p-2 border rounded-md w-full"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.description || ""}
                              onChange={(e) =>
                                onChange("description", e.target.value)
                              }
                              placeholder="Descrição (opcional)"
                              className="p-2 border rounded-md w-full"
                            />
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={item.available}
                                onChange={(e) =>
                                  onChange("available", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              Ativo
                            </label>
                          </div>
                        </div>
                      )}
                    />
                  </div>

                  {/* Flavor Combinations */}
                  <div>
                    <h4 className="text-md font-medium text-slate-600 mb-3">
                      Combinações de Sabores (Opcional)
                    </h4>
                    <p className="text-sm text-slate-500 mb-3">
                      Crie combinações pré-definidas para facilitar o pedido dos
                      clientes
                    </p>
                    <DynamicListManager<FlavorCombination>
                      title=""
                      items={formData.flavorCombinations}
                      setItems={(items) =>
                        setFormData((prev) => ({
                          ...prev,
                          flavorCombinations: items,
                        }))
                      }
                      newItemFactory={() => ({
                        id: uuidv4(),
                        name: "",
                        flavors: [],
                        price: 0,
                        description: "",
                      })}
                      renderItem={(item, onChange) => (
                        <div className="space-y-3 p-3 border rounded-lg bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => onChange("name", e.target.value)}
                              placeholder="Nome da combinação (ex: Meia Margherita, Meia Pepperoni)"
                              className="p-2 border rounded-md w-full"
                            />
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                onChange(
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Preço total da combinação"
                              className="p-2 border rounded-md w-full"
                            />
                          </div>
                          <input
                            type="text"
                            value={item.description || ""}
                            onChange={(e) =>
                              onChange("description", e.target.value)
                            }
                            placeholder="Descrição da combinação (opcional)"
                            className="p-2 border rounded-md w-full"
                          />

                          {/* Flavor Selection for Combination */}
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                              Sabores na combinação:
                            </label>
                            <div className="space-y-2">
                              {item.flavors.map(
                                (
                                  flavor: {
                                    flavorId: string;
                                    percentage: number;
                                  },
                                  index: number
                                ) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2"
                                  >
                                    <select
                                      value={flavor.flavorId}
                                      onChange={(e) => {
                                        const newFlavors = [...item.flavors];
                                        newFlavors[index] = {
                                          ...newFlavors[index],
                                          flavorId: e.target.value,
                                        };
                                        onChange("flavors", newFlavors);
                                      }}
                                      className="flex-1 p-2 border rounded-md"
                                    >
                                      <option value="">
                                        Selecione um sabor
                                      </option>
                                      {formData.availableFlavors
                                        .filter((f) => f.available)
                                        .map((flavor) => (
                                          <option
                                            key={flavor.id}
                                            value={flavor.id}
                                          >
                                            {flavor.name}
                                          </option>
                                        ))}
                                    </select>
                                    <input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={flavor.percentage}
                                      onChange={(e) => {
                                        const newFlavors = [...item.flavors];
                                        newFlavors[index] = {
                                          ...newFlavors[index],
                                          percentage:
                                            parseInt(e.target.value) || 0,
                                        };
                                        onChange("flavors", newFlavors);
                                      }}
                                      placeholder="%"
                                      className="w-20 p-2 border rounded-md text-center"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newFlavors = item.flavors.filter(
                                          (_: any, i: number) => i !== index
                                        );
                                        onChange("flavors", newFlavors);
                                      }}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                )
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const newFlavors = [
                                    ...item.flavors,
                                    { flavorId: "", percentage: 0 },
                                  ];
                                  onChange("flavors", newFlavors);
                                }}
                                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
                              >
                                <PlusCircle className="w-4 h-4" />
                                Adicionar sabor
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          </SubContainer>

          {/* --- Card: Complementos e Ingredientes --- */}
          <SubContainer variant="white" className="p-6">
            <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-3">
              3. Complementos e Ingredientes
            </h2>
            <div className="space-y-4">
              <DynamicListManager<AddonOption>
                title="Complementos / Adicionais"
                items={formData.addons}
                setItems={(items) =>
                  setFormData((prev) => ({ ...prev, addons: items }))
                }
                newItemFactory={() => ({ id: uuidv4(), name: "", price: 0 })}
                renderItem={(item, onChange) => (
                  <>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      placeholder="Nome (Ex: Bacon, Ovo)"
                      className="p-2 border rounded-md w-full"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        onChange("price", parseFloat(e.target.value))
                      }
                      placeholder="Preço Adicional"
                      className="p-2 border rounded-md w-full"
                    />
                  </>
                )}
              />
              <DynamicListManager<string>
                title="Ingredientes Removíveis"
                items={formData.removableIngredients}
                setItems={(items) =>
                  setFormData((prev) => ({
                    ...prev,
                    removableIngredients: items,
                  }))
                }
                newItemFactory={() => ""}
                renderItem={(item, onChange) => (
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => onChange(null, e.target.value)}
                    placeholder="Ex: Cebola, Picles"
                    className="p-2 border rounded-md w-full"
                  />
                )}
              />
            </div>
          </SubContainer>

          {/* --- Card: Configurações Avançadas --- */}
          <SubContainer variant="white" className="p-6">
            <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-3">
              4. Configurações Avançadas
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Tempo Médio de Preparo (minutos)"
                  name="averagePrepTime"
                  type="number"
                  value={formData.averagePrepTime}
                  onChange={handleInputChange}
                />
                <InputField
                  label="Quantidade em Estoque"
                  name="stock"
                  type="number"
                  value={formData.stock === null ? "" : formData.stock}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      stock:
                        e.target.value === "" ? null : parseInt(e.target.value),
                    }))
                  }
                  placeholder="Deixe em branco para ilimitado"
                />
              </div>
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="isDishOfDay"
                    checked={formData.isDishOfDay}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Marcar como Prato do Dia / Promoção
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="isPopular"
                    checked={formData.isPopular}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Marcar como "Mais Pedido"
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="inStock"
                    checked={formData.inStock}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Disponível para venda (em estoque)
                </label>
              </div>
            </div>
          </SubContainer>

          {/* --- Card: Etiquetas e Filtros --- */}
          <SubContainer variant="white" className="p-6">
            <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-3">
              5. Etiquetas e Filtros
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Etiquetas de Dieta
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "vegano",
                      "vegetariano",
                      "sem-gluten",
                      "low-carb",
                    ] as DietaryTag[]
                  ).map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center gap-2 capitalize"
                    >
                      <input
                        type="checkbox"
                        checked={formData.dietaryTags.includes(tag)}
                        onChange={(e) => {
                          const newTags = e.target.checked
                            ? [...formData.dietaryTags, tag]
                            : formData.dietaryTags.filter((t) => t !== tag);
                          setFormData((p) => ({ ...p, dietaryTags: newTags }));
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {tag.replace("-", " ")}
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
                    { value: "nenhum", label: "Nenhum" },
                    { value: "leve", label: "Leve" },
                    { value: "médio", label: "Médio" },
                    { value: "forte", label: "Forte" },
                  ]}
                />
              </div>
            </div>
          </SubContainer>
        </main>
      </form>

      {/* Modal de Descarte */}
      <Modal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title="Descartar Alterações"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            {isNewItem
              ? "Tem certeza que quer descartar todas as alterações? O formulário será resetado e os dados não salvos serão perdidos."
              : "Tem certeza que quer descartar todas as alterações? O item voltará ao estado original."}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDiscardModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDiscard}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Exclusão */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Tem certeza que quer excluir o item "{item?.name}"? Esta ação é
            irreversível.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Salvar como Modelo */}
      <Modal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        title="Salvar como Modelo"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Qual o nome deste modelo? (ex: 'Modelo Pizza', 'Modelo Hambúrguer')
          </p>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmSaveAsTemplate();
              }
            }}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Digite o nome do modelo..."
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowSaveTemplateModal(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmSaveAsTemplate}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </SectionContainer>
  );
}

// --- COMPONENTES DE UI INTERNOS (para organização) ---

const InputField = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label
      htmlFor={props.name}
      className="block text-sm font-medium text-slate-700 mb-1"
    >
      {label}
    </label>
    <input
      id={props.name}
      {...props}
      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
    />
  </div>
);

const TextAreaField = ({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="mt-4">
    <label
      htmlFor={props.name}
      className="block text-sm font-medium text-slate-700 mb-1"
    >
      {label}
    </label>
    <textarea
      id={props.name}
      {...props}
      rows={3}
      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
    />
  </div>
);

const SelectField = ({
  label,
  options,
  ...props
}: {
  label: string;
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>
    <label
      htmlFor={props.name}
      className="block text-sm font-medium text-slate-700 mb-1"
    >
      {label}
    </label>
    <select
      id={props.name}
      {...props}
      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const ImageUploader = ({
  preview,
  setPreview,
  setFile,
}: {
  preview: string | null;
  setPreview: (p: string | null) => void;
  setFile: (f: File | null) => void;
}) => {
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
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Imagem do Prato
      </label>
      <div
        className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 cursor-pointer hover:border-emerald-500 hover:text-emerald-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Pré-visualização"
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12" />
            <p>Clique para enviar uma imagem</p>
            <p className="text-xs">PNG, JPG até 5MB</p>
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />
    </div>
  );
};

// Componente Genérico para Listas Dinâmicas (Tamanhos, Adicionais, etc)
type ItemWithValue = { id: string; [key: string]: any } | string;
interface DynamicListManagerProps<T extends ItemWithValue> {
  title: string;
  items: T[];
  setItems: (items: T[]) => void;
  newItemFactory: () => T;
  renderItem: (
    item: T,
    onChange: (field: keyof T | null, value: any) => void
  ) => React.ReactNode;
}
function DynamicListManager<T extends ItemWithValue>({
  title,
  items,
  setItems,
  newItemFactory,
  renderItem,
}: DynamicListManagerProps<T>) {
  const addItem = () => setItems([...items, newItemFactory()]);
  const removeItem = (idToRemove: string) =>
    setItems(
      items.filter((item) =>
        typeof item === "string" ? item !== idToRemove : item.id !== idToRemove
      )
    );

  const updateItem = (
    idToUpdate: string,
    field: keyof T | null,
    value: any
  ) => {
    setItems(
      items.map((item) => {
        const currentId = typeof item === "string" ? item : item.id;
        if (currentId !== idToUpdate) {
          return item;
        }
        if (typeof item === "object" && item !== null && field) {
          return { ...item, [field]: value };
        }
        if (typeof item === "string") {
          return value;
        }
        return item;
      })
    );
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-slate-700">
        {title}
      </label>
      <div className="space-y-2 mt-1">
        {items.map((item) => {
          const id = typeof item === "string" ? item : item.id;
          return (
            <div key={id} className="flex items-center gap-2">
              <div className="flex-grow grid grid-cols-2 gap-2">
                {renderItem(item, (field, value) =>
                  updateItem(id, field, value)
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(id)}
                className="text-red-500 hover:text-red-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800"
      >
        <PlusCircle className="w-4 h-4" /> Adicionar
      </button>
    </div>
  );
}

// Componente para um checkbox que, quando marcado, revela uma lista dinâmica
interface CheckboxWithDynamicListProps<T extends ItemWithValue>
  extends DynamicListManagerProps<T> {
  checkboxLabel: string;
  isChecked: boolean;
  setIsChecked: (checked: boolean) => void;
}
function CheckboxWithDynamicList<T extends ItemWithValue>(
  props: CheckboxWithDynamicListProps<T>
) {
  const { checkboxLabel, isChecked, setIsChecked, ...listProps } = props;
  return (
    <div className="mt-4">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        {checkboxLabel}
      </label>
      {isChecked && (
        <div className="pl-6 mt-2">
          <DynamicListManager {...listProps} />
        </div>
      )}
    </div>
  );
}
