
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SearchFilters } from './types';
import SearchField from './components/SearchField';
import ProductTable from './components/ProductTable';

const MASTER_PIN = '2025';
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL6WsNyflZ2dg_hWRU8fdqk5VWYVhp4ymIVMa0Wv50onOu_7elzdPeO5RkzPHlQ0OHDI0AgfRmo2lh/pub?gid=0&single=true&output=csv';
const DEFAULT_SECURITY_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL6WsNyflZ2dg_hWRU8fdqk5VWYVhp4ymIVMa0Wv50onOu_7elzdPeO5RkzPHlQ0OHDI0AgfRmo2lh/pub?gid=1675041371&single=true&output=csv';

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(() => localStorage.getItem('koncrecel_authorized') === 'true');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('koncrecel_sheet_url') || DEFAULT_SHEET_URL);
  const [securityUrl, setSecurityUrl] = useState(() => localStorage.getItem('koncrecel_security_url') || DEFAULT_SECURITY_URL);
  const [publicAppUrl, setPublicAppUrl] = useState(() => localStorage.getItem('koncrecel_public_url') || '');
  
  const [showConfig, setShowConfig] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [tempSheetUrl, setTempSheetUrl] = useState(sheetUrl);
  const [tempSecurityUrl, setTempSecurityUrl] = useState(securityUrl);
  const [tempPublicUrl, setTempPublicUrl] = useState(publicAppUrl);
  const [copied, setCopied] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    produto: '', atributos: '', aplicacao: '', superficie: '', embalagens: '', detalhes: ''
  });

  const isEditingLink = window.location.href.includes('drive') || window.location.href.includes('fullscreenApplet=true');

  const cleanUrl = (url: string) => url.replace(/\s/g, '').trim();

  const parseCSV = (text: string): string[][] => {
    const trimmed = text.trim();
    if (trimmed.toLowerCase().includes('<!doctype') || trimmed.toLowerCase().includes('<html')) {
      throw new Error("Link da Planilha inválido. Verifique se publicou como CSV.");
    }
    const rows: string[][] = [];
    const lines = trimmed.split(/\r?\n/);
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
    const activeSheetUrl = localStorage.getItem('koncrecel_sheet_url') || sheetUrl;
    if (!isAuthorized || !activeSheetUrl) return;
    try {
      setLoading(true);
      setError(null);
      const url = cleanUrl(activeSheetUrl);
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Falha ao carregar dados da Koncrecel.`);
      const text = await response.text();
      const rows = parseCSV(text);
      const header = rows[0].map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      const findIdx = (names: string[], fb: number) => {
        const i = header.findIndex(h => names.some(n => h.includes(n)));
        return i !== -1 ? i : fb;
      };
      const idx = {
        produto: findIdx(['produto', 'nome'], 0),
        atributos: findIdx(['atributo', 'carac'], 1),
        aplicacao: findIdx(['aplicacao', 'onde'], 2),
        superficie: findIdx(['superficie', 'base'], 3),
        embalagens: findIdx(['embalagem'], 4),
        detalhes: findIdx(['detalhe'], 5)
      };
      const mapped = rows.slice(1).map(f => ({
        produto: f[idx.produto] || 'Sem Nome',
        atributos: f[idx.atributos] || '',
        aplicacao: f[idx.aplicacao] || '',
        superficie: f[idx.superficie] || '',
        embalagens: f[idx.embalagens] || '',
        detalhes: f[idx.detalhes] || ''
      })).filter(p => p.produto !== 'Sem Nome');
      setProducts(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAuthorized) fetchData(); }, [isAuthorized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === MASTER_PIN) {
      setIsAuthorized(true);
      localStorage.setItem('koncrecel_authorized', 'true');
      setPinInput(''); return;
    }
    setIsChecking(true);
    setPinError(false);
    try {
      const activeSecUrl = localStorage.getItem('koncrecel_security_url') || securityUrl;
      const response = await fetch(`${cleanUrl(activeSecUrl)}${activeSecUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
      const text = await response.text();
      if (parseCSV(text).flat().map(p => p?.toString().trim()).includes(pinInput)) {
        setIsAuthorized(true);
        localStorage.setItem('koncrecel_authorized', 'true');
        setPinInput('');
      } else { setPinError(true); }
    } catch { setPinError(true); }
    finally { setIsChecking(false); }
  };

  const handleLogout = () => {
    if (confirm("Deseja sair do catálogo Koncrecel?")) {
      setIsAuthorized(false);
      localStorage.removeItem('koncrecel_authorized');
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('koncrecel_sheet_url', tempSheetUrl.trim());
    localStorage.setItem('koncrecel_security_url', tempSecurityUrl.trim());
    localStorage.setItem('koncrecel_public_url', tempPublicUrl.trim());
    setSheetUrl(tempSheetUrl.trim());
    setSecurityUrl(tempSecurityUrl.trim());
    setPublicAppUrl(tempPublicUrl.trim());
    setShowConfig(false);
    if (isAuthorized) fetchData();
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const match = (f: string, v: string) => !v || f.toLowerCase().includes(v.toLowerCase());
      return match(p.produto, filters.produto) &&
             match(p.atributos, filters.atributos) &&
             match(p.aplicacao, filters.aplicacao) &&
             match(p.superficie, filters.superficie);
    });
  }, [filters, products]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100 text-center">
          <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-10 shadow-xl">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#000000]">Koncrecel <span className="text-blue-600">Catálogo</span></h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2 mb-10">Acesso Restrito</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" inputMode="numeric" placeholder="PIN" className={`w-full text-center text-4xl tracking-[0.3em] py-6 bg-gray-50 border-2 rounded-[2rem] outline-none transition-all ${pinError ? 'border-red-500 animate-shake text-red-500' : 'border-gray-100 focus:border-blue-500 text-[#000000]'}`} value={pinInput} onChange={e => setPinInput(e.target.value)} autoFocus />
            <button type="submit" disabled={isChecking} className="w-full bg-blue-600 text-white font-black py-6 rounded-[2rem] shadow-xl uppercase text-xs tracking-widest">{isChecking ? "Validando..." : "Entrar"}</button>
          </form>
          <button onClick={() => setShowConfig(true)} className="mt-12 text-[9px] text-gray-300 hover:text-blue-500 uppercase font-black tracking-widest">Ajustes Koncrecel</button>
        </div>
        {showConfig && <ConfigModal tempSheetUrl={tempSheetUrl} setTempSheetUrl={setTempSheetUrl} tempSecurityUrl={tempSecurityUrl} setTempSecurityUrl={setTempSecurityUrl} tempPublicUrl={tempPublicUrl} setTempPublicUrl={setTempPublicUrl} onSave={handleSaveConfig} onClose={() => setShowConfig(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {isEditingLink && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-[9px] font-black uppercase tracking-widest z-50">
          Link de edição detectado. Para seus clientes, utilize a URL configurada nos ajustes. <button onClick={() => setShowConfig(true)} className="underline ml-2">Configurar</button>
        </div>
      )}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-2xl text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-[#000000]">Koncrecel <span className="text-blue-600">Busca</span></h1>
            </div>
            <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
              <HeaderBtn onClick={() => setShowShare(true)} icon="share" />
              <HeaderBtn onClick={fetchData} icon="refresh" loading={loading} />
              <HeaderBtn onClick={() => setShowConfig(true)} icon="settings" />
              <div className="w-px h-4 bg-gray-300 mx-2"></div>
              <HeaderBtn onClick={handleLogout} icon="logout" color="red" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SearchField label="Produto" placeholder="Pesquisar..." value={filters.produto} onChange={v => setFilters(f => ({...f, produto: v}))} />
            <SearchField label="Atributos" placeholder="Pesquisar..." value={filters.atributos} onChange={v => setFilters(f => ({...f, atributos: v}))} />
            <SearchField label="Aplicação" placeholder="Pesquisar..." value={filters.aplicacao} onChange={v => setFilters(f => ({...f, aplicacao: v}))} />
            <SearchField label="Superfície" placeholder="Pesquisar..." value={filters.superficie} onChange={v => setFilters(f => ({...f, superficie: v}))} />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {error ? (
          <div className="bg-white p-10 rounded-[3rem] border-2 border-red-50 text-center max-w-md mx-auto shadow-2xl">
            <h4 className="text-red-600 font-black uppercase mb-4 text-sm">Problema Técnico</h4>
            <div className="text-[11px] font-bold text-gray-400 leading-relaxed mb-8 uppercase tracking-wider">{error}</div>
            <button onClick={() => setShowConfig(true)} className="w-full bg-blue-600 text-white py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest">Revisar Configurações</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
             <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
             <span className="text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]">Carregando Koncrecel...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <span className="text-[10px] font-black text-[#000000] uppercase tracking-widest font-bold">{filteredProducts.length} PRODUTOS ENCONTRADOS</span>
            </div>
            <ProductTable products={filteredProducts} highlight={filters} />
          </div>
        )}
      </main>
      {showShare && <ShareModal onClose={() => setShowShare(false)} copied={copied} setCopied={setCopied} publicAppUrl={publicAppUrl} />}
      {showConfig && <ConfigModal tempSheetUrl={tempSheetUrl} setTempSheetUrl={setTempSheetUrl} tempSecurityUrl={tempSecurityUrl} setTempSecurityUrl={setTempSecurityUrl} tempPublicUrl={tempPublicUrl} setTempPublicUrl={setTempPublicUrl} onSave={handleSaveConfig} onClose={() => setShowConfig(false)} />}
    </div>
  );
};

const HeaderBtn: React.FC<any> = ({ onClick, icon, loading, color = 'blue' }) => {
  const icons: any = {
    share: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />,
    refresh: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  };
  return <button onClick={onClick} className={`p-2.5 rounded-2xl transition-all ${color === 'red' ? 'text-red-400 hover:bg-red-50' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}><svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{icons[icon]}</svg></button>;
};

const ConfigModal: React.FC<any> = ({ tempSheetUrl, setTempSheetUrl, tempSecurityUrl, setTempSecurityUrl, tempPublicUrl, setTempPublicUrl, onSave, onClose }) => {
  const isWrongLink = tempPublicUrl.includes('drive') || tempPublicUrl.includes('fullscreenApplet=true');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 text-center font-bold text-[#000000]">Painel Koncrecel</h3>
        
        <div className="space-y-8">
          <ConfigInput label="Tabela de Produtos (CSV)" value={tempSheetUrl} onChange={setTempSheetUrl} />
          <ConfigInput label="Tabela de PINs/Acesso (CSV)" value={tempSecurityUrl} onChange={setTempSecurityUrl} />
          
          <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${isWrongLink ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'}`}>
             <ConfigInput 
                label="URL do Aplicativo Publicado" 
                value={tempPublicUrl} 
                onChange={setTempPublicUrl} 
                placeholder="Ex: https://aistudio.google.com/app/..." 
             />
             
             {isWrongLink && (
               <div className="mt-6 p-5 bg-white rounded-3xl border border-amber-100 shadow-sm space-y-4">
                  <p className="text-[11px] text-amber-700 font-black uppercase flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    URL de Edição (Aviso)
                  </p>
                  
                  <div className="space-y-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Como obter o link certo:</p>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                        <p className="text-[9px] text-gray-600 leading-relaxed font-bold uppercase">
                          1. No Share, ative <span className="text-blue-600">"Publish"</span> e <span className="text-blue-600">"Full screen"</span><br/>
                          2. O link mudará para <span className="bg-blue-600 text-white px-1">.../app/ID</span><br/>
                          3. <span className="text-blue-600">Copie esse novo link</span> e cole aqui.
                        </p>
                    </div>
                  </div>
               </div>
             )}
          </div>

          <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Hospedagem Koncrecel (GitHub/Vercel)</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed mb-4 px-4">
                Sempre use links CSV diretos do Google Sheets para que as alterações reflitam em tempo real.
              </p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4 mt-12">
          <button onClick={onSave} className="bg-blue-600 text-white font-black py-6 rounded-[2rem] text-sm shadow-xl uppercase tracking-widest hover:bg-blue-700 transition-colors">Salvar Dados</button>
          <button onClick={onClose} className="py-2 text-gray-300 text-[10px] font-black uppercase hover:text-gray-500 text-center tracking-widest">Fechar</button>
        </div>
      </div>
    </div>
  );
};

