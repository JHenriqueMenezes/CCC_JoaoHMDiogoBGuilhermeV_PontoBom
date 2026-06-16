import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_TERMINAL = ['FINALIZADO', 'RECUSADO'];

const STATUS_TITULO = {
  RECEBIDO: 'Pedido recebido!',
  ACEITO: 'Pedido confirmado!',
  EM_PREPARO: 'Estamos preparando o seu pedido...',
  PRONTO_PARA_RETIRADA: 'Pronto! Pode vir buscar 🎉',
  FINALIZADO: 'Pedido finalizado',
  RECUSADO: 'Pedido recusado',
};

const STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  ACEITO: 'Aceito',
  EM_PREPARO: 'Em preparo',
  PRONTO_PARA_RETIRADA: 'Pronto para retirada',
  FINALIZADO: 'Finalizado',
  RECUSADO: 'Recusado',
};

const STATUS_ORDEM = ['RECEBIDO', 'ACEITO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA', 'FINALIZADO'];

function fmtHora(dateStr) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function AcompanharPedido() {
  const { numero } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const intervalRef = useRef(null);

  async function buscarPedido() {
    try {
      const { data } = await api.get(`/pedidos/${numero}`);
      setPedido(data.pedido);
      setErro(null);
      if (STATUS_TERMINAL.includes(data.pedido.statusAtual)) {
        clearInterval(intervalRef.current);
      }
    } catch {
      setErro('Pedido não encontrado.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { state: { redirectTo: `/pedido/${numero}` } });
      return;
    }
    buscarPedido();
    intervalRef.current = setInterval(buscarPedido, 10000);
    return () => clearInterval(intervalRef.current);
  }, [numero]);

  if (carregando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh' }}>
        <p style={{ color: 'var(--pb-ink-300)', fontFamily: 'var(--pb-font-text)' }}>Carregando...</p>
      </div>
    );
  }

  if (erro || !pedido) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100svh', gap: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--pb-danger)', fontWeight: 600, margin: 0 }}>{erro || 'Pedido não encontrado.'}</p>
        <button className="pb-btn pb-btn--ghost" onClick={() => navigate('/historico')}>
          Ver histórico
        </button>
      </div>
    );
  }

  const isRecusado = pedido.statusAtual === 'RECUSADO';

  const horarioStatus = {};
  (pedido.historico ?? []).forEach((h) => {
    horarioStatus[h.status] = h.criadoEm;
  });
  const motivo = (pedido.historico ?? []).find((h) => h.status === 'RECUSADO')?.motivo;

  const estimativaHorario = (() => {
    if (!pedido.estimativaMin) return null;
    const aceito = (pedido.historico ?? []).find((h) => h.status === 'ACEITO');
    if (!aceito) return null;
    const base = new Date(aceito.criadoEm);
    base.setMinutes(base.getMinutes() + pedido.estimativaMin);
    return base.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  })();

  const timelineItems = isRecusado
    ? (pedido.historico ?? []).map((h) => h.status)
    : STATUS_ORDEM;

  // Número de telefone da loja — ajustar conforme necessário
  const telLoja = '555496820236';

  return (
    <div className="acp-page">
      {/* Header bordô */}
      <header className="acp-header">
        <div className="acp-header-top">
          <button className="acp-back-btn" onClick={() => navigate('/historico')} aria-label="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="acp-header-pedido">
            <span className="acp-header-label">PEDIDO</span>
            <span className="acp-header-numero">#{pedido.numero}</span>
          </div>
        </div>

        <h1 className="acp-status-titulo">{STATUS_TITULO[pedido.statusAtual]}</h1>

        {estimativaHorario && !STATUS_TERMINAL.includes(pedido.statusAtual) && (
          <div className="acp-estimativa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Retirada prevista: {estimativaHorario} · em ~{pedido.estimativaMin} min
          </div>
        )}
      </header>

      <div className="acp-body">
        {/* Motivo de recusa */}
        {isRecusado && motivo && (
          <div className="acp-recusado-card">
            <p className="acp-recusado-label">Motivo da recusa</p>
            <p className="acp-recusado-motivo">{motivo}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="acp-secao">
          <h2 className="acp-secao-titulo">Acompanhamento</h2>
          <div className="acp-timeline">
            {timelineItems.map((status, idx) => {
              const concluido = horarioStatus[status] != null;
              const atual = pedido.statusAtual === status;
              const futuro = !concluido && !atual;
              const isUltimo = idx === timelineItems.length - 1;

              return (
                <div
                  key={status}
                  className={`acp-tl-item${atual ? ' acp-tl-item--atual' : ''}${futuro ? ' acp-tl-item--futuro' : ''}`}
                >
                  <div className="acp-tl-left">
                    <div
                      className={[
                        'acp-tl-dot',
                        atual ? 'acp-tl-dot--atual' : '',
                        futuro ? 'acp-tl-dot--futuro' : '',
                        status === 'RECUSADO' ? 'acp-tl-dot--recusado' : '',
                      ].filter(Boolean).join(' ')}
                    />
                    {!isUltimo && (
                      <div className={`acp-tl-line${concluido ? ' acp-tl-line--done' : ''}`} />
                    )}
                  </div>

                  <div className="acp-tl-right">
                    <span className="acp-tl-label">{STATUS_LABEL[status]}</span>
                    {concluido && (
                      <span className="acp-tl-hora">{fmtHora(horarioStatus[status])}</span>
                    )}
                    {atual && !concluido && (
                      <span className="acp-tl-agora">agora</span>
                    )}
                    {futuro && (
                      <span className="acp-tl-hora acp-tl-hora--futuro">
                        {status === 'PRONTO_PARA_RETIRADA' && estimativaHorario
                          ? `~${estimativaHorario}`
                          : '–'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Itens */}
        <div className="acp-secao">
          <h2 className="acp-secao-titulo">Seu pedido</h2>
          <div className="acp-itens-card">
            {(pedido.itens ?? []).map((ip, idx) => (
              <div key={ip.id ?? idx} className="acp-item-row">
                <span className="acp-item-qtd">{ip.quantidade}×</span>
                <span className="acp-item-nome">{ip.nome}</span>
                <span className="acp-item-preco">
                  R$ {(ip.precoUnit * ip.quantidade).toFixed(2)}
                </span>
                {ip.observacao && (
                  <span className="acp-item-obs">{ip.observacao}</span>
                )}
              </div>
            ))}
            <div className="acp-total-row">
              <span className="acp-total-label">
                {pedido.formaPagamento === 'AVISTA' ? 'À vista na retirada' : 'Pago online (Asaas)'}
              </span>
              <span className="acp-total-valor">R$ {Number(pedido.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé com ações */}
      <div className="acp-footer">
        <a href={`tel:+${telLoja}`} className="pb-btn pb-btn--ghost" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>
          Ligar
        </a>
        <a
          href={`https://wa.me/${telLoja}`}
          target="_blank"
          rel="noreferrer"
          className="pb-btn pb-btn--primary"
          style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
