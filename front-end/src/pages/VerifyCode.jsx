import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../axios";
import "../auth-styles.css";

const VerifyCode = () => {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer l'email stocké lors de la demande de réinitialisation
    const storedEmail = localStorage.getItem("resetEmail");
    if (!storedEmail) {
      // Rediriger vers la page de mot de passe oublié si aucun email n'est trouvé
      navigate("/forgot-password");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  useEffect(() => {
    // Gérer le compte à rebours pour la fonctionnalité de renvoi
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    setCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/verify-code", {
        email,
        code,
      });

      // Stocker le token de réinitialisation
      localStorage.setItem("resetToken", response.data.reset_token);
      
      // Rediriger vers la page de réinitialisation du mot de passe
      navigate("/reset-password");
    } catch (err) {
      console.error("Erreur lors de la vérification du code:", err);

      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.data && err.response.data.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(errorMessages.join(" "));
      } else {
        setError(
          "Une erreur est survenue. Veuillez vérifier votre code et réessayer."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError("");

    try {
      await axios.post("/api/forgot-password", { email });
      setResendSuccess(true);
      setCountdown(60); // Compte à rebours de 60 secondes avant de pouvoir renvoyer un code
    } catch (err) {
      console.error("Erreur lors du renvoi du code:", err);

      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Une erreur est survenue lors du renvoi du code.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="auth-logo">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <div className="auth-info">
          <h2>Vérification du code</h2>
          <p>
            Nous avons envoyé un code de vérification à votre adresse e-mail{" "}
            <strong>{email}</strong>. Veuillez vérifier votre boîte de
            réception et entrer le code reçu pour poursuivre la réinitialisation
            de votre mot de passe.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <i className="fas fa-envelope-open-text"></i>
              <span>Vérifiez votre boîte de réception</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-hourglass-half"></i>
              <span>Le code expire après 60 minutes</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-shield-alt"></i>
              <span>Protégez votre compte</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-container">
          <h1>Entrez le code de vérification</h1>
          <p className="auth-subtitle">
            Le code a été envoyé à l'adresse {email}
          </p>

          {error && <div className="auth-alert auth-alert-danger">{error}</div>}
          {resendSuccess && (
            <div className="auth-alert auth-alert-success">
              Un nouveau code de vérification a été envoyé à votre adresse
              e-mail.
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="code">Code de vérification</label>
              <div className="auth-input-group">
                <i className="fas fa-key"></i>
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={code}
                  onChange={handleChange}
                  placeholder="Entrez le code à 6 caractères"
                  required
                  autoComplete="off"
                  maxLength="6"
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Vérification...
                </>
              ) : (
                "Vérifier le code"
              )}
            </button>
          </form>

          <div className="auth-resend">
            <p>Vous n'avez pas reçu le code?</p>
            <button
              onClick={handleResendCode}
              className="auth-resend-button"
              disabled={resendLoading || countdown > 0}
            >
              {resendLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Envoi en cours...
                </>
              ) : countdown > 0 ? (
                `Renvoyer le code (${countdown}s)`
              ) : (
                "Renvoyer le code"
              )}
            </button>
          </div>

          <div className="auth-separator">
            <span>OU</span>
          </div>

          <div className="auth-links">
            <Link to="/forgot-password" className="auth-back-link">
              <i className="fas fa-arrow-left"></i> Changer d'adresse e-mail
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

export default VerifyCode;