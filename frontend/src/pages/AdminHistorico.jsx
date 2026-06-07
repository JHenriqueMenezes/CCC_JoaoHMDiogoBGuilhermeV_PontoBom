import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SidebarAdmin from '../components/SidebarAdmin';
import api from '../services/api';

const fmt = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

function IcoAlerta() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function fmtDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function resumo(itens) {
  if (!itens.length) return '—';
  const primeiro = `${itens[0].quantidade}x ${itens[0].nome}`;
  if (itens.length === 1) return primeiro;
  return `${primeiro} +${itens.length - 1}`;
}

const PERIODOS = [
  { valor: 'hoje', label: 'Hoje' },
  { valor: '7d',   label: 'Últimos 7 dias' },
  { valor: '30d',  label: 'Últimos 30 dias' },
  { valor: 'tudo', label: 'Tudo' },
];

const STATUS_OPCOES = [
  { valor: '',           label: 'Todos' },
  { valor: 'FINALIZADO', label: 'Finalizados' },
  { valor: 'RECUSADO',   label: 'Recusados' },
];

// ── Modal detalhe do pedido ───────────────────────────────────────────────────

function ModalDetalhePedido({ pedido, onFechar }) {
  const temAlgumObs = pedido.resumoItens.some((i) => i.observacao);

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="adm-modal" style={{ maxWidth: '480px' }}>
        <div className="adm-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 className="adm-modal-titulo">Pedido #{pedido.numero}</h2>
            <span className={`hadm-badge ${pedido.statusAtual === 'FINALIZADO' ? 'hadm-badge--ok' : 'hadm-badge--recusado'}`}>
              {pedido.statusAtual === 'FINALIZADO' ? 'Finalizado' : 'Recusado'}
            </span>
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

        {/* Itens */}
        <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid var(--pb-line)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pb-ink-300)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
            Itens do pedido
          </p>
          {pedido.resumoItens.map((ip, idx) => (
            <div key={idx}>
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

        {/* Motivo de recusa */}
        {pedido.motivo && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--pb-line)', background: 'var(--pb-danger-bg)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pb-danger)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 5px' }}>
              Motivo da recusa
            </p>
            <p style={{ fontSize: '13px', color: 'var(--pb-danger)', margin: 0, lineHeight: 1.5 }}>
              {pedido.motivo}
            </p>
          </div>
        )}

        {/* Rodapé com info */}
        <div style={{ padding: '12px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--pb-ink-500)' }}>
            {pedido.formaPagamento === 'AVISTA' ? 'À vista' : 'Online'} · {fmtDataHora(pedido.criadoEm)}
          </span>
          <span style={{ fontFamily: 'var(--pb-font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--pb-ink-900)' }}>
            {fmt(pedido.total)}
          </span>
        </div>

      </div>
    </div>
  );
}

// ── Linha da tabela ───────────────────────────────────────────────────────────

