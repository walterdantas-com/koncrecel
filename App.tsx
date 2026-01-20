
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SearchFilters } from './types';
import SearchField from './components/SearchField';
import ProductTable from './components/ProductTable';

const MASTER_PIN = '2025';
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL6WsNyflZ2dg_hWRU8fdqk5VWYVhp4ymIVMa0Wv50onOu_7elzdPeO5RkzPHlQ0OHDI0AgfRmo2lh/pub?gid=0&single=true&output=csv';
const DEFAULT_SECURITY_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL6WsNyflZ2dg_hWRU8fdqk5VWYVhp4ymIVMa0Wv50onOu_7elzdPeO5RkzPHlQ0OHDI0AgfRmo2lh/pub?gid=1675041371&single=true&output=csv';

const KONCRECEL_WHATSAPP = '44991647722';
const KONCRECEL_EMAIL = 'koncrecel.vendas@gmail.com';

// Insira aqui os links das logos do seu Google Drive se desejar
const LOGO_FULL_URL = 'klogo-full.png'; 
const LOGO_ICON_URL = 'klogo-icon.png';

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(() => localStorage.getItem('koncrecel_authorized') === 'true');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('koncrecel_sheet_url') || DEFAULT_SHEET_URL);
  const [securityUrl, setSecurityUrl] = useState(() => localStorage.getItem('koncrecel_security_url') || DEFAULT_SECURITY_URL);
  
  const [showConfig, setShowConfig] = useState(false);
  const [showSendPicker, setShowSendPicker] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    produto: '', tipo: '', aplicacao: '', superficie: ''
  });

  const cleanUrl = (url: string) => url.replace(/\s/g, '').trim();

  const convertDriveUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    const driveRegex = /[-\w]{25,}/;
    const match = trimmed.match(driveRegex);
    if ((trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) && match) {
      return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return trimmed;
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    const separator = lines[0].includes(';') ? ';' : ',';
    for (let line of lines) {
      if (!line.trim()) continue;
      const fields: string[] = [];
      let field = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === separator && !inQuotes) {
          fields.push(field.trim());
          field = '';
        } else { field += char; }
      }
      fields.push(field.trim());
      rows.push(fields);
    }
    return rows;
  };

  const fetchData = async () => {
    if (!isAuthorized) return;
    try {
      setLoading(true);
      const url = cleanUrl(sheetUrl);
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`);
      const text = await response.text();
      const rows = parseCSV(text);
      
      const header = rows[0].map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      const findIdx = (names: string[]) => header.findIndex(h => names.some(n => h.includes(n)));
      
      const idx = {
        produto: findIdx(['produto', 'nome']),
        tipo: findIdx(['tipo', 'categoria']),
        aplicacao: findIdx(['aplicacao', 'onde']),
        superficie: findIdx(['superficie', 'base']),
        embalagens: findIdx(['embalagem']),
        caracteristica: findIdx(['caracteristica', 'atributo']),
        foto: findIdx(['foto', 'imagem']),
        cores: findIdx(['cor', 'tonalidade']),
        rendimento: findIdx(['rendimento'])
      };

      const mapped = rows.slice(1).map(f => {
        const rawPhotos = f[idx.foto] || '';
        const photoList = rawPhotos.split(/[;,]/).map(url => convertDriveUrl(url)).filter(u => u !== '');

        return {
          produto: f[idx.produto] || 'Sem Nome',
          tipo: f[idx.tipo] || '',
          aplicacao: f[idx.aplicacao] || '',
          superficie: f[idx.superficie] || '',
          embalagens: f[idx.embalagens] || '',
          caracteristica: f[idx.caracteristica] || '',
          fotos: photoList,
          cores: f[idx.cores] || '',
          rendimento: f[idx.rendimento] || ''
        };
      }).filter(p => p.produto !== 'Sem Nome');
      
      setProducts(mapped);
    } catch (err: any) {
      setError("Erro ao carregar os dados. Verifique a conexão.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAuthorized) fetchData(); }, [isAuthorized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === MASTER_PIN) {
      setIsAuthorized(true);
      localStorage.setItem('koncrecel_authorized', 'true');
      return;
    }
    setIsChecking(true);
    try {
      const response = await fetch(`${cleanUrl(securityUrl)}?t=${Date.now()}`);
      const text = await response.text();
      const pins = parseCSV(text).flat().map(p => p.trim());
      if (pins.includes(pinInput)) {
        setIsAuthorized(true);
        localStorage.setItem('koncrecel_authorized', 'true');
      } else { setPinError(true); }
    } catch { setPinError(true); }
    finally { setIsChecking(false); }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const match = (f: string, v: string) => !v || f.toLowerCase().includes(v.toLowerCase());
      return match(p.produto, filters.produto) &&
             match(p.tipo, filters.tipo) &&
             match(p.aplicacao, filters.aplicacao) &&
             match(p.superficie, filters.superficie);
    });
  }, [filters, products]);

  const handleToggleSelect = (productName: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(productName)) newSet.delete(productName);
    else newSet.add(productName);
    setSelectedIds(newSet);
  };

  const handleSendRequest = (method: 'whatsapp' | 'email') => {
    const selectedItems = products.filter(p => selectedIds.has(p.produto));
    if (selectedItems.length === 0) return;

    let message = `*Solicitação de Orçamento - Koncrecel*\n\n`;
    selectedItems.forEach(item => {
      message += `• *${item.produto}*\n  Embalagens: ${item.embalagens}\n\n`;
    });

    if (method === 'whatsapp') {
      window.open(`https://wa.me/55${KONCRECEL_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      const subject = encodeURIComponent('Solicitação de Orçamento - Catálogo Koncrecel');
      window.open(`mailto:${KONCRECEL_EMAIL}?subject=${subject}&body=${encodeURIComponent(message.replace(/\*/g, ''))}`, '_blank');
    }
    setShowSendPicker(false);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <img src={convertDriveUrl(LOGO_FULL_URL)} alt="Koncrecel" className="w-64 mx-auto mb-10 drop-shadow-sm" onError={(e) => { e.currentTarget.src = 'https://raw.githubusercontent.com/Renan-Koncrecel/Catalogo/main/koncrecel-full.png' }} />
          <h2 className="text-xl font-black uppercase tracking-widest mb-10 text-gray-800">Catálogo de Produtos</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" inputMode="numeric" placeholder="PIN" className={`w-full text-center text-4xl py-5 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${pinError ? 'border-red-500 animate-shake text-red-500' : 'border-gray-100 focus:border-blue-500 text-gray-900'}`} value={pinInput} onChange={e => setPinInput(e.target.value)} />
            <button type="submit" disabled={isChecking} className="w-full bg-[#000000] text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform">{isChecking ? "Validando..." : "Entrar"}</button>
          </form>
          <button onClick={() => setShowConfig(true)} className="mt-8 text-[10px] text-gray-300 uppercase font-bold hover:text-blue-500">Configurações</button>
        </div>
        {showConfig && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
            <h3 className="font-black uppercase mb-6 text-gray-900 tracking-widest">Painel de Ajustes</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">URL Planilha Produtos</label>
                <input className="w-full p-4 bg-gray-50 rounded-xl border-gray-100 border text-xs outline-none focus:border-blue-500" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">URL Planilha Segurança</label>
                <input className="w-full p-4 bg-gray-50 rounded-xl border-gray-100 border text-xs outline-none focus:border-blue-500" value={securityUrl} onChange={e => setSecurityUrl(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-8">
              <button onClick={() => { localStorage.setItem('koncrecel_sheet_url', sheetUrl); localStorage.setItem('koncrecel_security_url', securityUrl); setShowConfig(false); fetchData(); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Salvar Configurações</button>
              <button onClick={() => setShowConfig(false)} className="w-full py-2 text-gray-400 font-bold uppercase text-[10px]">Fechar</button>
            </div>
          </div>
        </div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-3 py-4 shadow-sm backdrop-blur-md bg-white/95">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <img src={convertDriveUrl(LOGO_ICON_URL)} alt="K" className="h-8 object-contain" onError={(e) => { e.currentTarget.src = 'https://raw.githubusercontent.com/Renan-Koncrecel/Catalogo/main/koncrecel-icon.png' }} />
            <h1 className="text-lg font-black uppercase tracking-tighter text-gray-900">Catálogo <span className="text-blue-600">Koncrecel</span></h1>
          </div>
          <button onClick={fetchData} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <SearchField label="Produto" placeholder="Pesquisar..." value={filters.produto} onChange={v => setFilters(f => ({...f, produto: v}))} />
          <SearchField label="Tipo" placeholder="Pesquisar..." value={filters.tipo} onChange={v => setFilters(f => ({...f, tipo: v}))} />
          <SearchField label="Aplicação" placeholder="Pesquisar..." value={filters.aplicacao} onChange={v => setFilters(f => ({...f, aplicacao: v}))} />
          <SearchField label="Superfície" placeholder="Pesquisar..." value={filters.superficie} onChange={v => setFilters(f => ({...f, superficie: v}))} />
        </div>
      </header>

      <main className="flex-1 p-3 pb-32">
        {loading && !products.length ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Atualizando Catálogo...</p>
          </div>
        ) : (
          <ProductTable 
            products={filteredProducts} 
            highlight={filters} 
            selectedIds={selectedIds} 
            onToggleSelect={handleToggleSelect} 
          />
        )}
      </main>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
          <button 
            onClick={() => setShowSendPicker(true)}
            className="w-full bg-[#000000] text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between active:scale-95 transition-transform"
          >
            <span className="ml-4 font-black uppercase text-[11px] tracking-widest">{selectedIds.size} itens selecionados</span>
            <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full">
              <span className="text-[10px] font-black uppercase tracking-tighter">Enviar Solicitação</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7M5 12h16" /></svg>
            </div>
          </button>
        </div>
      )}

      {showSendPicker && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-8 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2 text-gray-900">Como deseja enviar?</h3>
            <p className="text-xs text-gray-400 mb-8 font-medium">Selecione o canal para enviar seu pedido</p>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => handleSendRequest('whatsapp')}
                className="flex items-center justify-center space-x-3 bg-green-500 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>WhatsApp</span>
              </button>
              <button 
                onClick={() => handleSendRequest('email')}
                className="flex items-center justify-center space-x-3 bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>E-mail</span>
              </button>
              <button onClick={() => setShowSendPicker(false)} className="mt-4 py-2 text-gray-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto py-10 text-center bg-gray-50 border-t border-gray-100 px-6">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Koncrecel Representações</p>
        <p className="text-[14px] font-bold text-gray-900">44-9.9164.7722</p>
      </footer>
    </div>
  );
};

export default App;
