import { useState } from 'react';
import { DespesaFinanceira } from '../../types/DespesaFinanceira';
import { DespesaList } from './DespesaList';
import { DespesaModal } from './DespesaModal';

export function DespesasPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DespesaFinanceira | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--accent), var(--warning))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: 'var(--shadow-md)' }}>💰</div>
            <div>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-primary)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)' }}>Controle Financeiro</h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Gerencie os gastos com seus pets</p>
            </div>
          </div>
          <button 
            data-testid="btn-open-despesa-modal" 
            onClick={() => { setEditing(null); setModalOpen(true); }} 
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px' }}
          >
            <span style={{ fontSize: 20 }}>➕</span>
            Nova Despesa
          </button>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 32, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
          <DespesaList 
            key={refreshKey} 
            onEdit={(d) => { setEditing(d); setModalOpen(true); }} 
            onRefresh={() => setRefreshKey((k) => k + 1)} 
          />
        </div>
      </div>

      <DespesaModal 
        isOpen={modalOpen} 
        onClose={() => { setModalOpen(false); setEditing(null); }} 
        mode={editing ? 'edit' : 'create'} 
        initial={editing ?? undefined} 
        onSaved={() => setRefreshKey((k) => k + 1)} 
      />
    </div>
  );
}

