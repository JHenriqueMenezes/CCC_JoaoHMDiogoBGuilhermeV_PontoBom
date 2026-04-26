import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await api.post('/auth/cadastro', { telefone });
      navigate('/verificar', { state: { telefone } });
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao enviar código.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>PontoBom</h1>
        <h2>Entrar</h2>
        <form onSubmit={handleSubmit}>
          <label>Telefone (WhatsApp)</label>
          <input
            type="text"
            placeholder="Ex: 54999999999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />
          {erro && <p className="erro">{erro}</p>}
          <button type="submit" disabled={carregando}>
            {carregando ? 'Enviando...' : 'Receber código'}
          </button>
        </form>
        <p>Primeira vez? <Link to="/cadastro">Cadastre-se</Link></p>
      </div>
    </div>
  );
}
