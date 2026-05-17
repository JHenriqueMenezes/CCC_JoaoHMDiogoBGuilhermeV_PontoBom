import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [itens, setItens] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pb_carrinho') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('pb_carrinho', JSON.stringify(itens));
  }, [itens]);

  function adicionar(item, quantidade, observacao) {
    setItens((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id && c.observacao === observacao);
      if (idx >= 0) {
        return prev.map((c, i) => i === idx ? { ...c, quantidade: c.quantidade + quantidade } : c);
      }
      return [...prev, { item, quantidade, observacao }];
    });
  }

  function remover(idx) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  function alterarQtd(idx, delta) {
    setItens((prev) =>
      prev
        .map((c, i) => i !== idx ? c : { ...c, quantidade: c.quantidade + delta })
        .filter((c) => c.quantidade > 0)
    );
  }

  function limpar() { setItens([]); }

  const totalItens = itens.reduce((a, c) => a + c.quantidade, 0);
  const totalPreco = itens.reduce((a, c) => a + c.item.preco * c.quantidade, 0);

  return (
    <CartContext.Provider value={{ itens, adicionar, remover, alterarQtd, limpar, totalItens, totalPreco }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
