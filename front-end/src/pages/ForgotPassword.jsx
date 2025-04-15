import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus(null);

    try {
      const response = await axios.post("/api/forgot-password", { email });
      setStatus(
        response.data.status ||
          "Un lien de réinitialisation vous a été envoyé par email."
      );
    } catch (err) {
      console.error("Erreur lors de la demande de réinitialisation:", err);

      if (err.response && err.response.data && err.response.data.errors) {
        setError(Object.values(err.response.data.errors).flat().join(" "));
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        setError(err.response.data.message);
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Mot de passe oublié</h2>

      {status && <div className="alert alert-success">{status}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!status ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              required
            />
            <p className="help-text">
              Nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>
      ) : (
        <div className="success-message">
          <p>
            Vérifiez votre boîte de réception pour le lien de réinitialisation.
          </p>
        </div>
      )}

      <div className="auth-links">
        <Link to="/login">Retour à la connexion</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
