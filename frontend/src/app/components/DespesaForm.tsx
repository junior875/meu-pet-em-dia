import { FormEvent, useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { API_BASE_URL } from '../../lib/api';
import { DespesaFinanceira, CategoriaDespesa } from '../../types/DespesaFinanceira';
import { Pet } from '../../types/Pet';

interface DespesaFormProps {
  mode: 'create' | 'edit';
  initial?: DespesaFinanceira;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DespesaForm({ mode, initial, onSuccess, onCancel }: DespesaFormProps) {
  const { token } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Campos do formulário
  const [petId, setPetId] = useState(initial?.petId || '');
  const [categoria, setCategoria] = useState<CategoriaDespesa | ''>(initial?.categoria || '');
  const [descricao, setDescricao] = useState(initial?.descricao || '');
  const [valor, setValor] = useState(initial?.valor?.toString() || '');
  const [data, setData] = useState(initial?.data || new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState(initial?.observacoes || '');

  const categorias: CategoriaDespesa[] = [
    'Alimentação',
    'Saúde',
    'Higiene',
    'Acessórios',
    'Hospedagem',
    'Transporte',
    'Outros',
  ];

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = {
        petId: Number(petId),
        categoria,
        descricao,
        valor: parseFloat(valor),
        data,
        observacoes: observacoes || null,
      };

      const url = mode === 'create' 
        ? `${API_BASE_URL}/despesas`
        : `${API_BASE_URL}/despesas/${initial!.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Erro ao salvar despesa' }));
        throw new Error(data.message);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar despesa');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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

      <label>Pet *</label>
      <select
        data-testid="despesa-input-pet"
        value={petId}
        onChange={(e) => setPetId(e.target.value)}
        required
        disabled={mode === 'edit'}
      >
        <option value="">Selecione um pet</option>
        {pets.map(pet => (
          <option key={pet.id} value={pet.id}>{pet.name}</option>
        ))}
      </select>

      <label>Categoria *</label>
      <select
        data-testid="despesa-input-categoria"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value as CategoriaDespesa)}
        required
      >
        <option value="">Selecione uma categoria</option>
        {categorias.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <label>Descrição *</label>
      <input
        data-testid="despesa-input-descricao"
        type="text"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Ex: Ração Premium 15kg"
        minLength={3}
        maxLength={255}
        required
      />

      <label>Valor (R$) *</label>
      <input
        data-testid="despesa-input-valor"
        type="number"
        step="0.01"
        min="0.01"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="0.00"
        required
      />

      <label>Data *</label>
      <input
        data-testid="despesa-input-data"
        type="date"
        value={data}
        onChange={(e) => setData(e.target.value)}
        required
      />

      <label>Observações</label>
      <textarea
        data-testid="despesa-input-observacoes"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Informações adicionais (opcional)"
        maxLength={500}
        rows={3}
      />

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          data-testid="despesa-submit"
          type="submit"
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Salvando...' : mode === 'create' ? '💾 Cadastrar' : '💾 Atualizar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="secondary"
          disabled={loading}
          style={{ flex: 1 }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

