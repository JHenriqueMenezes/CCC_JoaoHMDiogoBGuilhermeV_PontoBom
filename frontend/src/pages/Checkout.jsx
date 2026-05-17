import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { imgUrl } from '../services/api';
import api from '../services/api';

const fmt = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

// ── Tela de sucesso ────────────────────────────────────────────────────────────

function TelaSucesso({ numero, onVoltar }) {
  return (
    <div className="checkout-page checkout-page--sucesso">
      <div className="checkout-sucesso">
        <div className="checkout-sucesso-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h1 className="checkout-sucesso-titulo">Pedido realizado!</h1>
        <p className="checkout-sucesso-sub">Seu pedido foi recebido com sucesso.</p>

        <div className="checkout-sucesso-numero">
          <span className="checkout-sucesso-numero-label">Número do pedido</span>
          <span className="checkout-sucesso-numero-val">#{numero}</span>
        </div>

        <div className="checkout-sucesso-info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12a8 8 0 11-3.2-6.4L20 4l-1.4 3.6A7.96 7.96 0 0120 12zM8 14c1 2 3 4 5 5l2-2-3-1-1-1-1-3-2 2z" />
          </svg>
          <p>Enviamos a confirmação para o seu WhatsApp. Aguarde o preparo!</p>
        </div>

        <button
          className="pb-btn pb-btn--primary pb-btn--block pb-btn--lg"
          style={{ marginTop: '8px' }}
          onClick={onVoltar}
        >
          Voltar ao cardápio
        </button>
      </div>
    </div>
  );
}

// ── Checkout ──────────────────────────────────────────────────────────────────

export default function Checkout() {
  const { itens, totalPreco, limpar } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState('');
  const [numeroPedido, setNumeroPedido] = useState(null);

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { state: { redirectTo: '/checkout' } });
    } else if (itens.length === 0 && !numeroPedido) {
      navigate('/carrinho');
    }
  }, []);

  async function handleConfirmar() {
    setConfirmando(true);
    setErro('');
    try {
      const res = await api.post('/pedidos', {
        formaPagamento: 'AVISTA',
        itens: itens.map((c) => ({
          itemId: c.item.id,
          quantidade: c.quantidade,
          observacao: c.observacao || '',
          precoUnit: c.item.preco,
        })),
      });
      limpar();
      setNumeroPedido(res.data.pedido.numero);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao realizar pedido. Tente novamente.');
    } finally {
      setConfirmando(false);
    }
  }

  if (numeroPedido) {
    return <TelaSucesso numero={numeroPedido} onVoltar={() => navigate('/')} />;
  }

  return (
    <div className="checkout-page">
      {/* ── Header ── */}
      <header className="checkout-header">
        <button
          className="checkout-back"
          onClick={() => navigate('/carrinho')}
          aria-label="Voltar ao carrinho"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="carrinho-titulo" style={{ margin: 0 }}>Confirmar pedido</h1>
        <div style={{ width: 36 }} />
      </header>

      {/* ── Conteúdo ── */}
      <div className="carrinho-body">

        {/* Resumo dos itens */}
        <div className="checkout-secao">
          <h2 className="checkout-secao-titulo">Resumo do pedido</h2>
          {itens.map((c, i) => (
            <div key={i} className="checkout-item">
              <div className="checkout-item-thumb">
                {c.item.imagemUrl
                  ? <img src={imgUrl(c.item.imagemUrl)} alt={c.item.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  : <span className="carrinho-item-thumb-letra">{c.item.nome[0].toUpperCase()}</span>
                }
              </div>
              <div className="checkout-item-info">
                <p className="checkout-item-nome">
                  <span className="checkout-item-qtd">{c.quantidade}x</span> {c.item.nome}
                </p>
                {c.observacao && <p className="checkout-item-obs">"{c.observacao}"</p>}
              </div>
              <span className="checkout-item-preco">{fmt(c.item.preco * c.quantidade)}</span>
            </div>
          ))}
        </div>

        {/* Forma de pagamento */}
        <div className="checkout-secao">
          <h2 className="checkout-secao-titulo">Forma de pagamento</h2>
          <p className="checkout-secao-sub">O pagamento é feito na retirada do pedido.</p>

          <div className="checkout-pagamento-opcao checkout-pagamento-opcao--on">
            <div className="checkout-pagamento-radio" />
            <div className="checkout-pagamento-info">
              <p className="checkout-pagamento-nome">À vista na retirada</p>
              <p className="checkout-pagamento-desc">Pague em dinheiro, cartão ou Pix diretamente no balcão</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pb-success)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <div className="checkout-pagamento-opcao checkout-pagamento-opcao--disabled">
            <div className="checkout-pagamento-radio checkout-pagamento-radio--off" />
            <div className="checkout-pagamento-info">
              <p className="checkout-pagamento-nome">Pagamento online</p>
              <p className="checkout-pagamento-desc">PIX, cartão de crédito — em breve</p>
            </div>
            <span className="pb-badge pb-badge--neutral" style={{ fontSize: '10px', flexShrink: 0 }}>Em breve</span>
          </div>
        </div>

        {erro && <div className="pb-erro">{erro}</div>}
      </div>

      {/* ── Rodapé ── */}
      <div className="carrinho-footer">
        <div className="carrinho-total-row">
          <span className="carrinho-total-label">Total a pagar</span>
          <span className="carrinho-total-valor">{fmt(totalPreco)}</span>
        </div>
        <button
          className="pb-btn pb-btn--primary pb-btn--block pb-btn--lg"
          onClick={handleConfirmar}
          disabled={confirmando}
        >
          {confirmando
            ? 'Confirmando…'
            : 'Confirmar pedido'}
          {!confirmando && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
        </button>
        <p className="checkout-aviso">
          Pedido para retirada no balcão · Sem entrega
        </p>
      </div>
    </div>
  );
}
