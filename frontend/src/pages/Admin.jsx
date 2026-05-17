import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { imgUrl } from '../services/api';

const fmt = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function Switch({ on, onChange }) {
  return (
    <button
      className={`adm-switch${on ? ' adm-switch--on' : ''}`}
      onClick={onChange}
      role="switch"
      aria-checked={on}
      type="button"
    />
  );
}

// ── Modal Seção (lógica inalterada) ───────────────────────────────────────────

function ModalSecao({ secao, onSalvar, onFechar, salvando }) {
  const [nome, setNome] = useState(secao?.nome ?? '');
  const [ordem, setOrdem] = useState(secao?.ordem ?? 0);
  const [ativa, setAtiva] = useState(secao?.ativa ?? true);

  function handleSubmit(e) {
    e.preventDefault();
    onSalvar({ id: secao?.id, nome, ordem: Number(ordem), ativa });
  }

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <h2 className="adm-modal-titulo">{secao ? 'Editar Seção' : 'Nova Seção'}</h2>
          <button className="adm-modal-close" type="button" onClick={onFechar}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="adm-modal-body">
            <div className="adm-form-row">
              <label className="pb-label">Nome da seção</label>
              <input className="pb-input" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Pizzas" autoFocus />
            </div>
            <div className="adm-form-row">
              <label className="pb-label">Ordem de exibição</label>
              <input className="pb-input" type="number" min={0} style={{ maxWidth: '120px' }} value={ordem} onChange={(e) => setOrdem(e.target.value)} />
            </div>
            <label className="adm-form-check">
              <input type="checkbox" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} />
              Seção ativa (visível no cardápio)
            </label>
          </div>
          <div className="adm-modal-footer">
            <button type="button" className="pb-btn pb-btn--ghost" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="pb-btn pb-btn--primary" disabled={salvando}>
              {salvando ? 'Salvando…' : secao ? 'Salvar alterações' : 'Criar Seção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Item ────────────────────────────────────────────────────────────────

function ModalItem({ item, secoes, onSalvar, onFechar, salvando }) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [descricao, setDescricao] = useState(item?.descricao ?? '');
  const [preco, setPreco] = useState(item?.preco != null ? Number(item.preco).toFixed(2) : '');
  const [disponivel, setDisponivel] = useState(item?.disponivel ?? true);
  const [secaoIds, setSecaoIds] = useState(item?.secoes?.map((s) => s.id) ?? []);
  const [imagemUrl, setImagemUrl] = useState(item?.imagemUrl ?? '');
  const [uploadando, setUploadando] = useState(false);
  const [erroUpload, setErroUpload] = useState('');
  const inputFileRef = useRef(null);

  function toggleSecao(id) {
    setSecaoIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  async function handleArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadando(true);
    setErroUpload('');
    const fd = new FormData();
    fd.append('imagem', file);
    try {
      const res = await api.post('/admin/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImagemUrl(res.data.url);
    } catch (err) {
      setErroUpload(err.response?.data?.erro || 'Erro ao enviar imagem.');
    } finally {
      setUploadando(false);
      e.target.value = '';
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSalvar({ id: item?.id, nome, descricao, preco: Number(preco), imagemUrl, disponivel, secaoIds });
  }

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <h2 className="adm-modal-titulo">{item ? 'Editar Item' : 'Novo Item'}</h2>
          <button className="adm-modal-close" type="button" onClick={onFechar}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="adm-modal-body">

            {/* ── Upload de imagem ── */}
            <div className="adm-form-row">
              <label className="pb-label">Foto do item</label>
              {uploadando ? (
                <div className="adm-img-upload adm-img-upload--loading">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>Enviando imagem…</span>
                </div>
              ) : imagemUrl ? (
                <div className="adm-img-preview">
                  <img src={imgUrl(imagemUrl)} alt="Preview" className="adm-img-preview-img" />
                  <div className="adm-img-preview-actions">
                    <button type="button" className="adm-btn-sm" onClick={() => inputFileRef.current?.click()}>
                      Trocar foto
                    </button>
                    <button type="button" className="adm-btn-sm adm-btn-sm--danger" onClick={() => setImagemUrl('')}>
                      Remover
                    </button>
                  </div>
                  <input ref={inputFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleArquivo} />
                </div>
              ) : (
                <label className="adm-img-upload" htmlFor="adm-img-file">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--pb-ink-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span style={{ fontWeight: 600, color: 'var(--pb-ink-500)', fontSize: '14px' }}>Clique para adicionar foto</span>
                  <span style={{ fontSize: '12px', color: 'var(--pb-ink-300)' }}>JPG, PNG, WebP · máx. 5 MB</span>
                  <input id="adm-img-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleArquivo} />
                </label>
              )}
              {erroUpload && <p style={{ color: 'var(--pb-danger)', fontSize: '12px', marginTop: '6px' }}>{erroUpload}</p>}
            </div>

            <div className="adm-form-row">
              <label className="pb-label">Nome do item</label>
              <input className="pb-input" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Pizza Margherita" autoFocus />
            </div>
            <div className="adm-form-row">
              <label className="pb-label">Descrição</label>
              <textarea className="pb-input" rows={3} style={{ resize: 'vertical' }} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ingredientes, detalhes…" />
            </div>
            <div className="adm-form-row">
              <label className="pb-label">Preço (R$)</label>
              <input className="pb-input" type="number" step="0.01" min="0" style={{ maxWidth: '180px' }} value={preco} onChange={(e) => setPreco(e.target.value)} required placeholder="0,00" />
            </div>
            {secoes.length > 0 && (
              <div className="adm-form-row">
                <label className="pb-label">Seções</label>
                <div className="adm-secao-chips">
                  {secoes.map((s) => (
                    <label key={s.id} className={`adm-secao-chip${secaoIds.includes(s.id) ? ' adm-secao-chip--on' : ''}`}>
                      <input type="checkbox" style={{ display: 'none' }} checked={secaoIds.includes(s.id)} onChange={() => toggleSecao(s.id)} />
                      {s.nome}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <label className="adm-form-check">
              <input type="checkbox" checked={disponivel} onChange={(e) => setDisponivel(e.target.checked)} />
              Item disponível no cardápio
            </label>
          </div>
          <div className="adm-modal-footer">
            <button type="button" className="pb-btn pb-btn--ghost" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="pb-btn pb-btn--primary" disabled={salvando || uploadando}>
              {salvando ? 'Salvando…' : item ? 'Salvar alterações' : 'Criar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Ícones SVG ────────────────────────────────────────────────────────────────

const IcoPedidos = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const IcoCardapio = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);
const IcoSecoes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IcoHistorico = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoConfig = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IcoChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

const NAV_ITEMS = [
  { id: 'pedidos',    label: 'Pedidos',       ico: <IcoPedidos /> },
  { id: 'cardapio',  label: 'Cardápio',       ico: <IcoCardapio /> },
  { id: 'secoes',    label: 'Seções',         ico: <IcoSecoes /> },
  { id: 'historico', label: 'Histórico',      ico: <IcoHistorico /> },
  { id: 'config',    label: 'Configurações',  ico: <IcoConfig /> },
];

// ── Admin ─────────────────────────────────────────────────────────────────────

export default function Admin() {
  const [secoes, setSecoes] = useState([]);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [secaoSelecionada, setSecaoSelecionada] = useState(null);
  // mobile: null = lista seções, object = itens da seção
  const [mobileVista, setMobileVista] = useState('secoes'); // 'secoes' | 'itens'
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const exibirAlerta = useCallback((tipo, msg) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 3500);
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      const [rS, rI] = await Promise.all([api.get('/admin/secoes'), api.get('/admin/itens')]);
      setSecoes(rS.data.secoes);
      setItens(rI.data.itens);
    } catch {
      exibirAlerta('erro', 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [exibirAlerta]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // ── CRUD Seções (lógica inalterada) ──
  async function salvarSecao(dados) {
    setSalvando(true);
    try {
      if (dados.id) {
        await api.put(`/admin/secoes/${dados.id}`, dados);
        exibirAlerta('sucesso', 'Seção atualizada com sucesso.');
      } else {
        await api.post('/admin/secoes', dados);
        exibirAlerta('sucesso', 'Seção criada com sucesso.');
      }
      setModal(null);
      await carregarDados();
    } catch (err) {
      exibirAlerta('erro', err.response?.data?.erro || 'Erro ao salvar seção.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirSecao(id) {
    if (!window.confirm('Excluir esta seção? Os itens vinculados não serão excluídos.')) return;
    try {
      await api.delete(`/admin/secoes/${id}`);
      if (secaoSelecionada?.id === id) setSecaoSelecionada(null);
      exibirAlerta('sucesso', 'Seção excluída.');
      await carregarDados();
    } catch (err) {
      exibirAlerta('erro', err.response?.data?.erro || 'Erro ao excluir seção.');
    }
  }

  async function toggleSecaoAtiva(secao) {
    try {
      await api.put(`/admin/secoes/${secao.id}`, { ativa: !secao.ativa });
      await carregarDados();
    } catch {
      exibirAlerta('erro', 'Erro ao atualizar seção.');
    }
  }

  // ── CRUD Itens (lógica inalterada) ──
  async function salvarItem(dados) {
    setSalvando(true);
    try {
      if (dados.id) {
        await api.put(`/admin/itens/${dados.id}`, dados);
        exibirAlerta('sucesso', 'Item atualizado com sucesso.');
      } else {
        await api.post('/admin/itens', dados);
        exibirAlerta('sucesso', 'Item criado com sucesso.');
      }
      setModal(null);
      await carregarDados();
    } catch (err) {
      exibirAlerta('erro', err.response?.data?.erro || 'Erro ao salvar item.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirItem(id) {
    if (!window.confirm('Excluir este item do cardápio?')) return;
    try {
      await api.delete(`/admin/itens/${id}`);
      exibirAlerta('sucesso', 'Item excluído.');
      await carregarDados();
    } catch (err) {
      exibirAlerta('erro', err.response?.data?.erro || 'Erro ao excluir item.');
    }
  }

  async function toggleDisponivel(item) {
    try {
      await api.put(`/admin/itens/${item.id}`, { disponivel: !item.disponivel });
      await carregarDados();
    } catch {
      exibirAlerta('erro', 'Erro ao atualizar item.');
    }
  }

  function handleLogout() { logout(); navigate('/admin/login'); }

  function selecionarSecao(s) {
    setSecaoSelecionada(s);
    setMobileVista('itens');
  }

  const itensDaSecao = secaoSelecionada
    ? itens.filter((i) => i.secoes.some((s) => s.id === secaoSelecionada.id))
    : [];

  // ── Painel Central (seções) ──
  const PainelSecoes = () => (
    <div className="adm-center">
      <div className="adm-center-header">
        <p className="adm-center-titulo">Cardápio</p>
        <p className="adm-center-sub">Organize seções e itens do seu menu</p>
      </div>
      <div className="adm-center-list">
        {loading ? (
          <p style={{ padding: '20px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Carregando…</p>
        ) : secoes.length === 0 ? (
          <p style={{ padding: '20px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Nenhuma seção ainda.</p>
        ) : secoes.map((s) => (
          <button
            key={s.id}
            className={`adm-secao-row${secaoSelecionada?.id === s.id ? ' adm-secao-row--on' : ''}`}
            onClick={() => selecionarSecao(s)}
          >
            <span className="adm-secao-row-nome">{s.nome}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {!s.ativa && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>INATIVA</span>}
              <IcoChevron />
            </div>
          </button>
        ))}
      </div>
      <div className="adm-center-footer">
        <button className="adm-nova-secao-btn" onClick={() => setModal({ tipo: 'secao', dados: null })}>
          + Nova seção
        </button>
      </div>
    </div>
  );

  // ── Painel Direito (itens da seção) ──
  const PainelItens = () => {
    if (!secaoSelecionada) return (
      <div className="adm-right adm-right--vazio">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--pb-line)', marginBottom: '16px' }}>
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
        <p style={{ color: 'var(--pb-ink-500)', fontWeight: 600 }}>Selecione uma seção</p>
        <p style={{ color: 'var(--pb-ink-300)', fontSize: '13px', marginTop: '4px' }}>Escolha uma seção à esquerda para ver e editar seus itens.</p>
      </div>
    );

    return (
      <div className="adm-right">
        <div className="adm-right-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="adm-right-titulo">{secaoSelecionada.nome}</h2>
              <span className="pb-badge pb-badge--neutral" style={{ fontSize: '11px' }}>
                {itensDaSecao.length} {itensDaSecao.length === 1 ? 'item' : 'itens'}
              </span>
              {secaoSelecionada.ativa
                ? <span className="pb-badge pb-badge--success" style={{ fontSize: '11px' }}>Seção ativa</span>
                : <span className="pb-badge pb-badge--neutral" style={{ fontSize: '11px' }}>Inativa</span>
              }
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="pb-btn pb-btn--ghost" style={{ fontSize: '13px', padding: '8px 14px' }} onClick={() => setModal({ tipo: 'secao', dados: secaoSelecionada })}>
              Editar seção
            </button>
            <button className="adm-btn-danger" onClick={() => excluirSecao(secaoSelecionada.id)}>
              Excluir
            </button>
            <button className="pb-btn pb-btn--primary" style={{ fontSize: '13px', padding: '9px 18px' }} onClick={() => setModal({ tipo: 'item', dados: null })}>
              + Novo item
            </button>
          </div>
        </div>

        {itensDaSecao.length === 0 ? (
          <div className="adm-right-vazio">
            <p style={{ color: 'var(--pb-ink-500)' }}>Nenhum item nesta seção.</p>
            <button className="pb-btn pb-btn--primary" style={{ marginTop: '16px', fontSize: '14px' }} onClick={() => setModal({ tipo: 'item', dados: null })}>
              + Criar primeiro item
            </button>
          </div>
        ) : (
          <div className="adm-itens-list">
            {itensDaSecao.map((item) => (
              <div key={item.id} className={`adm-item-row${!item.disponivel ? ' adm-item-row--off' : ''}`}>
                {/* Thumbnail */}
                <div className="adm-item-thumb" style={{ padding: 0, overflow: 'hidden' }}>
                  {item.imagemUrl
                    ? <img src={imgUrl(item.imagemUrl)} alt={item.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '20px' }}>🍽️</span>
                  }
                </div>
                {/* Info */}
                <div className="adm-item-info">
                  <p className="adm-item-nome">{item.nome}</p>
                  {item.descricao && <p className="adm-item-desc">{item.descricao}</p>}
                  {item.secoes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {item.secoes.map((s) => (
                        <span key={s.id} className="pb-badge pb-badge--neutral" style={{ fontSize: '10px' }}>{s.nome}</span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Preço + toggle + ações */}
                <div className="adm-item-actions">
                  <span className="adm-item-preco">{fmt(item.preco)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Switch on={item.disponivel} onChange={() => toggleDisponivel(item)} />
                    <button className="adm-btn-sm" onClick={() => setModal({ tipo: 'item', dados: item })}>Editar</button>
                    <button className="adm-btn-sm adm-btn-sm--danger" onClick={() => excluirItem(item.id)}>Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="adm-shell">

      {/* ── Sidebar ── */}
      <aside className="adm-sidebar">
        {/* Logo */}
        <div className="adm-sidebar-logo">
          <div className="pb-logo-mark" style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--pb-mustard-200)' }}>P</div>
          <span style={{ fontFamily: 'var(--pb-font-display)', fontWeight: 700, fontSize: '18px', color: 'white', letterSpacing: '-0.02em' }}>PontoBom</span>
        </div>

        {/* Nav */}
        <nav className="adm-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`adm-nav-item${item.id === 'cardapio' ? ' adm-nav-item--on' : ''}`}
            >
              {item.ico}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Perfil */}
        <div className="adm-sidebar-perfil">
          <div className="adm-perfil-avatar">{(usuario?.nome || 'A')[0].toUpperCase()}</div>
          <div className="adm-perfil-info">
            <p className="adm-perfil-nome">{usuario?.nome || 'Administrador'}</p>
            <p className="adm-perfil-email">{usuario?.email || 'admin@pontobom.com'}</p>
          </div>
          <button className="adm-perfil-sair" onClick={handleLogout} title="Sair">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Layout Desktop: centro + direita ── */}
      <div className="adm-workspace">
        {/* Alerta (desktop) */}
        {alerta && (
          <div className={`adm-alerta adm-alerta--${alerta.tipo}`} style={{ position: 'absolute', top: '16px', right: '24px', zIndex: 50, minWidth: '280px' }}>
            {alerta.msg}
          </div>
        )}
        <PainelSecoes />
        <PainelItens />
      </div>

      {/* ── Layout Mobile ── */}
      <div className="adm-mobile">
        {/* Header mobile */}
        <div className="adm-mobile-header">
          {mobileVista === 'itens' && (
            <button className="adm-mobile-back" onClick={() => { setMobileVista('secoes'); setSecaoSelecionada(null); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
          )}
          <div className="pb-logo" style={{ color: 'white' }}>
            <div className="pb-logo-mark" style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--pb-mustard-200)', width: '28px', height: '28px', fontSize: '14px' }}>P</div>
            {mobileVista === 'secoes' ? 'Cardápio' : secaoSelecionada?.nome}
          </div>
          <button className="adm-mobile-sair" onClick={handleLogout}>Sair</button>
        </div>

        {/* Alerta mobile */}
        {alerta && <div className={`adm-alerta adm-alerta--${alerta.tipo}`} style={{ margin: '8px 16px 0' }}>{alerta.msg}</div>}

        {/* Vista Seções */}
        {mobileVista === 'secoes' && (
          <div className="adm-mobile-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--pb-font-display)', fontSize: '22px', fontWeight: 700 }}>Seções</h2>
              <button className="pb-btn pb-btn--primary" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={() => setModal({ tipo: 'secao', dados: null })}>+ Nova</button>
            </div>
            {loading ? <p style={{ color: 'var(--pb-ink-500)' }}>Carregando…</p> : secoes.length === 0 ? (
              <p style={{ color: 'var(--pb-ink-500)' }}>Nenhuma seção cadastrada.</p>
            ) : secoes.map((s) => (
              <button key={s.id} className="adm-mobile-secao-row" onClick={() => selecionarSecao(s)}>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--pb-ink-900)', textAlign: 'left' }}>{s.nome}</p>
                  <p style={{ fontSize: '12px', color: 'var(--pb-ink-500)' }}>{s.ativa ? 'Ativa' : 'Inativa'}</p>
                </div>
                <IcoChevron />
              </button>
            ))}
          </div>
        )}

        {/* Vista Itens */}
        {mobileVista === 'itens' && secaoSelecionada && (
          <div className="adm-mobile-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--pb-font-display)', fontSize: '20px', fontWeight: 700 }}>{secaoSelecionada.nome}</h2>
                <p style={{ fontSize: '13px', color: 'var(--pb-ink-500)' }}>{itensDaSecao.length} {itensDaSecao.length === 1 ? 'item' : 'itens'}</p>
              </div>
              <button className="pb-btn pb-btn--primary" style={{ fontSize: '13px', padding: '8px 14px' }} onClick={() => setModal({ tipo: 'item', dados: null })}>+ Novo</button>
            </div>
            {itensDaSecao.length === 0 ? (
              <p style={{ color: 'var(--pb-ink-500)' }}>Nenhum item nesta seção.</p>
            ) : itensDaSecao.map((item) => (
              <div key={item.id} className="adm-mobile-item-row">
                <div className="adm-mobile-item-info">
                  <p style={{ fontWeight: 600, color: 'var(--pb-ink-900)' }}>{item.nome}</p>
                  {item.descricao && <p style={{ fontSize: '12px', color: 'var(--pb-ink-500)', marginTop: '2px' }}>{item.descricao}</p>}
                  <p style={{ fontFamily: 'var(--pb-font-display)', fontWeight: 700, color: 'var(--pb-terracotta-600)', marginTop: '6px' }}>{fmt(item.preco)}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  <Switch on={item.disponivel} onChange={() => toggleDisponivel(item)} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="adm-btn-sm" onClick={() => setModal({ tipo: 'item', dados: item })}>Editar</button>
                    <button className="adm-btn-sm adm-btn-sm--danger" onClick={() => excluirItem(item.id)}>Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      {modal?.tipo === 'secao' && (
        <ModalSecao secao={modal.dados} salvando={salvando} onSalvar={salvarSecao} onFechar={() => setModal(null)} />
      )}
      {modal?.tipo === 'item' && (
        <ModalItem item={modal.dados} secoes={secoes} salvando={salvando} onSalvar={salvarItem} onFechar={() => setModal(null)} />
      )}
    </div>
  );
}
