// src/components/patient-dashboard/EditProfileForm.jsx
import React, { useState, useEffect } from "react";

const EditProfileForm = ({ profile, onSave, onCancel, actionLoading }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    bloodType: "",
    allergies: [],
    chronicDiseases: [],
    emergencyContact: "",
    medicalHistory: ""
  });

  const [allergiesInput, setAllergiesInput] = useState("");
  const [diseasesInput, setDiseasesInput] = useState("");

  // Initialisation du formulaire avec les données du profil
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        dateOfBirth: profile.dateOfBirth || "",
        bloodType: profile.bloodType || "",
        allergies: profile.allergies || [],
        chronicDiseases: profile.chronicDiseases || [],
        emergencyContact: profile.emergencyContact || "",
        medicalHistory: profile.medicalHistory || ""
      });

      // Initialiser les champs de tags
      setAllergiesInput(profile.allergies ? profile.allergies.join(", ") : "");
      setDiseasesInput(profile.chronicDiseases ? profile.chronicDiseases.join(", ") : "");
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAllergiesChange = (e) => {
    setAllergiesInput(e.target.value);
    const allergiesArray = e.target.value
      .split(",")
      .map(item => item.trim())
      .filter(item => item !== "");

    setFormData({
      ...formData,
      allergies: allergiesArray
    });
  };

  const handleDiseasesChange = (e) => {
    setDiseasesInput(e.target.value);
    const diseasesArray = e.target.value
      .split(",")
      .map(item => item.trim())
      .filter(item => item !== "");

    setFormData({
      ...formData,
      chronicDiseases: diseasesArray
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="edit-profile-form">
      <div className="form-section">
        <h4>Informations personnelles</h4>
        
        <div className="form-group">
          <label htmlFor="name">Nom complet</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={actionLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={actionLoading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={actionLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date de naissance</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={actionLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="address">Adresse</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={actionLoading}
          />
        </div>
      </div>

      <div className="form-section">
        <h4>Informations médicales</h4>
        
        <div className="form-group">
          <label htmlFor="bloodType">Groupe sanguin</label>
          <select
            id="bloodType"
            name="bloodType"
            value={formData.bloodType}
            onChange={handleChange}
            disabled={actionLoading}
          >
            <option value="">Sélectionner un groupe sanguin</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="allergies">Allergies (séparées par des virgules)</label>
          <input
            type="text"
            id="allergies"
            name="allergies"
            value={allergiesInput}
            onChange={handleAllergiesChange}
            placeholder="Ex: pénicilline, arachides, lactose"
            disabled={actionLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="chronicDiseases">Maladies chroniques (séparées par des virgules)</label>
          <input
            type="text"
            id="chronicDiseases"
            name="chronicDiseases"
            value={diseasesInput}
            onChange={handleDiseasesChange}
            placeholder="Ex: asthme, diabète, hypertension"
            disabled={actionLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="emergencyContact">Contact d'urgence</label>
          <input
            type="text"
            id="emergencyContact"
            name="emergencyContact"
            value={formData.emergencyContact}
            onChange={handleChange}
            placeholder="Nom et numéro de téléphone"
            disabled={actionLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="medicalHistory">Antécédents médicaux</label>
          <textarea
            id="medicalHistory"
            name="medicalHistory"
            value={formData.medicalHistory}
            onChange={handleChange}
            rows="4"
            placeholder="Informations importantes sur vos antécédents médicaux"
            disabled={actionLoading}
          ></textarea>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={actionLoading}>
          {actionLoading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={onCancel}
          disabled={actionLoading}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;