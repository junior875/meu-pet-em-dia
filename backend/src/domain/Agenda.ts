export type Procedimento =
  | 'Banho/Tosa'
  | 'Vacina'
  | 'Vermifugo'
  | 'Antipulgas'
  | 'Consulta'
  | 'Outros';

export interface Agenda {
  id: number;
  petId: number;
  procedimento: Procedimento;
  data: string;
  horario: string;
  profissional: string | null;
  observacoes: string | null;
  avaliacaoNota?: number | null; 
  avaliacaoComentario?: string | null;
  createdAt: string;
}

export interface AgendaInputDTO extends Omit<Agenda, 'id' | 'createdAt' | 'avaliacaoNota' | 'avaliacaoComentario'> {}