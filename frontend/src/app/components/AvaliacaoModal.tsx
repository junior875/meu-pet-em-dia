import { useState, useEffect } from 'react';

interface AvaliacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nota: number, comentario: string) => void;
  loading: boolean;
}

export function AvaliacaoModal({ isOpen, onClose, onConfirm, loading }: AvaliacaoModalProps) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNota(5);
      setComentario('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)'
      }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>⭐ Avaliar Serviço</h3>
        
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Qual nota você dá para este atendimento?</p>
          <div style={{ fontSize: 32, cursor: 'pointer', userSelect: 'none' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star}
                onClick={() => setNota(star)}
                style={{ color: star <= nota ? '#FFD700' : '#E0E0E0', transition: 'color 0.2s', margin: '0 4px' }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9em', fontWeight: 500, color: 'var(--text-primary)' }}>Comentário</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontFamily: 'inherit', resize: 'vertical' }}
            placeholder="Fale sobre o atendimento e o profissional ou deixe uma sugestão..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'end', gap: 12 }}>
          <button onClick={onClose} className="secondary" disabled={loading}>Cancelar</button>
          <button onClick={() => onConfirm(nota, comentario)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? 'Enviando...' : 'Confirmar Avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}