import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SidebarAdmin from '../components/SidebarAdmin';
import api from '../services/api';

export default function AdminConfig() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get('/status').then((r) => setAberto(r.data.aberto)).catch(() => setAberto(true));
  }, []);

  async function alternar() {
    if (salvando || aberto === null) return;
    setSalvando(true);
    try {
      const r = await api.patch('/admin/config/restaurante', { aberto: !aberto });
      setAberto(r.data.aberto);
    } catch {
      alert('Erro ao alterar status do restaurante.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="adm-shell">

      {/* ── Sidebar (desktop) ── */}
      <SidebarAdmin ativo="config" />

      {/* ── Conteúdo principal (desktop) ── */}
      <div className="adm-workspace">
        <div className="cfg-conteudo">
          <div className="cfg-page-header">
            <h1 className="cfg-page-titulo">Configurações</h1>
            <p className="cfg-page-sub">Gerencie o funcionamento do restaurante.</p>
          </div>

          <div className="cfg-card">
            <div className="cfg-card-info">
              <h2 className="cfg-card-titulo">Status do restaurante</h2>
              <p className="cfg-card-desc">
                Quando fechado, clientes não conseguem avançar do carrinho para o pagamento.
              </p>
            </div>

            {aberto === null ? (
              <p style={{ color: 'var(--pb-ink-400)', fontSize: '14px' }}>Carregando…</p>
            ) : (
              <div className="cfg-toggle-area">
                <span className={`cfg-status-badge ${aberto ? 'cfg-status-badge--aberto' : 'cfg-status-badge--fechado'}`}>
                  <span className="cfg-status-dot" />
                  {aberto ? 'Aberto' : 'Fechado'}
                </span>
                <button
                  className={`cfg-toggle-btn ${aberto ? 'cfg-toggle-btn--fechar' : 'cfg-toggle-btn--abrir'}`}
                  onClick={alternar}
                  disabled={salvando}
                >
                  {salvando ? 'Aguarde…' : aberto ? 'Fechar restaurante' : 'Abrir restaurante'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="adm-mobile">
        <div className="adm-mobile-header">
          <button className="adm-mobile-back" onClick={() => navigate('/admin')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>Configurações</span>
          <button className="adm-mobile-sair" onClick={() => { logout(); navigate('/admin/login'); }}>Sair</button>
        </div>
        <div className="adm-mobile-body">
          <div className="cfg-card">
            <div className="cfg-card-info">
              <h2 className="cfg-card-titulo">Status do restaurante</h2>
              <p className="cfg-card-desc">
                Quando fechado, clientes não conseguem avançar do carrinho para o pagamento.
              </p>
            </div>
            {aberto === null ? (
              <p style={{ color: 'var(--pb-ink-400)', fontSize: '14px' }}>Carregando…</p>
            ) : (
              <div className="cfg-toggle-area">
                <span className={`cfg-status-badge ${aberto ? 'cfg-status-badge--aberto' : 'cfg-status-badge--fechado'}`}>
                  <span className="cfg-status-dot" />
                  {aberto ? 'Aberto' : 'Fechado'}
                </span>
                <button
                  className={`cfg-toggle-btn ${aberto ? 'cfg-toggle-btn--fechar' : 'cfg-toggle-btn--abrir'}`}
                  onClick={alternar}
                  disabled={salvando}
                >
                  {salvando ? 'Aguarde…' : aberto ? 'Fechar restaurante' : 'Abrir restaurante'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
