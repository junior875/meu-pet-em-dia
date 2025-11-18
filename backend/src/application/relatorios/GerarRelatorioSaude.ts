import type { PetRepository } from '../../infrastructure/repositories/PetRepository';
import type { RegistroSaudeRepository } from '../../infrastructure/repositories/RegistroSaudeRepository';
import type { Pet } from '../../domain/Pet';
import type { RegistroSaude } from '../../domain/RegistroSaude';

interface RelatorioSaudeInput {
  petId: number;
  userId: number;
  dataInicio?: string;
  dataFim?: string;
}

interface RegistroRelatorio {
  id: number;
  petId: number;
  tipo: string;
  data: string;
  horario: string;
  profissional: string | null;
  observacoes: string | null;
  arquivoPath: string | null;
  createdAt: string;
}

interface RelatorioSaude {
  pet: Pet;
  periodo: {
    inicio: string | null;
    fim: string | null;
  };
  registros: RegistroRelatorio[];
  resumo: {
    totalRegistros: number;
    porTipo: Record<string, number>;
  };
  geradoEm: string;
}

export class GerarRelatorioSaude {
  constructor(
    private readonly petRepo: PetRepository,
    private readonly registroRepo: RegistroSaudeRepository
  ) {}

  execute(input: RelatorioSaudeInput): RelatorioSaude {
    // Verificar se o pet existe
    const pet = this.petRepo.findById(input.petId);
    if (!pet) {
      throw new Error('Pet não encontrado');
    }

    // Verificar se o pet pertence ao usuário
    if (pet.ownerId !== input.userId) {
      throw new Error('Você não tem permissão para visualizar este relatório');
    }

    // Buscar registros de saúde
    let registros = this.registroRepo.findByPetId(input.petId);

    // Filtrar por período se fornecido
    if (input.dataInicio) {
      registros = registros.filter(r => r.data >= input.dataInicio!);
    }
    if (input.dataFim) {
      registros = registros.filter(r => r.data <= input.dataFim!);
    }

    // Ordenar por data (mais recente primeiro)
    registros.sort((a, b) => {
      if (a.data !== b.data) {
        return b.data.localeCompare(a.data);
      }
      return b.horario.localeCompare(a.horario);
    });

    // Mapear registros para formato do relatório
    const registrosRelatorio: RegistroRelatorio[] = registros.map(r => ({
      id: r.id,
      petId: r.petId,
      tipo: r.tipoRegistro, // Mapeia tipoRegistro para tipo
      data: r.data,
      horario: r.horario,
      profissional: r.profissional,
      observacoes: null, // registros_saude não tem observações, mas o frontend espera
      arquivoPath: r.filePath, // Mapeia filePath para arquivoPath
      createdAt: r.createdAt,
    }));

    // Calcular resumo
    const resumoPorTipo: Record<string, number> = {};
    for (const registro of registrosRelatorio) {
      resumoPorTipo[registro.tipo] = (resumoPorTipo[registro.tipo] || 0) + 1;
    }

    return {
      pet,
      periodo: {
        inicio: input.dataInicio || null,
        fim: input.dataFim || null,
      },
      registros: registrosRelatorio,
      resumo: {
        totalRegistros: registrosRelatorio.length,
        porTipo: resumoPorTipo,
      },
      geradoEm: new Date().toISOString(),
    };
  }
}

