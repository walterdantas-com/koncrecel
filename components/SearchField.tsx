
import React from 'react';

interface SearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const SearchField: React.FC<SearchFieldProps> = ({ label, placeholder, value, onChange }) => {
  return (
    <div className="flex flex-row items-center space-x-1 w-full">
      <label className="text-[8px] font-black text-[#808080] tracking-tighter uppercase w-[42px] shrink-0 leading-none">
        {label}
      </label>
      <div className="relative flex-1">
        <input
          type="text"
          className="block w-full px-2 py-1.5 border border-gray-100 rounded-lg bg-gray-50/50 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500 text-[12px] transition-all font-semibold text-[#000000]"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button onClick={() => onChange('')} className="absolute inset-y-0 right-0 pr-1.5 flex items-center text-gray-300 hover:text-gray-500">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchField;
