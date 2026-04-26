import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Painel Administrativo</h1>
      <p>Bem-vindo, {usuario?.nome}!</p>
      <p>🚧 Gerenciamento de cardápio será implementado na Semana 3.</p>
      <button onClick={handleLogout}>Sair</button>
    </div>
  );
}
