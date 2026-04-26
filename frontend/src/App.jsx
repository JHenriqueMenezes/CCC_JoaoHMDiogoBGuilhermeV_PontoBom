import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import LoginAdmin from './pages/LoginAdmin';
import Cadastro from './pages/Cadastro';
import VerificarCodigo from './pages/VerificarCodigo';
import Cardapio from './pages/Cardapio';
import Admin from './pages/Admin';

function RotaAdmin({ children }) {
  const { usuario } = useAuth();
  if (!usuario || usuario.role !== 'ADMIN') return <Navigate to="/admin/login" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Cardapio />} />
          <Route path="/cardapio" element={<Cardapio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/verificar" element={<VerificarCodigo />} />
          <Route path="/admin/login" element={<LoginAdmin />} />
          <Route path="/admin" element={
            <RotaAdmin><Admin /></RotaAdmin>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
