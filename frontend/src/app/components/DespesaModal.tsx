import { DespesaFinanceira } from '../../types/DespesaFinanceira';
import { DespesaForm } from './DespesaForm';

interface DespesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: DespesaFinanceira;
  onSaved: () => void;
}

export function DespesaModal({ isOpen, onClose, mode, initial, onSaved }: DespesaModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 32,
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>
            {mode === 'create' ? '💰 Nova Despesa' : '✏️ Editar Despesa'}
          </h2>
          <button 
            onClick={onClose} 
            className="ghost"
            style={{ padding: 8, fontSize: 24 }}
          >
            ✕
          </button>
        </div>

        <DespesaForm
          mode={mode}
          initial={initial}
          onSuccess={() => {
            onSaved();
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

