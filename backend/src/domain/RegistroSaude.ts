import { UserRole, UserType } from './User';

export type TipoRegistro = 'Vacina' | 'Cirurgia' | 'Exame' | 'Observação';

/**
 * Entidade que representa um Registro de Saúde (Registro Médico) no banco de dados.
 */
export interface RegistroSaude {
  id: number;
  petId: number;
  tipoRegistro: TipoRegistro;
  data: string;
  horario: string;
  profissional: string | null;
  filePath: string | null; 
  createdAt: string;
  userId: number; 
}

export interface RegistroSaudeInputDTO extends Omit<RegistroSaude, 'id' | 'createdAt' | 'userId' | 'filePath'> {
    filePath: string | null;
}

export interface CreateRegistroSaudeInput extends RegistroSaudeInputDTO {
    file: Buffer | null; 
}