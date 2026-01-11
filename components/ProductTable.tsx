
import React from 'react';
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
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
        <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Nenhum item encontrado</p>
      </div>
    );
  }

  // Função para transformar em Title Case (Primeira letra de cada palavra em maiúscula)
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
      {products.map((product, idx) => (
        <div key={`${idx}-${product.produto}`} className="px-6 py-5 hover:bg-gray-50/50 transition-colors flex flex-col gap-3">
          
          {/* PRODUTO - Todo em Maiúsculo, Preto #000000, Exo 2 */}
          <div className="text-[17px] font-black text-[#000000] leading-tight tracking-normal mb-1">
            {highlightText(product.produto, highlight.produto, (t) => t.toUpperCase())}
          </div>
          
          <div className="space-y-2">
            {/* ATRIBUTOS */}
            <div className="text-[13px] text-[#000000] leading-normal flex items-start">
              <span className="font-black text-[#000000] mr-3 uppercase text-[10px] w-24 shrink-0 mt-0.5 tracking-wider font-bold">Atributos</span>
              <span className="font-medium flex-1">{highlightText(product.atributos, highlight.atributos, toTitleCase)}</span>
            </div>
            
            {/* APLICAÇÃO */}
            <div className="text-[13px] text-[#000000] leading-normal flex items-start">
              <span className="font-black text-[#000000] mr-3 uppercase text-[10px] w-24 shrink-0 mt-0.5 tracking-wider font-bold">Aplicação</span>
              <span className="font-medium flex-1">{highlightText(product.aplicacao, highlight.aplicacao, toTitleCase)}</span>
            </div>
            
            {/* SUPERFÍCIE */}
            <div className="text-[13px] text-[#000000] leading-normal flex items-start">
              <span className="font-black text-[#000000] mr-3 uppercase text-[10px] w-24 shrink-0 mt-0.5 tracking-wider font-bold">Superfície</span>
              <span className="font-medium flex-1">{highlightText(product.superficie, highlight.superficie, toTitleCase)}</span>
            </div>

            {/* EMBALAGENS */}
            <div className="text-[13px] text-[#000000] leading-normal flex items-start">
              <span className="font-black text-[#000000] mr-3 uppercase text-[10px] w-24 shrink-0 mt-0.5 tracking-wider font-bold">Embalagem</span>
              <span className="font-medium flex-1">{toTitleCase(product.embalagens)}</span>
            </div>

            {/* DETALHES */}
            <div className="text-[13px] text-[#000000] leading-relaxed mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start">
              <span className="font-black text-[#000000] mr-3 uppercase text-[10px] w-24 shrink-0 mt-0.5 tracking-wider font-bold">Detalhes</span>
              <span className="font-medium flex-1">{highlightText(product.detalhes, highlight.detalhes, toTitleCase)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductTable;
