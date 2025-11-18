import { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { API_BASE_URL } from '../../lib/api';
import { DespesaFinanceira, DespesaSummary, CategoriaDespesa } from '../../types/DespesaFinanceira';
import { Pet } from '../../types/Pet';

interface DespesaListProps {
  onEdit: (despesa: DespesaFinanceira) => void;
  onRefresh: () => void;
}

export function DespesaList({ onEdit, onRefresh }: DespesaListProps) {
  const { token } = useAuth();
  const [despesas, setDespesas] = useState<DespesaFinanceira[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [summary, setSummary] = useState<DespesaSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filtros
  const [filterPet, setFilterPet] = useState<number | ''>('');
  const [filterCategoria, setFilterCategoria] = useState<CategoriaDespesa | ''>('');

  useEffect(() => {
    loadData();
  }, [token, filterPet, filterCategoria]);

  async function loadData() {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      // Buscar pets
      const resPets = await fetch(`${API_BASE_URL}/pets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resPets.ok) {
        const dataPets = await resPets.json();
        setPets(dataPets);
      }

      // Buscar despesas com filtros
      const params = new URLSearchParams();
      if (filterPet) params.append('petId', String(filterPet));
      if (filterCategoria) params.append('categoria', filterCategoria);

      const [resDespesas, resSummary] = await Promise.all([
        fetch(`${API_BASE_URL}/despesas?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/despesas/summary?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resDespesas.ok) {
        const dataDespesas = await resDespesas.json();
        setDespesas(dataDespesas);
      }

      if (resSummary.ok) {
        const dataSummary = await resSummary.json();
        setSummary(dataSummary);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar despesas');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/despesas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Erro ao deletar' }));
        throw new Error(data.message);
      }

      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar despesa');
    }
  }

  const categoriaEmoji: Record<CategoriaDespesa, string> = {
    'Alimentação': '🍖',
    'Saúde': '💊',
    'Higiene': '🛁',
    'Acessórios': '🎀',
    'Hospedagem': '🏠',
    'Transporte': '🚗',
    'Outros': '📦',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Carregando...</div>;

  return (
    <div>
      {/* Resumo Financeiro */}
      {summary && (
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))', 
          borderRadius: 'var(--radius-lg)', 
          padding: 24, 
          marginBottom: 24,
          border: '2px solid var(--border)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            💰 Total Gasto: R$ {summary.total.toFixed(2)}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {Object.entries(summary.porCategoria).map(([cat, valor]) => (
              valor > 0 && (
                <div key={cat} style={{ background: 'var(--surface)', padding: 12, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{categoriaEmoji[cat as CategoriaDespesa]}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>{cat}</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                    R$ {valor.toFixed(2)}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ marginBottom: 8 }}>Filtrar por Pet:</label>
          <select 
            value={filterPet} 
            onChange={(e) => setFilterPet(e.target.value ? Number(e.target.value) : '')}
            style={{ padding: 12 }}
          >
            <option value="">Todos os pets</option>
            {pets.map(pet => (
              <option key={pet.id} value={pet.id}>{pet.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ marginBottom: 8 }}>Filtrar por Categoria:</label>
          <select 
            value={filterCategoria} 
            onChange={(e) => setFilterCategoria(e.target.value as CategoriaDespesa | '')}
            style={{ padding: 12 }}
          >
            <option value="">Todas as categorias</option>
            {Object.keys(categoriaEmoji).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={{ color: 'var(--error)', marginBottom: 16, padding: 12, background: 'rgba(255, 107, 107, 0.1)', borderRadius: 'var(--radius-md)' }}>{error}</div>}

      {despesas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)' }}>Nenhuma despesa cadastrada</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Clique em "Nova Despesa" para começar</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {despesas.map(despesa => {
            const pet = pets.find(p => p.id === despesa.petId);
            return (
              <div 
                key={despesa.id} 
                className="card"
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: 20,
                  gap: 16,
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 300px' }}>
                  <div style={{ fontSize: 32 }}>{categoriaEmoji[despesa.categoria]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                        {despesa.descricao}
                      </h4>
                      <span style={{ 
                        padding: '4px 12px', 
                        background: 'var(--primary-light)', 
                        color: 'var(--primary-dark)', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: 'var(--text-xs)', 
                        fontWeight: 'var(--font-semibold)' 
                      }}>
                        {despesa.categoria}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      🐾 {pet?.name || 'Pet não encontrado'} • 📅 {new Date(despesa.data).toLocaleDateString('pt-BR')}
                    </div>
                    {despesa.observacoes && (
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 8, fontStyle: 'italic' }}>
                        💭 {despesa.observacoes}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    fontSize: 'var(--text-xl)', 
                    fontWeight: 'var(--font-bold)', 
                    color: 'var(--success)',
                    marginRight: 8
                  }}>
                    R$ {despesa.valor.toFixed(2)}
                  </div>
                  <button 
                    data-testid={`despesa-edit-${despesa.id}`}
                    onClick={() => onEdit(despesa)} 
                    className="secondary"
                    style={{ padding: '8px 16px', fontSize: 'var(--text-sm)' }}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    data-testid={`despesa-delete-${despesa.id}`}
                    onClick={() => handleDelete(despesa.id)} 
                    className="danger"
                    style={{ padding: '8px 16px', fontSize: 'var(--text-sm)' }}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

