import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../axios";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
          // Pour l'instant, redirection vers le tableau de bord patient
          // Plus tard, vous pouvez créer un tableau de bord admin dédié
          navigate("/patient/dashboard");
          console.log("Connexion réussie ✅ en tant qu'administrateur");
        } else if (role === "doctor") {
          // Redirection vers le tableau de bord médecin
          navigate("/doctor/dashboard");
          console.log("Connexion réussie ✅ en tant que médecin");
        } else {
          // Redirection vers le tableau de bord patient
          navigate("/patient/dashboard");
          console.log("Connexion réussie ✅ en tant que patient");
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

  return (
    <div className="login-container">
      <h2>Connexion</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mot de passe"
            required
          />
        </div>

        <div className="forgot-password-link">
          <Link to="/forgot-password">Mot de passe oublié ?</Link>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>

      <div className="auth-links">
        <p>Vous n'avez pas de compte ?</p>
        <Link to="/register">S'inscrire</Link>
      </div>
    </div>
  );
};

export default Login;
