import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

export default function Historico() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  if (!usuario) {
    return (
      <div className="carrinho-page">
        <header className="carrinho-header">
          <h1 className="carrinho-titulo">Histórico</h1>
        </header>

        <div className="carrinho-vazio">
          <div className="carrinho-vazio-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--pb-ink-300)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="carrinho-vazio-titulo">Entre para ver seu histórico</p>
          <p className="carrinho-vazio-sub">Seus pedidos anteriores ficam salvos aqui.</p>
          <button className="pb-btn pb-btn--primary" style={{ marginTop: '24px' }} onClick={() => navigate('/login')}>
            Entrar
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="carrinho-page">
      <header className="carrinho-header">
        <h1 className="carrinho-titulo">Histórico</h1>
      </header>

      <div className="carrinho-vazio">
        <div className="carrinho-vazio-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--pb-ink-300)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <p className="carrinho-vazio-titulo">Nenhum pedido ainda</p>
        <p className="carrinho-vazio-sub">Quando você fizer um pedido, ele aparecerá aqui.</p>
        <button className="pb-btn pb-btn--primary" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>
          Fazer pedido
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
