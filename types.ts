
export interface Product {
  produto: string;
  tipo: string;
  aplicacao: string;
  superficie: string;
  embalagens: string;
  caracteristica: string;
  fotos: string[]; // Array para suportar carrossel
  cores: string;
  rendimento: string;
}

export interface SearchFilters {
  produto: string;
  tipo: string;
  aplicacao: string;
  superficie: string;
}
