import { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '@lib/api';
import { useToast } from './Toast';
import { RegistroSaude, TipoRegistro } from '../../types/RegistroSaude';
import { Pet } from '../../types/Pet';

type FormState = {
  petId: string;
  tipoRegistro: TipoRegistro;
  data: string;
  horario: string;
  profissional: string;
  file: File | null;
  // filePath deve ser adicionado aqui se você usa useState e onChange
  filePath?: string; 
};

interface RegistroSaudeFormProps {
  registro?: RegistroSaude | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RegistroSaudeForm({ registro, onSuccess, onCancel }: RegistroSaudeFormProps) {
  const { showToast, ToastComponent } = useToast();
  const [form, setForm] = useState<FormState>({
    petId: '',
    tipoRegistro: 'Observação',
    data: '',
    horario: '',
    profissional: '',
    file: null,
    // Inicializa filePath para edição
    filePath: registro?.filePath || undefined, 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const canSubmit = useMemo(() => {
    const petIdOk = form.petId.trim().length > 0;
    const profissionalOk = form.profissional.trim().length >= 3 && form.profissional.trim().length <= 100;
    const dataOk = form.data.trim().length > 0;
    const horarioOk = form.horario.trim().length > 0;
    return petIdOk && profissionalOk && dataOk && horarioOk && !submitting && !loadingPets;
  }, [form, submitting, loadingPets]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrors({});

    try {
      const fd = new FormData();
      fd.append('petId', form.petId.toString());
      fd.append('tipoRegistro', form.tipoRegistro);
      fd.append('data', form.data);
      fd.append('horario', form.horario);
      fd.append('profissional', form.profissional.trim());

      // Lógica para manter ou substituir o arquivo
      if (registro?.filePath && !form.file) {
        fd.append('filePath', registro.filePath);
      } else if (form.filePath) {
        // Se o usuário está em edição e não mudou o arquivo, mas o form ainda tem o path
        fd.append('filePath', form.filePath);
      } else {
        fd.append('filePath', ''); // Indica que deve ser nulo
      }

      if (form.file) {
        fd.append('file', form.file);
      }

      const url = registro ? `${API_BASE_URL}/registros_saude/${registro.id}` : `${API_BASE_URL}/registros_saude`;
      const method = registro ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const ok = registro ? res.ok : res.status === 201;
      const data = await res.json().catch(() => ({}));

      if (ok) {
        showToast(registro ? 'Registro atualizado com sucesso!' : 'Registro cadastrado com sucesso!', 'success');
        onSuccess();
        if (!registro) {
          setForm({ petId: '', tipoRegistro: 'Observação', data: '', horario: '', profissional: '', file: null });
        }
        return;
      }

      if (data?.errors) setErrors(data.errors);
      else setErrors({ general: data?.message ?? 'Falha ao salvar registro' });
    } catch (err) {
      setErrors({ general: 'Erro de rede' });
    } finally {
      setSubmitting(false);
    }
  }

  // CORREÇÃO CRÍTICA: Dependências vazias para rodar apenas uma vez
  useEffect(() => {
    const fetchPets = async () => {
      setLoadingPets(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/pets`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setPets(Array.isArray(data) ? data : []);
      } catch (err) {
        showToast('Erro ao carregar pets para seleção.', 'error');
      } finally {
        setLoadingPets(false);
      }
    };
    fetchPets();
  }, [ ]); // Array de dependências vazio: Executa na montagem.

  useEffect(() => {
    if (registro && !loadingPets) {
      setForm({
        petId: registro.petId.toString(),
        tipoRegistro: registro.tipoRegistro,
        data: registro.data,
        horario: registro.horario,
        profissional: registro.profissional,
        file: null,
        filePath: registro.filePath || undefined,
      });
    }
  }, [registro, loadingPets]);

  const tipos: TipoRegistro[] = ['Vacina', 'Cirurgia', 'Exame', 'Observação'];

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: 16 }}>
      {ToastComponent}
      {errors.general && (
        <div style={{ padding: '12px 16px', background: 'rgba(255, 107, 107, 0.1)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: 'var(--text-sm)' }}>
          {errors.general}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        <div>
          <label>Pet *</label>
          <select 
            data-testid="registro-pet" 
            disabled={loadingPets || !!registro} 
            value={form.petId} 
            onChange={(e) => onChange('petId', e.target.value)}
          >
            <option value="">{loadingPets ? 'Carregando Pets...' : pets.length === 0 ? 'Nenhum Pet cadastrado' : 'Selecione um Pet'}</option>
            {pets.map(pet => (
              <option key={pet.id} value={pet.id.toString()}>{pet.name} ({pet.species})</option>
            ))}
          </select>
          {errors.petId && <small style={{ color: 'var(--error)' }}>{errors.petId}</small>}
        </div>

        <div>
          <label>Tipo de Registro *</label>
          <select 
            data-testid="registro-tipo" 
            disabled={!!registro} 
            value={form.tipoRegistro} 
            onChange={(e) => onChange('tipoRegistro', e.target.value as TipoRegistro)}
          >
            {tipos.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.tipoRegistro && <small style={{ color: 'var(--error)' }}>{errors.tipoRegistro}</small>}
        </div>

        <div>
          <label>Data *</label>
          <input 
            data-testid="registro-data" 
            type="date" 
            value={form.data} 
            onChange={(e) => onChange('data', e.target.value)} 
          />
          {errors.data && <small style={{ color: 'var(--error)' }}>{errors.data}</small>}
        </div>

        <div>
          <label>Horário *</label>
          <input 
            data-testid="registro-horario" 
            type="time" 
            value={form.horario} 
            onChange={(e) => onChange('horario', e.target.value)} 
          />
          {errors.horario && <small style={{ color: 'var(--error)' }}>{errors.horario}</small>}
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label>Profissional *</label>
          <input 
            data-testid="registro-profissional" 
            type="text" 
            value={form.profissional} 
            onChange={(e) => onChange('profissional', e.target.value)} 
            placeholder="Nome do Profissional Responsável" 
          />
          {errors.profissional && <small style={{ color: 'var(--error)' }}>{errors.profissional}</small>}
        </div>

        <div>
          <label>Arquivo (PDF/PNG/JPG)</label>
          <input 
            type="file" 
            accept=".pdf,image/png,image/jpeg" 
            onChange={(e) => onChange('file', e.target.files?.[0] ?? null)} 
          />
          {errors.file && <small style={{ color: 'var(--error)' }}>{errors.file}</small>}
          {/* Verifica se há path salvo E se o usuário não selecionou um novo arquivo */}
          {form.filePath && !form.file && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
              Anexo atual: <a href={`${API_BASE_URL}${form.filePath}`} target="_blank" rel="noopener noreferrer">Visualizar</a>
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: 8, flexWrap: 'wrap' }}>
        <button 
          data-testid="registro-submit" 
          type="submit" 
          disabled={!canSubmit} 
          style={{ flex: 1, minWidth: 200 }}
        >
          {submitting ? 'Enviando...' : (registro ? '✓ Salvar Alterações' : '✓ Cadastrar Registro')}
        </button>
        <button 
          type="button" 
          className="secondary" 
          onClick={onCancel} 
          style={{ flex: 1, minWidth: 200 }}
        >
          ✕ Cancelar
        </button>
      </div>
    </form>
  );
}