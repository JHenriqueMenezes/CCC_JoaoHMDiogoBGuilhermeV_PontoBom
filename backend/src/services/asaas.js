const BASE_URL = process.env.ASAAS_URL || 'https://sandbox.asaas.com/api/v3';
const API_KEY = process.env.ASAAS_API_KEY;

async function req(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'access_token': API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors?.[0]?.description || data.message || 'Erro Asaas';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function proximoDia() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

async function criarCliente({ nome, telefone, cpf }) {
  return req('POST', '/customers', {
    name: nome || 'Cliente PontoBom',
    mobilePhone: telefone ? telefone.replace(/\D/g, '') : undefined,
    cpfCnpj: cpf ? cpf.replace(/\D/g, '') : undefined,
  });
}

async function criarCobrancaPix(clienteId, valor, numeroPedido) {
  return req('POST', '/payments', {
    customer: clienteId,
    billingType: 'PIX',
    value: Number(valor),
    dueDate: proximoDia(),
    description: `Pedido #${numeroPedido} - PontoBom`,
    externalReference: numeroPedido,
  });
}

async function buscarPixQrCode(paymentId) {
  return req('GET', `/payments/${paymentId}/pixQrCode`);
}

async function criarCobrancaCartao(clienteId, valor, numeroPedido, cartao, titular) {
  return req('POST', '/payments', {
    customer: clienteId,
    billingType: 'CREDIT_CARD',
    value: Number(valor),
    dueDate: proximoDia(),
    description: `Pedido #${numeroPedido} - PontoBom`,
    externalReference: numeroPedido,
    creditCard: {
      holderName: cartao.nomeTitular,
      number: cartao.numero.replace(/\s/g, ''),
      expiryMonth: cartao.mesExpiracao,
      expiryYear: cartao.anoExpiracao,
      ccv: cartao.cvv,
    },
    creditCardHolderInfo: {
      name: titular.nome,
      email: titular.email || 'cliente@pontobom.com',
      cpfCnpj: titular.cpf.replace(/\D/g, ''),
      postalCode: titular.cep.replace(/\D/g, ''),
      addressNumber: titular.numeroEndereco || '1',
      phone: titular.telefone ? titular.telefone.replace(/\D/g, '') : undefined,
    },
  });
}

async function consultarPagamento(paymentId) {
  return req('GET', `/payments/${paymentId}`);
}

module.exports = {
  criarCliente,
  criarCobrancaPix,
  buscarPixQrCode,
  criarCobrancaCartao,
  consultarPagamento,
};
