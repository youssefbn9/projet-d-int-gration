import { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import FormField from '../components/FormField';
import { Alert } from '../components/UI';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
  });

  // Touched states for inline errors
  const [touched, setTouched] = useState({});

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Real-time validations
  const validateEmail = (email) => {
    if (!email) return 'L\'adresse email est requise';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Format d\'adresse email invalide';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Le mot de passe est requis';
    if (password.length < 8) return 'Au moins 8 caractères requis';
    if (!/[A-Z]/.test(password)) return 'Au moins une lettre majuscule requise';
    if (!/\d/.test(password)) return 'Au moins un chiffre requis';
    return '';
  };

  // Inline errors calculation
  const loginErrors = useMemo(() => {
    return {
      email: touched.loginEmail ? validateEmail(loginForm.email) : '',
      password: touched.loginPassword && !loginForm.password ? 'Le mot de passe est requis' : '',
    };
  }, [loginForm, touched]);

  const registerErrors = useMemo(() => {
    return {
      companyName:
        touched.regCompany && !registerForm.companyName.trim()
          ? 'Le nom de l\'entreprise est requis'
          : '',
      name:
        touched.regName && !registerForm.name.trim()
          ? 'Votre nom est requis'
          : '',
      email: touched.regEmail ? validateEmail(registerForm.email) : '',
      password: touched.regPassword ? validatePassword(registerForm.password) : '',
    };
  }, [registerForm, touched]);

  // Handlers
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const emailErr = validateEmail(loginForm.email);
    const passErr = !loginForm.password ? 'Le mot de passe est requis' : '';
    if (emailErr || passErr) {
      setTouched((t) => ({ ...t, loginEmail: true, loginPassword: true }));
      return;
    }

    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Connexion réussie !');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const compErr = !registerForm.companyName.trim() ? 'Requis' : '';
    const nameErr = !registerForm.name.trim() ? 'Requis' : '';
    const emailErr = validateEmail(registerForm.email);
    const passErr = validatePassword(registerForm.password);

    if (compErr || nameErr || emailErr || passErr) {
      setTouched({
        regCompany: true,
        regName: true,
        regEmail: true,
        regPassword: true,
      });
      return;
    }

    setLoading(true);
    try {
      await register(registerForm);
      toast.success('Compte entreprise créé avec succès !');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Erreur lors de l\'inscription');
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

        {/* Onglets Connexion / Inscription */}
        <div className="login-tabs">
          <button
            type="button"
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login');
              setServerError('');
            }}
          >
            Connexion
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register');
              setServerError('');
            }}
          >
            Inscription du commerce
          </button>
        </div>

        {serverError && <Alert type="danger">{serverError}</Alert>}

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="flex-col gap-4" noValidate>
            <FormField
              label="Adresse email"
              name="email"
              type="email"
              value={loginForm.email}
              onChange={(e) => {
                setLoginForm({ ...loginForm, email: e.target.value });
                setTouched((t) => ({ ...t, loginEmail: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, loginEmail: true }))}
              placeholder="admin@alpha.com"
              error={loginErrors.email}
              autoComplete="email"
              required
            />

            <FormField
              label="Mot de passe"
              name="password"
              type="password"
              value={loginForm.password}
              onChange={(e) => {
                setLoginForm({ ...loginForm, password: e.target.value });
                setTouched((t) => ({ ...t, loginPassword: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, loginPassword: true }))}
              placeholder="••••••••"
              error={loginErrors.password}
              autoComplete="current-password"
              required
            />

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.875rem' }}
              disabled={loading}
            >
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </button>

            <div className="demo-accounts-box">
              <p className="text-muted text-xs" style={{ textAlign: 'center', margin: 0 }}>
                Comptes de test disponibles :
              </p>
              <p className="text-xs" style={{ textAlign: 'center', color: 'var(--color-primary-light)', margin: 0 }}>
                admin@alpha.com / Admin1234!
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="flex-col gap-4" noValidate>
            <FormField
              label="Nom du commerce"
              name="companyName"
              value={registerForm.companyName}
              onChange={(e) => {
                setRegisterForm({ ...registerForm, companyName: e.target.value });
                setTouched((t) => ({ ...t, regCompany: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, regCompany: true }))}
              placeholder="Ex: Boutique Paris Sud"
              error={registerErrors.companyName}
              required
            />

            <FormField
              label="Nom & prénom du gérant"
              name="name"
              value={registerForm.name}
              onChange={(e) => {
                setRegisterForm({ ...registerForm, name: e.target.value });
                setTouched((t) => ({ ...t, regName: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, regName: true }))}
              placeholder="Jean Dupont"
              error={registerErrors.name}
              required
            />

            <FormField
              label="Email professionnel"
              name="email"
              type="email"
              value={registerForm.email}
              onChange={(e) => {
                setRegisterForm({ ...registerForm, email: e.target.value });
                setTouched((t) => ({ ...t, regEmail: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, regEmail: true }))}
              placeholder="contact@commerce.com"
              error={registerErrors.email}
              autoComplete="email"
              required
            />

            <FormField
              label="Mot de passe"
              name="password"
              type="password"
              value={registerForm.password}
              onChange={(e) => {
                setRegisterForm({ ...registerForm, password: e.target.value });
                setTouched((t) => ({ ...t, regPassword: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, regPassword: true }))}
              placeholder="8+ car., 1 majuscule, 1 chiffre"
              error={registerErrors.password}
              autoComplete="new-password"
              required
            />

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.875rem' }}
              disabled={loading}
            >
              {loading ? 'Création de l\'espace…' : 'Créer mon commerce'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
