import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';

function fmtTelefone(val) {
  const d = val.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function Logo() {
  return (
    <span className="pb-logo">
      <span className="pb-logo-mark">P</span>
      PontoBom
    </span>
  );
}

export default function Login() {
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await api.post('/auth/login', { telefone: telefone.replace(/\D/g, '') });
      navigate('/verificar', { state: { telefone, redirectTo } });
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao enviar código.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-screen">
      <button className="auth-back-btn" onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>

      <div style={{ marginTop: 16 }}>
        <Logo />
      </div>

      <h2 style={{ fontSize: 28, marginTop: 28, lineHeight: 1.15 }}>
        Bem-vindo de&nbsp;volta
      </h2>
      <p style={{ fontSize: 14, color: 'var(--pb-ink-500)', marginTop: 8, lineHeight: 1.5 }}>
        Informe o número do seu WhatsApp e a gente envia um código rapidinho.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
        <div className="auth-field">
          <label className="pb-label">Telefone (WhatsApp)</label>
          <div className="auth-phone-wrap">
            <span className="auth-phone-prefix">+55</span>
            <input
              className="pb-input auth-phone-input"
              placeholder="(54) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(fmtTelefone(e.target.value))}
              inputMode="numeric"
              required
            />
          </div>
          <p className="auth-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7c3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12a8 8 0 11-3.2-6.4L20 4l-1.4 3.6A7.96 7.96 0 0120 12zM8 14c1 2 3 4 5 5l2-2-3-1-1-1-1-3-2 2z" />
            </svg>
            O número precisa ter WhatsApp ativo.
          </p>
        </div>

        {erro && <div className="pb-erro">{erro}</div>}

        <div className="auth-spacer" style={{ minHeight: 24 }} />

        <button
          type="submit"
          className="pb-btn pb-btn--primary pb-btn--block pb-btn--lg"
          disabled={carregando}
        >
          {carregando ? 'Enviando...' : 'Receber código'}
          {!carregando && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </form>

      <p className="auth-footer-link">
        Primeira vez? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  );
}
