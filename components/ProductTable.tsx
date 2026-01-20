
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

  const currentProduct = modalIndex !== null ? products[modalIndex] : null;

  return (
    <div className="space-y-1.5">
      {products.map((product, idx) => (
        <div 
          key={`${idx}-${product.produto}`}
          className={`bg-white rounded-xl border transition-all flex items-center p-2 gap-3 hover:shadow-sm ${selectedIds.has(product.produto) ? 'border-blue-200 bg-blue-50/20' : 'border-gray-100'}`}
        >
          <div className="flex items-center pl-1">
            <input 
              type="checkbox" 
              checked={selectedIds.has(product.produto)}
              onChange={() => onToggleSelect(product.produto)}
              className="w-5 h-5 rounded-full border-2 border-gray-200 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer accent-blue-600"
            />
          </div>

          <div onClick={() => openModal(idx)} className="w-14 h-14 shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 p-0.5 cursor-pointer">
            {product.fotos && product.fotos[0] ? (
              <img src={product.fotos[0]} alt={product.produto} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg></div>
            )}
          </div>

          <div onClick={() => openModal(idx)} className="flex-1 min-w-0 cursor-pointer py-1">
            <div className="text-[13px] font-black text-gray-900 truncate leading-tight mb-0.5">
              {highlightText(product.produto, highlight.produto)}
            </div>
            <div className="flex flex-col text-[9px] text-blue-600 font-bold space-y-0.5 uppercase tracking-tighter">
              <span className="truncate"><span className="opacity-50 mr-0.5 text-blue-600">Tipo:</span> {highlightText(product.tipo, highlight.tipo)}</span>
              <span className="truncate"><span className="opacity-50 mr-0.5 text-blue-600">Uso:</span> {highlightText(product.aplicacao, highlight.aplicacao)}</span>
            </div>
          </div>
          
          <div className="text-gray-200 pr-1 shrink-0">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      ))}

      {currentProduct && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-lg flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[2.5rem] max-h-[96vh] overflow-hidden flex flex-col relative animate-in slide-in-from-bottom duration-300">
            
            {/* Controles de navegação de PRODUTO (Carrossel Principal) */}
            {products.length > 1 && (
              <div className="absolute top-[40%] left-0 right-0 z-[130] flex justify-between px-4 pointer-events-none">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateProduct('prev'); }}
                  className="pointer-events-auto bg-black/20 hover:bg-black/40 text-white p-3 rounded-full backdrop-blur-md transition-all active:scale-90"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateProduct('next'); }}
                  className="pointer-events-auto bg-black/20 hover:bg-black/40 text-white p-3 rounded-full backdrop-blur-md transition-all active:scale-90"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}

            <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center">
              <button onClick={() => setModalIndex(null)} className="bg-black/5 hover:bg-black/10 p-2.5 rounded-full text-gray-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Orçamento</span>
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(currentProduct.produto)}
                  onChange={() => onToggleSelect(currentProduct.produto)}
                  className="w-5 h-5 rounded-full border-2 border-gray-200 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Carrossel de Fotos do Produto - Ajustado conforme solicitação */}
            <div className="relative w-full aspect-square bg-white shrink-0 p-10 pt-20 flex items-center justify-center border-b border-gray-50">
              {currentProduct.fotos && currentProduct.fotos.length > 0 ? (
                <img src={currentProduct.fotos[currentPhotoIdx]} alt={currentProduct.produto} className="max-w-full max-h-full object-contain drop-shadow-xl transition-all duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-50"><svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg></div>
              )}

              {/* Indicadores de fotos (dots) - Melhora na área de toque e tamanho */}
              {currentProduct.fotos && currentProduct.fotos.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/5 px-4 py-2 rounded-full backdrop-blur-sm">
                  {currentProduct.fotos.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setCurrentPhotoIdx(i)} 
                      className="group relative flex items-center justify-center py-2 px-1 focus:outline-none"
                      aria-label={`Ver imagem ${i + 1}`}
                    >
                      {/* Círculo visível maior e mais fácil de clicar */}
                      <span className={`h-2.5 rounded-full transition-all duration-300 ${i === currentPhotoIdx ? 'w-8 bg-blue-600 shadow-md shadow-blue-200' : 'w-2.5 bg-gray-300 group-hover:bg-gray-400'}`} />
                      
                      {/* Hit area invisível expandida para facilitar o toque no celular */}
                      <span className="absolute inset-0 w-full h-full -top-1 -bottom-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detalhes Técnicos */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-white">
              <div className="border-b border-gray-100 pb-4 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                   <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Produto</p>
                   <p className="text-[9px] font-bold text-gray-300">Item {modalIndex! + 1} de {products.length}</p>
                </div>
                <h2 className="text-2xl font-black text-[#000000] uppercase leading-tight tracking-tight">{currentProduct.produto}</h2>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <DetailRow label="Tipo do produto" value={currentProduct.tipo} />
                <DetailRow label="Aplicação padrão" value={currentProduct.aplicacao} />
                <DetailRow label="Superfície para uso" value={currentProduct.superficie} />
                <DetailRow label="Embalagens" value={currentProduct.embalagens} />
                <DetailRow label="Característica" value={currentProduct.caracteristica} />
                <DetailRow label="Cores disponíveis" value={currentProduct.cores} />
                <DetailRow label="Rendimento estimado" value={currentProduct.rendimento} />
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => { onToggleSelect(currentProduct.produto); }}
                  className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 ${selectedIds.has(currentProduct.produto) ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-600 text-white'}`}
                >
                  {selectedIds.has(currentProduct.produto) ? "Remover da Lista" : "Adicionar para Orçamento"}
                </button>
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
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">{formattedLabel}</span>
      <span className="text-[14px] font-medium text-[#000000] leading-snug whitespace-pre-wrap">{value}</span>
    </div>
  );
};

export default ProductTable;
