import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { imgUrl } from '../services/api';

const fmt = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

export default function Carrinho() {
  const { itens, remover, alterarQtd, totalItens, totalPreco } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  function handleFinalizar() {
    if (!usuario) {
      navigate('/login', { state: { redirectTo: '/carrinho' } });
    } else {
      navigate('/checkout');
    }
  }

  if (itens.length === 0) {
    return (
      <div className="carrinho-page">
        <header className="carrinho-header">
          <h1 className="carrinho-titulo">Carrinho</h1>
        </header>

        <div className="carrinho-vazio">
          <div className="carrinho-vazio-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--pb-ink-300)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
          </div>
          <p className="carrinho-vazio-titulo">Seu carrinho está vazio</p>
          <p className="carrinho-vazio-sub">Adicione itens do cardápio para continuar</p>
          <button className="pb-btn pb-btn--primary" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>
            Ver cardápio
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="carrinho-page">
      <header className="carrinho-header">
        <div>
          <h1 className="carrinho-titulo">Carrinho</h1>
          <p className="carrinho-header-count">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</p>
        </div>
      </header>

      <div className="carrinho-body">
        {itens.map((c, i) => (
          <div key={i} className="carrinho-item">
            {/* Thumbnail */}
            <div className="carrinho-item-thumb">
              {c.item.imagemUrl
                ? <img src={imgUrl(c.item.imagemUrl)} alt={c.item.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                : <span className="carrinho-item-thumb-letra">{c.item.nome[0].toUpperCase()}</span>
              }
            </div>
            <div className="carrinho-item-info">
              <p className="carrinho-item-nome">{c.item.nome}</p>
              {c.observacao && <p className="carrinho-item-obs">"{c.observacao}"</p>}
              <p className="carrinho-item-preco-unit">{fmt(c.item.preco)} / un.</p>
            </div>

            <div className="carrinho-item-right">
              <p className="carrinho-item-preco-total">{fmt(c.item.preco * c.quantidade)}</p>
              <div className="carrinho-controles">
                <button
                  className={`carrinho-qty-btn${c.quantidade === 1 ? ' carrinho-qty-btn--del' : ''}`}
                  onClick={() => c.quantidade === 1 ? remover(i) : alterarQtd(i, -1)}
                  aria-label={c.quantidade === 1 ? 'Remover item' : 'Diminuir quantidade'}
                >
                  {c.quantidade === 1
                    ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                    )
                    : '−'}
                </button>
                <span className="carrinho-qty-num">{c.quantidade}</span>
                <button
                  className="carrinho-qty-btn"
                  onClick={() => alterarQtd(i, 1)}
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="carrinho-footer">
        <div className="carrinho-total-row">
          <span className="carrinho-total-label">Total do pedido</span>
          <span className="carrinho-total-valor">{fmt(totalPreco)}</span>
        </div>

        {!usuario && (
          <p className="carrinho-login-hint">
            Você precisa estar logado para finalizar o pedido.
          </p>
        )}

        <button
          className="pb-btn pb-btn--primary pb-btn--block pb-btn--lg"
          onClick={handleFinalizar}
        >
          {usuario ? 'Finalizar pedido' : 'Entrar para finalizar'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
