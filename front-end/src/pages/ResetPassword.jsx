import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    token: "",
  });

  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (token && email) {
      setForm((prev) => ({ ...prev, token, email }));
    } else {
      setError("Lien de réinitialisation invalide ou expiré.");
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus(null);

    try {
      const response = await axios.post("/api/reset-password", form);
      setStatus(
        response.data.status || "Mot de passe réinitialisé avec succès"
      );

      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", err);

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
    <div className="reset-password-container">
      <h2>Réinitialiser le mot de passe</h2>

      {status && (
        <div className="alert alert-success">
          {status}
          <p>Vous allez être redirigé vers la page de connexion...</p>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!status && form.token && form.email && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              readOnly
              className="readonly-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Nouveau mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Nouveau mot de passe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password_confirmation">
              Confirmer le mot de passe
            </label>
            <input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={handleChange}
              placeholder="Confirmer le mot de passe"
              required
            />
          </div>

          {/* Le token est envoyé via le formulaire mais reste caché */}
          <input type="hidden" name="token" value={form.token} />

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading
              ? "Réinitialisation en cours..."
              : "Réinitialiser le mot de passe"}
          </button>
        </form>
      )}

      <div className="auth-links">
        <Link to="/login">Retour à la connexion</Link>
      </div>
    </div>
  );
};

export default ResetPassword;