function LinhaPedido({ p, onVerDetalhe }) {
  const temObs = p.resumoItens.some((i) => i.observacao);

  return (
    <div
      className={`hadm-linha${p.statusAtual === 'RECUSADO' ? ' hadm-linha--recusado' : ''}`}
      onClick={() => onVerDetalhe(p)}
      style={{ cursor: 'pointer' }}
    >
      <span className="hadm-numero" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        #{p.numero}
        {temObs && (
          <span style={{ color: 'var(--pb-warn)', display: 'flex' }} title="Pedido contém observações">
            <IcoAlerta />
          </span>
        )}
      </span>
      <span className="hadm-cliente">
        {p.cliente?.nome || p.cliente?.telefone || <em style={{ color: 'var(--pb-ink-300)' }}>—</em>}
      </span>
      <span className="hadm-itens" title={p.resumoItens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}>
        {resumo(p.resumoItens)}
      </span>
      <span className="hadm-total">{fmt(p.total)}</span>
      <span className="hadm-pgto">
        {p.formaPagamento === 'AVISTA' ? 'À vista' : 'Online'}
      </span>
      <span className="hadm-data">{fmtDataHora(p.criadoEm)}</span>
      <span>
        <span className={`hadm-badge ${p.statusAtual === 'FINALIZADO' ? 'hadm-badge--ok' : 'hadm-badge--recusado'}`}>
          {p.statusAtual === 'FINALIZADO' ? 'Finalizado' : 'Recusado'}
        </span>
      </span>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function AdminHistorico() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [pedidos, setPedidos]         = useState([]);
  const [total, setTotal]             = useState(0);
  const [pagina, setPagina]           = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading]         = useState(true);
  const [pedidoModal, setPedidoModal] = useState(null);

  const [periodo, setPeriodo]   = useState('7d');
  const [status, setStatus]     = useState('');
  const [busca, setBusca]       = useState('');
  const [buscaInput, setBuscaInput] = useState('');

  const buscar = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ periodo, pagina: pg });
      if (status) params.set('status', status);
      if (busca)  params.set('busca', busca);
      const r = await api.get(`/admin/pedidos/historico?${params}`);
      setPedidos(r.data.pedidos);
      setTotal(r.data.total);
      setPagina(r.data.pagina);
      setTotalPaginas(r.data.totalPaginas);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [periodo, status, busca]);

  useEffect(() => { buscar(1); }, [buscar]);

  function handleBuscar(e) {
    e.preventDefault();
    setBusca(buscaInput);
  }

  function irPagina(pg) {
    if (pg < 1 || pg > totalPaginas) return;
    buscar(pg);
  }

  const conteudo = (
    <>
      <div className="hadm-page-header">
        <div>
          <h1 className="hadm-page-titulo">Histórico de Pedidos</h1>
          <p className="hadm-page-sub">{total} pedido{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="hadm-filtros">
        <select className="hadm-select" value={periodo} onChange={(e) => { setPeriodo(e.target.value); setPagina(1); }}>
          {PERIODOS.map((p) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
        </select>
        <select className="hadm-select" value={status} onChange={(e) => { setStatus(e.target.value); setPagina(1); }}>
          {STATUS_OPCOES.map((s) => <option key={s.valor} value={s.valor}>{s.label}</option>)}
        </select>
        <form className="hadm-busca-form" onSubmit={handleBuscar}>
          <input
            className="hadm-busca-input"
            placeholder="Nº pedido ou nome do cliente…"
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
          />
          <button type="submit" className="pb-btn pb-btn--primary" style={{ fontSize: '13px', padding: '9px 16px' }}>
            Buscar
          </button>
        </form>
      </div>

      {/* Tabela */}
      <div className="hadm-tabela">
        <div className="hadm-tabela-header">
          <span>Pedido</span>
          <span>Cliente</span>
          <span>Itens</span>
          <span>Total</span>
          <span>Pgto</span>
          <span>Data</span>
          <span>Status</span>
        </div>

        {loading ? (
          <p style={{ padding: '32px 20px', color: 'var(--pb-ink-400)' }}>Carregando…</p>
        ) : pedidos.length === 0 ? (
          <p style={{ padding: '40px 20px', color: 'var(--pb-ink-400)', textAlign: 'center' }}>
            Nenhum pedido encontrado para os filtros selecionados.
          </p>
        ) : (
          pedidos.map((p) => <LinhaPedido key={p.id} p={p} onVerDetalhe={setPedidoModal} />)
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="hadm-paginacao">
          <button className="hadm-pg-btn" onClick={() => irPagina(pagina - 1)} disabled={pagina === 1}>← Anterior</button>
          <span className="hadm-pg-info">Página {pagina} de {totalPaginas}</span>
          <button className="hadm-pg-btn" onClick={() => irPagina(pagina + 1)} disabled={pagina === totalPaginas}>Próxima →</button>
        </div>
      )}
    </>
  );

  return (
    <div className="adm-shell">

      <SidebarAdmin ativo="historico" />

      {/* Desktop */}
      <div className="adm-workspace">
        <div className="hadm-conteudo">{conteudo}</div>
      </div>

      {/* Mobile */}
      <div className="adm-mobile">
        <div className="adm-mobile-header">
          <button className="adm-mobile-back" onClick={() => navigate('/admin')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>Histórico</span>
          <button className="adm-mobile-sair" onClick={() => { logout(); navigate('/admin/login'); }}>Sair</button>
        </div>
        <div className="adm-mobile-body">{conteudo}</div>
      </div>

      {pedidoModal && (
        <ModalDetalhePedido pedido={pedidoModal} onFechar={() => setPedidoModal(null)} />
      )}

    </div>
  );
}
