import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerificarCodigo() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const telefone = location.state?.telefone;
  const telefoneDisplay = telefone
    ? telefone.replace(/^55/, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    : '';

  function handleDigit(i, val) {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every(d => d !== '') ) {
      submitCodigo(next.join(''));
    }
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) submitCodigo(pasted);
  }

  async function submitCodigo(codigo) {
    setErro('');
    setCarregando(true);
    try {
      const res = await api.post('/auth/verificar', { telefone, codigo });
      login(res.data.token, res.data.usuario);
      navigate('/cardapio');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Código inválido.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setCarregando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    submitCodigo(digits.join(''));
  }

  const filled = digits.findIndex(d => d === '');
  const activeCursor = filled === -1 ? 6 : filled;

  return (
    <div className="auth-screen">
      <button className="auth-back-btn" onClick={() => navigate(-1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>

      <div style={{
        marginTop: 28, width: 64, height: 64, borderRadius: 18,
        background: 'var(--pb-mustard-100)', display: 'grid', placeItems: 'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4a7c3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12a8 8 0 11-3.2-6.4L20 4l-1.4 3.6A7.96 7.96 0 0120 12zM8 14c1 2 3 4 5 5l2-2-3-1-1-1-1-3-2 2z" />
        </svg>
      </div>

      <h2 style={{ fontSize: 26, marginTop: 20, lineHeight: 1.15 }}>
        Confira seu WhatsApp
      </h2>
      <p style={{ fontSize: 14, color: 'var(--pb-ink-500)', marginTop: 8, lineHeight: 1.5 }}>
        Mandamos um código de 6 dígitos para<br />
        <strong style={{ color: 'var(--pb-ink-900)' }}>+55 {telefoneDisplay}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="otp-grid" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <div
              key={i}
              className={`otp-digit ${i === activeCursor ? 'otp-digit--active' : ''}`}
              onClick={() => inputRefs.current[filled === -1 ? 5 : filled]?.focus()}
            >
              <input
                ref={el => inputRefs.current[i] = el}
                className="otp-real-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
              />
              {d
                ? d
                : i === activeCursor
                ? <span className="otp-cursor" />
                : ''}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'var(--pb-ink-500)', marginTop: 18, textAlign: 'center' }}>
          Não recebeu?{' '}
          <span style={{ color: 'var(--pb-terracotta-600)', fontWeight: 600, cursor: 'pointer' }}>
            Reenviar código
          </span>
        </p>

        {erro && <div className="pb-erro" style={{ marginTop: 16 }}>{erro}</div>}

        <div className="auth-spacer" style={{ minHeight: 32 }} />

        <button
          type="submit"
          className="pb-btn pb-btn--primary pb-btn--block pb-btn--lg"
          disabled={carregando || digits.some(d => d === '')}
          style={{ marginTop: 24 }}
        >
          {carregando ? 'Verificando...' : 'Confirmar'}
        </button>
      </form>
    </div>
  );
}
