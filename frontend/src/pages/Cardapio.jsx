import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import BottomNav from '../components/BottomNav';
import api, { imgUrl } from '../services/api';

const fmt = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

const GRADS = [
  'linear-gradient(145deg,#f4a882 0%,#c95a2e 100%)',
  'linear-gradient(145deg,#e8906a 0%,#b04020 100%)',
  'linear-gradient(145deg,#f5b490 0%,#d06030 100%)',
  'linear-gradient(145deg,#e07858 0%,#9a3010 100%)',
  'linear-gradient(145deg,#f09870 0%,#c05028 100%)',
];
const grad = (i) => GRADS[i % GRADS.length];
const label = (nome) => nome.replace(/s$/i, '').toUpperCase().slice(0, 7);

// ── Modal detalhe do item ──────────────────────────────────────────────────────

function ModalDetalhe({ item, secaoNome, gradIdx, onFechar, onAdicionar }) {
  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState('');

  return (
    <div className="cd-modal-overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="cd-modal">
        <div className="cd-modal-img" style={item.imagemUrl ? {} : { background: grad(gradIdx) }}>
          {item.imagemUrl && (
            <img src={imgUrl(item.imagemUrl)} alt={item.nome} className="cd-item-img-cover" />
          )}
          <button className="cd-modal-back" onClick={onFechar} aria-label="Voltar" style={{ position: 'relative', zIndex: 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          {!item.imagemUrl && <span className="cd-modal-img-label" style={{ position: 'relative', zIndex: 1 }}>{label(secaoNome)}</span>}
        </div>
        <div className="cd-modal-body">
          <span className="pb-badge pb-badge--success" style={{ fontSize: '11px', marginBottom: '10px', display: 'inline-flex' }}>
            Top vendida
          </span>
          <h2 className="cd-modal-nome">{item.nome}</h2>
          <span className="cd-modal-preco">{fmt(item.preco)}</span>
          {item.descricao && <p className="cd-modal-desc">{item.descricao}</p>}

          <div className="cd-modal-obs">
            <label className="pb-label">Observações</label>
            <input
              className="pb-input"
              placeholder="Sem cebola, por favor…"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>

          <div className="cd-modal-qty">
            <button className="cd-qty-btn" onClick={() => setQtd((q) => Math.max(1, q - 1))}>−</button>
            <span className="cd-qty-num">{qtd}</span>
            <button className="cd-qty-btn" onClick={() => setQtd((q) => q + 1)}>+</button>
          </div>

          <button
            className="pb-btn pb-btn--primary pb-btn--block pb-btn--lg"
            style={{ marginTop: '20px' }}
            onClick={() => { onAdicionar(item, qtd, obs); onFechar(); }}
          >
            Adicionar · {fmt(item.preco * qtd)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cardápio ──────────────────────────────────────────────────────────────────

export default function Cardapio() {
  const [secoes, setSecoes] = useState([]);
  const [secaoAtiva, setSecaoAtiva] = useState(null);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [itemModal, setItemModal] = useState(null);

  const { adicionar, totalItens } = useCart();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/cardapio')
      .then((r) => {
        const dados = r.data.secoes.filter((s) => s.itens.length > 0);
        setSecoes(dados);
        if (dados.length > 0) setSecaoAtiva(dados[0].id);
      })
      .catch(() => setErro('Não foi possível carregar o cardápio. Tente novamente.'))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() { logout(); navigate('/login'); }

  const secoesVisiveis = secaoAtiva ? secoes.filter((s) => s.id === secaoAtiva) : secoes;
  const secoesComBusca = busca.trim()
    ? secoesVisiveis
        .map((s) => ({ ...s, itens: s.itens.filter((i) => i.nome.toLowerCase().includes(busca.toLowerCase())) }))
        .filter((s) => s.itens.length > 0)
    : secoesVisiveis;

  return (
    <div className="cd-page">

      {/* ── Header Mobile ── */}
      <header className="cd-hm">
        <div className="cd-hm-inner">
          <div className="pb-logo" style={{ fontSize: '18px' }}>
            <div className="pb-logo-mark" style={{ width: '30px', height: '30px', fontSize: '15px' }}>P</div>
            PontoBom
          </div>
          <button
            className="cd-icon-btn"
            onClick={usuario ? handleLogout : () => navigate('/login')}
            aria-label={usuario ? 'Sair' : 'Entrar'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Navbar Desktop ── */}
      <nav className="cd-nav">
        <div className="cd-nav-inner">
          <div className="pb-logo">
            <div className="pb-logo-mark">P</div>
            PontoBom
          </div>
          <div className="cd-nav-links">
            <a className="cd-nav-link cd-nav-link--on" href="#">Cardápio</a>
            <a className="cd-nav-link" href="#">Meus pedidos</a>
            <a className="cd-nav-link" href="#">Sobre</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {usuario && (
              <span style={{ fontSize: '14px', color: 'var(--pb-ink-700)', fontWeight: 500 }}>
                {usuario.nome || usuario.telefone}
              </span>
            )}
            <button
              className="pb-btn pb-btn--primary"
              style={{ fontSize: '13px', padding: '9px 20px', position: 'relative' }}
              onClick={() => navigate('/carrinho')}
            >
              {totalItens > 0 ? `Carrinho · ${totalItens}` : 'Carrinho'}
              {totalItens > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '18px', height: '18px', borderRadius: '9px',
                  background: 'var(--pb-mustard-500)', color: 'white',
                  fontSize: '10px', fontWeight: 700,
                  display: 'grid', placeItems: 'center',
                  border: '2px solid white',
                }}>
                  {totalItens}
                </span>
              )}
            </button>
            {usuario
              ? <button className="pb-btn pb-btn--ghost" style={{ fontSize: '13px', padding: '9px 14px' }} onClick={handleLogout}>Sair</button>
              : <button className="pb-btn pb-btn--ghost" style={{ fontSize: '13px', padding: '9px 14px' }} onClick={() => navigate('/login')}>Entrar</button>
            }
          </div>
        </div>
        <div className="cd-aberto-bar">
          <span className="cd-aberto-badge">
            <span className="cd-aberto-dot" />
            Aberto · 18h às 23h
          </span>
        </div>
      </nav>

      {/* ── Hero Desktop ── */}
      <section className="cd-hero">
        <div className="cd-hero-inner">
          <div className="cd-hero-text">
            <h1 className="cd-hero-titulo">O sabor de casa,<br /><em>direto do forno.</em></h1>
            <p className="cd-hero-sub">Peça online, retire no balcão. Sem fila, sem espera — só o melhor da culinária local.</p>
          </div>
          <div className="cd-hero-cards">
            {[
              { icon: '⭐', val: '4,9', label: 'Avaliação' },
              { icon: '⏱', val: '~25min', label: 'Tempo médio' },
              { icon: '📍', val: 'Centro', label: 'Localização' },
            ].map((c) => (
              <div key={c.label} className="cd-hero-card">
                <span className="cd-hero-card-icon">{c.icon}</span>
                <span className="cd-hero-card-val">{c.val}</span>
                <span className="cd-hero-card-label">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="cd-main">
        {/* Busca */}
        <div className="cd-search">
          <svg className="cd-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="cd-search-input"
            placeholder="Buscar pizza, lanche…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {loading && (
          <div className="cd-vazio">
            <p style={{ color: 'var(--pb-ink-500)' }}>Carregando cardápio…</p>
          </div>
        )}
        {!loading && erro && <div className="pb-erro">{erro}</div>}
        {!loading && !erro && secoes.length === 0 && (
          <div className="cd-vazio">
            <span style={{ fontSize: '48px' }}>🍽️</span>
            <p style={{ color: 'var(--pb-ink-500)', marginTop: '12px' }}>Nenhum item disponível.</p>
          </div>
        )}

        {!loading && !erro && secoes.length > 0 && (
          <>
            {/* Pills — mobile */}
            <div className="cd-pills">
              {secoes.map((s) => (
                <button
                  key={s.id}
                  className={`cd-pill${secaoAtiva === s.id ? ' cd-pill--on' : ''}`}
                  onClick={() => setSecaoAtiva(s.id)}
                >
                  {s.nome}
                </button>
              ))}
            </div>

            {/* Abas — desktop */}
            <div className="cd-abas">
              {secoes.map((s) => (
                <button
                  key={s.id}
                  className={`cd-aba${secaoAtiva === s.id ? ' cd-aba--on' : ''}`}
                  onClick={() => setSecaoAtiva(s.id)}
                >
                  {s.nome}
                </button>
              ))}
            </div>

            {secoesComBusca.map((secao, si) => (
              <section key={secao.id} className="cd-secao">
                <h2 className="cd-secao-titulo">
                  {secao.nome}
                  <span className="cd-secao-count"> · {secao.itens.length} {secao.itens.length === 1 ? 'item' : 'itens'}</span>
                </h2>

                {/* Cards mobile */}
                <div className="cd-lista">
                  {secao.itens.map((item) => (
                    <div
                      key={item.id}
                      className={`cd-card-h${!item.disponivel ? ' cd-card-h--off' : ''}`}
                      onClick={() => item.disponivel && setItemModal({ item, secaoNome: secao.nome, gradIdx: si })}
                    >
                      <div className="cd-card-h-thumb" style={item.imagemUrl ? {} : { background: grad(si) }}>
                        {item.imagemUrl
                          ? <img src={imgUrl(item.imagemUrl)} alt={item.nome} className="cd-item-img-cover" />
                          : <span className="cd-card-h-label">{label(secao.nome)}</span>
                        }
                      </div>
                      <div className="cd-card-h-body">
                        <p className="cd-card-h-nome">{item.nome}</p>
                        {item.descricao && <p className="cd-card-h-desc">{item.descricao}</p>}
                        <div className="cd-card-h-footer">
                          <span className="cd-card-h-preco">{fmt(item.preco)}</span>
                          {item.disponivel
                            ? (
                              <button
                                className="cd-plus"
                                onClick={(e) => { e.stopPropagation(); setItemModal({ item, secaoNome: secao.nome, gradIdx: si }); }}
                                aria-label={`Adicionar ${item.nome}`}
                              >
                                +
                              </button>
                            )
                            : <span className="pb-badge pb-badge--neutral" style={{ fontSize: '11px' }}>Indisponível</span>
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cards desktop */}
                <div className="cd-grid">
                  {secao.itens.map((item) => (
                    <div key={item.id} className={`cd-card-v${!item.disponivel ? ' cd-card-v--off' : ''}`}>
                      <div className="cd-card-v-img" style={item.imagemUrl ? {} : { background: grad(si) }}>
                        {item.imagemUrl
                          ? <img src={imgUrl(item.imagemUrl)} alt={item.nome} className="cd-item-img-cover" />
                          : <span className="cd-card-v-label">{label(secao.nome)}</span>
                        }
                      </div>
                      <div className="cd-card-v-body">
                        <p className="cd-card-v-nome">{item.nome}</p>
                        {item.descricao && <p className="cd-card-v-desc">{item.descricao}</p>}
                        <div className="cd-card-v-footer">
                          <span className="cd-card-v-preco">{fmt(item.preco)}</span>
                          <button
                            className="cd-add-btn"
                            disabled={!item.disponivel}
                            onClick={() => setItemModal({ item, secaoNome: secao.nome, gradIdx: si })}
                          >
                            + Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>

      {/* ── Modal detalhe do item ── */}
      {itemModal && (
        <ModalDetalhe
          item={itemModal.item}
          secaoNome={itemModal.secaoNome}
          gradIdx={itemModal.gradIdx}
          onFechar={() => setItemModal(null)}
          onAdicionar={adicionar}
        />
      )}

      <BottomNav />
    </div>
  );
}
