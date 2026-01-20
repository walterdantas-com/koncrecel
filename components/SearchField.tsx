
import React from 'react';

interface SearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const SearchField: React.FC<SearchFieldProps> = ({ label, placeholder, value, onChange }) => {
  return (
    <div className="flex flex-row items-center space-x-1 w-full bg-gray-50/30 rounded-lg px-1.5 py-0.5 border border-transparent">
      {/* Rótulo alterado para text-blue-600 conforme solicitado */}
      <label className="text-[7.5px] font-black text-blue-600 tracking-tighter uppercase w-[38px] shrink-0 leading-none">
        {label}
      </label>
      <div className="relative flex-1">
        <input
          type="text"
          className="block w-full px-1.5 py-1.5 bg-transparent placeholder-gray-300 focus:outline-none text-[12px] font-bold text-[#000000]"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button onClick={() => onChange('')} className="absolute inset-y-0 right-0 pr-1 flex items-center text-gray-300 hover:text-red-400 transition-colors">
            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchField;
