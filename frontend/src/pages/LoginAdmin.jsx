import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Logo({ light }) {
  return (
    <span className="pb-logo" style={light ? { color: 'white' } : {}}>
      <span className="pb-logo-mark" style={light ? { background: 'rgba(255,255,255,0.15)', color: 'var(--pb-mustard-200)' } : {}}>P</span>
      PontoBom
    </span>
  );
}

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await api.post('/auth/login-admin', { email, senha });
      login(res.data.token, res.data.usuario);
      navigate('/admin');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Credenciais inválidas.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      {/* Painel esquerdo */}
      <div className="admin-login-left">
        <Logo light />
        <div>
          <h1 style={{ color: 'white', fontSize: 44, lineHeight: 1.1, fontWeight: 600 }}>
            Onde a fila vira<br />fluxo.
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55, maxWidth: 380 }}>
            Receba pedidos, controle o preparo e avise os clientes pelo WhatsApp — tudo de um lugar só.
          </p>
          <div className="admin-stats">
            {[
              { n: '127', l: 'pedidos hoje' },
              { n: '18min', l: 'tempo médio' },
              { n: '4.9★', l: 'avaliação' },
            ].map(s => (
              <div key={s.l}>
                <div className="admin-stat-value">{s.n}</div>
                <div className="admin-stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>v1.0 · Painel administrativo</div>
      </div>

      {/* Painel direito */}
      <div className="admin-login-right">
        <div className="admin-login-form">
          <span className="pb-badge" style={{ background: 'var(--pb-terracotta-100)', color: 'var(--pb-terracotta-700)' }}>
            Acesso restrito · proprietário
          </span>

          <h2 style={{ fontSize: 30, marginTop: 12 }}>Entrar no painel</h2>
          <p style={{ fontSize: 14, color: 'var(--pb-ink-500)', marginTop: 6 }}>
            Use o e-mail e senha cadastrados.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
            <div className="auth-field">
              <label className="pb-label">E-mail</label>
              <input
                className="pb-input"
                type="email"
                placeholder="admin@pontobom.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="pb-label">Senha</label>
              <input
                className="pb-input"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>

            {erro && <div className="pb-erro">{erro}</div>}

            <button
              type="submit"
              className="pb-btn pb-btn--primary pb-btn--block pb-btn--lg"
              style={{ marginTop: 8 }}
              disabled={carregando}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>

            <p style={{ fontSize: 13, color: 'var(--pb-ink-500)', marginTop: 16, textAlign: 'center' }}>
              Esqueceu a senha?{' '}
              <span style={{ color: 'var(--pb-terracotta-600)', fontWeight: 600, cursor: 'pointer' }}>
                Recuperar
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
