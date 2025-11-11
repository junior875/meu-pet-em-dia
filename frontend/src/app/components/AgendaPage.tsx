import { useState } from 'react';
import { Agenda } from '../../types/Agenda';
import { AgendaList } from './AgendaList';
import { AgendaModal } from './AgendaModal';

export function AgendaPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Agenda | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: 'var(--shadow-md)' }}>📅</div>
            <div>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-primary)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)' }}>Agenda</h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Gerencie os agendamentos de vacinas, consultas e banho/tosa</p>
            </div>
          </div>
          
          <button data-testid="btn-open-agenda-modal" onClick={() => { setEditing(null); setModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px' }}>
            <span style={{ fontSize: 20 }}>➕</span>
            Novo Agendamento
          </button>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
          <AgendaList 
            refreshKey={refreshKey} 
            onEdit={(a) => { setEditing(a); setModalOpen(true); }} 
            onRefresh={() => setRefreshKey((k) => k + 1)} 
          />
        </div>
      </div>

      <AgendaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        agenda={editing}
        onSuccess={() => {
          setModalOpen(false);
          setEditing(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}