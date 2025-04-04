import React, { useEffect, useState } from "react";
import axios from "../axios";
import { Link } from "react-router-dom";

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      // Récupérer le token du localStorage
      const token = localStorage.getItem("token");

      // Si aucun token n'est trouvé, ne pas faire de requête
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Effectuer la requête pour récupérer les données utilisateur
        const response = await axios.get("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Stocker les données utilisateur dans l'état
        setUser(response.data);
        setError(null);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des données utilisateur:",
          err
        );

        // Gérer les différents types d'erreurs
        if (err.response) {
          // La requête a été effectuée et le serveur a répondu avec un code d'état non 2xx
          if (err.response.status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem("token");
            setError("Session expirée. Veuillez vous reconnecter.");
          } else {
            setError(`Erreur serveur: ${err.response.status}`);
          }
        } else if (err.request) {
          // La requête a été effectuée mais aucune réponse n'a été reçue
          setError(
            "Aucune réponse du serveur. Vérifiez votre connexion internet."
          );
        } else {
          // Une erreur s'est produite lors de la configuration de la requête
          setError("Erreur lors de la configuration de la requête.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        // Appeler l'API de déconnexion
        await axios.post(
          "/api/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // Supprimer le token du localStorage
      localStorage.removeItem("token");

      // Réinitialiser l'état utilisateur
      setUser(null);

      // Rediriger vers la page de connexion (si vous utilisez react-router)
      window.location.href = "/login";
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
      // Même si la déconnexion échoue côté serveur, on supprime le token local
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  if (loading) {
    return <div className="loading">Chargement en cours...</div>;
  }

  return (
    <div className="home-container">
      <h1>Bienvenue sur notre application</h1>

      {error && (
        <div className="error-message">
          {error}
          <br />
          <Link to="/login">Se connecter</Link>
        </div>
      )}

      {user ? (
        <div className="user-info">
          <h2>Bonjour, {user.name}</h2>
          <p>Email: {user.email}</p>

          <button onClick={handleLogout} className="logout-btn">
            Se déconnecter
          </button>
        </div>
      ) : (
        <div className="auth-links">
          <p>Vous n'êtes pas connecté.</p>
          <div>
            <Link to="/login" className="auth-btn">
              Se connecter
            </Link>
            <Link to="/register" className="auth-btn">
              S'inscrire
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
