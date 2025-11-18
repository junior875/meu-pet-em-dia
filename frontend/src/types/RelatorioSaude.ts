import { Pet } from './Pet';

export type TipoRegistroSaude = 'Vacina' | 'Consulta' | 'Cirurgia' | 'Exame' | 'Medicamento' | 'Outros';

export interface RegistroSaudeRelatorio {
  id: number;
  petId: number;
  tipo: TipoRegistroSaude;
  data: string;
  horario: string;
  profissional: string;
  observacoes: string | null;
  arquivoPath: string | null;
  createdAt: string;
}

export interface RelatorioSaude {
  pet: Pet;
  periodo: {
    inicio: string | null;
    fim: string | null;
  };
  registros: RegistroSaudeRelatorio[];
  resumo: {
    totalRegistros: number;
    porTipo: Record<string, number>;
  };
  geradoEm: string;
}

