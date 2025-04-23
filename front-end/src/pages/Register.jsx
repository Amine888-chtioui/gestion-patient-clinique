import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../axios";
import "../auth-styles.css";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "patient", // Valeur par défaut
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

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

    // Vérification de la correspondance des mots de passe
    if (form.password !== form.password_confirmation) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Envoyer la requête d'inscription
      const response = await axios.post("/api/register", form);

      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", form.role);

        // Redirection vers la page d'accueil ou le tableau de bord approprié
        if (form.role === "patient") {
          navigate("/patient/dashboard");
        } else {
          navigate("/");
        }
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
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="auth-logo">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <div className="auth-info">
          <h2>Rejoignez notre communauté médicale</h2>
          <p>
            Créez votre compte pour accéder à tous nos services et bénéficier
            d'un suivi médical personnalisé. Notre plateforme sécurisée vous
            garantit une confidentialité totale de vos données de santé.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <i className="fas fa-user-shield"></i>
              <span>Protection de vos données</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-clipboard-check"></i>
              <span>Suivi médical personnalisé</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-hospital-user"></i>
              <span>Accès à tous nos services médicaux</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-container">
          <h1>Inscription</h1>
          <p className="auth-subtitle">
            Créez votre compte en quelques étapes simples
          </p>

          {error && <div className="auth-alert auth-alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="name">Nom complet</label>
              <div className="auth-input-group">
                <i className="fas fa-user"></i>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Entrez votre nom complet"
                  required
                />
              </div>
            </div>

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
              <label htmlFor="password">Mot de passe</label>
              <div className="auth-input-group">
                <i className="fas fa-lock"></i>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Créez un mot de passe"
                  required
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
                  placeholder="Confirmez votre mot de passe"
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label htmlFor="role">Type de compte</label>
              <div className="auth-input-group">
                <i className="fas fa-user-tag"></i>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">
                    Médecin (en attente d'approbation)
                  </option>
                </select>
              </div>
            </div>

            <div className="auth-terms">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">
                J'accepte les <a href="#">termes et conditions</a> et la{" "}
                <a href="#">politique de confidentialité</a>
              </label>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Inscription en
                  cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>

          <div className="auth-separator">
            <span>OU</span>
          </div>

          <div className="auth-links">
            <p>Vous avez déjà un compte?</p>
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

export default Register;
