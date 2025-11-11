import { useState } from 'react';
import { RegistroSaude } from '../../types/RegistroSaude';
import { RegistroSaudeList } from './RegistroSaudeList';
import { RegistroSaudeModal } from './RegistroSaudeModal';

export function RegistroSaudePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RegistroSaude | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--warning), var(--info))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: 'var(--shadow-md)' }}>💉</div>
            <div>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-primary)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)' }}>Registros de Saúde</h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Histórico de vacinas, cirurgias, exames e observações dos seus pets</p>
            </div>
          </div>
          
          <button data-testid="btn-open-registro-modal" onClick={() => { setEditing(null); setModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px' }}>
            <span style={{ fontSize: 20 }}>➕</span>
            Novo Registro
          </button>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
          <RegistroSaudeList 
            refreshKey={refreshKey} 
            onEdit={(r) => { setEditing(r); setModalOpen(true); }} 
            onRefresh={() => setRefreshKey((k) => k + 1)} 
          />
        </div>
      </div>

      <RegistroSaudeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        registro={editing}
        onSuccess={() => {
          setModalOpen(false);
          setEditing(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}