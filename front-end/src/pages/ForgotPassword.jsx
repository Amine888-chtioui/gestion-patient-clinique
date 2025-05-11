import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";
import "../auth-styles.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await axios.post("/api/forgot-password", { email });
      setSuccess(true);
      // Redirection vers la page de vérification du code
      localStorage.setItem("resetEmail", email);
      window.location.href = "/verify-code";
    } catch (err) {
      console.error("Erreur lors de la demande de réinitialisation:", err);

      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.data && err.response.data.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(errorMessages.join(" "));
      } else {
        setError(
          "Une erreur est survenue. Veuillez vérifier votre email et réessayer."
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
          <h2>Récupération de compte</h2>
          <p>
            Entrez votre adresse e-mail pour recevoir un code de vérification.
            Ce code vous permettra de réinitialiser votre mot de passe et de
            récupérer l'accès à votre compte.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <i className="fas fa-lock"></i>
              <span>Processus sécurisé</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-envelope"></i>
              <span>Envoi instantané par e-mail</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-key"></i>
              <span>Récupérez l'accès rapidement</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-container">
          <h1>Mot de passe oublié</h1>
          <p className="auth-subtitle">
            Nous vous enverrons un code de vérification pour réinitialiser votre
            mot de passe
          </p>

          {error && <div className="auth-alert auth-alert-danger">{error}</div>}
          {success && (
            <div className="auth-alert auth-alert-success">
              Un code de vérification a été envoyé à votre adresse e-mail.
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="email">Adresse email</label>
              <div className="auth-input-group">
                <i className="fas fa-envelope"></i>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="Entrez votre email"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Envoi en cours...
                </>
              ) : (
                "Envoyer le code de vérification"
              )}
            </button>
          </form>

          <div className="auth-separator">
            <span>OU</span>
          </div>

          <div className="auth-links">
            <p>Vous vous souvenez de votre mot de passe?</p>
            <Link to="/login" className="auth-login-link">
              Se connecter
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

export default ForgotPassword;