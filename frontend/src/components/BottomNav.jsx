import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { totalItens } = useCart();

  const tabs = [
    {
      path: '/',
      label: 'Cardápio',
      match: ['/cardapio', '/'],
      icon: (on) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={on ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/carrinho',
      label: 'Carrinho',
      match: ['/carrinho'],
      badge: totalItens,
      icon: (on) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={on ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
      ),
    },
    {
      path: '/historico',
      label: 'Histórico',
      match: ['/historico'],
      icon: (on) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={on ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const on = tab.match.includes(pathname);
        return (
          <button
            key={tab.path}
            className={`bottom-nav-item${on ? ' bottom-nav-item--on' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
          >
            <span className="bottom-nav-icon-wrap">
              {tab.icon(on)}
              {tab.badge > 0 && (
                <span className="bottom-nav-badge">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
