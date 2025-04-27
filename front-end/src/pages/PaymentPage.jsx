// src/pages/PaymentPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import PaymentInterface from "../components/patient-dashboard/PaymentInterface";
import "../components/patient-dashboard/PatientDashboard.css";
import "../styles/payment.css";

const PaymentPage = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-page">
      <header className="payment-header">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Logo Clinique" className="logo" />
          <span className="site-name">Centre Médical</span>
        </div>
        <button className="btn-text" onClick={() => navigate("/patient/dashboard")}>
          <i className="fas fa-home"></i> Retour au tableau de bord
        </button>
      </header>

      <main className="payment-main">
        <PaymentInterface />
      </main>
      
      <footer className="payment-footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} Centre Médical. Tous droits réservés.</p>
          <div className="footer-links">
            <a href="#" onClick={(e) => e.preventDefault()}>Conditions d'utilisation</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Politique de confidentialité</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentPage;