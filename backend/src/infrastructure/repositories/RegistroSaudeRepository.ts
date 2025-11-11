import { RegistroSaude, RegistroSaudeInputDTO, TipoRegistro } from '../../domain/RegistroSaude';

export interface RegistroSaudeRepository {
    create(data: RegistroSaudeInputDTO & { userId: number }): RegistroSaude;
    update(id: number, data: Partial<RegistroSaudeInputDTO>): RegistroSaude;
    delete(id: number): void;
    findById(id: number): RegistroSaude | null;
    findAll(ownerId: number): RegistroSaude[]; 
    findByPetId(petId: number, filter?: { tipoRegistro?: TipoRegistro }): RegistroSaude[];
}