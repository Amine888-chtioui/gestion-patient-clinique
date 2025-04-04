import axios from "axios";

// Créez une instance axios avec la configuration de base
const instance = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Permet d'envoyer les cookies avec les requêtes cross-origin
});

// Fonction pour obtenir le cookie CSRF de Laravel
async function getCsrfToken() {
  try {
    // Appelez l'endpoint de Laravel pour définir le cookie CSRF
    await axios.get("http://127.0.0.1:8000/sanctum/csrf-cookie", {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du cookie CSRF :", error);
  }
}

// Intercepteur pour ajouter le token d'autorisation à chaque requête
instance.interceptors.request.use(
  async (config) => {
    // Pour les requêtes non GET, obtenez d'abord un cookie CSRF
    if (["post", "put", "delete", "patch"].includes(config.method)) {
      await getCsrfToken();
    }

    // Ajoutez le token d'authentification s'il existe
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
