// src/App.jsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PatientInvoicesPage from "./pages/PatientInvoicesPage";
import PatientInvoiceDetailsPage from "./pages/PatientInvoiceDetailsPage";
import "./theme-variables.css";
import PaymentPage from "./pages/PaymentPage";
import InvoiceList from "./components/invoices/InvoiceList";
import InvoiceDetails from "./components/invoices/InvoiceDetails";
import InvoiceForm from "./components/invoices/InvoiceForm";

// Composant pour gérer l'application des thèmes
const ThemeManager = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Retirer toutes les classes de thème précédentes
    document.body.classList.remove('patient-theme', 'doctor-theme', 'admin-theme', 'auth-theme');
    
    // Appliquer la classe de thème appropriée en fonction de la route
    if (location.pathname.includes('/patient')) {
      document.body.classList.add('patient-theme');
    } else if (location.pathname.includes('/doctor')) {
      document.body.classList.add('doctor-theme');
    } else if (location.pathname.includes('/admin')) {
      document.body.classList.add('admin-theme');
    } else if (['/login', '/register', '/forgot-password', '/reset-password'].some(path => 
      location.pathname === path)) {
      document.body.classList.add('auth-theme');
    } else {
      // Par défaut, la page d'accueil utilise le thème auth (bleu)
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

function App() {
  return (
    <Router>
      <ThemeManager>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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

          {/* Routes pour les factures patient (accessibles depuis le dashboard ou directement) */}
          <Route
            path="/patient-invoices"
            element={
              <ProtectedRoute allowedRoles={["patient", "admin"]}>
                <PatientInvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient-invoices/:id"
            element={
              <ProtectedRoute allowedRoles={["patient", "admin"]}>
                <PatientInvoiceDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Routes pour l'administration des factures */}
          <Route 
            path="/invoices" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <InvoiceList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invoices/:id" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <InvoiceDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invoices/create" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <InvoiceForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invoices/edit/:id" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <InvoiceForm />
              </ProtectedRoute>
            } 
          />
          <Route
           path="/payment/:id"
           element={
             <ProtectedRoute allowedRoles={["patient", "admin"]}>
               <PaymentPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ThemeManager>
    </Router>
  );
}

export default App;