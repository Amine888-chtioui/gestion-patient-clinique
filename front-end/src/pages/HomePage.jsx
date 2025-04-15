import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HomePage.css";
// Importez vos images ici
// import logo1 from '../assets/favicon.png';
// import logo2 from '../assets/3.png';
// import carousel from '../assets/6.jpg';
// import aboutImage from '../assets/pexels-photo-8326324.jpeg';
// import aboutImageSmall from '../assets/bg-1.jpg';

const HomePage = () => {
  return (
    <>
      {/* Upper Bar */}
      <div className="upper-bar">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm">
              <span>
                <a href="#">
                  <i className="fa-solid fa-location-dot fa-1x"></i>Lieu: Fes,
                  RTE Immouzer 17 - MAROC
                </a>
              </span>
            </div>
            <div className="col-sm">
              <span>
                <a href="#">
                  <i className="fa-solid fa-phone fa-1x"></i> Ligne d'urgence :
                  0536629878
                </a>
              </span>
            </div>
            <div className="col-sm">
              <span>
                <a href="#">
                  <i className="fas fa-clock fa-1x"></i> Lun - Ven : 8:00 am -
                  7:00 pm
                </a>
              </span>
            </div>
            <div className="col-sm">
              <a href="#">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#">
                <i className="fab fa-linkedin"></i>
              </a>
              <a href="#">
                <i className="fab fa-instagram"></i>
              </a>
              <a className="search" href="#">
                <i className="fa-solid fa-magnifying-glass"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link className="navbar-brand" to="/">
            {/* Remplacez par vos images réelles */}
            <img className="logo1" src="/images/logo.png" alt="logo" />
            <img className="logo2" src="/images/favicon.png" alt="logo" />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#main"
            aria-controls="main"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="main">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a
                  className="nav-link active text-uppercase"
                  aria-current="page"
                  href="#"
                >
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-uppercase" href="#about">
                  About
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-uppercase" href="#">
                  blog
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-uppercase" href="#">
                  services
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-uppercase" href="#contact">
                  Contact
                </a>
              </li>
              <li className="nav-item">
                <Link className="bane" to="/login">
                  connexion
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Carousel/Hero Section */}
      <div className="carousel-inner">
        <div className="carousel-item active c-item">
          {/* Remplacez par votre image réelle */}
          <img
            src="/images/6.jpg"
            className="d-block w-100 c-img"
            alt="..."
          />
          <div className="carousel-caption">
            <div className="file text-center">
              <h1 className="display-1 text-uppercase fw-bolder">
                BIENVENUE
                <br />
                DANS NOTRE
                <br />
                CLINIQUE
              </h1>
              <p className="fs-4 mt-3">
                Some representative placeholder content for the first slide.
              </p>
              <a className="bane mt-3 d-inline-block" href="#about">
                à propos de nous
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats/Features Section */}
      <div className="bord">
        <div className="container-fluid">
          <div className="rame">
            <div className="col-sm">
              <i className="fa-solid fa-bed fa-4x"></i>
              <p>
                Le Groupe AKDITAL représente plus 20% de la capacité litière
                privée du Maroc
              </p>
            </div>
            <div className="col-sm">
              <i className="fa-solid fa-users fa-4x"></i>
              <p>
                6826 collaborateurs travaillent dans un écosystème de qualité C
              </p>
            </div>
            <div className="col-sm">
              <i className="fa-solid fa-hospital fa-4x"></i>
              <p>
                33 établissements de santé et de nombreuses ouvertures sont à
                venir
              </p>
            </div>
            <div className="col-sm">
              <i className="fas fa-chevron-circle-down fa-4x"></i>
              <p>12 ans d'expertise, d'excellence et de dévouement</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="section" id="about">
        <div className="container-fluid">
          <div className="image">
            {/* Remplacez par votre image réelle */}
            <img
              className="img-fluid"
              src="/images/jon.jpeg"
              alt="img"
              style={{ width: "20%", height: "600px", objectFit: "cover" }}
            />
          </div>
          <div className="imageph">
            <h1 className="display-1">
              <i>À propos de nous</i>
            </h1>
            <p>
              Le Groupe AKDITAL est le leader du secteur privé de la santé au
              Maroc, opérant un réseau de 32 établissements de santé répartis
              sur plusieurs villes du royaume et représentant plus de 20% de
              l'offre nationale privée. Nous proposons une gamme complète de
              soins médicaux, couvrant toutes les spécialités et offrant une
              continuité des soins grâce à une prise en charge individualisée et
              multidisciplinaire. Notre pilosophie place le patient au cœur de
              nos actions, s'appuyant sur des installations modernes,
              l'excellence clinique et la qualité de service.
            </p>
            {/* Remplacez par votre image réelle */}
            <img
              className="img-fluid"
              src="/images/bg-1.jpg"
              alt="img"
              style={{ width: "1000px", height: "500px", maxWidth: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <div className="content">
          <h2>Contactez-nous</h2>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos
            nostrum cum asperiores deserunt iste doloribus distinctio ratione
            voluptas alias?
          </p>
        </div>
        <div className="containere">
          <div className="contact-info">
            <div className="box">
              <div className="icon">
                <b></b>
                <i className="fa-solid fa-location-dot"></i>
              </div>
              <div className="text">
                <h3>Address</h3>
                <p>Lieu: Fes, RTE Immouzer 17 - MAROC</p>
              </div>
            </div>
            <div className="box">
              <div className="icon">
                <b></b>
                <i className="fa-solid fa-envelope"></i>
              </div>
              <div className="text">
                <h3>Email</h3>
                <p>Hopitaltazi@gmail.com</p>
              </div>
            </div>
            <div className="box">
              <div className="icon">
                <b></b>
                <i className="fa-solid fa-phone"></i>
              </div>
              <div className="text">
                <h3>Téléphone</h3>
                <p>+212533775473</p>
              </div>
            </div>

            <h2 className="txt">Connectez-vous avec nous</h2>
            <ul className="sci">
              <li>
                <a href="">
                  <i className="fab fa-facebook"></i>
                </a>
              </li>
              <li>
                <a href="">
                  <i className="fa-brands fa-x-twitter"></i>
                </a>
              </li>
              <li>
                <a href="">
                  <i className="fa-brands fa-instagram"></i>
                </a>
              </li>
            </ul>
          </div>

          <div className="contact-form">
            <form>
              <h2>Envoyer un message</h2>
              <div className="inputBox">
                <input type="text" required="required" />
                <span>Nom et prénom</span>
              </div>
              <div className="inputBox">
                <input type="text" required="required" />
                <span>Email</span>
              </div>
              <div className="inputBox">
                <textarea required="required"></textarea>
                <span>Tapez votre message...</span>
              </div>
              <div className="inputBox">
                <input type="submit" value="Send" />
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="footer pt-5 pb-5 text-center d-flex justify-content-center align-items-center">
        <div className="container">
          <div className="row">
            <div className="col-md-4 text-center">
              <div className="info">
                {/* Remplacez par votre image réelle */}
                <img src="/images/logo.png" alt="" className="mb-4" />
              </div>
            </div>
            <div className="col-md-4 text-center">
              <h1 className="fw-bold mb-4">Contactez-nous</h1>
              <p>246 Rte de l'Oasis, Casablanca 20250</p>
              <p>+212 (0) 522 23 14 14</p>
              <p>
                <a href="mailto:communication@akdital.ma">
                  communication@akdital.ma
                </a>
              </p>
            </div>
            <div className="copyright">
              © 2024 Copyright AKDITAL All Rights Reserved
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
