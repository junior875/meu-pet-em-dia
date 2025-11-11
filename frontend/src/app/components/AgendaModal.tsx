import { useEffect, useRef } from 'react';
import { Agenda } from '../../types/Agenda';
import { AgendaForm } from './AgendaForm';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda: Agenda | null;
  onSuccess: () => void;
}

export function AgendaModal({ isOpen, onClose, agenda, onSuccess }: AgendaModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mode = agenda ? 'edit' : 'create';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = 'unset'; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 9999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div data-testid="agenda-modal" ref={ref} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', maxWidth: 900, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📅</div>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-primary)', fontSize: 'var(--text-2xl)' }}>{mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{mode === 'create' ? 'Preencha os dados do agendamento' : 'Atualize os detalhes do agendamento'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 28, cursor: 'pointer', boxShadow: 'none' }}>✕</button>
        </div>

        <div style={{ padding: '32px' }}>
          <AgendaForm
            agenda={agenda}
            onSuccess={() => { onSuccess(); onClose(); }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}