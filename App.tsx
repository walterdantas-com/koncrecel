
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SearchFilters } from './types';
import SearchField from './components/SearchField';
import ProductTable from './components/ProductTable';

const MASTER_PIN = '2025';
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL6WsNyflZ2dg_hWRU8fdqk5VWYVhp4ymIVMa0Wv50onOu_7elzdPeO5RkzPHlQ0OHDI0AgfRmo2lh/pub?gid=0&single=true&output=csv';
const DEFAULT_SECURITY_URL = 'https://docs.google.com/spreadsheets/d/15Jx0pkSQsgW_bATIAoc14yggdU0dZ-nAOl0s2YYggdE/export?format=csv&gid=0';

const KONCRECEL_WHATSAPP = '44991647722';
const KONCRECEL_EMAIL = 'koncrecel.vendas@gmail.com';

const LOGO_FULL_URL = 'https://drive.google.com/file/d/1xzOmLtf45Gl78ko2hulY80wp6M8Mzlhv/view?usp=sharing'; 
const LOGO_ICON_URL = 'https://drive.google.com/file/d/1XlGtQt8Vd2T-thux9YmlIYP2ptGmvHJP/view?usp=sharing';

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(() => localStorage.getItem('koncrecel_authorized') === 'true');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('koncrecel_is_admin') === 'true');
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
    localStorage.removeItem('koncrecel_is_admin');
    setIsAuthorized(false);
    setIsAdmin(false);
    setPinInput('');
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/);
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
          fields.push(field.trim().replace(/^"|"$/g, ''));
          field = '';
        } else { field += char; }
      }
      fields.push(field.trim().replace(/^"|"$/g, ''));
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
        produto: findIdx(['produto', 'nome', 'item']),
        tipo: findIdx(['tipo', 'categoria', 'grupo']),
        aplicacao: findIdx(['aplicacao', 'onde', 'uso', 'finalidade']),
        superficie: findIdx(['superficie', 'base', 'substrato', 'chao']),
        embalagens: findIdx(['embalagem', 'embalagens', 'emb', 'unidade', 'medida', 'vol', 'peso', 'apresentacao']),
        caracteristica: findIdx(['caracteristica', 'atributo', 'detalhe', 'sobre']),
        foto: findIdx(['foto', 'imagem', 'link', 'url']),
        cores: findIdx(['cor', 'tonalidade', 'cores', 'paleta']),
        rendimento: findIdx(['rendimento', 'consumo', 'cobertura'])
      };

      const mapped = rows.slice(1).map(f => {
        const rawPhotos = f[idx.foto] || '';
        const photoList = rawPhotos.split(/[;|,]/).map(url => convertDriveUrl(url)).filter(u => u !== '');

        return {
          produto: f[idx.produto] || '',
          tipo: f[idx.tipo] || '',
          aplicacao: f[idx.aplicacao] || '',
          superficie: f[idx.superficie] || '',
          embalagens: f[idx.embalagens] || '',
          caracteristica: f[idx.caracteristica] || '',
          fotos: photoList,
          cores: f[idx.cores] || '',
          rendimento: f[idx.rendimento] || ''
        };
      }).filter(p => p.produto.trim() !== '');
      
      setProducts(mapped);
    } catch (err: any) {
      console.error("Erro ao carregar dados.");
    } finally { setLoading(false); }
  };

  const handleFullReset = () => {
    setFilters({ produto: '', tipo: '', aplicacao: '', superficie: '' });
    setSelectedIds(new Set());
    fetchData();
  };

  useEffect(() => { 
    if (isAuthorized) fetchData(); 
  }, [isAuthorized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);
    
    const normalize = (s: any) => s ? s.toString().toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';
    const cleanInput = normalize(pinInput);
    
    if (cleanInput === normalize(MASTER_PIN)) {
      setIsAuthorized(true);
      setIsAdmin(true);
      localStorage.setItem('koncrecel_authorized', 'true');
      localStorage.setItem('koncrecel_is_admin', 'true');
      return;
    }
    
    setIsChecking(true);
    try {
      const secUrl = securityUrl.replace(/\s/g, '').trim();
      const connector = secUrl.includes('?') ? '&' : '?';
      const finalUrl = `${secUrl}${connector}t=${Date.now()}`;
      
      const response = await fetch(finalUrl, { cache: 'no-store' });
      const text = await response.text();
      const csvData = parseCSV(text);
      const allCells = csvData.flat().map(cell => normalize(cell));
      
      if (allCells.some(p => p === cleanInput && p !== '')) {
        setIsAuthorized(true);
        setIsAdmin(false);
        localStorage.setItem('koncrecel_authorized', 'true');
        localStorage.setItem('koncrecel_is_admin', 'false');
      } else { 
        setPinError(true); 
      }
    } catch (err) { 
      setPinError(true); 
    }
    finally { setIsChecking(false); }
  };

  const handleSecretConfig = () => {
    if (pinInput === MASTER_PIN) {
      setShowConfig(true);
    }
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
      const embalagensList = item.embalagens.split(/[,;]/).map(s => s.trim()).filter(s => s !== '');
      const embalagensText = embalagensList.length > 0 ? embalagensList.join('\n') : '';
      message += `• *${item.produto}*\n${embalagensText}\n\n`;
    });

    if (method === 'whatsapp') {
      window.open(`https://wa.me/55${KONCRECEL_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      const subject = encodeURIComponent('Orçamento - Koncrecel');
      window.open(`mailto:${KONCRECEL_EMAIL}?subject=${subject}&body=${encodeURIComponent(message.replace(/\*/g, ''))}`, '_blank');
    }
    setShowSendPicker(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {!isAuthorized ? (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
          <div className="max-w-sm w-full text-center">
            {/* Gesto secreto: clicar no logo com o pin 2025 digitado abre as configs */}
            <img 
              src={processedLogoFull} 
              alt="Koncrecel" 
              onClick={handleSecretConfig}
              className="w-48 mx-auto mb-10 drop-shadow-sm cursor-default active:scale-95 transition-transform" 
            />
            <h2 className="text-xl font-black uppercase tracking-widest mb-10 text-gray-800">Koncrecel 44-9.9164.7722</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <input 
                type="text" 
                inputMode="numeric" 
                placeholder="Digite seu PIN" 
                className={`w-full text-center text-4xl py-5 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${pinError ? 'border-red-500 animate-shake text-red-500' : 'border-gray-100 focus:border-blue-500 text-gray-900'}`} 
                value={pinInput} 
                onChange={e => setPinInput(e.target.value)} 
              />
              <button type="submit" disabled={isChecking} className="w-full bg-[#000000] text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform">
                {isChecking ? "Verificando..." : "Entrar"}
              </button>
            </form>
            {/* Botão público removido daqui */}
          </div>
          {showConfig && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black uppercase text-gray-900 tracking-widest">Painel Administrativo</h3>
                  <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Planilha de Produtos (CSV)</label>
                     <input className="w-full p-4 bg-gray-50 rounded-xl border-gray-100 border text-xs outline-none focus:border-blue-500" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Planilha de Senhas (PINs)</label>
                     <input className="w-full p-4 bg-gray-50 rounded-xl border-gray-100 border text-xs outline-none focus:border-blue-500" value={securityUrl} onChange={e => setSecurityUrl(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-8">
                  <button onClick={() => { localStorage.setItem('koncrecel_sheet_url', sheetUrl); localStorage.setItem('koncrecel_security_url', securityUrl); setShowConfig(false); fetchData(); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Salvar e Atualizar</button>
                  <p className="text-[8px] text-gray-400 text-center mt-2 px-4 uppercase font-bold leading-tight">Mudar esses links afeta a origem de todos os dados do aplicativo.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-3 py-1.5 shadow-sm backdrop-blur-md bg-white/95">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center space-x-2">
                <img src={processedLogoIcon} alt="K" className="h-6 object-contain" />
                <h1 className="text-[12px] font-black uppercase tracking-tighter text-gray-900 leading-none">Koncrecel <span className="text-blue-600">44-9.9164.7722</span></h1>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Ícone de Configuração só aparece para quem usou o PIN Mestre */}
                {isAdmin && (
                  <button onClick={() => setShowConfig(true)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                )}
                <button onClick={handleFullReset} title="Reset" className="flex items-center px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">
                  <span className="text-[9px] font-black uppercase mr-1.5 tracking-widest">Reset</span>
                  <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button onClick={handleLogout} className="px-2 py-1.5 text-[9px] font-black uppercase text-red-500 border border-red-100 rounded-lg bg-red-50/20">Sair</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
              <SearchField label="Produto" placeholder="Buscar..." value={filters.produto} onChange={v => setFilters(f => ({...f, produto: v}))} />
              <SearchField label="Tipo" placeholder="Buscar..." value={filters.tipo} onChange={v => setFilters(f => ({...f, tipo: v}))} />
              <SearchField label="Uso" placeholder="Buscar..." value={filters.aplicacao} onChange={v => setFilters(f => ({...f, aplicacao: v}))} />
              <SearchField label="Base" placeholder="Buscar..." value={filters.superficie} onChange={v => setFilters(f => ({...f, superficie: v}))} />
            </div>
          </header>

          <main className="flex-1 p-2 pb-32 bg-white">
            {loading && !products.length ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-7 h-7 border-[3px] border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Carregando...</p>
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
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button onClick={() => setShowSendPicker(true)} className="w-full bg-[#000000] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between active:scale-95 transition-transform">
                <span className="ml-2 font-black uppercase text-[10px] tracking-widest">{selectedIds.size} itens na lista</span>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl">
                  <span className="text-[9px] font-black uppercase">Pedir Orçamento</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7M5 12h16" /></svg>
                </div>
              </button>
            </div>
          )}

          {showSendPicker && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-6">
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl">
                <h3 className="text-lg font-black uppercase mb-2 text-gray-900 leading-tight">Enviar Orçamento</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <button onClick={() => handleSendRequest('whatsapp')} className="bg-green-500 text-white p-4 rounded-xl font-black uppercase text-[10px] tracking-widest">WhatsApp</button>
                  <button onClick={() => handleSendRequest('email')} className="bg-blue-600 text-white p-4 rounded-xl font-black uppercase text-[10px] tracking-widest">E-mail</button>
                  <button onClick={() => setShowSendPicker(false)} className="mt-2 py-2 text-gray-300 font-bold uppercase text-[9px]">Voltar</button>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal de Configuração também pode ser aberto via cabeçalho para Admin */}
          {showConfig && isAdmin && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black uppercase text-gray-900 tracking-widest">Painel Administrativo</h3>
                  <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Planilha de Produtos (CSV)</label>
                     <input className="w-full p-4 bg-gray-50 rounded-xl border-gray-100 border text-xs outline-none focus:border-blue-500" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Planilha de Senhas (PINs)</label>
                     <input className="w-full p-4 bg-gray-50 rounded-xl border-gray-100 border text-xs outline-none focus:border-blue-500" value={securityUrl} onChange={e => setSecurityUrl(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-8">
                  <button onClick={() => { localStorage.setItem('koncrecel_sheet_url', sheetUrl); localStorage.setItem('koncrecel_security_url', securityUrl); setShowConfig(false); fetchData(); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Salvar e Atualizar</button>
                  <button onClick={() => setShowConfig(false)} className="w-full py-2 text-gray-400 font-bold uppercase text-[10px]">Fechar</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
