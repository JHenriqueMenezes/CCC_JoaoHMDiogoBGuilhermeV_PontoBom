import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import api from '../services/api';

const STATUS_BADGE = {
  RECEBIDO:             { label: 'Recebido',            cls: 'pb-badge--info' },
  ACEITO:               { label: 'Aceito',               cls: 'pb-badge--info' },
  EM_PREPARO:           { label: 'Em preparo',           cls: 'pb-badge--warn' },
  PRONTO_PARA_RETIRADA: { label: 'Pronto p/ retirada',   cls: 'pb-badge--success' },
  FINALIZADO:           { label: 'Finalizado',           cls: 'pb-badge--neutral' },
  RECUSADO:             { label: 'Recusado',             cls: 'pb-badge--danger' },
};

const EM_ANDAMENTO = new Set(['RECEBIDO', 'ACEITO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA']);

function fmtData(dateStr) {
  const d = new Date(dateStr);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const mesmoDia = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (mesmoDia(d, hoje)) return `Hoje · ${hora}`;
  if (mesmoDia(d, ontem)) return `Ontem · ${hora}`;

  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') +
    ` · ${hora}`
  );
}

function resumo(itens) {
  const trecho = itens
    .slice(0, 2)
    .map((i) => `${i.quantidade}× ${i.nome}`)
    .join(', ');
  return itens.length > 2 ? `${trecho} +${itens.length - 2}` : trecho;
}

export default function Historico() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    setCarregando(true);
    api
      .get('/pedidos/me')
      .then((r) => setPedidos(r.data.pedidos))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [usuario]);

  if (!usuario) {
    return (
      <div className="carrinho-page">
        <header className="carrinho-header">
          <h1 className="carrinho-titulo">Histórico</h1>
        </header>

        <div className="carrinho-vazio">
          <div className="carrinho-vazio-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--pb-ink-300)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="carrinho-vazio-titulo">Entre para ver seu histórico</p>
          <p className="carrinho-vazio-sub">Seus pedidos anteriores ficam salvos aqui.</p>
          <button
            className="pb-btn pb-btn--primary"
            style={{ marginTop: 24 }}
            onClick={() => navigate('/login')}
          >
            Entrar
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="carrinho-page">
      <header className="carrinho-header">
        <h1 className="carrinho-titulo">Meus pedidos</h1>
        {!carregando && pedidos.length > 0 && (
          <p className="carrinho-header-count">
            {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
          </p>
        )}
      </header>

      {carregando ? (
        <div className="carrinho-vazio">
          <p style={{ color: 'var(--pb-ink-300)' }}>Carregando...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="carrinho-vazio">
          <div className="carrinho-vazio-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--pb-ink-300)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <p className="carrinho-vazio-titulo">Nenhum pedido ainda</p>
          <p className="carrinho-vazio-sub">Quando você fizer um pedido, ele aparecerá aqui.</p>
          <button
            className="pb-btn pb-btn--primary"
            style={{ marginTop: 24 }}
            onClick={() => navigate('/')}
          >
            Fazer pedido
          </button>
        </div>
      ) : (
        <div className="carrinho-body">
          {pedidos.map((p) => {
            const badge = STATUS_BADGE[p.statusAtual] ?? STATUS_BADGE.RECEBIDO;
            const emAndamento = EM_ANDAMENTO.has(p.statusAtual);
            return (
              <div key={p.id} className="hst-card">
                <div className="hst-card-top">
                  <div>
                    <span className="hst-numero">#{p.numero}</span>
                    <span className="hst-data">{fmtData(p.criadoEm)}</span>
                  </div>
                  <span className="hst-total">R$ {Number(p.total).toFixed(2)}</span>
                </div>

                <p className="hst-itens">{resumo(p.itens)}</p>

                <div className="hst-card-bottom">
                  <span className={`pb-badge ${badge.cls}`}>{badge.label}</span>
                  <button
                    className="hst-acompanhar"
                    onClick={() => navigate(`/pedido/${p.numero}`)}
                  >
                    {emAndamento ? 'Acompanhar →' : 'Ver detalhes →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
