
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductTableProps {
  products: Product[];
  highlight: any;
  selectedIds: Set<string>;
  onToggleSelect: (name: string) => void;
  logoUrl?: string;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, highlight, selectedIds, onToggleSelect, logoUrl }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

  const openModal = (p: Product) => {
    setSelectedProduct(p);
    setCurrentPhotoIdx(0);
  };

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

          <div onClick={() => openModal(product)} className="w-14 h-14 shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 p-0.5 cursor-pointer">
            {product.fotos && product.fotos[0] ? (
              <img src={product.fotos[0]} alt={product.produto} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg></div>
            )}
          </div>

          <div onClick={() => openModal(product)} className="flex-1 min-w-0 cursor-pointer py-1">
            <div className="text-[13px] font-black text-gray-900 truncate leading-tight mb-0.5">
              {highlightText(product.produto, highlight.produto)}
            </div>
            <div className="flex flex-col text-[9px] text-gray-400 font-bold space-y-0.5 uppercase tracking-tighter">
              <span className="truncate"><span className="opacity-40 mr-0.5">Tipo:</span> {highlightText(product.tipo, highlight.tipo)}</span>
              <span className="truncate"><span className="opacity-40 mr-0.5">Uso:</span> {highlightText(product.aplicacao, highlight.aplicacao)}</span>
            </div>
          </div>
          
          <div className="text-gray-200 pr-1 shrink-0">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      ))}

      {selectedProduct && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-lg flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[2.5rem] max-h-[96vh] overflow-hidden flex flex-col relative animate-in slide-in-from-bottom duration-300">
            
            {/* Botão fechar mais discreto e fora da área central da foto */}
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-50 bg-black/5 hover:bg-black/10 p-2.5 rounded-full text-gray-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Carrossel de Fotos com Padding Superior para evitar o botão fechar */}
            <div className="relative w-full aspect-square bg-white shrink-0 p-10 pt-16 flex items-center justify-center border-b border-gray-50">
              {selectedProduct.fotos && selectedProduct.fotos.length > 0 ? (
                <img src={selectedProduct.fotos[currentPhotoIdx]} alt={selectedProduct.produto} className="max-w-full max-h-full object-contain drop-shadow-xl" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-50"><svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg></div>
              )}

              {selectedProduct.fotos && selectedProduct.fotos.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentPhotoIdx(prev => (prev === 0 ? selectedProduct.fotos.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/50 backdrop-blur-sm text-gray-800 border border-gray-100 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button 
                    onClick={() => setCurrentPhotoIdx(prev => (prev === selectedProduct.fotos.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/50 backdrop-blur-sm text-gray-800 border border-gray-100 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selectedProduct.fotos.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all ${i === currentPhotoIdx ? 'w-5 bg-blue-500' : 'w-1.5 bg-gray-200'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Detalhes Técnicos - Fundo Branco conforme pedido */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-white">
              <div className="border-b border-gray-100 pb-4 flex justify-between items-start">
                <h2 className="text-2xl font-black text-[#000000] uppercase leading-tight tracking-tight flex-1">{selectedProduct.produto}</h2>
                {logoUrl && (
                  <img src={logoUrl} className="h-8 opacity-10 ml-4 object-contain" alt="K" />
                )}
              </div>

              <div className="grid grid-cols-1 gap-5">
                <DetailRow label="Tipo do produto" value={selectedProduct.tipo} />
                <DetailRow label="Aplicação padrão" value={selectedProduct.aplicacao} />
                <DetailRow label="Superfície para uso" value={selectedProduct.superficie} />
                <DetailRow label="Embalagens" value={selectedProduct.embalagens} />
                <DetailRow label="Característica" value={selectedProduct.caracteristica} />
                <DetailRow label="Cores disponíveis" value={selectedProduct.cores} />
                <DetailRow label="Rendimento estimado" value={selectedProduct.rendimento} />
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => { onToggleSelect(selectedProduct.produto); setSelectedProduct(null); }}
                  className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 ${selectedIds.has(selectedProduct.produto) ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-600 text-white'}`}
                >
                  {selectedIds.has(selectedProduct.produto) ? "Remover da Lista" : "Adicionar para Orçamento"}
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
      <span className="text-[10px] font-bold text-[#808080] tracking-widest uppercase">{formattedLabel}</span>
      <span className="text-[14px] font-medium text-[#000000] leading-snug whitespace-pre-wrap">{value}</span>
    </div>
  );
};

export default ProductTable;
