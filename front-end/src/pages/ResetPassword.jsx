import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../axios";
import "../auth-styles.css";

const ResetPassword = () => {
  const [form, setForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer l'email et le token stockés
    const storedEmail = localStorage.getItem("resetEmail");
    const storedToken = localStorage.getItem("resetToken");

    if (!storedEmail || !storedToken) {
      // Rediriger vers la page de mot de passe oublié si les informations manquent
      navigate("/forgot-password");
    } else {
      setEmail(storedEmail);
      setToken(storedToken);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });

    // Vérifier la force du mot de passe si le champ est 'password'
    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  // Fonction pour vérifier la force du mot de passe
  const checkPasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Vérifier si les mots de passe correspondent
    if (form.password !== form.password_confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/reset-password", {
        email,
        token,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      setSuccess(true);
      
      // Nettoyer le localStorage
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetToken");

      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", err);

      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.data && err.response.data.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(errorMessages.join(" "));
      } else {
        setError(
          "Une erreur est survenue. Veuillez réessayer."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="auth-logo">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <div className="auth-info">
          <h2>Créez un nouveau mot de passe</h2>
          <p>
            Choisissez un mot de passe fort pour sécuriser votre compte. Un bon
            mot de passe doit contenir au moins 8 caractères, des lettres
            majuscules et minuscules, des chiffres et des caractères spéciaux.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <i className="fas fa-lock"></i>
              <span>Sécurisez votre compte</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-shield-alt"></i>
              <span>Protégez vos données</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-check-circle"></i>
              <span>Récupérez l'accès à votre compte</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-container">
          <h1>Réinitialiser le mot de passe</h1>
          <p className="auth-subtitle">
            Créez un nouveau mot de passe pour votre compte
          </p>

          {error && <div className="auth-alert auth-alert-danger">{error}</div>}
          {success && (
            <div className="auth-alert auth-alert-success">
              Votre mot de passe a été réinitialisé avec succès! Vous allez être
              redirigé vers la page de connexion...
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <div className="auth-input-group">
                <i className="fas fa-lock"></i>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                  minLength="8"
                />
              </div>
              {form.password && (
                <div className="password-strength">
                  <div className="strength-meter">
                    <div
                      className={`strength-bar strength-${passwordStrength}`}
                      style={{ width: `${passwordStrength * 25}%` }}
                    ></div>
                  </div>
                  <div className="strength-text">
                    {passwordStrength === 0 && "Mot de passe très faible"}
                    {passwordStrength === 1 && "Mot de passe faible"}
                    {passwordStrength === 2 && "Mot de passe moyen"}
                    {passwordStrength === 3 && "Mot de passe fort"}
                    {passwordStrength === 4 && "Mot de passe très fort"}
                  </div>
                </div>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="password_confirmation">
                Confirmer le mot de passe
              </label>
              <div className="auth-input-group">
                <i className="fas fa-lock"></i>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Réinitialisation...
                </>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </form>

          <div className="auth-separator">
            <span>OU</span>
          </div>

          <div className="auth-links">
            <Link to="/login" className="auth-login-link">
              Retour à la connexion
            </Link>
          </div>

          <div className="auth-home-link">
            <Link to="/">
              <i className="fas fa-home"></i> Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;