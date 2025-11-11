import { RegistroSaude, RegistroSaudeInputDTO, TipoRegistro } from '../../domain/RegistroSaude';
import { RegistroSaudeRepository } from '../../infrastructure/repositories/RegistroSaudeRepository';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';
import { Pet } from '../../domain/Pet';

const TIPOS_VALIDOS: readonly string[] = ['Vacina', 'Cirurgia', 'Exame', 'Observação'];

export type CreateRegistroSaudeInput = {
  userId: number;
  userType: 'Tutor' | 'Veterinário';
  data: Omit<RegistroSaudeInputDTO, 'filePath' | 'userId'> & {
    petId: number;
    fileData: { buffer: Buffer, mimeType: string, originalName: string } | null;
  };
};

export class CreateRegistroSaude {
  constructor(
    private readonly registroRepo: RegistroSaudeRepository,
    private readonly petRepo: PetRepository,
  ) {}

  execute(input: CreateRegistroSaudeInput): RegistroSaude {
    const { data, userId, userType } = input;
    const errors: Record<string, string> = {};

    const pet = this.petRepo.findById(data.petId);
    if (!pet) throw new Error('PetNotFound');
    if (pet.ownerId !== userId) throw new Error('PetAccessDenied');

    const profissionalLimpo = data.profissional?.trim() || '';
    
    if (!data.data) errors.data = 'Data é obrigatória';
    if (!data.horario) errors.horario = 'Horário é obrigatório';
    
    if (!profissionalLimpo) errors.profissional = 'Profissional é obrigatório';
    if (profissionalLimpo.length < 3 || profissionalLimpo.length > 100) errors.profissional = 'Profissional deve ter entre 3 e 100 caracteres';

    if (!data.tipoRegistro || !TIPOS_VALIDOS.includes(data.tipoRegistro)) errors.tipoRegistro = 'Tipo de registro inválido';

    if (data.fileData) {
        const mimeType = data.fileData.mimeType;
        if (!['application/pdf', 'image/png', 'image/jpeg'].includes(mimeType)) {
            errors.arquivo = 'Tipo de arquivo inválido. Apenas PDF, PNG e JPG são permitidos.';
        }
    }

    if (Object.keys(errors).length) {
      const err = new Error('ValidationError') as Error & { errors?: Record<string, string> };
      err.errors = errors;
      throw err;
    }
    
    let filePath: string | null = null;
    if (data.fileData) {
        const fileExt = data.fileData.originalName.split('.').pop();
        filePath = `/uploads/registros/${data.petId}_${Date.now()}.${fileExt}`;
    }

    const cleanedData: RegistroSaudeInputDTO & { userId: number } = {
        userId,
        petId: data.petId,
        tipoRegistro: data.tipoRegistro as TipoRegistro,
        data: data.data.trim(),
        horario: data.horario.trim(),
        profissional: profissionalLimpo,
        filePath,
    };

    return this.registroRepo.create(cleanedData);
  }
}