import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerificarCodigo() {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const telefone = location.state?.telefone;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await api.post('/auth/verificar', { telefone, codigo });
      login(res.data.token, res.data.usuario);
      navigate('/cardapio');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Código inválido.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>PontoBom</h1>
        <h2>Verificar Código</h2>
        <p>Código enviado para <strong>{telefone}</strong></p>
        <p className="dica">⚠️ Em desenvolvimento: veja o código no terminal do backend.</p>
        <form onSubmit={handleSubmit}>
          <label>Código de 6 dígitos</label>
          <input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
          />
          {erro && <p className="erro">{erro}</p>}
          <button type="submit" disabled={carregando}>
            {carregando ? 'Verificando...' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
}
