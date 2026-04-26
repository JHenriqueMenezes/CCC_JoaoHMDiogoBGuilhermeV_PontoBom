import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Cardapio() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>PontoBom</h1>
        {usuario ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>Olá, {usuario.nome || usuario.telefone}</span>
            <button onClick={() => { logout(); }}>Sair</button>
          </div>
        ) : (
          <button onClick={() => navigate('/login')}>Entrar</button>
        )}
      </div>
      <p style={{ marginTop: '1rem' }}>🚧 Cardápio será implementado na Semana 3.</p>
    </div>
  );
}
