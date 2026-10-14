import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  weightOrUnit?: string;
  image: string;
  alt: string;
  description?: string;
  badge?: string;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export const FALLBACK_STORE_PRODUCTS: ProductItem[] = [];

export const STORE_PRODUCTS = FALLBACK_STORE_PRODUCTS;

interface SandysStoreProps {
  onBack: () => void;
  initialTab?: 'produtos' | 'carrinho';
}

export const SandysStore: React.FC<SandysStoreProps> = ({ onBack, initialTab = 'produtos' }) => {
  const [activeTab, setActiveTab] = useState<'produtos' | 'carrinho'>(initialTab);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedItemAnim, setAddedItemAnim] = useState<string | null>(null);
  const [hasAddedItemThisSession, setHasAddedItemThisSession] = useState<boolean>(false);

  // Carregar produtos do Supabase (store_products)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('store_products')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data) {
          const mapped: ProductItem[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            category: row.category,
            price: Number(row.price),
            rating: Number(row.rating || 5.0),
            reviews: Number(row.reviews || 0),
            weightOrUnit: row.weight_or_unit || undefined,
            image: row.image,
            alt: row.alt,
            description: row.description || undefined,
            badge: row.badge || undefined
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.warn('Erro ao carregar store_products do Supabase:', err);
      }
    };

    fetchProducts();
  }, []);

  // Carrinho inicial mantido no localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sandys_store_cart');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('sandys_store_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Atualizar tab se initialTab mudar
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Sincronizar URL dedicada (/loja vs /carrinho) e suportar botão voltar/avançar nativo
  useEffect(() => {
    const handlePop = () => {
      const p = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (p === '/carrinho') {
        setActiveTab('carrinho');
      } else if (p === '/loja' || p === '/store' || p === '/produtos') {
        setActiveTab('produtos');
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const handleSwitchTab = (tab: 'produtos' | 'carrinho') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const targetUrl = tab === 'carrinho' ? '/carrinho' : '/loja';
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
    }
  };

  // Botão de voltar: se estiver no carrinho, volta para a loja. Se estiver na loja, volta para a tela inicial.
  const handleHeaderBack = () => {
    if (activeTab === 'carrinho') {
      handleSwitchTab('produtos');
    } else {
      onBack();
    }
  };

  const categories = [
    { id: 'todos', label: 'Todos', icon: 'auto_awesome', isEmoji: false },
    { id: 'saude', label: 'Saúde', icon: '🩺', isEmoji: true },
    { id: 'mimos', label: 'Mimos', icon: '🎁', isEmoji: true },
    { id: 'racao', label: 'Ração', icon: '🥣', isEmoji: true }
  ];

  const filteredProducts = products.filter(product => {
    const matchesCat = selectedCategory === 'todos' || product.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: ProductItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setAddedItemAnim(product.id);
    setHasAddedItemThisSession(true);
    setTimeout(() => {
      setAddedItemAnim(null);
    }, 1400);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const total = subtotal;

  // Montagem da mensagem formatada e elegante para o WhatsApp
  const generateWhatsAppMessage = () => {
    const lines: string[] = [];
    lines.push('🐾 *Olá, equipe Sandy\'s Store!*');
    lines.push('Gostaria de confirmar meu pedido com muito carinho:');
    lines.push('');
    lines.push('🛍️ *Itens Selecionados:*');
    
    cart.forEach(item => {
      const itemSubtotal = (item.product.price * item.quantity).toFixed(2).replace('.', ',');
      lines.push(`• *${item.quantity}x* ${item.product.name} (R$ ${itemSubtotal})`);
    });

    lines.push('');
    lines.push(`💰 *Total:* R$ ${total.toFixed(2).replace('.', ',')}`);
    lines.push('');
    lines.push('Aguardando a confirmação e dados para pagamento (PIX / Cartão)! 💕');
    return lines.join('\n');
  };

  const confirmWhatsAppSend = async () => {
    if (cart.length === 0) {
      alert('Seu carrinho está vazio! Adicione alguns mimos antes de finalizar.');
      return;
    }
    const phone = '5511994580316';
    const text = encodeURIComponent(generateWhatsAppMessage());
    const url = `https://wa.me/${phone}?text=${text}`;

    // Registrar pedido no Supabase para histórico administrativo
    try {
      await supabase.from('store_orders').insert({
        items: cart.map(i => ({
          id: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity
        })),
        total_items: totalCartCount,
        subtotal: subtotal,
        total: total,
        status: 'pending'
      });
    } catch (err) {
      console.warn('Erro ao salvar pedido na tabela store_orders:', err);
    }

    window.open(url, '_blank');
  };

  return (
    <div className="bg-[#fff8f7] font-['Plus_Jakarta_Sans',sans-serif] text-[#3f0019] antialiased flex flex-col min-h-screen selection:bg-[#ffb1c2] selection:text-[#3f0018]">
      {/* ═══ HEADER FIXO RETRÔ/BOUTIQUE ═══ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#FCE4EC]/95 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(80,7,36,0.06)] border-b border-[#ffd9e0]/40">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto w-full relative min-h-[56px]">
          {/* Botão de Voltar Dinâmico */}
          <button 
            type="button"
            onClick={handleHeaderBack}
            aria-label={activeTab === 'carrinho' ? 'Voltar para a loja' : 'Voltar para a página inicial'} 
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3f0019] shadow-sm active:scale-95 hover:bg-[#ffe8ec] transition-all flex-shrink-0 z-10 border border-[#e1bec4]/40"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>

          {/* Título Sandy's Store usando font-brand */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 cursor-pointer" onClick={() => handleSwitchTab('produtos')}>
            <h1 className="font-brand text-3xl sm:text-4xl text-[#b50a53] tracking-normal leading-tight">
              Sandy's Store
            </h1>
          </div>

          {/* Botão do Carrinho no Topo */}
          <button
            type="button"
            onClick={() => handleSwitchTab(activeTab === 'carrinho' ? 'produtos' : 'carrinho')}
            aria-label="Ver Carrinho"
            className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#b50a53] shadow-sm active:scale-95 hover:bg-[#ffe8ec] transition-all flex-shrink-0 z-10 border border-[#e1bec4]/40"
          >
            <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FB7185] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white min-w-[18px] text-center shadow-xs animate-scaleIn">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ═══ CORPO PRINCIPAL ═══ */}
      <main className="flex flex-col relative w-full pb-32 flex-grow pt-20 max-w-2xl mx-auto">
        {activeTab === 'produtos' ? (
          <div className="flex flex-col w-full px-4 gap-5 animate-fadeIn">
            {/* Barra de Busca */}
            <section className="relative w-full">
              <div className="relative flex items-center w-full">
                <span className="absolute left-4 text-[#8A5868] material-symbols-outlined text-[22px] pointer-events-none">
                  search
                </span>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar rações, brinquedos, petiscos..." 
                  className="w-full h-12 pl-12 pr-12 rounded-full bg-white text-[#3f0019] text-sm placeholder:text-[#8A5868]/70 shadow-[0_4px_16px_-2px_rgba(80,7,36,0.05)] border border-[#e1bec4]/40 focus:outline-none focus:ring-2 focus:ring-[#b50a53]/40 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 w-7 h-7 rounded-full bg-[#FCE4EC] flex items-center justify-center text-[#b50a53] text-xs hover:bg-[#ffb1c2] transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </section>

            {/* Carrossel de Categorias Fofas */}
            <section className="flex flex-col gap-2 -mx-4">
              <div className="px-4 flex items-center justify-between">
                <span className="font-bold text-sm text-[#3f0019]">Categorias Fofas</span>
                <span className="text-xs text-[#8A5868] font-medium">{filteredProducts.length} itens</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto px-4 no-scrollbar py-1">
                {categories.map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-4 h-10 rounded-full font-bold text-xs shadow-xs transition-all active:scale-95 border ${
                        isActive
                          ? 'bg-[#b50a53] text-white border-[#b50a53] shadow-md shadow-[#b50a53]/20'
                          : 'bg-white text-[#8A5868] border-[#e1bec4]/50 hover:bg-[#fff0f2]'
                      }`}
                    >
                      {cat.isEmoji ? (
                        <span>{cat.icon}</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                      )}
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Vitrine de Produtos (Grid 2 colunas) */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-[#3f0019]">Favoritos do Momento</h2>
                  <span className="w-2 h-2 rounded-full bg-[#b50a53] animate-pulse"></span>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center flex flex-col items-center gap-3 border border-[#e1bec4]/40 my-4 shadow-sm">
                  <span className="text-4xl">🐾</span>
                  <p className="font-bold text-[#3f0019]">Nenhum produto encontrado</p>
                  <p className="text-xs text-[#8A5868]">Tente buscar por outro termo ou selecione todas as categorias.</p>
                  <button 
                    onClick={() => { setSelectedCategory('todos'); setSearchQuery(''); }}
                    className="mt-2 px-5 py-2 rounded-full bg-[#FCE4EC] text-[#b50a53] font-bold text-xs"
                  >
                    Ver Todos os Produtos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full">
                  {filteredProducts.map(product => {
                    const isAdded = addedItemAnim === product.id;
                    return (
                      <article 
                        key={product.id}
                        className="flex flex-col justify-between bg-white rounded-3xl p-3 shadow-[0_4px_16px_-2px_rgba(80,7,36,0.06)] border border-[#e1bec4]/30 hover:border-[#b50a53]/40 transition-all hover:shadow-md group"
                      >
                        <div className="relative w-full aspect-square rounded-2xl bg-[#FFF0F5] overflow-hidden mb-2.5">
                          <img 
                            src={product.image} 
                            alt={product.alt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            loading="lazy"
                          />
                        </div>

                        <div className="flex flex-col gap-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-[#3f0019] leading-snug break-words">
                            {product.name}
                          </h3>

                          {product.weightOrUnit && (
                            <span className="text-[10px] text-[#8A5868] line-clamp-1 break-words">
                              {product.weightOrUnit}
                            </span>
                          )}

                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xs text-[#b50a53] font-bold">R$</span>
                            <span className="text-base sm:text-lg text-[#b50a53] font-extrabold tracking-tight">
                              {product.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>

                        {/* ÁREA DE AÇÃO: BOTÃO ADICIONAR E SELETOR DE QUANTIDADE QUE CABE 100% NO MOBILE */}
                        {(() => {
                          const cartItem = cart.find(i => i.product.id === product.id);
                          const quantity = cartItem ? cartItem.quantity : 0;

                          if (quantity === 0) {
                            return (
                              <button 
                                type="button"
                                onClick={() => addToCart(product)}
                                className="mt-3 w-full h-10 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs bg-[#ffe8ec] text-[#b50a53] hover:bg-[#b50a53] hover:text-white"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  add_shopping_cart
                                </span>
                                <span>Adicionar</span>
                              </button>
                            );
                          }

                          return (
                            <div className="mt-3 flex items-center justify-between w-full h-10 bg-[#b50a53] text-white rounded-full px-1.5 shadow-md shadow-[#b50a53]/25 animate-fadeIn">
                              {/* Botão de Diminuir (-) */}
                              <button
                                type="button"
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shadow-xs active:scale-90 transition-all font-bold flex-shrink-0"
                                aria-label="Diminuir quantidade"
                              >
                                <span className="material-symbols-outlined text-[16px]">remove</span>
                              </button>

                              {/* Indicador Central: Apenas o número centralizado */}
                              <div className="flex-1 flex items-center justify-center text-center">
                                <span className="font-extrabold text-sm text-white tracking-wide">
                                  {quantity}
                                </span>
                              </div>

                              {/* Botão de Aumentar (+) */}
                              <button
                                type="button"
                                onClick={() => addToCart(product)}
                                className="w-7 h-7 rounded-full bg-white text-[#b50a53] hover:bg-[#ffe8ec] flex items-center justify-center shadow-xs active:scale-90 transition-all font-bold flex-shrink-0"
                                aria-label="Aumentar quantidade"
                              >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                              </button>
                            </div>
                          );
                        })()}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Rodapé Afetuoso */}
            <footer className="mt-2 py-6 px-4 rounded-3xl bg-[#fff0f2] text-center flex flex-col items-center gap-2 border border-[#ffd9e0]/40">
              <div className="w-10 h-10 rounded-full bg-[#FCE4EC] flex items-center justify-center text-[#b50a53]">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  volunteer_activism
                </span>
              </div>
              <p className="font-bold text-sm text-[#3f0019]">Amor sem limites pelo seu pet</p>
              <p className="text-xs text-[#8A5868] max-w-xs leading-relaxed font-medium">
                Cuidamos do seu melhor amigo como se fosse nosso.
              </p>
            </footer>
          </div>
        ) : (
          /* ═══ TELA DO CARRINHO ═══ */
          <div className="flex flex-col w-full px-4 gap-5 animate-fadeIn">
            {/* Header do Carrinho */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#3f0019] flex items-center gap-2">
                <span>Meu Carrinho</span>
                <span className="text-xs font-bold text-[#b50a53] bg-[#FCE4EC] px-2.5 py-0.5 rounded-full border border-[#ffd9e0]/60">
                  {totalCartCount} {totalCartCount === 1 ? 'item' : 'itens'}
                </span>
              </h2>

              <button 
                onClick={() => handleSwitchTab('produtos')}
                className="text-xs font-bold text-[#b50a53] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Mais produtos
              </button>
            </div>

            {/* Lista de Itens do Carrinho */}
            {cart.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center flex flex-col items-center gap-3 border border-[#e1bec4]/40 shadow-sm">
                <span className="text-5xl">🛍️</span>
                <p className="text-base font-bold text-[#3f0019]">Seu carrinho está vazio</p>
                <p className="text-xs text-[#8A5868] max-w-xs">
                  Que tal escolher alguns mimos deliciosos ou brinquedos fofos para o seu pet?
                </p>
                <button
                  onClick={() => handleSwitchTab('produtos')}
                  className="mt-3 px-6 py-3 rounded-full bg-[#b50a53] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
                >
                  Explorar a Loja Agora 🐾
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cart.map(item => (
                  <div 
                    key={item.product.id}
                    className="bg-white rounded-3xl p-3.5 shadow-sm flex gap-3 items-center border border-[#e1bec4]/30 relative"
                  >
                    <div className="w-20 h-20 bg-[#FFF0F5] rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#ffd9e0]/40">
                      <img 
                        src={item.product.image} 
                        alt={item.product.alt} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h3 className="text-xs sm:text-sm font-bold text-[#3f0019] truncate pr-1">
                          {item.product.name}
                        </h3>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          aria-label="Remover item" 
                          className="text-[#8A5868] hover:text-[#ba1a1a] p-1 rounded-full transition-colors flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>

                      <span className="text-[11px] text-[#8A5868]">
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}R$ {item.product.price.toFixed(2).replace('.', ',')}
                      </span>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-extrabold text-[#b50a53]">
                          R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                        </span>

                        {/* Seletor de Quantidade */}
                        <div className="flex items-center bg-[#fff0f2] rounded-full px-2 py-1 gap-2 border border-[#ffd9e0]/40">
                          <button 
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#3f0019] shadow-xs active:scale-90 transition-transform font-bold"
                          >
                            <span className="material-symbols-outlined text-[14px]">remove</span>
                          </button>
                          <span className="text-xs font-bold text-[#3f0019] w-4 text-center">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded-full bg-[#b50a53] text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform font-bold"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                {/* Resumo Financeiro Aconchegante */}
                <section className="bg-[#FCE4EC]/70 rounded-3xl p-4 flex flex-col gap-2 border border-[#ffd9e0]/60">
                  <h3 className="font-bold text-sm text-[#3f0019]">Resumo do Pedido</h3>
                  <div className="flex flex-col gap-1 pb-1 text-xs text-[#594045]">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center">
                        <span className="truncate pr-2">{item.quantity}x {item.product.name}</span>
                        <span className="font-bold text-[#3f0019] flex-shrink-0">
                          R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full h-px bg-[#e1bec4]/40 my-0.5"></div>

                  <div className="flex justify-between items-center text-xs text-[#594045]">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="w-full h-px bg-[#e1bec4]/40 my-0.5"></div>

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-extrabold text-base text-[#3f0019]">Total a Pagar</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#b50a53] leading-none">
                        R$ {total.toFixed(2).replace('.', ',')}
                      </span>
                      <p className="text-[10px] text-[#8A5868] mt-0.5">Via PIX ou Cartão no WhatsApp</p>
                    </div>
                  </div>
                </section>

                {/* BOTÃO PRINCIPAL DE DESTAQUE: FINALIZAÇÃO PELO WHATSAPP */}
                <section className="flex flex-col items-center gap-2 pt-1">
                  <button 
                    onClick={confirmWhatsAppSend}
                    className="w-full relative overflow-hidden bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-3xl p-4 shadow-[0_12px_28px_-6px_rgba(37,211,102,0.45)] active:scale-[0.98] transition-all flex items-center justify-between group"
                  >
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 text-left z-10">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 18.04c-1.49 0-2.94-.4-4.22-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.106 8.106 0 0 1-1.25-4.26c0-4.5 3.66-8.16 8.16-8.16 2.18 0 4.23.85 5.77 2.39a8.125 8.125 0 0 1 2.39 5.77c.01 4.5-3.65 8.16-8.06 8.16zm4.47-6.11c-.24-.12-1.45-.72-1.67-.8-.23-.08-.39-.12-.56.12-.17.24-.64.8-.79.96-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.35-1.69-.14-.24-.02-.37.1-.49.11-.11.24-.29.37-.43.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43s-.56-1.35-.77-1.85c-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.22.24-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.45-.59 1.66-1.16.2-.57.2-1.06.14-1.16-.06-.11-.22-.17-.46-.29z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-white tracking-tight leading-tight">
                          Finalizar pelo WhatsApp
                        </span>
                        <span className="text-xs text-white/90">Envie seu pedido diretamente para a Sandy 💕</span>
                      </div>
                    </div>
                    <div className="z-10 bg-white/20 p-2 rounded-full group-hover:translate-x-1 transition-transform">
                      <span className="material-symbols-outlined text-[20px] text-white">arrow_forward</span>
                    </div>
                  </button>

                  <span className="text-xs text-[#8A5868] text-center flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[15px] text-[#25D366]">bolt</span>
                    Atendimento direto pelo WhatsApp da Sandy
                  </span>
                </section>
              </>
            )}
          </div>
        )}
      </main>

      {/* ═══ MINI-CARRINHO FLUTUANTE (APENAS SE O CLIENTE CLICOU EM ADICIONAR E HÁ ITENS) ═══ */}
      {activeTab === 'produtos' && hasAddedItemThisSession && totalCartCount > 0 && (
        <aside className="fixed bottom-20 inset-x-4 z-40 max-w-lg mx-auto transition-all duration-300 animate-slideUp">
          <div className="flex items-center justify-between p-3 pl-4 rounded-full bg-[#3f0019] text-white shadow-[0_12px_32px_-4px_rgba(80,7,36,0.35)] backdrop-blur-md border border-[#ffd9df]/20">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#b50a53] text-white">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                <span className="absolute -top-1 -right-1 bg-[#FB7185] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-[#3f0019]">
                  {totalCartCount}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#ffcdd7]">{totalCartCount} {totalCartCount === 1 ? 'mimo' : 'mimos'} no carrinho</span>
                <span className="text-sm text-white font-extrabold tracking-tight">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
            <button 
              onClick={() => handleSwitchTab('carrinho')}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#b50a53] hover:bg-[#d72f6b] text-white font-bold text-xs active:scale-95 transition-all shadow-sm"
            >
              <span>Ver Carrinho</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </aside>
      )}

      {/* ═══ BARRA DE NAVEGAÇÃO INFERIOR FIXA DA LOJA (Apenas Loja e Carrinho) ═══ */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-4px_20px_0_rgba(80,7,36,0.08)] border-t border-[#ffd9e0]/40">
        <div className="flex justify-around items-center h-16 max-w-sm mx-auto px-6">
          {/* Aba Loja */}
          <button 
            type="button"
            onClick={() => handleSwitchTab('produtos')}
            className={`flex flex-col items-center justify-center min-w-[70px] py-1 px-4 transition-all active:scale-95 ${
              activeTab === 'produtos' ? 'text-[#b50a53] font-bold' : 'text-[#8A5868] hover:text-[#b50a53]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">storefront</span>
            <span className="text-[12px] mt-0.5">Loja</span>
          </button>

          {/* Aba Carrinho com Badge */}
          <button 
            type="button"
            onClick={() => handleSwitchTab('carrinho')}
            className={`relative flex flex-col items-center justify-center min-w-[70px] py-1 px-4 transition-all active:scale-95 ${
              activeTab === 'carrinho' ? 'text-[#b50a53] font-bold' : 'text-[#8A5868] hover:text-[#b50a53]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#FB7185] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center border-2 border-white shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </div>
            <span className="text-[12px] mt-0.5">Carrinho</span>
          </button>
        </div>
      </nav>

    </div>
  );
};
export default SandysStore;
