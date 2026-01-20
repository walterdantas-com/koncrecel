
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SearchFilters } from './types';
import SearchField from './components/SearchField';
import ProductTable from './components/ProductTable';

const MASTER_PIN = '2025';
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL6WsNyflZ2dg_hWRU8fdqk5VWYVhp4ymIVMa0Wv50onOu_7elzdPeO5RkzPHlQ0OHDI0AgfRmo2lh/pub?gid=0&single=true&output=csv';
const DEFAULT_SECURITY_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL6WsNyflZ2dg_hWRU8fdqk5VWYVhp4ymIVMa0Wv50onOu_7elzdPeO5RkzPHlQ0OHDI0AgfRmo2lh/pub?gid=1675041371&single=true&output=csv';

const KONCRECEL_WHATSAPP = '44991647722';
const KONCRECEL_EMAIL = 'koncrecel.vendas@gmail.com';

// SUBSTITUA OS TEXTOS ABAIXO PELOS LINKS DE COMPARTILHAMENTO DO DRIVE PARA AS LOGOS
const LOGO_FULL_URL = 'https://drive.google.com/file/d/1xzOmLtf45Gl78ko2hulY80wp6M8Mzlhv/view?usp=sharing'; 
const LOGO_ICON_URL = 'https://drive.google.com/file/d/1XlGtQt8Vd2T-thux9YmlIYP2ptGmvHJP/view?usp=sharing';

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

  const [filters, setFilters] = useState<SearchFilters>({
    produto: '', tipo: '', aplicacao: '', superficie: ''
  });

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

  const processedLogoFull = useMemo(() => convertDriveUrl(LOGO_FULL_URL), []);
  const processedLogoIcon = useMemo(() => convertDriveUrl(LOGO_ICON_URL), []);

  const handleLogout = () => {
    localStorage.removeItem('koncrecel_authorized');
    setIsAuthorized(false);
    setPinInput('');
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
      const url = sheetUrl.replace(/\s/g, '').trim();
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
      console.error("Erro ao carregar dados.");
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    if (isAuthorized) fetchData(); 
  }, [isAuthorized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);
    if (pinInput === MASTER_PIN) {
      setIsAuthorized(true);
      localStorage.setItem('koncrecel_authorized', 'true');
      return;
    }
    setIsChecking(true);
    try {
      const response = await fetch(`${securityUrl.replace(/\s/g, '').trim()}?t=${Date.now()}`);
      const text = await response.text();
      const csvData = parseCSV(text);
      // Achata todos os campos e limpa espaços para garantir que encontre o PIN
      const pins = csvData.flat().map(p => p.trim().toString());
      
      if (pins.some(p => p === pinInput)) {
        setIsAuthorized(true);
        localStorage.setItem('koncrecel_authorized', 'true');
      } else { 
        setPinError(true); 
      }
    } catch (err) { 
      setPinError(true); 
    }
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
      const subject = encodeURIComponent('Orçamento - Koncrecel');
      window.open(`mailto:${KONCRECEL_EMAIL}?subject=${subject}&body=${encodeURIComponent(message.replace(/\*/g, ''))}`, '_blank');
    }
    setShowSendPicker(false);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <img 
            src={processedLogoFull} 
            alt="Koncrecel" 
            className="w-48 mx-auto mb-10 drop-shadow-sm" 
            onError={(e) => { e.currentTarget.src = 'https://raw.githubusercontent.com/Renan-Koncrecel/Catalogo/main/koncrecel-full.png' }} 
          />
          <h2 className="text-xl font-black uppercase tracking-widest mb-10 text-gray-800">Koncrecel 44-9.9164.7722</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              inputMode="numeric" 
              placeholder="Digite seu PIN" 
              className={`w-full text-center text-4xl py-5 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${pinError ? 'border-red-500 animate-shake text-red-500' : 'border-gray-100 focus:border-blue-500 text-gray-900'}`} 
              value={pinInput} 
              onChange={e => setPinInput(e.target.value)} 
            />
            <button type="submit" disabled={isChecking} className="w-full bg-[#000000] text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform">
              {isChecking ? "Verificando..." : "Entrar"}
            </button>
            {pinError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Acesso não autorizado</p>}
          </form>
          <button onClick={() => setShowConfig(true)} className="mt-12 text-[9px] text-gray-300 uppercase font-bold hover:text-blue-500 tracking-widest">Configurações do Sistema</button>
        </div>
        {showConfig && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
              <h3 className="font-black uppercase mb-6 text-gray-900 tracking-widest">Ajustes Técnicos</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Planilha de Produtos</label>
                   <input className="w-full p-4 bg-gray-50 rounded-xl border-gray-100 border text-xs outline-none focus:border-blue-500" placeholder="URL CSV" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Planilha de PINs</label>
                   <input className="w-full p-4 bg-gray-50 rounded-xl border-gray-100 border text-xs outline-none focus:border-blue-500" placeholder="URL CSV" value={securityUrl} onChange={e => setSecurityUrl(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-8">
                <button onClick={() => { localStorage.setItem('koncrecel_sheet_url', sheetUrl); localStorage.setItem('koncrecel_security_url', securityUrl); setShowConfig(false); fetchData(); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Salvar e Atualizar</button>
                <button onClick={() => setShowConfig(false)} className="w-full py-2 text-gray-400 font-bold uppercase text-[10px]">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-3 py-2.5 shadow-sm backdrop-blur-md bg-white/95">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <img 
              src={processedLogoIcon} 
              alt="K" 
              className="h-7 object-contain" 
              onError={(e) => { e.currentTarget.src = 'https://raw.githubusercontent.com/Renan-Koncrecel/Catalogo/main/koncrecel-icon.png' }} 
            />
            <h1 className="text-md font-black uppercase tracking-tighter text-gray-900 leading-none">Koncrecel <span className="text-blue-600">44-9.9164.7722</span></h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={handleLogout} className="px-2 py-1 text-[9px] font-black uppercase text-red-500 border border-red-100 rounded-lg hover:bg-red-50">Sair</button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
          <SearchField label="Produto" placeholder="Buscar..." value={filters.produto} onChange={v => setFilters(f => ({...f, produto: v}))} />
          <SearchField label="Tipo" placeholder="Buscar..." value={filters.tipo} onChange={v => setFilters(f => ({...f, tipo: v}))} />
          <SearchField label="Aplicação" placeholder="Buscar..." value={filters.aplicacao} onChange={v => setFilters(f => ({...f, aplicacao: v}))} />
          <SearchField label="Base" placeholder="Buscar..." value={filters.superficie} onChange={v => setFilters(f => ({...f, superficie: v}))} />
        </div>
      </header>

      <main className="flex-1 p-2 pb-32">
        {loading && !products.length ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-7 h-7 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Carregando Itens...</p>
          </div>
        ) : (
          <ProductTable 
            products={filteredProducts} 
            highlight={filters} 
            selectedIds={selectedIds} 
            onToggleSelect={handleToggleSelect} 
            logoUrl={processedLogoIcon}
          />
        )}
      </main>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md">
          <button 
            onClick={() => setShowSendPicker(true)}
            className="w-full bg-[#000000] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between active:scale-95 transition-transform"
          >
            <span className="ml-2 font-black uppercase text-[10px] tracking-widest">{selectedIds.size} selecionados</span>
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl">
              <span className="text-[9px] font-black uppercase">Solicitar Orçamento</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7M5 12h16" /></svg>
            </div>
          </button>
        </div>
      )}

      {showSendPicker && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-lg font-black uppercase mb-2 text-gray-900 leading-tight">Enviar solicitação</h3>
            <p className="text-[10px] text-gray-400 mb-6 font-bold uppercase tracking-widest">Escolha o canal de contato</p>
            <div className="grid grid-cols-1 gap-2.5">
              <button onClick={() => handleSendRequest('whatsapp')} className="flex items-center justify-center space-x-3 bg-green-500 text-white p-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform">
                <span>WhatsApp</span>
              </button>
              <button onClick={() => handleSendRequest('email')} className="flex items-center justify-center space-x-3 bg-blue-600 text-white p-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform">
                <span>E-mail</span>
              </button>
              <button onClick={() => setShowSendPicker(false)} className="mt-2 py-2 text-gray-300 font-bold uppercase text-[9px] tracking-widest">Fechar</button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto py-8 text-center bg-gray-50 border-t border-gray-100 px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Koncrecel Representações</p>
        <p className="text-[12px] font-bold text-gray-900">44-9.9164.7722</p>
      </footer>
    </div>
  );
};

export default App;
