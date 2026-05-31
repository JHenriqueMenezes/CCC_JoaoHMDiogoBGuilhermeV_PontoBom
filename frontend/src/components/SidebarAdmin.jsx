import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    id: 'pedidos',
    label: 'Pedidos',
    rota: '/admin/pedidos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    id: 'cardapio',
    label: 'Cardápio',
    rota: '/admin',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    id: 'mensagens',
    label: 'Mensagens',
    rota: '/admin/mensagens',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    rota: '/admin/usuarios',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'historico',
    label: 'Histórico',
    rota: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    id: 'config',
    label: 'Configurações',
    rota: '/admin/config',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

export default function SidebarAdmin({ ativo, novosPedidos = 0 }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <aside className="adm-sidebar">
      {/* Logo */}
      <div className="adm-sidebar-logo">
        <div className="pb-logo-mark" style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--pb-mustard-200)' }}>P</div>
        <span style={{ fontFamily: 'var(--pb-font-display)', fontWeight: 700, fontSize: '18px', color: 'white', letterSpacing: '-0.02em' }}>
          PontoBom
        </span>
      </div>

      {/* Nav */}
      <nav className="adm-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`adm-nav-item${ativo === item.id ? ' adm-nav-item--on' : ''}`}
            onClick={item.rota ? () => navigate(item.rota) : undefined}
            style={!item.rota ? { opacity: 0.5, cursor: 'default' } : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === 'pedidos' && novosPedidos > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--pb-terracotta-500)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '999px',
                padding: '2px 7px',
                lineHeight: 1.5,
              }}>
                {novosPedidos}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Perfil + logout */}
      <div className="adm-sidebar-perfil">
        <div className="adm-perfil-avatar">{(usuario?.nome || 'A')[0].toUpperCase()}</div>
        <div className="adm-perfil-info">
          <p className="adm-perfil-nome">{usuario?.nome || 'Administrador'}</p>
          <p className="adm-perfil-email">{usuario?.email || 'admin@pontobom.com'}</p>
        </div>
        <button className="adm-perfil-sair" onClick={handleLogout} title="Sair">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
