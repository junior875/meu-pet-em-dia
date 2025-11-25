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

  // Calcular insights adicionais
  const calcularInsights = () => {
    if (!summary || despesas.length === 0) return null;

    const totalDespesas = despesas.length;
    const mediaGasto = summary.total / totalDespesas;
    const categorias = Object.entries(summary.porCategoria).filter(([_, v]) => v > 0);
    const categoriaMaisCara = categorias.reduce((max, [cat, val]) => val > max.valor ? { categoria: cat, valor: val } : max, { categoria: '', valor: 0 });
    const percentualCategoriaMaisCara = (categoriaMaisCara.valor / summary.total) * 100;
    
    // Gastos por pet
    const gastosPorPet: Record<number, { nome: string; total: number; quantidade: number }> = {};
    despesas.forEach(d => {
      if (!gastosPorPet[d.petId]) {
        const pet = pets.find(p => p.id === d.petId);
        gastosPorPet[d.petId] = { nome: pet?.name || 'Desconhecido', total: 0, quantidade: 0 };
      }
      gastosPorPet[d.petId].total += d.valor;
      gastosPorPet[d.petId].quantidade += 1;
    });

    const petMaisCaro = Object.entries(gastosPorPet).reduce((max, [id, data]) => 
      data.total > max.total ? { id: Number(id), ...data } : max, 
      { id: 0, nome: '', total: 0, quantidade: 0 }
    );

    return {
      totalDespesas,
      mediaGasto,
      categoriaMaisCara,
      percentualCategoriaMaisCara,
      gastosPorPet,
      petMaisCaro
    };
  };

  const insights = calcularInsights();

  return (
    <div>
      {/* Resumo Financeiro Expandido */}
      {summary && insights && (
        <>
          {/* Card Principal de Total */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: 'var(--radius-lg)', 
            padding: 32, 
            marginBottom: 24,
            color: 'white',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9, marginBottom: 8 }}>💰 Total Investido nos Pets</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'var(--font-bold)', marginBottom: 8 }}>
                  R$ {summary.total.toFixed(2)}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', opacity: 0.8 }}>
                  📊 {insights.totalDespesas} despesa{insights.totalDespesas !== 1 ? 's' : ''} registrada{insights.totalDespesas !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9, marginBottom: 8 }}>📈 Média por Despesa</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'var(--font-bold)' }}>
                  R$ {insights.mediaGasto.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* Categoria Mais Cara */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', padding: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{categoriaEmoji[insights.categoriaMaisCara.categoria as CategoriaDespesa]}</div>
              <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9, marginBottom: 4 }}>🏆 Categoria com Maior Gasto</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 8 }}>
                {insights.categoriaMaisCara.categoria}
              </div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                R$ {insights.categoriaMaisCara.valor.toFixed(2)}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginTop: 4 }}>
                {insights.percentualCategoriaMaisCara.toFixed(1)}% do total
              </div>
            </div>

            {/* Pet Mais Caro */}
            {insights.petMaisCaro.total > 0 && (
              <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', padding: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🐾</div>
                <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9, marginBottom: 4 }}>💎 Pet com Maior Investimento</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 8 }}>
                  {insights.petMaisCaro.nome}
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                  R$ {insights.petMaisCaro.total.toFixed(2)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginTop: 4 }}>
                  {insights.petMaisCaro.quantidade} despesa{insights.petMaisCaro.quantidade !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Gasto Médio por Pet */}
            {Object.keys(insights.gastosPorPet).length > 0 && (
              <div className="card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', padding: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9, marginBottom: 4 }}>🐶 Pets Cadastrados com Gastos</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 8 }}>
                  {Object.keys(insights.gastosPorPet).length} Pet{Object.keys(insights.gastosPorPet).length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                  R$ {(summary.total / Object.keys(insights.gastosPorPet).length).toFixed(2)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginTop: 4 }}>
                  média por pet
                </div>
              </div>
            )}
          </div>

          {/* Distribuição por Categoria com Barra Visual */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
              📊 Distribuição de Gastos por Categoria
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {Object.entries(summary.porCategoria)
                .filter(([_, valor]) => valor > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([cat, valor]) => {
                  const percentual = (valor / summary.total) * 100;
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 24 }}>{categoriaEmoji[cat as CategoriaDespesa]}</span>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{cat}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            {percentual.toFixed(1)}%
                          </span>
                          <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', color: 'var(--primary)' }}>
                            R$ {valor.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: 12, 
                        background: 'var(--border)', 
                        borderRadius: 'var(--radius-full)', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          width: `${percentual}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                          transition: 'width 0.3s ease',
                          borderRadius: 'var(--radius-full)'
                        }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Gastos por Pet Detalhado */}
          {Object.keys(insights.gastosPorPet).length > 1 && (
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                🐾 Gastos Detalhados por Pet
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {Object.entries(insights.gastosPorPet)
                  .sort(([_, a], [__, b]) => b.total - a.total)
                  .map(([petId, data]) => (
                    <div key={petId} style={{ 
                      background: 'var(--primary-light)', 
                      padding: 16, 
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      border: '2px solid var(--border)'
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🐕</div>
                      <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', marginBottom: 8, color: 'var(--text-primary)' }}>
                        {data.nome}
                      </div>
                      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--primary)', marginBottom: 4 }}>
                        R$ {data.total.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {data.quantidade} despesa{data.quantidade !== 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                        Média: R$ {(data.total / data.quantidade).toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
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

