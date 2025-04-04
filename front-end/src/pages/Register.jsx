import React, { useState, useEffect } from "react";
import axios from "../axios";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fonction pour initialiser les cookies CSRF avant de soumettre le formulaire
  useEffect(() => {
    // Facultatif: vous pouvez pré-charger le cookie CSRF au chargement de la page
    // Si vous préférez, vous pourriez aussi le faire juste avant la soumission du formulaire
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Envoyer la requête d'inscription
      // Notez que l'URL est maintenant /api/register si votre route est préfixée par /api
      const response = await axios.post("/api/register", form);

      console.log("Inscription réussie ✅", response.data);

      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        // Redirection vers la page d'accueil
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Erreur d'inscription:", err);

      // Afficher l'erreur spécifique si disponible
      if (err.response) {
        if (err.response.status === 419) {
          setError(
            "Erreur CSRF: Session expirée. Veuillez rafraîchir la page."
          );
        } else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else if (err.response.data && err.response.data.errors) {
          // Formater les erreurs de validation
          const errorMessages = Object.values(err.response.data.errors).flat();
          setError(errorMessages.join(" "));
        } else {
          setError("Une erreur s'est produite lors de l'inscription");
        }
      } else {
        setError("Erreur de connexion au serveur. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inscription-container">
      <h2>Inscription</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nom</label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nom"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mot de passe"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password_confirmation">Confirmer mot de passe</label>
          <input
            type="password"
            id="password_confirmation"
            name="password_confirmation"
            value={form.password_confirmation}
            onChange={handleChange}
            placeholder="Confirmer mot de passe"
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? "Inscription en cours..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
};

export default Register;
