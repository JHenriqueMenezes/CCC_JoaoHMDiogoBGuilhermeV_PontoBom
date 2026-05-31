import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SidebarAdmin from '../components/SidebarAdmin';
import api from '../services/api';

function fmtData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Modal novo admin ──────────────────────────────────────────────────────────

function ModalNovoAdmin({ onSalvo, onFechar }) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const r = await api.post('/admin/usuarios', form);
      onSalvo(r.data.usuario);
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao cadastrar administrador.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <h2 className="adm-modal-titulo">Novo administrador</h2>
          <button className="adm-modal-close" type="button" onClick={onFechar}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="adm-modal-body">
            <div className="adm-form-row">
              <label className="pb-label">Nome</label>
              <input className="pb-input" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="João Silva" required />
            </div>
            <div className="adm-form-row">
              <label className="pb-label">E-mail</label>
              <input className="pb-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="joao@pontobom.com" required />
            </div>
            <div className="adm-form-row">
              <label className="pb-label">Senha (mín. 6 caracteres)</label>
              <input className="pb-input" type="password" value={form.senha} onChange={(e) => set('senha', e.target.value)} placeholder="••••••" required minLength={6} />
            </div>
            {erro && <p style={{ color: 'var(--pb-danger)', fontSize: '13px', margin: '8px 0 0' }}>{erro}</p>}
          </div>
          <div className="adm-modal-footer">
            <button type="button" className="pb-btn pb-btn--ghost" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="pb-btn pb-btn--primary" disabled={salvando}>
              {salvando ? 'Cadastrando…' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function AdminUsuarios() {
  const { usuario: mim, logout } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [alterando, setAlterando] = useState(null);

  useEffect(() => {
    api.get('/admin/usuarios')
      .then((r) => setUsuarios(r.data.usuarios))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleNovoSalvo(novoUsuario) {
    setUsuarios((prev) => [...prev, novoUsuario]);
    setModalAberto(false);
  }

  async function alternarStatus(id) {
    setAlterando(id);
    try {
      const r = await api.patch(`/admin/usuarios/${id}/status`);
      setUsuarios((prev) => prev.map((u) => u.id === id ? r.data.usuario : u));
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao alterar status.');
    } finally {
      setAlterando(null);
    }
  }

  const conteudo = (
    <>
      <div className="usr-page-header">
        <div>
          <h1 className="usr-page-titulo">Usuários Admin</h1>
          <p className="usr-page-sub">Gerencie os administradores do sistema.</p>
        </div>
        <button className="pb-btn pb-btn--primary" style={{ fontSize: '13px' }} onClick={() => setModalAberto(true)}>
          + Novo administrador
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--pb-ink-400)', padding: '24px 0' }}>Carregando…</p>
      ) : (
        <div className="usr-tabela">
          <div className="usr-tabela-header">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Cadastro</span>
            <span>Status</span>
            <span></span>
          </div>
          {usuarios.map((u) => {
            const sou = u.id === mim?.id;
            return (
              <div key={u.id} className={`usr-linha${!u.ativo ? ' usr-linha--inativo' : ''}`}>
                <span className="usr-nome">
                  {u.nome || '—'}
                  {sou && <span className="usr-voce-badge">você</span>}
                </span>
                <span className="usr-email">{u.email}</span>
                <span className="usr-data">{fmtData(u.criadoEm)}</span>
                <span>
                  <span className={`usr-status-badge ${u.ativo ? 'usr-status-badge--ativo' : 'usr-status-badge--inativo'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </span>
                <span className="usr-acoes">
                  <button
                    className={`usr-toggle-btn ${u.ativo ? 'usr-toggle-btn--desativar' : 'usr-toggle-btn--ativar'}`}
                    onClick={() => alternarStatus(u.id)}
                    disabled={sou || alterando === u.id}
                    title={sou ? 'Não é possível alterar sua própria conta' : ''}
                  >
                    {alterando === u.id ? '…' : u.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </span>
              </div>
            );
          })}
          {usuarios.length === 0 && (
            <p style={{ padding: '24px', color: 'var(--pb-ink-400)', fontSize: '14px' }}>Nenhum administrador encontrado.</p>
          )}
        </div>
      )}

      {modalAberto && <ModalNovoAdmin onSalvo={handleNovoSalvo} onFechar={() => setModalAberto(false)} />}
    </>
  );

  return (
    <div className="adm-shell">

      <SidebarAdmin ativo="usuarios" />

      {/* Desktop */}
      <div className="adm-workspace">
        <div className="usr-conteudo">{conteudo}</div>
      </div>

      {/* Mobile */}
      <div className="adm-mobile">
        <div className="adm-mobile-header">
          <button className="adm-mobile-back" onClick={() => navigate('/admin')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>Usuários Admin</span>
          <button className="adm-mobile-sair" onClick={() => { logout(); navigate('/admin/login'); }}>Sair</button>
        </div>
        <div className="adm-mobile-body">{conteudo}</div>
      </div>

    </div>
  );
}
