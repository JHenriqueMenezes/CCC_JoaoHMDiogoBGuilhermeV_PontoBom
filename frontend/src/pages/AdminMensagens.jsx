import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SidebarAdmin from '../components/SidebarAdmin';
import api from '../services/api';

const NOMES = {
  codigo_verificacao: 'Código de Verificação',
  pedido_confirmado:  'Pedido Confirmado',
  status_aceito:      'Status: Aceito',
  status_em_preparo:  'Status: Em Preparo',
  status_pronto:      'Status: Pronto para Retirada',
  status_finalizado:  'Status: Finalizado',
  pedido_recusado:    'Pedido Recusado',
};

const EXEMPLOS = {
  codigo_verificacao: { codigo: '847291' },
  pedido_confirmado: {
    numero: 'PB0042',
    itens: '• 2x Pizza Margherita — R$ 45,00\n• 1x Refrigerante 2L — R$ 12,00',
    total: '102,00',
    formaPagamento: 'À vista na retirada',
  },
  status_aceito:     { numero: 'PB0042', estimativa: '25' },
  status_em_preparo: { numero: 'PB0042' },
  status_pronto:     { numero: 'PB0042' },
  status_finalizado: { numero: 'PB0042' },
  pedido_recusado:   { numero: 'PB0042', motivo: 'Restaurante fechado no momento.' },
};

function aplicarPreview(template, chave) {
  const vars = EXEMPLOS[chave] || {};
  return Object.entries(vars).reduce(
    (msg, [k, v]) => msg.replaceAll(`{{${k}}}`, v),
    template
  );
}

function extrairVars(descricao) {
  return descricao.match(/\{\{[^}]+\}\}/g) || [];
}

function fmtData(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Card de edição ─────────────────────────────────────────────────────────────

function CardMensagem({ msg, onSalvo }) {
  const [texto, setTexto] = useState(msg.template);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  const vars = extrairVars(msg.descricao);
  const preview = aplicarPreview(texto, msg.chave);
  const alterado = texto !== msg.template;

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await api.put(`/admin/mensagens/${msg.chave}`, { template: texto });
      setSucesso(true);
      onSalvo(msg.chave, texto);
      setTimeout(() => setSucesso(false), 2500);
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={`msg-card${alterado ? ' msg-card--alterado' : ''}`}>
      <div className="msg-card-header">
        <div>
          <h3 className="msg-card-titulo">{NOMES[msg.chave] || msg.chave}</h3>
          <p className="msg-card-desc">{msg.descricao.split('·')[0].trim()}</p>
        </div>
        {msg.atualizadoEm && (
          <span className="msg-quando">Editado em {fmtData(msg.atualizadoEm)}</span>
        )}
      </div>

      {vars.length > 0 && (
        <div className="msg-vars">
          <span className="msg-vars-label">Variáveis:</span>
          {vars.map((v) => (
            <span key={v} className="msg-var-chip">{v}</span>
          ))}
        </div>
      )}

      <div className="msg-editor">
        <div className="msg-editor-col">
          <span className="msg-col-label">Template</span>
          <textarea
            className="msg-textarea"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={7}
            spellCheck={false}
          />
        </div>
        <div className="msg-editor-col">
          <span className="msg-col-label">Preview (valores de exemplo)</span>
          <pre className="msg-preview">{preview}</pre>
        </div>
      </div>

      {erro && <p className="msg-erro">{erro}</p>}

      <div className="msg-card-footer">
        {alterado && (
          <button
            className="pb-btn pb-btn--ghost"
            style={{ fontSize: '13px' }}
            onClick={() => setTexto(msg.template)}
          >
            Descartar alterações
          </button>
        )}
        <button
          className={`pb-btn ${sucesso ? 'pb-btn--ghost' : 'pb-btn--primary'}`}
          style={{ fontSize: '13px', marginLeft: 'auto' }}
          onClick={salvar}
          disabled={salvando || !alterado}
        >
          {sucesso ? '✓ Salvo' : salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function AdminMensagens() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/mensagens')
      .then((r) => setMensagens(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSalvo(chave, novoTemplate) {
    setMensagens((prev) =>
      prev.map((m) =>
        m.chave === chave
          ? { ...m, template: novoTemplate, atualizadoEm: new Date().toISOString() }
          : m
      )
    );
  }

  return (
    <div className="adm-shell">

      {/* ── Sidebar (desktop) ── */}
      <SidebarAdmin ativo="mensagens" />

      {/* ── Conteúdo principal (desktop) ── */}
      <div className="adm-workspace">
        <div className="msg-conteudo">
          <div className="msg-page-header">
            <div>
              <h1 className="msg-page-titulo">Mensagens WhatsApp</h1>
              <p className="msg-page-sub">Edite os textos enviados automaticamente aos clientes.</p>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--pb-ink-400)', padding: '32px 0' }}>Carregando…</p>
          ) : (
            <div className="msg-lista">
              {mensagens.map((msg) => (
                <CardMensagem key={msg.chave} msg={msg} onSalvo={handleSalvo} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="adm-mobile">
        <div className="adm-mobile-header">
          <button className="adm-mobile-back" onClick={() => navigate('/admin')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>Mensagens WhatsApp</span>
          <button className="adm-mobile-sair" onClick={() => { logout(); navigate('/admin/login'); }}>Sair</button>
        </div>
        <div className="adm-mobile-body">
          {loading ? (
            <p style={{ color: 'var(--pb-ink-400)' }}>Carregando…</p>
          ) : (
            <div className="msg-lista">
              {mensagens.map((msg) => (
                <CardMensagem key={msg.chave} msg={msg} onSalvo={handleSalvo} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
