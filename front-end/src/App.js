// src/App.jsx - Version modifiée sans les routes patient-invoices
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyCode from "./pages/VerifyCode";
import "./theme-variables.css";

// ThemeManager component
const ThemeManager = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Retirer toutes les classes de thème précédentes
    document.body.classList.remove('patient-theme', 'doctor-theme', 'admin-theme', 'auth-theme');
    
    // Appliquer la classe de thème appropriée en fonction de la route
    if (location.pathname.includes('/admin')) {
      // Pour tout chemin contenant /admin, appliquer le thème admin
      document.body.classList.add('admin-theme');
    } else if (location.pathname.includes('/patient')) {
      document.body.classList.add('patient-theme');
    } else if (location.pathname.includes('/doctor')) {
      document.body.classList.add('doctor-theme');
    } else if (['/login', '/register', '/forgot-password', '/reset-password'].some(path => 
      location.pathname === path)) {
      document.body.classList.add('auth-theme');
    } else {
      // Par défaut, la page d'accueil utilise le thème auth
      document.body.classList.add('auth-theme');
    }
  }, [location]);

  return children;
};

// Protected route component to ensure authentication
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole"); // Nous devrons stocker le rôle de l'utilisateur lors de la connexion

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont spécifiés, vérifier que l'utilisateur a le bon rôle
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Rediriger vers le tableau de bord approprié en fonction du rôle
    if (userRole === "patient") {
      return <Navigate to="/patient/dashboard" replace />;
    } else if (userRole === "doctor") {
      return <Navigate to="/doctor/dashboard" replace />;
    } else if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // Par défaut, rediriger vers la page d'accueil
    return <Navigate to="/" replace />;
  }

  return children;
};

// Configuration de l'authentification Google - Vous devez remplacer cet ID client par le vôtre
const googleClientId = "246362871518-5h6ebt99mhs3qnhq0qq9lkkolhv8hhea.apps.googleusercontent.com";

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <ThemeManager>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-code" element={<VerifyCode />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Route pour gérer le callback OAuth */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Routes protégées pour les patients */}
            <Route
              path="/patient/dashboard/*"
              element={
                <ProtectedRoute allowedRoles={["patient", "admin"]}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />

            {/* Routes protégées pour les médecins */}
            <Route
              path="/doctor/dashboard/*"
              element={
                <ProtectedRoute allowedRoles={["doctor", "admin"]}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Routes protégées pour les administrateurs */}
            <Route
              path="/admin/dashboard/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Redirection des anciennes routes d'invoices vers le dashboard admin */}
            <Route path="/invoices" element={<Navigate to="/admin/dashboard/invoices" replace />} />
            <Route path="/invoices/:id" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/invoices/create" element={<Navigate to="/admin/dashboard/invoices/create" replace />} />
            <Route path="/invoices/edit/:id" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </ThemeManager>
      </Router>
    </GoogleOAuthProvider>
  );
}

// Composant pour gérer le callback OAuth
const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');
    const error = params.get('error');
    
    if (error) {
      // En cas d'erreur, rediriger vers la page de connexion avec un message d'erreur
      navigate('/login', { state: { error } });
      return;
    }
    
    if (token && role) {
      // Stocker le token et le rôle
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      
      // Rediriger vers le tableau de bord approprié
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } else {
      // Paramètres manquants, rediriger vers la page de connexion
      navigate('/login');
    }
  }, [location, navigate]);
  
  // Afficher un message de chargement pendant la redirection
  return (
    <div className="auth-callback-page">
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Authentification en cours...</p>
      </div>
    </div>
  );
};

export default App;