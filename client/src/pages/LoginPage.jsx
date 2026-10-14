import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="sidebar-logo-icon" style={{ width: 48, height: 48, fontSize: '1.5rem' }}>
            📈
          </div>
          <span className="sidebar-logo-text" style={{ fontSize: '1.75rem' }}>StockPro</span>
        </div>
        <h1 className="login-title">Connexion</h1>
        <p className="login-sub">Accédez à votre espace de gestion</p>

        {error && <Alert type="danger">{error}</Alert>}

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="vous@exemple.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.875rem' }}
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-muted text-xs" style={{ textAlign: 'center', marginTop: '2rem' }}>
          Comptes démo : admin@alpha.com / Admin1234!
        </p>
      </div>
    </div>
  );
}
