import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@app/providers/AuthProvider';
import { LoginForm } from '@app/components/LoginForm';
import { RegisterForm } from '@app/components/RegisterForm';
import { Navbar } from '@app/components/Navbar';
import { AdminUsersPage } from '@app/components/AdminUsersPage';
import { PetsPage } from '@app/components/PetsPage';
import { AgendaPage } from '@app/components/AgendaPage'; 

function Protected({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AdminOnly({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function TutorOnly({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.type !== 'Tutor') return <Navigate to="/" replace />;
  return children;
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardCards = [
    {
      icon: '🐾',
      title: 'Meus Pets',
      subtitle: 'Cadastre e gerencie seus pets',
      color: 'linear-gradient(135deg, #FF6B9D, #E8538A)',
      stats: '0 pets cadastrados',
      path: '/pets',
    },
    {
      icon: '📅',
      title: 'Agenda',
      subtitle: 'Vacinas, consultas e lembretes',
      color: 'linear-gradient(135deg, #4ECDC4, #3BB5AC)',
      stats: 'Próximos 7 dias',
      path: '/agenda',
    },
    {
      icon: '💉',
      title: 'Vacinas',
      subtitle: 'Histórico e próximos reforços',
      color: 'linear-gradient(135deg, #FFE66D, #F5D942)',
      stats: 'Tudo em dia',
      path: '/vacinas',
    },
    {
      icon: '💊',
      title: 'Medicamentos',
      subtitle: 'Controle de uso e dosagem',
      color: 'linear-gradient(135deg, #6BCF7F, #52B869)',
      stats: 'Nenhum ativo',
      path: '/medicamentos',
    },
  ];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 16px',
    }}>
      <div style={{
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-primary)',
            fontSize: 'var(--text-3xl)',
            marginBottom: '8px',
          }}>Olá, {user?.name}! 👋</h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            margin: 0,
          }}>
            Bem-vindo ao painel de {user?.type === 'Veterinário' ? 'veterinário' : 'tutor'}
          </p>
        </div>
        <div style={{
          padding: '12px 20px',
          background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))',
          borderRadius: 'var(--radius-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--primary-dark)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '20px' }}>🎉</span>
          {user?.type}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
      }}>
        {dashboardCards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '16px',
              boxShadow: 'var(--shadow-md)',
            }}>
              {card.icon}
            </div>
            <h3 style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 'var(--text-xl)',
              marginBottom: '8px',
              color: 'var(--text-primary)',
            }}>{card.title}</h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              marginBottom: '12px',
            }}>{card.subtitle}</p>
            <div style={{
              padding: '8px 12px',
              background: 'var(--background)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              fontWeight: 'var(--font-medium)',
              display: 'inline-block',
            }}>
              {card.stats}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-primary)',
          fontSize: 'var(--text-2xl)',
          marginBottom: '12px',
          color: 'var(--primary-dark)',
        }}>Comece cadastrando seu primeiro pet! 🐕</h2>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-base)',
          marginBottom: '24px',
          maxWidth: '600px',
          margin: '0 auto 24px',
        }}>
          Adicione informações sobre seu pet e mantenha tudo organizado em um só lugar.
        </p>
        <button style={{
          padding: '14px 32px',
          fontSize: 'var(--text-lg)',
        }}>
          Adicionar Meu Primeiro Pet
        </button>
      </div>
    </div>
  );
}

export function RootRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/pets" element={<TutorOnly><PetsPage /></TutorOnly>} />
          <Route path="/agenda" element={<Protected><AgendaPage /></Protected>} />
          <Route path="/financeiro" element={<Protected><div style={{ padding: '32px', textAlign: 'center' }}>Em desenvolvimento...</div></Protected>} />
          <Route path="/admin/users" element={<AdminOnly><AdminUsersPage /></AdminOnly>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}