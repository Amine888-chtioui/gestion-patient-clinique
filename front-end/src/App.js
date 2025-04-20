// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";

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
      // Pour l'instant, rediriger vers la page d'accueil, à modifier quand le tableau de bord admin sera créé
      return <Navigate to="/" replace />;
    }

    // Par défaut, rediriger vers la page d'accueil
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Routes protégées pour les patients */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={["patient", "admin"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées pour les médecins */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["doctor", "admin"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
