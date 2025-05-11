import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../axios";
import "../auth-styles.css";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    
    if (token) {
      if (userRole === "admin") {
        navigate("/admin/dashboard");
      } else if (userRole === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Appel à l'API de connexion
      const response = await axios.post("/api/login", form);

      // Stockage du token dans le localStorage
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);

        // Récupérer le rôle de l'utilisateur depuis la réponse
        const role = response.data.role || response.data.user?.role;

        // Stocker le rôle pour les vérifications de route protégée
        localStorage.setItem("userRole", role);

        // Redirection basée sur le rôle de l'utilisateur
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "doctor") {
          navigate("/doctor/dashboard");
        } else {
          navigate("/patient/dashboard");
        }
      } else {
        setError("Réponse invalide du serveur");
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);

      // Gérer les différents types d'erreurs
      if (err.response) {
        if (err.response.status === 401) {
          setError("Email ou mot de passe incorrect");
        } else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError(`Erreur serveur: ${err.response.status}`);
        }
      } else if (err.request) {
        setError(
          "Aucune réponse du serveur. Vérifiez votre connexion internet."
        );
      } else {
        setError("Erreur lors de la configuration de la requête.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la connexion Google
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setGoogleLoading(true);
      setError("");

      // Décoder le token ID pour obtenir les informations de l'utilisateur
      const decoded = jwtDecode(credentialResponse.credential);
      
      console.log("Google user info:", decoded);
      
      // Envoyer les données à votre API backend
      const response = await axios.post("/api/login-with-google", {
        google_id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        avatar: decoded.picture
      });

      // Stockage du token dans le localStorage
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", response.data.role);

        // Redirection basée sur le rôle de l'utilisateur
        if (response.data.role === "admin") {
          navigate("/admin/dashboard");
        } else if (response.data.role === "doctor") {
          navigate("/doctor/dashboard");
        } else {
          navigate("/patient/dashboard");
        }
      } else {
        setError("Réponse invalide du serveur");
      }
    } catch (err) {
      console.error("Erreur de connexion via Google:", err);
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue lors de la connexion via Google."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("La connexion avec Google a échoué. Veuillez réessayer.");
    setGoogleLoading(false);
  };

  // Bouton Google personnalisé avec l'image du logo Google
  const renderCustomGoogleButton = () => {
    return (
      <button 
        className="social-login-button" 
        onClick={() => document.querySelector(".google-login-button").click()}
        disabled={loading || googleLoading}
      >
        <img 
          src="/images/goooogle.png" 
          alt="Google" 
          className="google-icon" 
        />
        {googleLoading ? 'Connexion avec Google en cours...' : 'Se connecter avec Google'}
      </button>
    );
  };

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="auth-logo">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <div className="auth-info">
          <h2>Bienvenue sur notre plateforme médicale</h2>
          <p>
            Accédez à vos informations médicales, prenez rendez-vous avec nos médecins 
            et suivez votre dossier de santé en toute sécurité.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <i className="fas fa-calendar-check"></i>
              <span>Prise de rendez-vous facilitée</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-file-medical"></i>
              <span>Accès à votre dossier médical</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-user-md"></i>
              <span>Communication directe avec nos médecins</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-container">
          <h1>Connexion</h1>
          <p className="auth-subtitle">Connectez-vous pour accéder à votre espace personnel</p>

          {error && <div className="auth-alert auth-alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="email">Adresse email</label>
              <div className="auth-input-group">
                <i className="fas fa-envelope"></i>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Entrez votre email"
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <div className="auth-label-group">
                <label htmlFor="password">Mot de passe</label>
                <Link to="/forgot-password" className="auth-forgot-link">
                  Mot de passe oublié?
                </Link>
              </div>
              <div className="auth-input-group">
                <i className="fas fa-lock"></i>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Entrez votre mot de passe"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading || googleLoading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="auth-separator">
            <span>OU</span>
          </div>

          <div className="social-login-buttons">
            {/* Bouton personnalisé avec logo Google */}
            {renderCustomGoogleButton()}
            
            {/* Bouton Google offert par la bibliothèque (caché pour l'utilisateur) */}
            <div style={{ display: 'none' }}>
              <GoogleLogin
                className="google-login-button"
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="continue_with"
                shape="rectangular"
                size="large"
                theme="filled_blue"
                width="100%"
                locale="fr"
                disabled={loading || googleLoading}
              />
            </div>
          </div>

          <div className="auth-links">
            <p>Vous n'avez pas de compte?</p>
            <Link to="/register" className="auth-register-link">
              Créer un compte
            </Link>
          </div>

          <div className="auth-home-link">
            <Link to="/">
              <i className="fas fa-arrow-left"></i> Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;