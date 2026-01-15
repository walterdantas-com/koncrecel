
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductTableProps {
  products: Product[];
  highlight: {
    produto: string;
    atributos: string;
    aplicacao: string;
    superficie: string;
    detalhes: string;
  };
}

const ProductTable: React.FC<ProductTableProps> = ({ products, highlight }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest text-center px-4">Nenhum item encontrado</p>
      </div>
    );
  }

  const toTitleCase = (text: string) => {
    if (!text) return "";
    return text.toString()
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const highlightText = (text: string, term: string, formatFn: (t: string) => string) => {
    const formatted = formatFn(text);
    if (!term) return formatted;
    
    const parts = formatted.split(new RegExp(`(${term})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-[#000000] rounded-sm px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
      {products.map((product, idx) => (
        <div 
          key={`${idx}-${product.produto}`} 
          onClick={() => setSelectedProduct(product)}
          className="px-2 py-2.5 hover:bg-gray-50/50 transition-colors flex flex-row gap-3 cursor-pointer group"
        >
          <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center p-1">
            {product.foto ? (
              <img src={product.foto} alt={product.produto} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <svg className="w-6 h-6 text-gray-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-black text-[#000000] leading-tight tracking-tight mb-1 flex items-center justify-between">
              <span>{highlightText(product.produto, highlight.produto, (t) => t.toUpperCase())}</span>
              <svg className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="space-y-0.5">
              <InfoRow label="Atributos" value={highlightText(product.atributos, highlight.atributos, toTitleCase)} />
              <InfoRow label="Aplicação" value={highlightText(product.aplicacao, highlight.aplicacao, toTitleCase)} />
              <InfoRow label="Superfície" value={highlightText(product.superficie, highlight.superficie, toTitleCase)} />
            </div>
          </div>
        </div>
      ))}

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-all">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-20 bg-white/80 backdrop-blur-md p-2 rounded-full text-gray-800 shadow-lg hover:bg-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="w-full aspect-square bg-[radial-gradient(circle,_#ffffff_0%,_#f3f4f6_100%)] flex items-center justify-center overflow-hidden border-b border-gray-100 shrink-0 max-h-[45vh] p-8">
              {selectedProduct.foto ? (
                <img src={selectedProduct.foto} alt={selectedProduct.produto} className="w-full h-full object-contain drop-shadow-2xl" />
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                  <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Ficha Técnica</p>
                  <h2 className="text-2xl font-black text-[#000000] leading-none uppercase tracking-tighter">{selectedProduct.produto}</h2>
                </div>
                <div className="w-12 h-12">
                   <img 
                    src="https://raw.githubusercontent.com/Renan-Koncrecel/Catalogo/main/koncrecel-icon.png" 
                    alt="K" 
                    className="w-full h-full object-contain opacity-20"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <DetailItem label="Cor / Tonalidade" value={toTitleCase(selectedProduct.cor) || 'Conforme Tabela'} highlight={true} />
                <DetailItem label="Atributos" value={toTitleCase(selectedProduct.atributos)} />
                <DetailItem label="Onde Aplicar" value={toTitleCase(selectedProduct.aplicacao)} />
                <DetailItem label="Superfície Ideal" value={toTitleCase(selectedProduct.superficie)} />
                <DetailItem label="Embalagens" value={toTitleCase(selectedProduct.embalagens)} />
                {selectedProduct.detalhes && (
                  <div className="pt-4 border-t border-gray-100">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Informações Adicionais</label>
                    <p className="text-[13px] text-gray-700 leading-relaxed font-medium">{toTitleCase(selectedProduct.detalhes)}</p>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedProduct(null)} className="w-full bg-[#000000] text-white py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all mt-4 mb-2">Voltar à Lista</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="text-[11px] text-[#000000] leading-snug flex items-start">
    <span className="font-black text-[#000000] mr-1.5 uppercase text-[8px] w-[62px] shrink-0 mt-[2px] tracking-tighter opacity-60">{label}</span>
    <span className="font-medium flex-1 truncate">{value}</span>
  </div>
);

const DetailItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`p-4 rounded-2xl border transition-all ${highlight ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-gray-50/50 border-gray-100'}`}>
    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
    <p className={`text-[14px] leading-tight font-bold ${highlight ? 'text-blue-700' : 'text-[#000000]'}`}>{value || '---'}</p>
  </div>
);

export default ProductTable;
