import { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '@lib/api';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useToast } from './Toast';
import { Agenda, AgendaFormFields, Procedimento } from '../../types/Agenda';
import { Pet } from '../../types/Pet';

interface AgendaFormProps {
  agenda?: Agenda | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const getInitialValues = (agenda: Agenda | null | undefined): AgendaFormFields => ({
  petId: agenda?.petId.toString() || '',
  procedimento: agenda?.procedimento || 'Consulta',
  data: agenda?.data || '',
  horario: agenda?.horario || '',
  profissional: agenda?.profissional || '',
  observacoes: agenda?.observacoes || '',
});

export function AgendaForm({ agenda, onSuccess, onCancel }: AgendaFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AgendaFormFields>({
    defaultValues: getInitialValues(agenda),
  });
  const { showToast, ToastComponent } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      setLoadingPets(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/pets`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const petList = Array.isArray(data) ? data : [];
        setPets(petList);
      } catch (err) {
        showToast('Erro ao carregar pets para seleção.', 'error'); 
      } finally {
        setLoadingPets(false);
      }
    };
    fetchPets();
  }, [ /* Dependências vazias */ ]);

  useEffect(() => {
    if (!loadingPets) {
        reset(getInitialValues(agenda));
    }
  }, [agenda, reset, loadingPets]);

  const onSubmit: SubmitHandler<AgendaFormFields> = async (data) => {
    try {
      const payload = {
        petId: Number(data.petId),
        procedimento: data.procedimento.trim(),
        data: data.data.trim(),
        horario: data.horario.trim(),
        profissional: data.profissional?.trim() || null,
        observacoes: data.observacoes?.trim() || null,
      };
      
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/agenda`;
      let method = 'POST';

      if (agenda) {
        url = `${API_BASE_URL}/agenda/${agenda.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const errorMessage = responseData.message || responseData.errors?.[0]?.message || 'Erro desconhecido.';
        throw new Error(errorMessage);
      }
      
      if (agenda) {
        showToast('Agendamento Atualizado com sucesso!', 'success');
      } else {
        showToast('Agendamento Criado com sucesso!', 'success');
      }
      onSuccess();
    } catch (error: any) {
      showToast(error.message || 'Erro desconhecido ao salvar agendamento.', 'error');
    }
  };

  const procedimentos: Procedimento[] = ['Banho/Tosa', 'Vacina', 'Vermifugo', 'Antipulgas', 'Consulta', 'Outros'];
  const canSubmit = useMemo(() => !isSubmitting && !loadingPets, [isSubmitting, loadingPets]);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 16 }}>
      {ToastComponent}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        
        {/* Pet ID */}
        <div>
          <label>Pet</label>
          <select 
            disabled={loadingPets || pets.length === 0}
            {...register('petId', { required: 'Pet é obrigatório' })}
          >
            <option value="">
                {loadingPets ? 'Carregando Pets...' : 
                 pets.length === 0 ? 'Nenhum Pet cadastrado' : 
                 'Selecione um Pet'}
            </option>
            {pets.map(pet => (
              <option key={pet.id} value={pet.id.toString()}> 
                  {pet.name} ({pet.species})
              </option>
            ))}
          </select>
          {errors.petId && <small style={{ color: 'var(--error)' }}>{errors.petId.message}</small>}
          {loadingPets && <small style={{ color: 'var(--text-secondary)' }}>Carregando lista de Pets...</small>}
        </div>

        {/* Procedimento */}
        <div>
          <label>Procedimento</label>
          <select {...register('procedimento', { required: 'Procedimento é obrigatório' })}>
            {procedimentos.map(proc => (
              <option key={proc} value={proc}>{proc}</option>
            ))}
          </select>
          {errors.procedimento && <small style={{ color: 'var(--error)' }}>{errors.procedimento.message}</small>}
        </div>

        {/* Data */}
        <div>
          <label>Data</label>
          <input type="date" {...register('data', { required: 'Data é obrigatória' })} />
          {errors.data && <small style={{ color: 'var(--error)' }}>{errors.data.message}</small>}
        </div>

        {/* Horário */}
        <div>
          <label>Horário</label>
          <input type="time" {...register('horario', { required: 'Horário é obrigatório' })} />
          {errors.horario && <small style={{ color: 'var(--error)' }}>{errors.horario.message}</small>}
        </div>

        {/* Profissional */}
        <div>
          <label>Profissional</label>
          <input type="text" {...register('profissional', { maxLength: { value: 100, message: 'Máximo 100 caracteres' } })} placeholder="Nome do Veterinário/Tutor" />
          {errors.profissional && <small style={{ color: 'var(--error)' }}>{errors.profissional.message}</small>}
        </div>

        {/* Observações */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label>Observações</label>
          <textarea rows={3} {...register('observacoes', { maxLength: { value: 300, message: 'Máximo 300 caracteres' } })} placeholder="Detalhes adicionais sobre o agendamento" />
          {errors.observacoes && <small style={{ color: 'var(--error)' }}>{errors.observacoes.message}</small>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: 24, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={isSubmitting} style={{ background: 'var(--background)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '12px 24px' }}>
          Cancelar
        </button>
        <button data-testid="agenda-submit" type="submit" disabled={!canSubmit || pets.length === 0} style={{ padding: '12px 24px', background: 'var(--success)', color: 'white' }}>
          {isSubmitting ? 'Salvando...' : (agenda ? 'Salvar Alterações' : 'Criar Agendamento')}
        </button>
      </div>
    </form>
  );
}