const ConfigInput: React.FC<any> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-[#000000] uppercase tracking-widest block px-2 font-bold">{label}</label>
    <textarea className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] text-[12px] outline-none font-mono min-h-[80px] focus:border-blue-500 focus:bg-white transition-all shadow-inner text-[#000000]" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Link aqui..."} />
  </div>
);

const ShareModal: React.FC<any> = ({ onClose, copied, setCopied, publicAppUrl }) => {
  const currentUrl = publicAppUrl || window.location.href;
  const isWrongLink = currentUrl.includes('drive');

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Catálogo de Produtos Koncrecel - Acesse aqui: ${currentUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white rounded-[4rem] shadow-2xl p-10 w-full max-w-sm border border-gray-100 text-center relative animate-in fade-in zoom-in duration-500">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-gray-600"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-10 text-[#000000]">Compartilhar</h3>
        
        <div className={`p-8 rounded-[3.5rem] inline-block mb-10 border-2 transition-all ${isWrongLink ? 'bg-amber-50 border-amber-100 shadow-xl shadow-amber-50' : 'bg-gray-50 border-gray-100 shadow-inner'}`}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}&margin=15&color=${isWrongLink ? 'b45309' : '2563eb'}`} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
        </div>

        <div className="mb-10 px-4">
            <p className="text-[10px] font-black text-[#000000] uppercase tracking-widest mb-3 font-bold">Link do Catálogo Koncrecel</p>
            <div className={`p-4 rounded-2xl border overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-mono font-bold transition-all ${isWrongLink ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                {currentUrl}
            </div>
            {isWrongLink && (
              <p className="mt-3 text-[9px] text-amber-600 font-black uppercase tracking-wider font-bold">Modo de Edição (Somente você)</p>
            )}
        </div>

        <div className="flex flex-col space-y-4">
            <button onClick={handleWhatsApp} className={`w-full py-5 rounded-3xl text-white text-[12px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center space-x-3 transition-all bg-green-500 active:scale-95`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>WhatsApp</span>
            </button>
            <button onClick={handleCopy} className={`w-full py-5 rounded-3xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-3 active:scale-95 ${copied ? 'bg-blue-600 text-white shadow-2xl shadow-blue-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                <span>{copied ? '✓ COPIADO!' : 'COPIAR LINK'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;
