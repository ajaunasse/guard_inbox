import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Promos } from './pages/Promos';
import { Vault } from './pages/Vault';
import { Trash } from './pages/Trash';
import { Tracking } from './pages/Tracking';
import { Phishing } from './pages/Phishing';
import { Newsletters } from './pages/Newsletters';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/promos" element={<Promos />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/phishing" element={<Phishing />} />
          <Route path="/newsletters" element={<Newsletters />} />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
