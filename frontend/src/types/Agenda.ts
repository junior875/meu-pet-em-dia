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
  createdAt: string;
}

export type AgendaInputDTO = Omit<Agenda, 'id' | 'createdAt'>;

export type AgendaFormFields = Omit<AgendaInputDTO, 'petId'> & {
  petId: string;
};