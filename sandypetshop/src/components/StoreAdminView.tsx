import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

export interface StoreAdminProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  rating?: number;
  reviews?: number;
  weight_or_unit?: string;
  image: string;
  alt: string;
  description?: string;
  badge?: string;
  stock?: number;
  is_active: boolean;
  display_order?: number;
}

interface StoreAdminViewProps {
  onBack?: () => void;
}

// Compressão de imagem no client usando HTML5 Canvas (caso passe de 50MB ou para otimização rápida web)
async function compressImageIfNeeded(file: File): Promise<Blob> {
  const FIFTY_MB = 50 * 1024 * 1024;
  const isLarge = file.size > FIFTY_MB;
  
  // Se for maior que 50MB ou para garantir carregamento ultra-rápido, comprime via canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Se a foto tiver dimensões gigantescas (ex: câmera 48MP)
        const maxDim = isLarge ? 1920 : 2560;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        // Qualidade 0.85 em webp ou jpeg
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Imagem original: ${(file.size / 1024 / 1024).toFixed(2)}MB -> Comprimida: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          outputType,
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export const StoreAdminView: React.FC<StoreAdminViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('list');
  const [products, setProducts] = useState<StoreAdminProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  
  // Feedback toast
  const [toast, setToast] = useState<{ show: boolean; title: string; desc: string }>({
    show: false,
    title: '',
    desc: ''
  });

  // Accordion editing ID
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Form State (Novo Produto)
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'saude' | 'mimos' | 'racao'>('mimos');
  const [formPortion, setFormPortion] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState<number>(15);
  const [formDesc, setFormDesc] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formAlt, setFormAlt] = useState('');

  // Edit Inline Form State
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('mimos');
  const [editPortion, setEditPortion] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState<number>(10);
  const [editDesc, setEditDesc] = useState('');
  const [editImage, setEditImage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (title: string, desc: string) => {
    setToast({ show: true, title, desc });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erro ao buscar store_products:', error);
      } else if (data) {
        setProducts(data as StoreAdminProduct[]);
      }
    } catch (err) {
      console.error('Erro na requisição:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Upload handler com compressão para > 50MB e envio ao bucket store_products
  const handleFileUpload = async (file: File, isEdit: boolean = false) => {
    try {
      setUploadingImage(true);
      const compressedBlob = await compressImageIfNeeded(file);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // Usa o bucket dedicado store_products
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('store_products')
        .upload(fileName, compressedBlob, {
          contentType: file.type || 'image/jpeg',
          upsert: true
        });

      if (uploadErr) {
        console.error('Erro no upload para storage:', uploadErr);
        alert(`Erro ao subir imagem: ${uploadErr.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('store_products')
        .getPublicUrl(fileName);

      const uploadedUrl = publicUrlData.publicUrl;

      if (isEdit) {
        setEditImage(uploadedUrl);
      } else {
        setFormImages(prev => [...prev, uploadedUrl]);
      }
      showNotification('Foto Carregada!', 'Imagem salva com sucesso na nuvem ☁️');
    } catch (err: any) {
      console.error('Erro ao processar imagem:', err);
      alert('Falha ao processar e comprimir a imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Novo Produto
  const handleCreateProduct = async () => {
    if (!formName.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }

    const cleanPrice = parseFloat(formPrice.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    if (cleanPrice <= 0) {
      alert('Informe um preço de venda válido.');
      return;
    }

    setSaving(true);
    try {
      const mainImage = formImages[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';
      const newId = `prod-${Date.now()}`;
      const payload = {
        id: newId,
        name: formName.trim(),
        category: formCategory,
        price: cleanPrice,
        rating: 5.0,
        reviews: 0,
        weight_or_unit: formPortion.trim() || null,
        image: mainImage,
        alt: formAlt.trim() || formName.trim(),
        description: formDesc.trim() || null,
        is_active: true,
        display_order: (products.length || 0) + 1
      };

      const { error } = await supabase.from('store_products').insert([payload]);

      if (error) {
        console.error('Erro ao inserir produto:', error);
        alert(`Erro ao salvar produto: ${error.message}`);
      } else {
        showNotification('Sucesso, Lojista!', 'O mimo foi publicado na Sandy\'s Store ✨');
        // Reset form
        setFormName('');
        setFormPortion('');
        setFormPrice('');
        setFormDesc('');
        setFormAlt('');
        setFormImages([]);
        await fetchProducts();
        setActiveTab('list');
      }
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      alert('Erro inesperado ao cadastrar produto.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle do Accordion de Edição
  const toggleEditCard = (prod: StoreAdminProduct) => {
    if (editingCardId === prod.id) {
      setEditingCardId(null);
    } else {
      setEditingCardId(prod.id);
      setEditName(prod.name);
      setEditCategory(prod.category);
      setEditPortion(prod.weight_or_unit || '');
      setEditPrice(prod.price ? prod.price.toFixed(2).replace('.', ',') : '0,00');
      setEditStock(prod.stock ?? 18);
      setEditDesc(prod.description || '');
      setEditImage(prod.image);
    }
  };

  // Salvar Edição em Linha
  const handleSaveEdit = async (productId: string) => {
    const cleanPrice = parseFloat(editPrice.replace(',', '.').replace(/[^\d.]/g, '')) || 0;

    setSaving(true);
    try {
      const updatePayload: any = {
        name: editName.trim(),
        category: editCategory,
        weight_or_unit: editPortion.trim() || null,
        price: cleanPrice,
        description: editDesc.trim() || null,
        image: editImage,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('store_products')
        .update(updatePayload)
        .eq('id', productId);

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        alert(`Erro ao atualizar: ${error.message}`);
      } else {
        showNotification('Alterações Salvas!', 'O produto foi atualizado com sucesso no catálogo ✨');
        setEditingCardId(null);
        await fetchProducts();
      }
    } catch (err: any) {
      console.error('Erro ao salvar edição:', err);
    } finally {
      setSaving(false);
    }
  };

  // Alternar Pausado / Ativo
  const handleToggleActive = async (prod: StoreAdminProduct) => {
    try {
      const nextActive = !prod.is_active;
      const { error } = await supabase
        .from('store_products')
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', prod.id);

      if (!error) {
        showNotification(
          nextActive ? 'Produto Reativado' : 'Produto Pausado',
          nextActive ? 'Item visível para os clientes.' : 'Item ocultado na loja temporariamente.'
        );
        setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, is_active: nextActive } : p));
      }
    } catch (err) {
      console.error('Erro ao alternar status do produto:', err);
    }
  };

  // Excluir Produto
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto do catálogo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('store_products')
        .delete()
        .eq('id', productId);

      if (error) {
        alert(`Erro ao excluir: ${error.message}`);
      } else {
        showNotification('Produto Removido', 'O item foi excluído do catálogo.');
        setEditingCardId(null);
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Header Estilo Boutique Sandy's Store */}
      <header className="flex items-center justify-between pb-4 pt-2 border-b border-pink-100/70 mb-6 relative min-h-[56px]">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3f0019] shadow-sm active:scale-95 transition-transform hover:bg-pink-50 border border-pink-100 flex-shrink-0 z-10"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
        ) : (
          <div className="w-10 h-10 flex-shrink-0" />
        )}

        <div className="flex-1 flex items-center justify-center text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#b50a53] tracking-normal leading-tight" style={{ fontFamily: 'Rochester, cursive' }}>
            Sandy's Store
          </h1>
        </div>

        {/* Espaçador para manter o título perfeitamente centralizado */}
        <div className="w-10 h-10 flex-shrink-0" aria-hidden="true" />
      </header>

      {/* Inputs ocultos para upload de imagem */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0], false);
          }
        }}
      />
      <input
        type="file"
        ref={editFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0], true);
          }
        }}
      />

      {/* Segmented Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-[#ffe8ec] rounded-full shadow-inner mb-6 max-w-md mx-auto w-full">
        <button
          onClick={() => setActiveTab('form')}
          className={`py-2.5 px-4 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${
            activeTab === 'form'
              ? 'bg-[#b50a53] text-white shadow-sm'
              : 'text-[#594045] hover:text-[#b50a53]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          Novo Item
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`py-2.5 px-4 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${
            activeTab === 'list'
              ? 'bg-[#b50a53] text-white shadow-sm'
              : 'text-[#594045] hover:text-[#b50a53]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          Catálogo ({products.length})
        </button>
      </div>

      {/* ═══ ABA: NOVO ITEM (FORMULÁRIO) ═══ */}
      {activeTab === 'form' && (
        <div className="flex flex-col space-y-6 animate-fadeIn">
          {/* Upload de Mídia e Imagens */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[#b50a53] text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  photo_camera
                </span>
                <span className="font-bold text-sm text-[#3f0019]">Fotos do Produto</span>
              </div>
              {uploadingImage && (
                <span className="text-xs text-[#b50a53] font-semibold animate-pulse">
                  Compactando e subindo...
                </span>
              )}
            </div>
            <p className="text-xs text-[#8A5868] leading-tight">
              Adicione fotos com boa iluminação. A foto principal será a vitrine fofa na Sandy's Store!
            </p>

            {/* Grade de Fotos: O botão Adicionar é SEMPRE o primeiro, seguido da Capa e demais fotos */}
            <div className="grid grid-cols-4 gap-3 pt-1">
              {/* 1. Botão Interativo de Adicionar (SEMPRE O PRIMEIRO) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="aspect-square rounded-2xl bg-[#ffe8ec] flex flex-col items-center justify-center text-[#8A5868] hover:text-[#b50a53] hover:bg-[#FCE4EC] transition-colors active:scale-95 border-2 border-dashed border-[#ffd9e0]"
              >
                <span className="material-symbols-outlined text-[24px]">
                  {uploadingImage ? 'sync' : 'add_a_photo'}
                </span>
                <span className="text-[10px] font-bold mt-0.5">
                  {uploadingImage ? 'Subindo...' : 'Adicionar'}
                </span>
              </button>

              {/* 2. Foto de Capa (se carregada) */}
              {formImages[0] ? (
                <div className="relative group aspect-square rounded-2xl overflow-hidden bg-[#FFF0F5] border-2 border-[#b50a53] shadow-sm flex items-center justify-center">
                  <img src={formImages[0]} alt="Capa do Produto" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 inset-x-1 bg-[#b50a53]/90 backdrop-blur-sm rounded-full py-0.5 text-center">
                    <span className="text-white block text-[9px] uppercase tracking-tighter font-bold">Capa 🌟</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormImages(prev => prev.filter((_, idx) => idx !== 0))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="aspect-square rounded-2xl bg-[#fff0f2] flex flex-col items-center justify-center text-[#8A5868]/40 border border-dashed border-[#ffd9e0]/40">
                  <span className="material-symbols-outlined text-[20px]">pets</span>
                  <span className="text-[8px] font-semibold text-[#8A5868]/60 mt-0.5">Capa</span>
                </div>
              )}

              {/* 3. Foto Secundária 1 */}
              {formImages[1] ? (
                <div className="relative group aspect-square rounded-2xl overflow-hidden bg-[#FFF0F5] border border-pink-200 shadow-sm flex items-center justify-center">
                  <img src={formImages[1]} alt="Foto do Produto" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormImages(prev => prev.filter((_, idx) => idx !== 1))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="aspect-square rounded-2xl bg-[#fff0f2] flex flex-col items-center justify-center text-[#8A5868]/40 border border-dashed border-[#ffd9e0]/40">
                  <span className="material-symbols-outlined text-[20px]">pets</span>
                </div>
              )}

              {/* 4. Foto Secundária 2 */}
              {formImages[2] ? (
                <div className="relative group aspect-square rounded-2xl overflow-hidden bg-[#FFF0F5] border border-pink-200 shadow-sm flex items-center justify-center">
                  <img src={formImages[2]} alt="Foto do Produto" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormImages(prev => prev.filter((_, idx) => idx !== 2))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="aspect-square rounded-2xl bg-[#fff0f2] flex flex-col items-center justify-center text-[#8A5868]/40 border border-dashed border-[#ffd9e0]/40">
                  <span className="material-symbols-outlined text-[20px]">pets</span>
                </div>
              )}
            </div>
          </div>

          {/* Dados Básicos */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100/70 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-[#b50a53] text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                edit_note
              </span>
              <span className="font-bold text-sm text-[#3f0019]">Informações Principais</span>
            </div>

            {/* Nome do Produto */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3f0019]">Nome do Produto *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Biscoitinho Artesanal de Frango & Cenoura"
                className="w-full h-12 px-4 rounded-full bg-[#FFF8F9] text-[#3f0019] text-sm placeholder:text-[#8A5868] border border-[#e1bec4] focus:outline-none focus:border-[#b50a53] shadow-inner"
              />
            </div>

            {/* Categorias (Saúde, Mimos, Ração) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3f0019]">Categoria *</label>
              <div className="flex gap-2">
                {[
                  { id: 'saude', label: 'Saúde 🩺' },
                  { id: 'mimos', label: 'Mimos 🎁' },
                  { id: 'racao', label: 'Ração 🥣' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormCategory(cat.id as any)}
                    className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all border ${
                      formCategory === cat.id
                        ? 'bg-[#b50a53] text-white border-[#b50a53] shadow-sm'
                        : 'bg-[#FFF8F9] text-[#594045] border-[#e1bec4] hover:bg-pink-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Porção / Peso */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3f0019]">Porção / Peso (Opcional)</label>
              <input
                type="text"
                value={formPortion}
                onChange={(e) => setFormPortion(e.target.value)}
                placeholder="Ex: Pacote 2.5kg, Frasco 500ml, Tamanho M"
                className="w-full h-12 px-4 rounded-full bg-[#FFF8F9] text-[#3f0019] text-sm placeholder:text-[#8A5868] border border-[#e1bec4] focus:outline-none focus:border-[#b50a53] shadow-inner"
              />
            </div>

            {/* Descrição Amigável */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3f0019]">Descrição</label>
              <textarea
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Conte os encantos e benefícios deste item para os tutores..."
                className="w-full p-3.5 rounded-2xl bg-[#FFF8F9] text-[#3f0019] text-sm placeholder:text-[#8A5868] border border-[#e1bec4] focus:outline-none focus:border-[#b50a53] shadow-inner resize-none"
              />
            </div>
          </div>

          {/* Precificação e Estoque */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100/70 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-[#b50a53] text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                payments
              </span>
              <span className="font-bold text-sm text-[#3f0019]">Valores & Disponibilidade</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3f0019] flex items-center gap-1">
                <span>Preço Venda *</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 font-bold text-sm text-[#b50a53]">R$</span>
                <input
                  type="text"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="28,90"
                  className="w-full h-12 pl-12 pr-4 rounded-full bg-[#FFF8F9] text-[#b50a53] font-bold text-lg tracking-tight border border-[#e1bec4] focus:outline-none focus:border-[#b50a53] shadow-inner"
                />
              </div>
            </div>

            {/* Contador de Estoque */}
            <div className="p-3.5 bg-[#FFF0F5] rounded-2xl flex items-center justify-between border border-[#ffd9e0]/60">
              <div className="flex flex-col">
                <span className="font-bold text-xs text-[#3f0019]">Unidades em Estoque</span>
                <span className="text-[11px] text-[#8A5868]">Disponível para venda na Sandy's Store</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFormStock(Math.max(0, formStock - 1))}
                  className="w-9 h-9 rounded-full bg-white text-[#3f0019] flex items-center justify-center shadow-sm active:scale-90 transition-transform border border-pink-200"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="font-bold text-base text-[#b50a53] w-8 text-center">{formStock}</span>
                <button
                  type="button"
                  onClick={() => setFormStock(formStock + 1)}
                  className="w-9 h-9 rounded-full bg-[#b50a53] text-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleCreateProduct}
              disabled={saving}
              className="w-full h-14 bg-[#b50a53] hover:bg-[#93003f] rounded-full text-white font-bold text-base flex items-center justify-center space-x-2 shadow-lg shadow-[#b50a53]/25 active:scale-98 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">
                {saving ? 'sync' : 'publish'}
              </span>
              <span>{saving ? 'Publicando...' : 'Publicar Produto'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ ABA: CATÁLOGO EXISTENTE ═══ */}
      {activeTab === 'list' && (
        <div className="flex flex-col space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-[#3f0019]">Itens no Catálogo</h2>
              <p className="text-xs text-[#8A5868]">Ajuste rápido de preços, estoque e fotos</p>
            </div>
            <div className="px-3 py-1 bg-[#ffe8ec] rounded-full text-[#b50a53] text-xs font-bold">
              Total: {products.length}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[#8A5868] text-sm">
              Carregando catálogo da Sandy's Store...
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl border border-dashed border-pink-200 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-[#b50a53]">pets</span>
              <p className="text-sm font-semibold text-[#3f0019]">Nenhum produto cadastrado ainda</p>
              <button
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 bg-[#b50a53] text-white rounded-full text-xs font-bold"
              >
                Cadastrar Primeiro Produto
              </button>
            </div>
          ) : (
            products.map((prod) => {
              const isEditing = editingCardId === prod.id;

              return (
                <div
                  key={prod.id}
                  className={`bg-white rounded-2xl shadow-sm transition-all duration-300 overflow-hidden border ${
                    isEditing ? 'border-[#b50a53] ring-2 ring-[#b50a53]/20 shadow-md' : 'border-pink-100/70'
                  } ${!prod.is_active ? 'opacity-70 bg-gray-50' : ''}`}
                >
                  {/* Visualização do Card (Header colapsado) */}
                  <div
                    className="p-3.5 flex items-center space-x-3 cursor-pointer"
                    onClick={() => toggleEditCard(prod)}
                  >
                    <div className="w-16 h-16 rounded-xl bg-[#FFF0F5] overflow-hidden flex-shrink-0 relative border border-pink-100">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          !prod.is_active ? 'grayscale' : ''
                        }`}
                      />
                      <span
                        className={`absolute top-1 left-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          prod.is_active ? 'bg-[#25D366]' : 'bg-[#ba1a1a]'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#b50a53] uppercase tracking-wider">
                          {prod.category === 'saude' ? 'Saúde' : prod.category === 'racao' ? 'Ração' : 'Mimos'}
                        </span>
                        <span className="text-[11px] text-[#8A5868]">
                          {prod.is_active ? `Estoque: ${prod.stock ?? 18} un` : 'Pausado'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#3f0019] truncate">{prod.name}</p>
                      <p className="text-xs text-[#8A5868] truncate">{prod.weight_or_unit || 'Unidade'}</p>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-extrabold text-[#b50a53]">
                          R$ {Number(prod.price).toFixed(2).replace('.', ',')}
                        </span>

                        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleEditCard(prod)}
                            aria-label="Editar Produto"
                            className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                              isEditing
                                ? 'bg-[#b50a53] text-white'
                                : 'bg-[#FFF0F5] text-[#b50a53] hover:bg-[#FCE4EC]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isEditing ? 'close' : 'edit'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(prod)}
                            title={prod.is_active ? 'Pausar item' : 'Reativar item'}
                            className="w-8 h-8 rounded-full bg-[#ffe8ec] text-[#8A5868] flex items-center justify-center active:scale-90 transition-transform hover:text-[#b50a53]"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {prod.is_active ? 'pause' : 'play_arrow'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Painel Expansível de Edição em Linha (Accordion suave) */}
                  {isEditing && (
                    <div className="border-t border-[#ffe8ec] bg-[#FFF0F5]/40 px-4 py-4 space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[#b50a53]">
                          <span className="material-symbols-outlined text-[18px]">edit_note</span>
                          <span className="text-xs font-bold text-[#3f0019]">Edição Rápida do Item</span>
                        </div>
                        <span className="text-[10px] text-[#b50a53] bg-[#ffd9df] px-2 py-0.5 rounded-full font-bold">
                          Editando
                        </span>
                      </div>

                      {/* 1. Preview / Troca rápida de foto */}
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-pink-100">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#FFF0F5] border border-[#b50a53]/20 flex-shrink-0">
                          <img src={editImage || prod.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#3f0019]">Foto de Apresentação</p>
                          <p className="text-[11px] text-[#8A5868]">Substituir capa da vitrine</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-3 py-1.5 bg-[#ffe8ec] rounded-full text-[#b50a53] text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform hover:bg-[#FCE4EC]"
                        >
                          <span className="material-symbols-outlined text-[16px]">change_circle</span>
                          <span>{uploadingImage ? 'Subindo...' : 'Trocar'}</span>
                        </button>
                      </div>

                      {/* 2. Nome do Produto */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#8A5868]">Nome do Produto</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl bg-white text-[#3f0019] text-sm border border-[#e1bec4] focus:border-[#b50a53] focus:outline-none shadow-inner"
                        />
                      </div>

                      {/* 3. Categoria e Porção */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#8A5868]">Categoria</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl bg-white text-[#3f0019] text-xs font-bold border border-[#e1bec4] focus:border-[#b50a53] focus:outline-none shadow-inner"
                          >
                            <option value="saude">Saúde 🩺</option>
                            <option value="mimos">Mimos 🎁</option>
                            <option value="racao">Ração 🥣</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#8A5868]">Porção / Peso</label>
                          <input
                            type="text"
                            value={editPortion}
                            onChange={(e) => setEditPortion(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl bg-white text-[#3f0019] text-sm border border-[#e1bec4] focus:border-[#b50a53] focus:outline-none shadow-inner"
                          />
                        </div>
                      </div>

                      {/* 4. Preço e Estoque */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#8A5868]">Preço (R$)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-[#b50a53] font-bold">R$</span>
                            <input
                              type="text"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full h-11 pl-9 pr-3 rounded-xl bg-white text-[#b50a53] font-bold text-base border border-[#e1bec4] focus:border-[#b50a53] focus:outline-none shadow-inner"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#8A5868]">Estoque (unidades)</label>
                          <div className="flex items-center bg-white rounded-xl border border-[#e1bec4] h-11 px-1.5 justify-between">
                            <button
                              type="button"
                              onClick={() => setEditStock(Math.max(0, editStock - 1))}
                              className="w-8 h-8 rounded-lg bg-[#ffe8ec] flex items-center justify-center text-[#3f0019] active:scale-90 transition-transform"
                            >
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <span className="text-sm text-[#3f0019] font-bold">{editStock}</span>
                            <button
                              type="button"
                              onClick={() => setEditStock(editStock + 1)}
                              className="w-8 h-8 rounded-lg bg-[#b50a53] text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 5. Descrição */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#8A5868]">Descrição do Produto</label>
                        <textarea
                          rows={2}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full p-3 rounded-xl bg-white text-[#3f0019] text-xs border border-[#e1bec4] focus:border-[#b50a53] focus:outline-none shadow-inner resize-none"
                        />
                      </div>

                      {/* 6. Ações Inferiores (Excluir & Concluir Edição) */}
                      <div className="pt-2 flex items-center justify-between gap-3 border-t border-pink-100">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="py-2.5 px-3 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          <span>Excluir Produto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveEdit(prod.id)}
                          disabled={saving}
                          className="flex-1 py-2.5 px-4 rounded-full bg-[#b50a53] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#b50a53]/20 active:scale-95 transition-transform disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          <span>{saving ? 'Salvando...' : 'Concluir Edição'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Botão de Rodapé para Cadastrar Mais um Produto */}
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className="w-full py-3.5 rounded-full bg-[#FCE4EC] text-[#b50a53] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-[#ffd9e4]"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Cadastrar Mais um Produto
          </button>
        </div>
      )}

      {/* Notification Toast Modal */}
      <div
        className={`fixed bottom-6 inset-x-4 max-w-sm mx-auto bg-[#5d132e] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 z-50 transform transition-transform duration-300 pointer-events-none ${
          toast.show ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'
        }`}
      >
        <span className="material-symbols-outlined text-[#25D366] text-[24px]" style={{ fontVariationSettings: '"FILL" 1' }}>
          check_circle
        </span>
        <div className="flex-1">
          <p className="font-bold text-sm">{toast.title}</p>
          <p className="text-xs text-white/80">{toast.desc}</p>
        </div>
      </div>
    </div>
  );
};
