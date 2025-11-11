import { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '@lib/api';
import { Agenda } from '../../types/Agenda';
import { Pet, PetSpecies } from '../../types/Pet';
import { useToast } from './Toast';

interface AgendaListProps {
  onEdit: (a: Agenda) => void;
  onRefresh: () => void;
  refreshKey: number;
}

type AgendaItem = Agenda & { petName: string; petSpecies: PetSpecies };

export function AgendaList({ onEdit, onRefresh, refreshKey }: AgendaListProps) {
  const { showToast, ToastComponent } = useToast();
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<'Todos' | PetSpecies>('Todos');
  const SPECIES_OPTIONS: PetSpecies[] = ['Cachorro', 'Cavalo', 'Gato', 'Outros'];

  async function loadAgendasByFilter() {
    setLoading(true);
    setError('');
    
    let pets: Pet[] = [];
    try {
      const params = new URLSearchParams();
      if (filterName.trim()) params.set('name', filterName.trim());
      if (filterSpecies !== 'Todos') params.set('species', filterSpecies);
      
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/pets?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (!res.ok) {
        throw new Error('Falha ao carregar a lista de Pets para o filtro.');
      }
      pets = await res.json();
      if (!Array.isArray(pets)) pets = [];
      
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lista de Pets.');
      setLoading(false);
      return;
    }

    if (pets.length === 0) {
        setAgendas([]);
        setLoading(false);
        return;
    }
    
    const promises = pets.map(async (pet) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/agenda/pet/${pet.id}`, { headers: { Authorization: `Bearer ${token}` } });
            const agendaList = await res.json();
            
            return (Array.isArray(agendaList) ? agendaList : []).map((a: Agenda) => ({
                ...a,
                petName: pet.name,
                petSpecies: pet.species,
            }) as AgendaItem);
        } catch (err) {
            console.error(`Falha ao carregar agenda para Pet ID ${pet.id}`);
            return [] as AgendaItem[];
        }
    });

    try {
        const results = await Promise.all(promises);
        const allAgendas = results.flat();
        setAgendas(allAgendas);
    } catch (err) {
        setError('Erro ao consolidar agendas.');
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => { 
      loadAgendasByFilter(); 
  }, [refreshKey]);

  async function onDelete(id: number) {
    if (!confirm('Deseja remover este agendamento?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/agenda/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status !== 204) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erro ao deletar.');
      }

      showToast('Agendamento removido com sucesso!', 'success');
      onRefresh();
    } catch (error: any) {
      showToast(error.message || 'Erro ao remover agendamento.', 'error');
    }
  }
  
  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>⏳ Carregando agenda...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: 32, color: 'var(--error)' }}>{error}</div>;


  return (
    <div style={{ padding: '24px 0' }}>
      {ToastComponent}
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        
        <div style={{ minWidth: 200, flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Nome do Pet</label>
          <input 
              value={filterName} 
              onChange={(e) => setFilterName(e.target.value)} 
              placeholder="Buscar por nome do pet" 
              style={{ width: '100%' }} 
          />
        </div>
        
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
        
        <button onClick={loadAgendasByFilter} style={{ minWidth: 140 }}>🔍 Buscar</button>
      </div>

      <div style={{ marginTop: 24 }}>
          
          {!agendas.length ? (
            <div style={{ textAlign: 'center', padding: 48, border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--background)' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🗓️</div>
                <p style={{ color: 'var(--text-secondary)' }}>Nenhum agendamento encontrado para os filtros atuais.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                <thead>
                    <tr style={{ background: 'var(--background)' }}>
                      <th style={{ padding: 12, textAlign: 'left' }}>Pet</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Espécie</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Data</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Horário</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Procedimento</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Profissional</th>
                      <th style={{ padding: 12, textAlign: 'center', width: 140 }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {agendas.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12, fontWeight: 600 }}>{a.petName}</td>
                        <td style={{ padding: 12 }}>{a.petSpecies}</td>
                        <td style={{ padding: 12 }}>{a.data}</td>
                        <td style={{ padding: 12 }}>{a.horario}</td>
                        <td style={{ padding: 12 }}>{a.procedimento}</td>
                        <td style={{ padding: 12 }}>{a.profissional || '-'}</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button data-testid={`agenda-edit-${a.id}`} onClick={() => onEdit(a)} style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}>
                              ✏️ Editar
                            </button>
                            <button data-testid={`agenda-delete-${a.id}`} className="danger" onClick={() => onDelete(a.id)} style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}>
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