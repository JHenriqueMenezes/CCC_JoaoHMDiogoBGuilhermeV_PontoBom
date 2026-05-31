import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import LoginAdmin from './pages/LoginAdmin';
import Cadastro from './pages/Cadastro';
import VerificarCodigo from './pages/VerificarCodigo';
import Cardapio from './pages/Cardapio';
import Carrinho from './pages/Carrinho';
import Checkout from './pages/Checkout';
import Historico from './pages/Historico';
import AcompanharPedido from './pages/AcompanharPedido';
import Admin from './pages/Admin';
import AdminPedidos from './pages/AdminPedidos';
import AdminMensagens from './pages/AdminMensagens';
import AdminConfig from './pages/AdminConfig';
import AdminUsuarios from './pages/AdminUsuarios';

function RotaAdmin({ children }) {
  const { usuario } = useAuth();
  if (!usuario || usuario.role !== 'ADMIN') return <Navigate to="/admin/login" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Cardapio />} />
            <Route path="/cardapio" element={<Cardapio />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/pedido/:numero" element={<AcompanharPedido />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/verificar" element={<VerificarCodigo />} />
            <Route path="/admin/login" element={<LoginAdmin />} />
            <Route path="/admin" element={
              <RotaAdmin><Admin /></RotaAdmin>
            } />
            <Route path="/admin/pedidos" element={
              <RotaAdmin><AdminPedidos /></RotaAdmin>
            } />
            <Route path="/admin/mensagens" element={
              <RotaAdmin><AdminMensagens /></RotaAdmin>
            } />
            <Route path="/admin/config" element={
              <RotaAdmin><AdminConfig /></RotaAdmin>
            } />
            <Route path="/admin/usuarios" element={
              <RotaAdmin><AdminUsuarios /></RotaAdmin>
            } />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
