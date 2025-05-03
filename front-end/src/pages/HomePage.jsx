import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HomePage.css";

const HomePage = () => {
  // État pour le formulaire de contact
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Soumettre le formulaire de contact
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post("/api/contact", formData);
      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      {/* Navigation */}
      <header className="header">
        <div className="top-bar">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="top-info">
                <div className="info-item">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>Fes, RTE Immouzer 17 - MAROC</span>
                </div>
                <div className="info-item">
                  <i className="fa-solid fa-phone"></i>
                  <span>Urgence: 0536629878</span>
                </div>
                <div className="info-item">
                  <i className="fas fa-clock"></i>
                  <span>24/7</span>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <div className="social-icons">
                <a href="#" aria-label="Facebook">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="#" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        <nav className="navbar navbar-expand-lg">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <img
                src="/images/logo.png"
                alt="Clinic Logo"
                className="main-logo"
              />
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNav"
              aria-controls="mainNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="mainNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <a className="nav-link active" href="#">
                    Accueil
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#about">
                    À propos
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#hours">
                    Horaires
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#services">
                    Services
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#contact">
                    Contact
                  </a>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary auth-btn" to="/login">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        className="hero-section"
        style={{
          backgroundImage: "url('/images/6.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "cover",
        }}
      >
        <div className="overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 style={{ fontSize: "3rem", color: "#fff" }}>
              BIENVENUE DANS
              <br />
              NOTRE CLINIQUE
            </h1>
            <p>
              Améliorer La Qualité De Votre Vie Grâce À Une Meilleure Santé.
            </p>
            <div className="hero-buttons">
              <a href="#about" className="btn btn-primary">
                À propos de nous
              </a>
              <Link to="/register" className="btn btn-outline">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="row stats-row">
            <div className="col-md-3 col-sm-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-bed"></i>
                </div>
                <div className="stat-content">
                  <h3>20%</h3>
                  <p>de la capacité litière privée du Maroc</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>6826</h3>
                  <p>collaborateurs qualifiés</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-hospital"></i>
                </div>
                <div className="stat-content">
                  <h3>33</h3>
                  <p>établissements de santé</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div className="stat-content">
                  <h3>12</h3>
                  <p>ans d'expertise et d'excellence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="container">
          <div className="section-header">
            <h2>À propos de nous</h2>
            <div className="header-line"></div>
          </div>
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="about-content">
                <p>
                  Le Groupe AKDITAL est le leader du secteur privé de la santé
                  au Maroc, opérant un réseau de 32 établissements de santé
                  répartis sur plusieurs villes du royaume et représentant plus
                  de 20% de l'offre nationale privée. Nous proposons une gamme
                  complète de soins médicaux, couvrant toutes les spécialités et
                  offrant une continuité des soins grâce à une prise en charge
                  individualisée et multidisciplinaire.
                </p>
                <p>
                  Notre philosophie place le patient au cœur de nos actions,
                  s'appuyant sur des installations modernes, l'excellence
                  clinique et la qualité de service.
                </p>
                <Link to="/register" className="btn btn-primary">
                  Rejoignez-nous <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="about-image">
                <img
                  src="/images/bg-1.jpg"
                  alt="À propos de notre clinique"
                  className="img-fluid rounded shadow"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hours Section */}
      <section className="hours-section" id="hours">
        <div className="container">
          <div className="section-header">
            <h2>Nos Horaires d'Ouverture</h2>
            <div className="header-line"></div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <div className="hours-card">
                <div className="hours-icon-title">
                  <i className="fas fa-clock hours-icon"></i>
                  <h3>Nous sommes là pour vous 24/7</h3>
                </div>
                <div className="hours-table">
                  <div className="hours-row">
                    <span className="day">Lundi</span>
                    <span className="time">00:00 - 23:59</span>
                  </div>
                  <div className="hours-row">
                    <span className="day">Mardi</span>
                    <span className="time">00:00 - 23:59</span>
                  </div>
                  <div className="hours-row">
                    <span className="day">Mercredi</span>
                    <span className="time">00:00 - 23:59</span>
                  </div>
                  <div className="hours-row">
                    <span className="day">Jeudi</span>
                    <span className="time">00:00 - 23:59</span>
                  </div>
                  <div className="hours-row">
                    <span className="day">Vendredi</span>
                    <span className="time">00:00 - 23:59</span>
                  </div>
                  <div className="hours-row">
                    <span className="day">Samedi</span>
                    <span className="time">00:00 - 23:59</span>
                  </div>
                  <div className="hours-row">
                    <span className="day">Dimanche</span>
                    <span className="time">00:00 - 23:59</span>
                  </div>
                </div>
                <div className="hours-note">
                  Service d'urgence disponible 24h/24, 7j/7
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hours-image">
                <img
                  src="/images/jon.jpeg"
                  alt="Médecin"
                  className="img-fluid"
                />
                <div className="hours-caption">
                  <h3>Des soins quand vous en avez besoin</h3>
                  <p>
                    Notre équipe médicale est disponible en permanence pour
                    assurer votre bien-être
                  </p>
                  <Link to="/login" className="btn btn-light">
                    Prendre Rendez-vous <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="services-section" id="services">
        <div className="container">
          <div className="section-header">
            <h2>Nos Services Médicaux</h2>
            <div className="header-line"></div>
            <p>
              Nous proposons une gamme complète de services médicaux pour
              répondre à vos besoins de santé
            </p>
          </div>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-stethoscope"></i>
              </div>
              <h3>Consultations Médicales</h3>
              <p>
                Consultations avec nos médecins généralistes et spécialistes
                pour tous vos besoins médicaux.
              </p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-heartbeat"></i>
              </div>
              <h3>Cardiologie</h3>
              <p>
                Diagnostic et traitement des maladies cardiovasculaires par nos
                cardiologues expérimentés.
              </p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-x-ray"></i>
              </div>
              <h3>Radiologie</h3>
              <p>
                Services d'imagerie médicale incluant radiographie, échographie,
                scanner et IRM.
              </p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-teeth"></i>
              </div>
              <h3>Dentisterie</h3>
              <p>
                Soins dentaires complets incluant prévention, traitement et
                chirurgie buccale.
              </p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-brain"></i>
              </div>
              <h3>Neurologie</h3>
              <p>
                Diagnostic et traitement des troubles du système nerveux par nos
                neurologues qualifiés.
              </p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-baby"></i>
              </div>
              <h3>Pédiatrie</h3>
              <p>
                Soins médicaux spécialisés pour les enfants, de la naissance à
                l'adolescence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <div className="section-header">
            <h2>Contactez-nous</h2>
            <div className="header-line"></div>
            <p>
              Notre équipe est disponible pour répondre à toutes vos questions
              et vous aider à prendre rendez-vous avec nos spécialistes.
            </p>
          </div>
          <div className="row">
            <div className="col-lg-5">
              <div className="contact-info">
                <div className="contact-item">
                  <div className="icon-box">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <div className="content">
                    <h4>Adresse</h4>
                    <p>Fes, RTE Immouzer 17 - MAROC</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="icon-box">
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div className="content">
                    <h4>Email</h4>
                    <p>Hopitaltazi@gmail.com</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="icon-box">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div className="content">
                    <h4>Téléphone</h4>
                    <p>+212533775473</p>
                  </div>
                </div>
                <h4 className="social-title">Connectez-vous avec nous</h4>
                <div className="social-icons">
                  <a href="#" aria-label="Facebook">
                    <i className="fab fa-facebook"></i>
                  </a>
                  <a href="#" aria-label="Twitter">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" aria-label="Instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="#" aria-label="LinkedIn">
                    <i className="fab fa-linkedin"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="contact-form-wrap">
                <h3>Envoyer un message</h3>
                {success && (
                  <div className="alert alert-success">
                    <i className="fas fa-check-circle"></i> Votre message a été
                    envoyé avec succès. Nous vous contacterons bientôt.
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger">
                    <i className="fas fa-exclamation-circle"></i> {error}
                  </div>
                )}
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nom et prénom"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Votre message..."
                      rows="5"
                      required
                      disabled={loading}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <span>
                        <i className="fas fa-spinner fa-spin"></i> Envoi en
                        cours...
                      </span>
                    ) : (
                      <span>
                        Envoyer <i className="fas fa-paper-plane"></i>
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-md-4">
              <div className="footer-logo">
                <img src="/images/logo.png" alt="Logo" />
              </div>
              <p>
                Nous nous engageons à offrir des soins de santé de haute qualité
                avec compassion et excellence pour améliorer la vie de nos
                patients.
              </p>
            </div>
            <div className="col-md-4">
              <h4>Liens rapides</h4>
              <div className="footer-links-horizontal">
                <ul>
                  <li>
                    <a href="#">Accueil</a>
                  </li>
                  <li>
                    <a href="#about">À propos</a>
                  </li>
                  <li>
                    <a href="#hours">Horaires</a>
                  </li>
                  <li>
                    <a href="#contact">Contact</a>
                  </li>
                  <li>
                    <Link to="/login">Connexion</Link>
                  </li>
                  <li>
                    <Link to="/register">Inscription</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-md-4">
              <h4>Contactez-nous</h4>
              <p>
                <i className="fa-solid fa-location-dot"></i> 246 Rte de l'Oasis,
                Casablanca 20250
              </p>
              <p>
                <i className="fa-solid fa-phone"></i> +212 (0) 522 23 14 14
              </p>
              <p>
                <i className="fa-solid fa-envelope"></i>{" "}
                <a href="mailto:communication@akdital.ma">
                  communication@akdital.ma
                </a>
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 Copyright AKDITAL All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
