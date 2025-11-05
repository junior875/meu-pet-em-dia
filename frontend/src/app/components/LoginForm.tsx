import { useState } from 'react';
import { useAuth } from '@app/providers/AuthProvider';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from './Toast';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Login realizado com sucesso! Redirecionando...', 'success');
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      showToast(err?.message || 'E-mail ou senha inválidos', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {ToastComponent}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 32px',
          boxShadow: 'var(--shadow-xl)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}>🐾</div>
            <h1 style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 'var(--text-3xl)',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}>Meu Pet em Dia</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Gerencie a saúde do seu pet
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <label>E-mail</label>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '20px',
                color: 'var(--text-secondary)',
              }}>📧</span>
              <input
                className="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>

            <label>Senha</label>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '20px',
                color: 'var(--text-secondary)',
              }}>🔒</span>
              <input
                className="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <a href="#" style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)' }}>
                Esqueci minha senha
              </a>
            </div>

            <button className="submit" type="submit" disabled={loading} style={{ width: '100%', padding: '16px', fontSize: 'var(--text-lg)' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Não tem conta?{' '}
            <Link to="/register" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--primary)' }}>
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
