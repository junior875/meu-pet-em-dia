import { PetSpecies } from "./Pet";
import { UserType } from "./User";

export type TipoRegistro = 'Vacina' | 'Cirurgia' | 'Exame' | 'Observação';

export interface RegistroSaude {
  id: number;
  petId: number;
  userId: number;
  tipoRegistro: TipoRegistro;
  data: string;
  horario: string;
  profissional: string; 
  filePath: string | null;
  createdAt: string;
}

export type RegistroSaudeInputDTO = Omit<RegistroSaude, 'id' | 'createdAt' | 'userId'>;

export type RegistroSaudeFormFields = Omit<RegistroSaudeInputDTO, 'filePath'> & {
    petId: string;
    file: File | null;
};

export type RegistroSaudeItem = RegistroSaude & { 
  petName: string; 
  petSpecies: PetSpecies;
};