import { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import FormField from '../components/FormField';
import { Alert } from '../components/UI';
import { Package2, Package, ShoppingCart, TrendingUp, ShieldCheck, UserCheck } from 'lucide-react';

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

  const [touched, setTouched] = useState({});

  const validateEmail = (email) => {
    if (!email) return "L'adresse email est requise";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Format d'adresse email invalide";
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Le mot de passe est requis';
    if (password.length < 8) return 'Au moins 8 caractères requis';
    if (!/[A-Z]/.test(password)) return 'Au moins une lettre majuscule requise';
    if (!/\d/.test(password)) return 'Au moins un chiffre requis';
    return '';
  };

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
          ? "Le nom de l'entreprise est requis"
          : '',
      name: touched.regName && !registerForm.name.trim() ? 'Votre nom est requis' : '',
      email: touched.regEmail ? validateEmail(registerForm.email) : '',
      password: touched.regPassword ? validatePassword(registerForm.password) : '',
    };
  }, [registerForm, touched]);

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
      setServerError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-split-page">
      {/* Panneau gauche : Dégradé bleu-turquoise vif, logo, accroche & bullet points */}
      <div className="login-left-panel">
        <div className="login-left-circles">
          <div className="circle-dec-1" />
          <div className="circle-dec-2" />
        </div>

        <div className="login-left-content">
          <div className="login-brand-badge">
            <Package2 size={20} strokeWidth={1.75} />
            <span>StockPro SaaS</span>
          </div>

          <h1 className="login-left-title">Gérez vos stocks & ventes avec sérénité</h1>
          <p className="login-left-sub">
            La solution cloud multi-commerces moderne, rapide et intuitive pour piloter votre activité
            en temps réel.
          </p>

          <div className="login-feature-list">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Package size={18} strokeWidth={1.75} />
              </div>
              <span>Suivi du stock et alertes de seuil en temps réel</span>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <ShoppingCart size={18} strokeWidth={1.75} />
              </div>
              <span>Point de vente rapide et gestion des encaissements</span>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <TrendingUp size={18} strokeWidth={1.75} />
              </div>
              <span>Modèle prédictif pour anticiper les ruptures à 7 jours</span>
            </div>
          </div>
        </div>

        <div className="text-xs" style={{ opacity: 0.85, zIndex: 10 }}>
          StockPro {new Date().getFullYear()} - Plateforme cloud certifiée et sécurisée
        </div>
      </div>

      {/* Panneau droit : Formulaire d'authentification */}
      <div className="login-right-panel">
        <div className="login-card-inner">
          <div style={{ marginBottom: '24px' }}>
            <h2 className="page-title">
              {tab === 'login' ? 'Bienvenue sur StockPro' : 'Créer votre commerce'}
            </h2>
            <p className="page-subtitle">
              {tab === 'login'
                ? 'Connectez-vous pour accéder à votre espace de gestion'
                : 'Commencez à gérer votre boutique dès aujourd hui'}
            </p>
          </div>

          <div className="tabs-nav">
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
                placeholder="Votre mot de passe"
                error={loginErrors.password}
                autoComplete="current-password"
                required
              />

              <button
                type="submit"
                className="btn btn-primary w-full"
                style={{ marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? 'Connexion en cours…' : 'Se connecter'}
              </button>

              <div className="demo-account-box">
                <div className="form-label" style={{ marginBottom: '8px' }}>
                  Comptes de démonstration (cliquez pour remplir) :
                </div>
                <div className="flex-col gap-2">
                  <button
                    type="button"
                    className="demo-account-btn"
                    onClick={() => {
                      setLoginForm({ email: 'admin@alpha.com', password: 'Admin1234!' });
                      setServerError('');
                    }}
                  >
                    <span className="flex-gap-2">
                      <ShieldCheck size={14} className="text-primary" />
                      <strong>Admin (Alpha)</strong>
                    </span>
                    <span className="text-muted">admin@alpha.com</span>
                  </button>
                  <button
                    type="button"
                    className="demo-account-btn"
                    onClick={() => {
                      setLoginForm({ email: 'admin@demo.tn', password: 'Admin123' });
                      setServerError('');
                    }}
                  >
                    <span className="flex-gap-2">
                      <ShieldCheck size={14} className="text-primary" />
                      <strong>Admin (Demo)</strong>
                    </span>
                    <span className="text-muted">admin@demo.tn</span>
                  </button>
                  <button
                    type="button"
                    className="demo-account-btn"
                    onClick={() => {
                      setLoginForm({ email: 'staff@demo.tn', password: 'Staff123' });
                      setServerError('');
                    }}
                  >
                    <span className="flex-gap-2">
                      <UserCheck size={14} className="text-primary" />
                      <strong>Staff (Vendeur)</strong>
                    </span>
                    <span className="text-muted">staff@demo.tn</span>
                  </button>
                </div>
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
                placeholder="8+ caractères, 1 majuscule, 1 chiffre"
                error={registerErrors.password}
                autoComplete="new-password"
                required
              />

              <button
                type="submit"
                className="btn btn-primary w-full"
                style={{ marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? 'Création de l espace…' : 'Créer mon commerce'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
