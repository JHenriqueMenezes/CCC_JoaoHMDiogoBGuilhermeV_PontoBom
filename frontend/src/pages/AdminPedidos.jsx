import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SidebarAdmin from '../components/SidebarAdmin';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

function tempoDecorrido(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `há ${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `há ${h}h${m > 0 ? `${m}min` : ''}`;
}

function fmtHoraRetirada(historicoAceito, estimativaMin) {
  if (!historicoAceito || !estimativaMin) return null;
  const base = new Date(historicoAceito.criadoEm);
  base.setMinutes(base.getMinutes() + estimativaMin);
  return base.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDia() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}


// ── Ícone de alerta ───────────────────────────────────────────────────────────

function IcoAlerta() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

// ── Lista de itens (com observações) ─────────────────────────────────────────

function ListaItensPedido({ itens }) {
  return (
    <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid var(--pb-line)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pb-ink-300)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
        Itens do pedido
      </p>
      {itens.map((ip, idx) => (
        <div key={ip.id ?? idx}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            {ip.observacao && (
              <span style={{ color: 'var(--pb-warn)', display: 'flex' }}><IcoAlerta /></span>
            )}
            <span style={{ fontWeight: 700, color: 'var(--pb-ink-500)' }}>{ip.quantidade}×</span>
            <span style={{ color: 'var(--pb-ink-900)' }}>{ip.nome}</span>
          </div>
          {ip.observacao && (
            <p style={{
              margin: '5px 0 0 18px', fontSize: '12px', lineHeight: 1.45,
              color: 'var(--pb-warn)', background: 'var(--pb-warn-bg)',
              borderRadius: '6px', padding: '4px 9px',
            }}>
              {ip.observacao}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Modal Aceitar ─────────────────────────────────────────────────────────────

function ModalAceitar({ pedido, onConfirmar, onFechar, salvando }) {
  const [estimativa, setEstimativa] = useState('25');
  const itens = pedido.itens ?? [];
  const temAlgumObs = itens.some((ip) => ip.observacao);

  function handleSubmit(e) {
    e.preventDefault();
    onConfirmar(pedido.id, Number(estimativa));
  }

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="adm-modal" style={{ maxWidth: '480px' }}>
        <div className="adm-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="adm-modal-titulo">Aceitar #{pedido.numero}</h2>
            {temAlgumObs && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                background: 'var(--pb-warn-bg)', color: 'var(--pb-warn)',
                fontSize: '11px', fontWeight: 700, padding: '2px 7px',
                borderRadius: '999px',
              }}>
                <IcoAlerta /> Observações
              </span>
            )}
          </div>
          <button className="adm-modal-close" type="button" onClick={onFechar}>✕</button>
        </div>

        <ListaItensPedido itens={itens} />

        <form onSubmit={handleSubmit}>
          <div className="adm-modal-body">
            <p style={{ fontSize: '14px', color: 'var(--pb-ink-500)', margin: '0 0 16px' }}>
              Informe o tempo estimado para o cliente retirar o pedido.
            </p>
            <div className="adm-form-row">
              <label className="pb-label">Estimativa (minutos)</label>
              <input
                className="pb-input"
                type="number"
                min={1}
                max={180}
                value={estimativa}
                onChange={(e) => setEstimativa(e.target.value)}
                required
                autoFocus
                style={{ maxWidth: '140px' }}
              />
            </div>
          </div>
          <div className="adm-modal-footer">
            <button type="button" className="pb-btn pb-btn--ghost" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="pb-btn pb-btn--primary" disabled={salvando}>
              {salvando ? 'Confirmando…' : `Aceitar · ${estimativa} min`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Recusar ─────────────────────────────────────────────────────────────

function ModalRecusar({ pedido, onConfirmar, onFechar, salvando }) {
  const [motivo, setMotivo] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!motivo.trim()) return;
    onConfirmar(pedido.id, motivo.trim());
  }

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <h2 className="adm-modal-titulo">Recusar #{pedido.numero}</h2>
          <button className="adm-modal-close" type="button" onClick={onFechar}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="adm-modal-body">
            <div className="adm-form-row">
              <label className="pb-label">Motivo da recusa</label>
              <textarea
                className="pb-input"
                rows={3}
                style={{ resize: 'vertical' }}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Item esgotado, fechado por manutenção..."
                required
                autoFocus
              />
            </div>
          </div>
          <div className="adm-modal-footer">
            <button type="button" className="pb-btn pb-btn--ghost" onClick={onFechar}>Cancelar</button>
            <button
              type="submit"
              className="pb-btn pb-btn--primary"
              style={{ background: 'var(--pb-danger)', boxShadow: 'none' }}
              disabled={salvando || !motivo.trim()}
            >
              {salvando ? 'Recusando…' : 'Confirmar recusa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Detalhes (visualização — pedidos em preparo) ────────────────────────

const PROXIMO_LABEL = {
  ACEITO: 'Iniciar preparo →',
  EM_PREPARO: 'Marcar como pronto →',
  PRONTO_PARA_RETIRADA: 'Cliente retirou ✓',
};

function ModalDetalhesPedido({ pedido, onFechar, onAvancar, processando }) {
  const itens = pedido.itens ?? [];
  const temAlgumObs = itens.some((ip) => ip.observacao);
  const proximoLabel = PROXIMO_LABEL[pedido.statusAtual];

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="adm-modal" style={{ maxWidth: '480px' }}>
        <div className="adm-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="adm-modal-titulo">Pedido #{pedido.numero}</h2>
            {temAlgumObs && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                background: 'var(--pb-warn-bg)', color: 'var(--pb-warn)',
                fontSize: '11px', fontWeight: 700, padding: '2px 7px',
                borderRadius: '999px',
              }}>
                <IcoAlerta /> Observações
              </span>
            )}
          </div>
          <button className="adm-modal-close" type="button" onClick={onFechar}>✕</button>
        </div>

        <div style={{ padding: '14px 20px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--pb-ink-500)', margin: 0 }}>
            Cliente: <strong style={{ color: 'var(--pb-ink-900)' }}>{pedido.usuario?.nome || 'Cliente'}</strong>
          </p>
        </div>

        <ListaItensPedido itens={itens} />

        <div className="adm-modal-footer">
          <button type="button" className="pb-btn pb-btn--ghost" onClick={onFechar}>Fechar</button>
          {proximoLabel && (
            <button
              type="button"
              className="pb-btn pb-btn--primary"
              disabled={processando}
              onClick={() => { onAvancar(pedido); onFechar(); }}
            >
              {processando ? 'Atualizando…' : proximoLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card de Pedido ────────────────────────────────────────────────────────────

function PedidoCard({ pedido, coluna, onAceitar, onRecusar, onAvancar, onVerDetalhes, processando }) {
  const aceitoHist = (pedido.historico ?? []).find((h) => h.status === 'ACEITO');
  const horarioRetirada = fmtHoraRetirada(aceitoHist, pedido.estimativaMin);
  const temObs = (pedido.itens ?? []).some((ip) => ip.observacao);

  const ehNovo =
    coluna === 'recebidos' &&
    Date.now() - new Date(pedido.criadoEm) < 3 * 60 * 1000;

  return (
    <div
      className="kb-card"
      onClick={
        coluna === 'recebidos' ? () => onAceitar(pedido)
        : coluna === 'preparo' ? () => onVerDetalhes(pedido)
        : undefined
      }
      style={(coluna === 'recebidos' || coluna === 'preparo') ? { cursor: 'pointer' } : undefined}
    >
      <div className="kb-card-top">
        <div className="kb-card-id">
          <span className="kb-card-numero">#{pedido.numero}</span>
          {ehNovo && <span className="kb-badge-novo">Novo</span>}
          {temObs && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              background: 'var(--pb-warn-bg)', color: 'var(--pb-warn)',
              fontSize: '10px', fontWeight: 700, padding: '2px 6px',
              borderRadius: '999px',
            }} title="Pedido contém observações">
              <IcoAlerta /> obs.
            </span>
          )}
        </div>
        <span className="kb-card-tempo">
          {coluna === 'preparo' && horarioRetirada
            ? `retirada ${horarioRetirada}`
            : tempoDecorrido(pedido.criadoEm)}
        </span>
      </div>

      <p className="kb-card-cliente">{pedido.usuario?.nome || 'Cliente'}</p>

      <div className="kb-card-itens">
        {(pedido.itens ?? []).slice(0, 3).map((ip, idx) => (
          <span key={ip.id ?? idx} className="kb-card-item-linha" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {ip.observacao && <span style={{ color: 'var(--pb-warn)', display: 'flex' }}><IcoAlerta /></span>}
            {ip.quantidade}× {ip.nome}
          </span>
        ))}
        {(pedido.itens?.length ?? 0) > 3 && (
          <span className="kb-card-item-mais">+{pedido.itens.length - 3} itens</span>
        )}
      </div>

      <div className="kb-card-footer">
        <span className="kb-card-total">{fmt(pedido.total)}</span>
        {coluna === 'pronto' && <span className="kb-wpp-ok">WhatsApp ✓</span>}
      </div>

      <div className="kb-card-acoes" onClick={(e) => e.stopPropagation()}>
        {coluna === 'recebidos' && (
          <>
            <button className="kb-btn-recusar" onClick={() => onRecusar(pedido)}>
              Recusar
            </button>
            <button className="kb-btn-aceitar" onClick={() => onAceitar(pedido)}>
              Aceitar
            </button>
          </>
        )}
        {coluna === 'preparo' && (
          <button
            className="kb-btn-avancar kb-btn-avancar--full"
            onClick={() => onAvancar(pedido)}
            disabled={processando}
          >
            {processando ? 'Atualizando…' : (pedido.statusAtual === 'ACEITO' ? 'Iniciar preparo →' : 'Marcar como pronto →')}
          </button>
        )}
        {coluna === 'pronto' && (
          <button
            className="kb-btn-avancar kb-btn-avancar--full kb-btn-avancar--finalizar"
            onClick={() => onAvancar(pedido)}
            disabled={processando}
          >
            {processando ? 'Atualizando…' : 'Cliente retirou ✓'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ titulo, valor, sub, destaque }) {
  return (
    <div className={`kb-kpi${destaque ? ' kb-kpi--destaque' : ''}`}>
      <p className="kb-kpi-titulo">{titulo}</p>
      <p className="kb-kpi-valor">{valor}</p>
      {sub && <p className="kb-kpi-sub">{sub}</p>}
    </div>
  );
}

// ── AdminPedidos ──────────────────────────────────────────────────────────────

export default function AdminPedidos() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [modal, setModal] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [processando, setProcessando] = useState(new Set());
  const [ultimaAtt, setUltimaAtt] = useState(null);
  const intervalRef = useRef(null);
  const buscarSeqRef = useRef(0);

  const buscar = useCallback(async () => {
    const seq = ++buscarSeqRef.current;
    try {
      const [rP, rM] = await Promise.all([
        api.get('/admin/pedidos'),
        api.get('/admin/pedidos/metrics'),
      ]);
      // Ignora respostas de requisições antigas que chegaram fora de ordem
      if (seq !== buscarSeqRef.current) return;
      setPedidos(rP.data.pedidos);
      setMetricas(rM.data);
      setUltimaAtt(new Date());
    } catch {}
  }, []);

  useEffect(() => {
    buscar();
    intervalRef.current = setInterval(buscar, 8000);
    return () => clearInterval(intervalRef.current);
  }, [buscar]);

  const recebidos = pedidos.filter((p) => p.statusAtual === 'RECEBIDO');
  const emPreparo = pedidos.filter((p) => ['ACEITO', 'EM_PREPARO'].includes(p.statusAtual));
  const prontos   = pedidos.filter((p) => p.statusAtual === 'PRONTO_PARA_RETIRADA');

  async function confirmarAceitar(id, estimativaMin) {
    setSalvando(true);
    try {
      await api.post(`/admin/pedidos/${id}/aceitar`, { estimativaMin });
      setModal(null);
      await buscar();
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao aceitar pedido.');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarRecusar(id, motivo) {
    setSalvando(true);
    try {
      await api.post(`/admin/pedidos/${id}/recusar`, { motivo });
      setModal(null);
      await buscar();
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao recusar pedido.');
    } finally {
      setSalvando(false);
    }
  }

  async function avancarStatus(pedido) {
    const proximo = {
      ACEITO: 'EM_PREPARO',
      EM_PREPARO: 'PRONTO_PARA_RETIRADA',
      PRONTO_PARA_RETIRADA: 'FINALIZADO',
    }[pedido.statusAtual];
    if (!proximo) return;

    setProcessando((s) => new Set(s).add(pedido.id));
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedido.id ? { ...p, statusAtual: proximo } : p))
    );
    // Invalida GETs em voo do polling para evitar que dado stale sobrescreva o update otimista
    buscarSeqRef.current++;

    try {
      await api.patch(`/admin/pedidos/${pedido.id}/status`, { status: proximo });
      buscar();
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao atualizar status.');
      buscar();
    } finally {
      setProcessando((s) => {
        const n = new Set(s);
        n.delete(pedido.id);
        return n;
      });
    }
  }

  const fmtUltimaAtt = () => {
    if (!ultimaAtt) return '–';
    const diff = Math.floor((Date.now() - ultimaAtt) / 1000);
    if (diff < 5) return 'agora mesmo';
    if (diff < 60) return `há ${diff} segundos`;
    return `há ${Math.floor(diff / 60)} min`;
  };

  return (
    <div className="adm-shell">

      {/* ── Sidebar (desktop) ── */}
      <SidebarAdmin ativo="pedidos" novosPedidos={recebidos.length} />

      {/* ── Conteúdo principal (desktop) ── */}
      <div className="adm-workspace">
        <div className="kb-conteudo">

          {/* Cabeçalho */}
          <div className="kb-header">
            <div>
              <h1 className="kb-titulo">Pedidos · ao vivo</h1>
              <p className="kb-subtitulo">
                Atualizado {fmtUltimaAtt()} · {fmtDia()}
              </p>
            </div>
            <span className="kb-badge-aberto">
              <span className="kb-aberto-dot" />
              Aberto agora
            </span>
          </div>

          {/* KPIs */}
          <div className="kb-kpis">
            <KpiCard
              titulo="HOJE"
              valor={metricas?.totalHoje ?? '–'}
              sub={
                metricas
                  ? metricas.variacaoVsOntem != null
                    ? `${metricas.variacaoVsOntem >= 0 ? '+' : ''}${metricas.variacaoVsOntem}% vs ontem`
                    : 'primeiro dia'
                  : '...'
              }
            />
            <KpiCard
              titulo="EM PRODUÇÃO"
              valor={metricas?.emProducao ?? '–'}
              sub="aceitos + em preparo"
              destaque={metricas?.emProducao > 0}
            />
            <KpiCard
              titulo="PRONTO P/ RETIRADA"
              valor={metricas?.prontos ?? '–'}
              sub="aguardando cliente"
              destaque={metricas?.prontos > 0}
            />
            <KpiCard
              titulo="FATURAMENTO HOJE"
              valor={metricas ? `R$ ${Number(metricas.faturamentoHoje).toFixed(2)}` : '–'}
              sub={metricas ? `${metricas.finalizadosHoje} finalizado${metricas.finalizadosHoje !== 1 ? 's' : ''}` : '...'}
            />
          </div>

          {/* Kanban */}
          <div className="kb-kanban">

            {/* Coluna 1 — Recebidos */}
            <div className="kb-coluna">
              <div className="kb-coluna-header kb-coluna-header--recebidos">
                <span className="kb-coluna-titulo">Recebidos</span>
                <span className="kb-coluna-count">{recebidos.length}</span>
              </div>
              <div className="kb-coluna-body">
                {recebidos.length === 0
                  ? <p className="kb-coluna-vazio">Nenhum pedido aguardando</p>
                  : recebidos.map((p) => (
                    <PedidoCard
                      key={p.id}
                      pedido={p}
                      coluna="recebidos"
                      onAceitar={(ped) => setModal({ tipo: 'aceitar', pedido: ped })}
                      onRecusar={(ped) => setModal({ tipo: 'recusar', pedido: ped })}
                      onAvancar={avancarStatus}
                    />
                  ))
                }
              </div>
            </div>

            {/* Coluna 2 — Em preparo */}
            <div className="kb-coluna">
              <div className="kb-coluna-header kb-coluna-header--preparo">
                <span className="kb-coluna-titulo">Em preparo</span>
                <span className="kb-coluna-count">{emPreparo.length}</span>
              </div>
              <div className="kb-coluna-body">
                {emPreparo.length === 0
                  ? <p className="kb-coluna-vazio">Nenhum pedido em preparo</p>
                  : emPreparo.map((p) => (
                    <PedidoCard
                      key={p.id}
                      pedido={p}
                      coluna="preparo"
                      onAceitar={() => {}}
                      onRecusar={() => {}}
                      onAvancar={avancarStatus}
                      onVerDetalhes={(ped) => setModal({ tipo: 'detalhes', pedido: ped })}
                      processando={processando.has(p.id)}
                    />
                  ))
                }
              </div>
            </div>

            {/* Coluna 3 — Pronto para retirada */}
            <div className="kb-coluna">
              <div className="kb-coluna-header kb-coluna-header--pronto">
                <span className="kb-coluna-titulo">Pronto p/ retirada</span>
                <span className="kb-coluna-count">{prontos.length}</span>
              </div>
              <div className="kb-coluna-body">
                {prontos.length === 0
                  ? <p className="kb-coluna-vazio">Nenhum pedido pronto</p>
                  : prontos.map((p) => (
                    <PedidoCard
                      key={p.id}
                      pedido={p}
                      coluna="pronto"
                      onAceitar={() => {}}
                      onRecusar={() => {}}
                      onAvancar={avancarStatus}
                      processando={processando.has(p.id)}
                    />
                  ))
                }
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile — lista simplificada ── */}
      <div className="adm-mobile">
        <div className="adm-mobile-header">
          <div className="pb-logo" style={{ color: 'white' }}>
            <div className="pb-logo-mark" style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--pb-mustard-200)', width: '28px', height: '28px', fontSize: '14px' }}>P</div>
            Pedidos
          </div>
          <button className="adm-mobile-sair" onClick={() => { logout(); navigate('/admin/login'); }}>Sair</button>
        </div>

        <div className="adm-mobile-body">
          <p style={{ fontSize: '13px', color: 'var(--pb-ink-500)', marginBottom: '16px' }}>
            Use uma tela maior para o painel completo. Lista resumida:
          </p>

          {[...recebidos, ...emPreparo, ...prontos].length === 0 ? (
            <p style={{ color: 'var(--pb-ink-300)', textAlign: 'center', marginTop: '32px' }}>
              Nenhum pedido ativo no momento
            </p>
          ) : (
            [...recebidos, ...emPreparo, ...prontos].map((p) => {
              const temObsMobile = (p.itens ?? []).some((ip) => ip.observacao);
              return (
              <div
                key={p.id}
                className="adm-mobile-item-row"
                style={{ flexDirection: 'column', gap: '10px', alignItems: 'stretch', cursor: p.statusAtual === 'RECEBIDO' ? 'pointer' : undefined }}
                onClick={p.statusAtual === 'RECEBIDO' ? () => setModal({ tipo: 'aceitar', pedido: p }) : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>#{p.numero}</span>
                    <span style={{ fontSize: '12px', color: 'var(--pb-ink-300)' }}>
                      {p.statusAtual.replace(/_/g, ' ')}
                    </span>
                    {temObsMobile && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        background: 'var(--pb-warn-bg)', color: 'var(--pb-warn)',
                        fontSize: '10px', fontWeight: 700, padding: '2px 6px',
                        borderRadius: '999px',
                      }}>
                        <IcoAlerta /> obs.
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--pb-font-display)', fontWeight: 700, color: 'var(--pb-terracotta-600)' }}>
                    {fmt(p.total)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                  {p.statusAtual === 'RECEBIDO' && (
                    <>
                      <button className="adm-btn-sm adm-btn-sm--danger" onClick={() => setModal({ tipo: 'recusar', pedido: p })}>Recusar</button>
                      <button className="pb-btn pb-btn--primary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => setModal({ tipo: 'aceitar', pedido: p })}>Aceitar</button>
                    </>
                  )}
                  {['ACEITO', 'EM_PREPARO'].includes(p.statusAtual) && (
                    <button
                      className="pb-btn pb-btn--primary"
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                      onClick={() => avancarStatus(p)}
                      disabled={processando.has(p.id)}
                    >
                      {processando.has(p.id) ? 'Atualizando…' : (p.statusAtual === 'ACEITO' ? 'Iniciar preparo' : 'Marcar como pronto')}
                    </button>
                  )}
                  {p.statusAtual === 'PRONTO_PARA_RETIRADA' && (
                    <button
                      className="pb-btn pb-btn--primary"
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                      onClick={() => avancarStatus(p)}
                      disabled={processando.has(p.id)}
                    >
                      {processando.has(p.id) ? 'Atualizando…' : 'Cliente retirou ✓'}
                    </button>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modais */}
      {modal?.tipo === 'aceitar' && (
        <ModalAceitar
          pedido={modal.pedido}
          salvando={salvando}
          onConfirmar={confirmarAceitar}
          onFechar={() => setModal(null)}
        />
      )}
      {modal?.tipo === 'recusar' && (
        <ModalRecusar
          pedido={modal.pedido}
          salvando={salvando}
          onConfirmar={confirmarRecusar}
          onFechar={() => setModal(null)}
        />
      )}
      {modal?.tipo === 'detalhes' && (
        <ModalDetalhesPedido
          pedido={modal.pedido}
          processando={processando.has(modal.pedido.id)}
          onAvancar={avancarStatus}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  );
}
