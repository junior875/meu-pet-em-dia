import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Rotas públicas onde a navbar não deve aparecer
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (!user || isPublicRoute) return null;

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/pets', label: 'Meus Pets', icon: '🐾' },
    { path: '/agenda', label: 'Agenda', icon: '📅' },
    { path: '/registros-saude', label: 'Saúde', icon: '💉' },
    { path: '/despesas', label: 'Financeiro', icon: '💰' },
    ...(user.role === 'admin' ? [{ path: '/admin/users', label: 'Gerenciar usuários', icon: '🧑‍💼' }] : []),
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 32px',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="navbar-desktop">
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-bold)',
          fontFamily: 'var(--font-primary)',
          color: 'var(--primary)',
          textDecoration: 'none',
        }}>
          <span style={{ fontSize: '28px' }}>🐾</span>
          Meu Pet em Dia
        </Link>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              data-testid={link.path === '/admin/users' ? 'nav-admin-users' : undefined}
              style={{
                position: 'relative',
                color: location.pathname === link.path ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 'var(--font-medium)',
                transition: 'color 0.3s ease',
                padding: '8px 0',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{link.icon}</span>
              {link.label}
              {location.pathname === link.path && (
                <span style={{
                  position: 'absolute',
                  bottom: '-16px',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'var(--primary)',
                  borderRadius: '3px 3px 0 0',
                }} />
              )}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '8px',
              position: 'relative',
              boxShadow: 'none',
            }}
          >
            🔔
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '10px',
              height: '10px',
              background: 'var(--error)',
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--surface)',
            }} />
          </button>

          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--surface)',
                fontWeight: 'var(--font-bold)',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                border: '2px solid var(--primary-light)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: '220px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                padding: '8px',
                zIndex: 1001,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{user.type}</div>
                </div>
                <div
                  onClick={() => { /* perfil */ }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>👤</span>
                  Meu Perfil
                </div>
                <div
                  onClick={() => { /* config */ }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>⚙️</span>
                  Configurações
                </div>
                <hr style={{ margin: '8px 0' }} />
                <div
                  onClick={logout}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--error)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>🚪</span>
                  Sair
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Topbar (avatar + sininho) */}
      <nav
        className="mobile-topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1001,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 16px',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: 'var(--primary)', fontWeight: 'var(--font-semibold)'
        }}>
          <span style={{ fontSize: 22 }}>🐾</span>
          <span style={{ fontSize: 'var(--text-base)' }}>Meu Pet em Dia</span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
              padding: 6,
              position: 'relative',
              boxShadow: 'none',
            }}
          >
            🔔
            <span style={{
              position: 'absolute', top: 2, right: 2, width: 8, height: 8,
              background: 'var(--error)', borderRadius: 'var(--radius-full)', border: '2px solid var(--surface)'
            }} />
          </button>

          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--surface)', fontWeight: 'var(--font-bold)', cursor: 'pointer',
                border: '2px solid var(--primary-light)'
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            {showDropdown && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 220,
                background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)', padding: 8, zIndex: 1002
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{user.type}</div>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <span>👤</span>
                  Meu Perfil
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <span>⚙️</span>
                  Configurações
                </div>
                <hr style={{ margin: '8px 0' }} />
                <div onClick={logout} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--error)', cursor: 'pointer' }}>
                  <span>🚪</span>
                  Sair
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'none',
        justifyContent: 'space-around',
        padding: '8px 0 12px',
        boxShadow: '0 -2px 10px var(--shadow)',
        zIndex: 1000,
      }}
      className="bottom-nav">
        {user.role === 'admin' ? (
          // No mobile, para admin mostramos todos os itens lineares (sem botão central flutuante)
          navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: location.pathname === link.path ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                padding: '8px 10px',
                minWidth: 60,
              }}
            >
              <span style={{
                fontSize: '22px',
                transition: 'transform 0.3s ease',
                transform: location.pathname === link.path ? 'translateY(-2px)' : 'none',
              }}>{link.icon}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{link.label}</span>
            </Link>
          ))
        ) : (
          <>
            {navLinks.slice(0, 2).map(link => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  color: location.pathname === link.path ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  padding: '8px 16px',
                }}
              >
                <span style={{
                  fontSize: '24px',
                  transition: 'transform 0.3s ease',
                  transform: location.pathname === link.path ? 'translateY(-2px)' : 'none',
                }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}

            <div style={{ position: 'relative', top: '-20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-lg)',
                color: 'var(--surface)',
                fontSize: '28px',
                cursor: 'pointer',
              }}>
                ➕
              </div>
            </div>

            {navLinks.slice(2).map(link => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  color: location.pathname === link.path ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  padding: '8px 16px',
                }}
              >
                <span style={{
                  fontSize: '24px',
                  transition: 'transform 0.3s ease',
                  transform: location.pathname === link.path ? 'translateY(-2px)' : 'none',
                }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <style>{`
        @media (min-width: 769px) {
          .navbar-desktop { display: flex !important; }
          .bottom-nav { display: none !important; }
          .mobile-topbar { display: none !important; }
        }
        @media (max-width: 768px) {
          .navbar-desktop { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .bottom-nav { display: flex !important; }
          body { padding-bottom: 80px !important; }
        }
      `}</style>
    </>
  );
}
