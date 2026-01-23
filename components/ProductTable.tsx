
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductTableProps {
  products: Product[];
  highlight: any;
  selectedIds: Set<string>;
  onToggleSelect: (name: string) => void;
  logoUrl?: string;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, highlight, selectedIds, onToggleSelect, logoUrl }) => {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  const highlightText = (text: string, term: string) => {
    if (!term || !text) return text;
    const parts = text.toString().split(new RegExp(`(${term})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded-sm">{part}</mark>
          ) : part
        )}
      </span>
    );
  };

  const openModal = (idx: number) => {
    setModalIndex(idx);
    setCurrentPhotoIdx(0);
  };

  const navigateProduct = (dir: 'next' | 'prev') => {
    if (modalIndex === null) return;
    if (dir === 'next') {
      const nextIdx = (modalIndex + 1) % products.length;
      setModalIndex(nextIdx);
    } else {
      const prevIdx = (modalIndex - 1 + products.length) % products.length;
      setModalIndex(prevIdx);
    }
    setCurrentPhotoIdx(0);
  };

  const navigatePhoto = (dir: 'next' | 'prev', photoCount: number) => {
    if (dir === 'next') {
      setCurrentPhotoIdx((prev) => (prev + 1) % photoCount);
    } else {
      setCurrentPhotoIdx((prev) => (prev - 1 + photoCount) % photoCount);
    }
  };

  const currentProduct = modalIndex !== null ? products[modalIndex] : null;

  return (
    <div className="space-y-2.5 px-1">
      {products.map((product, idx) => (
        <div 
          key={`${idx}-${product.produto}`}
          className={`bg-white rounded-2xl border transition-all flex items-center p-3 gap-4 hover:shadow-md ${selectedIds.has(product.produto) ? 'border-blue-400 bg-blue-50/40' : 'border-gray-100'}`}
        >
          <div className="flex items-center pl-1">
            <input 
              type="checkbox" 
              checked={selectedIds.has(product.produto)}
              onChange={() => onToggleSelect(product.produto)}
              className="w-8 h-8 rounded-full border-2 border-gray-200 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer accent-blue-600 shadow-sm"
            />
          </div>

          <div onClick={() => openModal(idx)} className="w-20 h-20 shrink-0 bg-white rounded-xl overflow-hidden border border-gray-100 p-1 cursor-pointer">
            {product.fotos && product.fotos[0] ? (
              <img src={product.fotos[0]} alt={product.produto} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg></div>
            )}
          </div>

          {/* Item 3: Fontes aumentadas na lista principal para 19px e 14px */}
          <div onClick={() => openModal(idx)} className="flex-1 min-w-0 cursor-pointer py-1">
            <div className="text-[19px] font-black text-gray-900 truncate leading-tight mb-1">
              {highlightText(product.produto, highlight.produto)}
            </div>
            <div className="flex flex-col text-[14px] text-blue-700 font-bold space-y-1 uppercase tracking-tighter">
              <span className="truncate"><span className="opacity-50 mr-1 text-blue-600 font-medium lowercase">tipo:</span> {highlightText(product.tipo, highlight.tipo)}</span>
              <span className="truncate"><span className="opacity-50 mr-1 text-blue-600 font-medium lowercase">uso:</span> {highlightText(product.aplicacao, highlight.aplicacao)}</span>
            </div>
          </div>
          
          <div className="text-gray-300 pr-1 shrink-0">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      ))}

      {currentProduct && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3rem] max-h-[96vh] overflow-hidden flex flex-col relative animate-in slide-in-from-bottom duration-300 shadow-2xl">
            
            {/* Cabeçalho Fixo do Modal */}
            <div className="sticky top-0 z-[160] bg-white/95 backdrop-blur-md px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <button onClick={() => setModalIndex(null)} className="bg-gray-100 hover:bg-gray-200 p-3 rounded-full text-gray-500 transition-colors active:scale-90 shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-full border border-blue-100 shadow-sm">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-[0.15em]">Orçamento</span>
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(currentProduct.produto)}
                  onChange={() => onToggleSelect(currentProduct.produto)}
                  className="w-7 h-7 rounded-full border-2 border-gray-200 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer accent-blue-600 shadow-sm"
                />
              </div>
            </div>

            {/* Setas Laterais de Navegação entre PRODUTOS (Sempre visíveis) */}
            {products.length > 1 && (
              <div className="absolute top-[45%] left-0 right-0 z-[155] -translate-y-1/2 flex justify-between px-3 pointer-events-none">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateProduct('prev'); }}
                  className="pointer-events-auto bg-white/70 hover:bg-white/90 text-gray-800 p-3.5 rounded-full backdrop-blur-lg transition-all active:scale-90 border border-white/40 shadow-xl"
                  title="Anterior"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateProduct('next'); }}
                  className="pointer-events-auto bg-white/70 hover:bg-white/90 text-gray-800 p-3.5 rounded-full backdrop-blur-lg transition-all active:scale-90 border border-white/40 shadow-xl"
                  title="Próximo"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}

            {/* Área de Conteúdo Unificada: Foto rola junto com o texto */}
            <div className="flex-1 overflow-y-auto bg-white scroll-smooth pb-12">
              
              {/* Foto do Produto (Limpa, sem botões em cima) */}
              <div className="w-full aspect-square bg-white flex items-center justify-center p-12">
                {currentProduct.fotos && currentProduct.fotos.length > 0 ? (
                  <img src={currentProduct.fotos[currentPhotoIdx]} alt={currentProduct.produto} className="max-w-full max-h-full object-contain drop-shadow-2xl transition-all duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-50"><svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg></div>
                )}
              </div>

              {/* Barra de Navegação de Fotos (Abaixo da imagem - Item 1) */}
              {currentProduct.fotos && currentProduct.fotos.length > 1 && (
                <div className="flex items-center justify-center gap-6 px-10 py-4 mb-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigatePhoto('prev', currentProduct.fotos!.length); }}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-400 p-3 rounded-full transition-all active:scale-75 border border-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <div className="flex gap-2.5">
                    {currentProduct.fotos.map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setCurrentPhotoIdx(i)} 
                        className="group relative flex items-center justify-center focus:outline-none py-2"
                      >
                        <span className={`h-2.5 rounded-full transition-all duration-300 ${i === currentPhotoIdx ? 'w-10 bg-blue-600 shadow-md' : 'w-2.5 bg-gray-200 group-hover:bg-gray-300'}`} />
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); navigatePhoto('next', currentProduct.fotos!.length); }}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-400 p-3 rounded-full transition-all active:scale-75 border border-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}

              {/* Detalhes Técnicos do Produto */}
              <div className="px-8 sm:px-12 space-y-8">
                <div className="border-b border-gray-100 pb-6 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                     <p className="text-[11px] font-black text-blue-600 tracking-widest uppercase">Ficha Técnica Completa</p>
                     <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Produto {modalIndex! + 1} / {products.length}</p>
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 uppercase leading-none tracking-tight">{currentProduct.produto}</h2>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <DetailRow label="Tipo do produto" value={currentProduct.tipo} />
                  <DetailRow label="Aplicação padrão" value={currentProduct.aplicacao} />
                  <DetailRow label="Superfície para uso" value={currentProduct.superficie} />
                  <DetailRow label="Embalagens" value={currentProduct.embalagens} />
                  <DetailRow label="Característica" value={currentProduct.caracteristica} />
                  <DetailRow label="Cores disponíveis" value={currentProduct.cores} />
                  <DetailRow label="Rendimento estimado" value={currentProduct.rendimento} />
                </div>

                <div className="pt-12 pb-16">
                  <button 
                    onClick={() => { onToggleSelect(currentProduct.produto); }}
                    className={`w-full py-7 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl transition-all active:scale-[0.97] ${selectedIds.has(currentProduct.produto) ? 'bg-red-50 text-red-500 border-2 border-red-100' : 'bg-blue-600 text-white border-2 border-transparent'}`}
                  >
                    {selectedIds.has(currentProduct.produto) ? "Remover do Orçamento" : "Adicionar ao Orçamento"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  if (!value || value.trim() === '') return null;
  const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <div className="flex flex-col gap-2 group">
      <span className="text-[11px] font-black text-blue-600 tracking-[0.2em] uppercase group-hover:text-blue-500 transition-colors opacity-80">{formattedLabel}</span>
      <span className="text-[17px] font-semibold text-gray-800 leading-relaxed whitespace-pre-wrap">{value}</span>
    </div>
  );
};

export default ProductTable;
