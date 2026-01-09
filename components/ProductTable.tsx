
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
        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Nenhum item encontrado</p>
      </div>
    );
  }

  const formatText = (text: string) => {
    if (!text) return "";
    const str = text.toString().toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const highlightText = (text: string, term: string) => {
    const formatted = formatText(text);
    if (!term) return formatted;
    const parts = formatted.split(new RegExp(`(${term})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={i} className="bg-yellow-100 text-yellow-800 rounded-sm px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
      {products.map((product, idx) => (
        <div key={`${idx}-${product.produto}`} className="px-4 py-3 hover:bg-gray-50/50 transition-colors flex flex-col gap-1.5">
          
          {/* PRODUTO - Azul, Primeira Maiúscula */}
          <div className="text-sm font-semibold text-blue-600 leading-tight">
            {highlightText(product.produto, highlight.produto)}
          </div>
          
          {/* ATRIBUTOS */}
          <div className="text-[11px] text-gray-700 leading-normal flex">
            <span className="font-black text-gray-300 mr-2 uppercase text-[8px] w-14 shrink-0 mt-0.5 tracking-tighter">Atributos</span>
            <span className="font-normal">{highlightText(product.atributos, highlight.atributos)}</span>
          </div>
          
          {/* APLICAÇÃO */}
          <div className="text-[11px] text-gray-600 leading-normal flex">
            <span className="font-black text-gray-300 mr-2 uppercase text-[8px] w-14 shrink-0 mt-0.5 tracking-tighter">Aplicação</span>
            <span className="font-normal">{highlightText(product.aplicacao, highlight.aplicacao)}</span>
          </div>
          
          {/* SUPERFÍCIE */}
          <div className="text-[11px] text-gray-500 leading-normal flex">
            <span className="font-black text-gray-300 mr-2 uppercase text-[8px] w-14 shrink-0 mt-0.5 tracking-tighter">Superfície</span>
            <span className="font-normal">{highlightText(product.superficie, highlight.superficie)}</span>
          </div>

          {/* EMBALAGENS */}
          <div className="text-[11px] text-indigo-500 leading-normal flex">
            <span className="font-black text-gray-300 mr-2 uppercase text-[8px] w-14 shrink-0 mt-0.5 tracking-tighter">Embalagem</span>
            <span className="font-normal">{formatText(product.embalagens)}</span>
          </div>

          {/* DETALHES */}
          <div className="text-[10px] text-gray-400 leading-relaxed mt-1 bg-gray-50/50 p-2 rounded border border-gray-100/50 flex">
            <span className="font-black text-gray-300 mr-2 uppercase text-[8px] w-14 shrink-0 mt-0.5 tracking-tighter">Detalhes</span>
            <span className="font-normal">{highlightText(product.detalhes, highlight.detalhes)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductTable;
