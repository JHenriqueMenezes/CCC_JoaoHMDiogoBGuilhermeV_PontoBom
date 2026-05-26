import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { imgUrl } from '../services/api';
import api from '../services/api';

const fmt = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

// ── Helpers de formatação ──────────────────────────────────────────────────────

function fmtCartao(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function fmtValidade(val) {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function fmtCpf(val) {
  return val.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function fmtCep(val) {
  return val.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}

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

// ── Tela PIX ──────────────────────────────────────────────────────────────────

function TelaPixQrCode({ numero, pixInfo, onPago, onVoltar }) {
  const [copiado, setCopiado] = useState(false);
  const onPagoRef = useRef(onPago);
  onPagoRef.current = onPago;

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/pedidos/${numero}/pagamento`);
        const { status } = res.data;
        if (status === 'RECEIVED' || status === 'CONFIRMED') {
          clearInterval(interval);
          onPagoRef.current();
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [numero]);

  function copiar() {
    navigator.clipboard.writeText(pixInfo.pixCopiaECola).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    });
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <button className="checkout-back" onClick={onVoltar} aria-label="Cancelar PIX">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="carrinho-titulo" style={{ margin: 0 }}>Pagar via PIX</h1>
        <div style={{ width: 36 }} />
      </header>

      <div className="carrinho-body">
        <div className="checkout-secao" style={{ textAlign: 'center' }}>
          <h2 className="checkout-secao-titulo">Escaneie o QR Code</h2>
          <p className="checkout-pagamento-desc" style={{ marginBottom: 20 }}>
            Pedido #{numero} · Abra seu banco e pague via PIX
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <img
              src={`data:image/png;base64,${pixInfo.pixQrCode}`}
              alt="QR Code PIX"
              style={{
                width: 200, height: 200,
                border: '6px solid white',
                borderRadius: 'var(--pb-r-md)',
                boxShadow: 'var(--pb-shadow-md)',
              }}
            />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 'var(--pb-r-md)',
            background: 'var(--pb-warn-bg)', color: 'var(--pb-warn)',
            fontSize: 13, fontWeight: 600, marginBottom: 16,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--pb-warn)', display: 'inline-block',
              animation: 'pb-pulse 1.4s ease-in-out infinite',
            }} />
            Aguardando pagamento…
          </div>

          <div style={{
            background: 'white', border: '1.5px solid var(--pb-line)',
            borderRadius: 'var(--pb-r-md)', padding: '12px 14px', marginBottom: 12,
            textAlign: 'left',
          }}>
            <p style={{ fontSize: 11, color: 'var(--pb-ink-300)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PIX copia e cola
            </p>
            <p style={{ fontSize: 12, color: 'var(--pb-ink-500)', margin: 0, wordBreak: 'break-all', lineHeight: 1.5 }}>
              {pixInfo.pixCopiaECola?.slice(0, 80)}…
            </p>
          </div>

          <button className="pb-btn pb-btn--primary pb-btn--block" onClick={copiar}>
            {copiado ? '✓ Código copiado!' : 'Copiar código PIX'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--pb-ink-300)', marginTop: 16 }}>
            Esta página atualiza automaticamente após o pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Checkout ──────────────────────────────────────────────────────────────────

const OPCOES_PAGAMENTO = [
  {
    id: 'AVISTA',
    nome: 'À vista na retirada',
    desc: 'Pague em dinheiro, cartão ou Pix no balcão',
  },
  {
    id: 'PIX',
    nome: 'PIX online',
    desc: 'Pague agora com PIX e garanta seu pedido',
  },
  {
    id: 'CARTAO',
    nome: 'Cartão de crédito',
    desc: 'Pague online com seu cartão de crédito',
  },
];

const INPUT = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid var(--pb-line)',
  borderRadius: 'var(--pb-r-sm)',
  fontSize: 14,
  fontFamily: 'var(--pb-font-text)',
  color: 'var(--pb-ink-900)',
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--pb-ink-500)',
  marginBottom: 4,
  display: 'block',
};

export default function Checkout() {
  const { itens, totalPreco, limpar } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [formaPagamento, setFormaPagamento] = useState('AVISTA');
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState('');
  const [numeroPedido, setNumeroPedido] = useState(null);
  const [pixInfo, setPixInfo] = useState(null);
  const [pagoPix, setPagoPix] = useState(false);

  const [cartao, setCartao] = useState({ numero: '', nomeTitular: '', validade: '', cvv: '' });
  const [titular, setTitular] = useState({ cpf: '', cep: '', numeroEndereco: '' });
  const [cpfPix, setCpfPix] = useState('');

  useEffect(() => {
    if (!usuario) navigate('/login', { state: { redirectTo: '/checkout' } });
    else if (itens.length === 0 && !numeroPedido) navigate('/carrinho');
  }, []);

  const handlePagoPix = useCallback(() => setPagoPix(true), []);

  async function handleConfirmar() {
    setConfirmando(true);
    setErro('');

    try {
      const payload = {
        formaPagamento: formaPagamento === 'AVISTA' ? 'AVISTA' : 'ASAAS',
        itens: itens.map((c) => ({
          itemId: c.item.id,
          quantidade: c.quantidade,
          observacao: c.observacao || '',
          precoUnit: c.item.preco,
        })),
      };

      if (formaPagamento === 'PIX') {
        if (!cpfPix) {
          setErro('Informe seu CPF para pagamento via PIX.');
          return;
        }
        payload.metodoPagamento = 'PIX';
        payload.cpf = cpfPix;
      } else if (formaPagamento === 'CARTAO') {
        if (!cartao.numero || !cartao.nomeTitular || !cartao.validade || !cartao.cvv) {
          setErro('Preencha todos os dados do cartão.');
          return;
        }
        if (!titular.cpf || !titular.cep || !titular.numeroEndereco) {
          setErro('Preencha o CPF, CEP e número do endereço do titular.');
          return;
        }
        const [mes, anoAbrev] = cartao.validade.split('/');
        if (!mes || !anoAbrev || anoAbrev.length < 2) {
          setErro('Validade inválida. Use o formato MM/AA.');
          return;
        }
        payload.metodoPagamento = 'CARTAO';
        payload.cartao = {
          numero: cartao.numero.replace(/\s/g, ''),
          nomeTitular: cartao.nomeTitular,
          mesExpiracao: mes,
          anoExpiracao: `20${anoAbrev}`,
          cvv: cartao.cvv,
        };
        payload.titular = {
          nome: cartao.nomeTitular,
          cpf: titular.cpf,
          cep: titular.cep,
          numeroEndereco: titular.numeroEndereco,
        };
      }

      const res = await api.post('/pedidos', payload);
      limpar();
      setNumeroPedido(res.data.pedido.numero);

      if (formaPagamento === 'PIX' && res.data.pagamento) {
        setPixInfo(res.data.pagamento);
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao realizar pedido. Tente novamente.');
    } finally {
      setConfirmando(false);
    }
  }

  // ── Telas de resultado ───────────────────────────────────────────────────────

  if (numeroPedido && formaPagamento === 'PIX' && !pagoPix && pixInfo) {
    return (
      <TelaPixQrCode
        numero={numeroPedido}
        pixInfo={pixInfo}
        onPago={handlePagoPix}
        onVoltar={() => navigate('/')}
      />
    );
  }

  if (numeroPedido && (formaPagamento !== 'PIX' || pagoPix)) {
    return <TelaSucesso numero={numeroPedido} onVoltar={() => navigate('/')} />;
  }

  // ── Render principal ─────────────────────────────────────────────────────────

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

          {OPCOES_PAGAMENTO.map((op) => (
            <div
              key={op.id}
              className={`checkout-pagamento-opcao${formaPagamento === op.id ? ' checkout-pagamento-opcao--on' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => { setFormaPagamento(op.id); setErro(''); }}
            >
              <div className={`checkout-pagamento-radio${formaPagamento !== op.id ? ' checkout-pagamento-radio--off' : ''}`} />
              <div className="checkout-pagamento-info">
                <p className="checkout-pagamento-nome">{op.nome}</p>
                <p className="checkout-pagamento-desc">{op.desc}</p>
              </div>
              {formaPagamento === op.id && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pb-success)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* CPF para PIX */}
        {formaPagamento === 'PIX' && (
          <div className="checkout-secao">
            <h2 className="checkout-secao-titulo">Dados para cobrança</h2>
            <div>
              <label style={LABEL}>CPF do pagador</label>
              <input
                style={INPUT}
                placeholder="000.000.000-00"
                value={cpfPix}
                inputMode="numeric"
                onChange={e => setCpfPix(fmtCpf(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* Formulário cartão de crédito */}
        {formaPagamento === 'CARTAO' && (
          <div className="checkout-secao">
            <h2 className="checkout-secao-titulo">Dados do cartão</h2>

            <div style={{ marginBottom: 10 }}>
              <label style={LABEL}>Número do cartão</label>
              <input
                style={INPUT}
                placeholder="0000 0000 0000 0000"
                value={cartao.numero}
                inputMode="numeric"
                onChange={e => setCartao(p => ({ ...p, numero: fmtCartao(e.target.value) }))}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={LABEL}>Nome no cartão</label>
              <input
                style={INPUT}
                placeholder="Como aparece no cartão"
                value={cartao.nomeTitular}
                onChange={e => setCartao(p => ({ ...p, nomeTitular: e.target.value.toUpperCase() }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL}>Validade</label>
                <input
                  style={INPUT}
                  placeholder="MM/AA"
                  value={cartao.validade}
                  inputMode="numeric"
                  onChange={e => setCartao(p => ({ ...p, validade: fmtValidade(e.target.value) }))}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LABEL}>CVV</label>
                <input
                  style={INPUT}
                  placeholder="123"
                  value={cartao.cvv}
                  inputMode="numeric"
                  type="password"
                  onChange={e => setCartao(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                />
              </div>
            </div>

            <h2 className="checkout-secao-titulo" style={{ marginTop: 4 }}>Dados do titular</h2>

            <div style={{ marginBottom: 10 }}>
              <label style={LABEL}>CPF</label>
              <input
                style={INPUT}
                placeholder="000.000.000-00"
                value={titular.cpf}
                inputMode="numeric"
                onChange={e => setTitular(p => ({ ...p, cpf: fmtCpf(e.target.value) }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL}>CEP</label>
                <input
                  style={INPUT}
                  placeholder="00000-000"
                  value={titular.cep}
                  inputMode="numeric"
                  onChange={e => setTitular(p => ({ ...p, cep: fmtCep(e.target.value) }))}
                />
              </div>
              <div style={{ flex: '0 0 110px' }}>
                <label style={LABEL}>Número</label>
                <input
                  style={INPUT}
                  placeholder="Ex: 42"
                  value={titular.numeroEndereco}
                  inputMode="numeric"
                  onChange={e => setTitular(p => ({ ...p, numeroEndereco: e.target.value.replace(/\D/g, '') }))}
                />
              </div>
            </div>
          </div>
        )}

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
            ? 'Processando…'
            : formaPagamento === 'PIX'
            ? 'Gerar código PIX'
            : formaPagamento === 'CARTAO'
            ? 'Pagar com cartão'
            : 'Confirmar pedido'}
          {!confirmando && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
        </button>
        <p className="checkout-aviso">
          {formaPagamento === 'AVISTA'
            ? 'Pedido para retirada no balcão · Sem entrega'
            : 'Pagamento processado com segurança via Asaas'}
        </p>
      </div>
    </div>
  );
}
