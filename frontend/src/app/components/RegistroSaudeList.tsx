import { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '@lib/api';
import { RegistroSaude, RegistroSaudeItem, TipoRegistro } from '../../types/RegistroSaude';
import { PetSpecies } from '../../types/Pet';
import { useToast } from './Toast';

interface RegistroSaudeListProps {
  onEdit: (r: RegistroSaude) => void;
  onRefresh: () => void;
  refreshKey: number;
}

export function RegistroSaudeList({ onEdit, onRefresh, refreshKey }: RegistroSaudeListProps) {
  const { showToast, ToastComponent } = useToast();
  // Estado que armazena os dados brutos da API (com petName e petSpecies anexados)
  const [allRegistros, setAllRegistros] = useState<RegistroSaudeItem[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // ESTADOS DO FILTRO (RFS16 e padrão PetList)
  const [filterType, setFilterType] = useState<'Todos' | TipoRegistro>('Todos');
  const [filterName, setFilterName] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<'Todos' | PetSpecies>('Todos');
  const [searchTrigger, setSearchTrigger] = useState(0); // Dispara a busca
  
  const TIPOS_OPTIONS: TipoRegistro[] = ['Vacina', 'Cirurgia', 'Exame', 'Observação'];
  const SPECIES_OPTIONS: PetSpecies[] = ['Cachorro', 'Cavalo', 'Gato', 'Outros'];

  // Função para buscar TODOS os registros do usuário
  async function loadAllRegistros() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // A rota findAll deve retornar registros_saude com petName e petSpecies anexados
      const res = await fetch(`${API_BASE_URL}/registros_saude`, { headers: { Authorization: `Bearer ${token}` } });
      
      if (!res.ok) {
        throw new Error('Falha ao carregar os registros de saúde.');
      }
      
      const data: RegistroSaudeItem[] = await res.json();
      setAllRegistros(Array.isArray(data) ? data : []);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar registros.');
    } finally {
      setLoading(false);
    }
  }

  // Efeito 1: Carregar todos os dados na montagem e no refresh
  useEffect(() => { 
      loadAllRegistros(); 
  }, [refreshKey]); 

  // Efeito 2: Filtrar os dados no frontend (disparado pelo searchTrigger ou mudança de filtro)
  const filteredRegistros = useMemo(() => {
    // RFS16: Aplica a ordenação decrescente por data/horário (se não tiver sido feito no backend)
    let lista = allRegistros;

    // 1. Filtrar por Tipo de Registro
    if (filterType !== 'Todos') {
        lista = lista.filter(r => r.tipoRegistro === filterType);
    }
    
    // 2. Filtrar por Nome do Pet (Case-insensitive)
    if (filterName.trim()) {
        const nomeLower = filterName.trim().toLowerCase();
        lista = lista.filter(r => r.petName.toLowerCase().includes(nomeLower));
    }
    
    // 3. Filtrar por Espécie
    if (filterSpecies !== 'Todos') {
        lista = lista.filter(r => r.petSpecies === filterSpecies);
    }

    return lista;
  }, [allRegistros, filterType, filterName, filterSpecies, searchTrigger]); // searchTrigger força a reexecução na busca

  async function onDelete(id: number, tipo: TipoRegistro) {
    // RFS15: Mensagem de confirmação antes da remoção
    if (!confirm(`Deseja remover este registro do tipo ${tipo}? Esta ação só é permitida para Observações criadas por você.`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/registros_saude/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 204) {
        showToast('Registro removido com sucesso!', 'success');
        onRefresh(); // Dispara o recarregamento
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Erro ao deletar.');
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao remover registro.', 'error');
    }
  }
  
  const handleSearch = () => {
    // Dispara a reexecução do useMemo para aplicar os filtros atuais
    setSearchTrigger(t => t + 1);
  };
  
  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>⏳ Carregando registros...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: 32, color: 'var(--error)' }}>{error}</div>;


  return (
    <div style={{ padding: '24px 0' }}>
      {ToastComponent}
      
      {/* Barra de Filtros (Estilo PetList.tsx) */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        
        {/* Filtro Nome do Pet */}
        <div style={{ minWidth: 200, flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Nome</label>
          <input 
              type="text"
              value={filterName} 
              onChange={(e) => setFilterName(e.target.value)} 
              placeholder="Buscar por nome do pet" 
              style={{ width: '100%' }} 
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
        </div>

        {/* Filtro Espécie */}
        <div style={{ minWidth: 200 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Espécie</label>
          <select 
              value={filterSpecies} 
              onChange={(e) => setFilterSpecies(e.target.value as 'Todos' | PetSpecies)}
          >
            <option value="Todos">Todas</option>
            {SPECIES_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        
        {/* Filtro Tipo de Registro (RFS16) */}
        <div style={{ minWidth: 200 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Tipo de Registro</label>
          <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as 'Todos' | TipoRegistro)}
          >
            <option value="Todos">Todos os Tipos</option>
            {TIPOS_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        
        {/* Botão Buscar (Aciona o filtro do useMemo) */}
        <button onClick={handleSearch} style={{ minWidth: 140 }}>🔍 Buscar</button>
      </div>

      {/* LISTAGEM DOS REGISTROS */}
      <div style={{ marginTop: 24 }}>
          
          {!filteredRegistros.length ? (
            <div style={{ textAlign: 'center', padding: 48, border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--background)' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📜</div>
                <p style={{ color: 'var(--text-secondary)' }}>Nenhum registro encontrado para os filtros atuais.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                <thead>
                    <tr style={{ background: 'var(--background)' }}>
                      <th style={{ padding: 12, textAlign: 'left' }}>Pet</th> 
                      <th style={{ padding: 12, textAlign: 'left' }}>Tipo</th> 
                      <th style={{ padding: 12, textAlign: 'left' }}>Data/Hora</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Profissional</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Arquivo</th>
                      <th style={{ padding: 12, textAlign: 'center', width: 140 }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRegistros.map((r, idx) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'var(--surface)' : 'var(--background)' }}>
                        <td style={{ padding: 12, fontWeight: 600 }}>{r.petName}</td>
                        <td style={{ padding: 12 }}>{r.tipoRegistro}</td>
                        <td style={{ padding: 12 }}>{r.data} às {r.horario}</td>
                        <td style={{ padding: 12 }}>{r.profissional}</td>
                        <td style={{ padding: 12 }}>
                            {r.filePath ? (
                                <a href={`${API_BASE_URL}${r.filePath}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                    Visualizar Anexo
                                </a>
                            ) : '-'}
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button data-testid={`registro-edit-${r.id}`} onClick={() => onEdit(r)} style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}>
                              ✏️ Editar
                            </button>
                            <button 
                              data-testid={`registro-delete-${r.id}`} 
                              className="danger" 
                              onClick={() => onDelete(r.id, r.tipoRegistro)} 
                              style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}
                            >
                              🗑️ Excluir
                            </button>
                          </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
              </div>
          )}
      </div>
    </div>
  );
}