import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { API_BASE_URL } from '../../lib/api';
import { Pet } from '../../types/Pet';
import { RelatorioSaude } from '../../types/RelatorioSaude';
import { RelatorioFinanceiro } from '../../types/RelatorioFinanceiro';

export function RelatoriosPage() {
  const { token } = useAuth();
  
  // Controle de Abas
  const [activeTab, setActiveTab] = useState<'saude' | 'financeiro'>('saude');

  // Estados Gerais
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [selectedPet, setSelectedPet] = useState<number | ''>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Dados dos Relatórios
  const [relatorioSaude, setRelatorioSaude] = useState<RelatorioSaude | null>(null);
  const [relatorioFinanceiro, setRelatorioFinanceiro] = useState<RelatorioFinanceiro | null>(null);

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
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);

      let url = '';
      
      if (activeTab === 'saude') {
        if (!selectedPet) {
          throw new Error('Selecione um pet para o relatório de saúde');
        }
        // Limpa o outro relatório para evitar confusão visual
        setRelatorioFinanceiro(null);
        url = `${API_BASE_URL}/relatorios/saude/${selectedPet}?${params}`;
      } else {
        // Limpa o outro relatório
        setRelatorioSaude(null);
        url = `${API_BASE_URL}/relatorios/financeiro?${params}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Erro ao gerar relatório' }));
        throw new Error(data.message);
      }

      const data = await res.json();
      
      if (activeTab === 'saude') {
        setRelatorioSaude(data);
      } else {
        setRelatorioFinanceiro(data);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  }

  function handleImprimir() {
    window.print();
  }

  // Função auxiliar para formatar moeda
  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Mapeamento de emojis para tipos de saúde
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
            <h1 style={{ margin: 0, fontFamily: 'var(--font-primary)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)' }}>Relatórios</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Acompanhe a saúde e os gastos dos seus pets</p>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }} className="no-print">
          <button 
            onClick={() => { setActiveTab('saude'); setError(''); }}
            style={{ 
              background: activeTab === 'saude' ? 'var(--primary)' : 'var(--surface)',
              color: activeTab === 'saude' ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🏥 Relatório de Saúde
          </button>
          <button 
             onClick={() => { setActiveTab('financeiro'); setError(''); }}
             style={{ 
              background: activeTab === 'financeiro' ? 'var(--primary)' : 'var(--surface)',
              color: activeTab === 'financeiro' ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            💰 Relatório Financeiro
          </button>
        </div>

        {/* Área de Filtros */}
        <div className="no-print" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            🔍 Gerar Relatório {activeTab === 'saude' ? 'de Saúde' : 'Financeiro'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* O seletor de Pet só aparece na aba de Saúde */}
            {activeTab === 'saude' && (
              <div>
                <label>Pet *</label>
                <select
                  data-testid="relatorio-select-pet"
                  value={selectedPet}
                  onChange={(e) => setSelectedPet(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', padding: 8, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                >
                  <option value="">Selecione um pet</option>
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id}>{pet.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label>Data Início</label>
              <input
                data-testid="relatorio-input-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
              />
            </div>

            <div>
              <label>Data Fim</label>
              <input
                data-testid="relatorio-input-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
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
            disabled={loading}
            style={{ width: '100%', padding: 12, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem' }}
          >
            {loading ? 'Gerando...' : '📊 Gerar Relatório'}
          </button>
        </div>

        {/* -------------------------------------------------------- */}
        {/* RENDERIZAÇÃO: RELATÓRIO DE SAÚDE                         */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'saude' && relatorioSaude && (
          <div id="relatorio-print" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
            
            <HeaderRelatorio 
              titulo="📋 Relatório de Saúde" 
              geradoEm={relatorioSaude.geradoEm} 
              periodoInicio={relatorioSaude.periodo.inicio}
              periodoFim={relatorioSaude.periodo.fim}
              onPrint={handleImprimir} 
            />

            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <p style={{ margin: '4px 0', fontSize: 'var(--text-lg)' }}>🐾 <strong>{relatorioSaude.pet.name}</strong> - {relatorioSaude.pet.species}</p>
              {relatorioSaude.pet.breed && <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>Raça: {relatorioSaude.pet.breed}</p>}
            </div>

            {/* Resumo Saúde */}
            <div style={{ background: 'linear-gradient(135deg, var(--secondary-light), var(--success))', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>📊 Resumo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--primary)' }}>{relatorioSaude.resumo.totalRegistros}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Total</div>
                </div>
                {Object.entries(relatorioSaude.resumo.porTipo).map(([tipo, count]) => (
                  count > 0 && (
                    <div key={tipo} style={{ background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{tipoEmoji[tipo] || '📋'}</div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{count}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{tipo}</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Lista Registros Saúde */}
            <div>
              <h3 style={{ marginBottom: 16 }}>📝 Histórico Detalhado</h3>
              {relatorioSaude.registros.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                  <p>Nenhum registro encontrado para o período.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {relatorioSaude.registros.map((registro) => (
                    <div key={registro.id} style={{ background: 'var(--background)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 24 }}>{tipoEmoji[registro.tipo] || '📋'}</span>
                        <h4 style={{ margin: 0 }}>{registro.tipo}</h4>
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                        📅 {new Date(registro.data).toLocaleDateString('pt-BR')} às {registro.horario}
                        {registro.profissional && ` • 👨‍⚕️ ${registro.profissional}`}
                      </div>
                      {registro.observacoes && (
                        <div style={{ marginTop: 12, padding: 12, background: 'var(--surface)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)' }}>
                          {registro.observacoes}
                        </div>
                      )}
                      {registro.arquivoPath && (
                        <div style={{ marginTop: 12 }}>
                          <a href={`${API_BASE_URL}${registro.arquivoPath}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)' }}>
                            📎 Ver Anexo
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* RENDERIZAÇÃO: RELATÓRIO FINANCEIRO                       */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'financeiro' && relatorioFinanceiro && (
          <div id="relatorio-print" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
            
            <HeaderRelatorio 
              titulo="💰 Relatório Financeiro" 
              geradoEm={relatorioFinanceiro.geradoEm} 
              periodoInicio={relatorioFinanceiro.periodo.inicio}
              periodoFim={relatorioFinanceiro.periodo.fim}
              onPrint={handleImprimir} 
            />

            {/* Resumo Financeiro */}
            <div style={{ background: 'linear-gradient(135deg, var(--secondary-light), var(--success))', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
               <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>Resumo de Gastos</h3>
               
               <div style={{ marginBottom: 24 }}>
                 <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Total Geral</span>
                 <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 'bold', color: 'var(--primary)' }}>
                   {formatMoney(relatorioFinanceiro.resumo.totalGeral)}
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                 {Object.entries(relatorioFinanceiro.resumo.porCategoria).map(([cat, val]) => (
                   val > 0 && (
                    <div key={cat} style={{ background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius-md)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>{cat}</div>
                      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatMoney(val)}</div>
                    </div>
                   )
                 ))}
               </div>
            </div>

            {/* Tabela de Despesas */}
            <div>
              <h3 style={{ marginBottom: 16 }}>💸 Detalhamento das Despesas</h3>
              {relatorioFinanceiro.despesas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                  <p>Nenhuma despesa encontrada para o período.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: 12 }}>Data</th>
                      <th style={{ padding: 12 }}>Categoria</th>
                      <th style={{ padding: 12 }}>Descrição</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorioFinanceiro.despesas.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12 }}>{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{ padding: '4px 10px', borderRadius: 12, background: 'var(--background)', fontSize: '0.85em', fontWeight: 500 }}>
                            {d.categoria}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          {d.descricao}
                          {d.observacoes && <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: 4 }}>Obs: {d.observacoes}</div>}
                        </td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {formatMoney(d.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSS Específico para Impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          #relatorio-print, #relatorio-print * { visibility: visible; }
          #relatorio-print { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Componente auxiliar para o cabeçalho dos relatórios
function HeaderRelatorio({ titulo, geradoEm, periodoInicio, periodoFim, onPrint }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24, paddingBottom: 24, borderBottom: '2px solid var(--border)' }}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
          {titulo}
        </h2>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: '4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Gerado em: {new Date(geradoEm).toLocaleString('pt-BR')}
        </p>
        <p style={{ margin: '4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Período: {periodoInicio ? new Date(periodoInicio).toLocaleDateString('pt-BR') : 'Início'} até {periodoFim ? new Date(periodoFim).toLocaleDateString('pt-BR') : 'Hoje'}
        </p>
        <button 
          onClick={onPrint}
          className="no-print"
          style={{ marginTop: 12, padding: '8px 16px', fontSize: 'var(--text-sm)', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
        >
          🖨️ Imprimir
        </button>
      </div>
    </div>
  );
}