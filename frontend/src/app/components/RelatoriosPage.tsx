import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { API_BASE_URL } from '../../lib/api';
import { Pet } from '../../types/Pet';
import { RelatorioSaude } from '../../types/RelatorioSaude';

export function RelatoriosPage() {
  const { token } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<number | ''>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorio, setRelatorio] = useState<RelatorioSaude | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPets();
  }, [token]);

  async function loadPets() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/pets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPets(data);
      }
    } catch (err) {
      console.error('Erro ao buscar pets:', err);
    }
  }

  async function handleGerarRelatorio() {
    if (!selectedPet) {
      alert('Selecione um pet');
      return;
    }

    setLoading(true);
    setError('');
    setRelatorio(null);

    try {
      const params = new URLSearchParams();
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);

      const res = await fetch(`${API_BASE_URL}/relatorios/saude/${selectedPet}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Erro ao gerar relatório' }));
        throw new Error(data.message);
      }

      const data = await res.json();
      setRelatorio(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  }

  function handleImprimir() {
    window.print();
  }

  const tipoEmoji: Record<string, string> = {
    'Vacina': '💉',
    'Consulta': '🩺',
    'Cirurgia': '⚕️',
    'Exame': '🔬',
    'Medicamento': '💊',
    'Outros': '📋',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--secondary), var(--success))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: 'var(--shadow-md)' }}>📊</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-primary)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)' }}>Relatórios de Saúde</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Visualize o histórico completo de saúde do seu pet</p>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>🔍 Gerar Relatório</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label>Pet *</label>
              <select
                data-testid="relatorio-select-pet"
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Selecione um pet</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id}>{pet.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Data Início</label>
              <input
                data-testid="relatorio-input-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div>
              <label>Data Fim</label>
              <input
                data-testid="relatorio-input-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: 12, 
              background: 'rgba(255, 107, 107, 0.1)', 
              color: 'var(--error)', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: 16,
              border: '1px solid var(--error)'
            }}>
              {error}
            </div>
          )}

          <button
            data-testid="btn-gerar-relatorio"
            onClick={handleGerarRelatorio}
            disabled={loading || !selectedPet}
            style={{ width: '100%' }}
          >
            {loading ? 'Gerando...' : '📊 Gerar Relatório'}
          </button>
        </div>

        {/* Relatório */}
        {relatorio && (
          <div id="relatorio-print" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24, paddingBottom: 24, borderBottom: '2px solid var(--border)' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
                  📋 Relatório de Saúde
                </h2>
                <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
                  <p style={{ margin: '4px 0' }}>🐾 <strong>{relatorio.pet.name}</strong> - {relatorio.pet.species}</p>
                  {relatorio.pet.breed && <p style={{ margin: '4px 0' }}>Raça: {relatorio.pet.breed}</p>}
                  {relatorio.pet.age && <p style={{ margin: '4px 0' }}>Idade: {relatorio.pet.age} anos</p>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  Gerado em: {new Date(relatorio.geradoEm).toLocaleString('pt-BR')}
                </p>
                {relatorio.periodo.inicio && (
                  <p style={{ margin: '4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Período: {new Date(relatorio.periodo.inicio).toLocaleDateString('pt-BR')} até {relatorio.periodo.fim ? new Date(relatorio.periodo.fim).toLocaleDateString('pt-BR') : 'hoje'}
                  </p>
                )}
                <button 
                  onClick={handleImprimir}
                  className="secondary"
                  style={{ marginTop: 12, padding: '8px 16px', fontSize: 'var(--text-sm)' }}
                >
                  🖨️ Imprimir
                </button>
              </div>
            </div>

            {/* Resumo */}
            <div style={{ 
              background: 'linear-gradient(135deg, var(--secondary-light), var(--success))', 
              borderRadius: 'var(--radius-lg)', 
              padding: 24, 
              marginBottom: 24 
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                📊 Resumo
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>
                    {relatorio.resumo.totalRegistros}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Total de Registros</div>
                </div>
                {Object.entries(relatorio.resumo.porTipo).map(([tipo, count]) => (
                  count > 0 && (
                    <div key={tipo} style={{ background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{tipoEmoji[tipo] || '📋'}</div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>{count}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>{tipo}</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Registros */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                📝 Histórico Detalhado ({relatorio.registros.length} registro{relatorio.registros.length !== 1 ? 's' : ''})
              </h3>
              
              {relatorio.registros.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🏥</div>
                  <p>Nenhum registro de saúde encontrado para o período selecionado</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {relatorio.registros.map((registro) => (
                    <div 
                      key={registro.id}
                      style={{ 
                        background: 'var(--background)', 
                        borderRadius: 'var(--radius-lg)', 
                        padding: 20,
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 24 }}>{tipoEmoji[registro.tipo] || '📋'}</span>
                            <h4 style={{ margin: 0, fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                              {registro.tipo}
                            </h4>
                          </div>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                            📅 {new Date(registro.data).toLocaleDateString('pt-BR')} às {registro.horario}
                            {registro.profissional && ` • 👨‍⚕️ ${registro.profissional}`}
                          </div>
                          {registro.observacoes && (
                            <div style={{ 
                              fontSize: 'var(--text-sm)', 
                              color: 'var(--text-primary)', 
                              marginTop: 12,
                              padding: 12,
                              background: 'var(--surface)',
                              borderRadius: 'var(--radius-md)',
                              borderLeft: '4px solid var(--primary)'
                            }}>
                              💭 {registro.observacoes}
                            </div>
                          )}
                          {registro.arquivoPath && (
                            <div style={{ marginTop: 12 }}>
                              <a 
                                href={`${API_BASE_URL}${registro.arquivoPath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: 8,
                                  padding: '8px 12px',
                                  background: 'var(--surface)',
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: 'var(--text-sm)',
                                  border: '1px solid var(--border)'
                                }}
                              >
                                📎 Ver Arquivo Anexo
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSS para impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #relatorio-print, #relatorio-print * { visibility: visible; }
          #relatorio-print { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
          }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}

