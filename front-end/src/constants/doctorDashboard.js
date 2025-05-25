// src/constants/doctorDashboard.js
export const DASHBOARD_TABS = [
  { id: "overview", icon: "home", label: "Tableau de bord" },
  { id: "appointments", icon: "calendar-alt", label: "Rendez-vous" },
  { id: "patients", icon: "user-injured", label: "Patients" },
  { id: "invoices", icon: "file-invoice-dollar", label: "Factures" },
  { id: "medical-records", icon: "file-medical", label: "Dossiers médicaux" },
  { id: "prescriptions", icon: "prescription", label: "Ordonnances" },
  { id: "schedules", icon: "clock", label: "Horaires" }
];

export const MOBILE_TABS = [
  { id: "overview", icon: "home", label: "Accueil" },
  { id: "appointments", icon: "calendar-alt", label: "RDV" },
  { id: "patients", icon: "user-injured", label: "Patients" },
  { id: "medical-records", icon: "file-medical", label: "Dossiers" },
  { id: "prescriptions", icon: "prescription", label: "Ordonnances" },
  { id: "invoices", icon: "file-invoice-dollar", label: "Factures" }
];

export const APPOINTMENT_STATUSES = {
  "en attente": { 
    label: "En attente", 
    class: "pending",
    color: "#ffc107"
  },
  "confirmé": { 
    label: "Confirmé", 
    class: "confirmed",
    color: "#28a745"
  },
  "annulé": { 
    label: "Annulé", 
    class: "cancelled",
    color: "#dc3545"
  }
};

export const MEDICAL_RECORD_TYPES = [
  { value: "consultation", label: "Consultation normale" },
  { value: "analyse", label: "Analyse/Examen" },
  { value: "chirurgie", label: "Intervention chirurgicale" },
  { value: "suivi", label: "Consultation de suivi" },
  { value: "autre", label: "Autre" }
];

export const INVOICE_STATUSES = {
  "paid": { 
    label: "Payée", 
    class: "paid",
    color: "#28a745"
  },
  "unpaid": { 
    label: "Non payée", 
    class: "unpaid",
    color: "#007bff"
  },
  "overdue": { 
    label: "En retard", 
    class: "overdue",
    color: "#dc3545"
  },
  "pending": { 
    label: "En attente", 
    class: "pending",
    color: "#ffc107"
  }
};

export const DAYS_OF_WEEK = [
  { value: "monday", label: "Lundi" },
  { value: "tuesday", label: "Mardi" },
  { value: "wednesday", label: "Mercredi" },
  { value: "thursday", label: "Jeudi" },
  { value: "friday", label: "Vendredi" },
  { value: "saturday", label: "Samedi" },
  { value: "sunday", label: "Dimanche" }
];

export const FILE_TYPES = {
  ALLOWED: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain"
  ],
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ICONS: {
    "pdf": "fa-file-pdf",
    "image": "fa-file-image",
    "word": "fa-file-word",
    "excel": "fa-file-excel",
    "text": "fa-file-alt",
    "default": "fa-file"
  }
};

export const NOTIFICATION_TYPES = {
  APPOINTMENT: "appointment",
  MEDICAL_RECORD: "medical",
  PRESCRIPTION: "prescription",
  INVOICE: "invoice",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  INFO: "info"
};

export const API_ENDPOINTS = {
  USER: "/api/user",
  DOCTOR: {
    PROFILE: "/api/doctor/profile",
    APPOINTMENTS: "/api/doctor/appointments",
    PATIENTS: "/api/doctor/patients",
    MEDICAL_RECORDS: "/api/doctor/medical-records",
    PRESCRIPTIONS: "/api/doctor/prescriptions",
    INVOICES: "/api/doctor/invoices",
    SCHEDULES: "/api/doctor/schedules",
    DOCUMENTS: "/api/doctor/documents"
  },
  SERVICES: "/api/patient/services",
  LOGOUT: "/api/logout"
};

export const LOADING_MESSAGES = {
  overview: "Chargement du tableau de bord...",
  appointments: "Chargement des rendez-vous...",
  patients: "Chargement des patients...",
  medicalRecords: "Chargement des dossiers médicaux...",
  prescriptions: "Chargement des ordonnances...",
  invoices: "Chargement des factures...",
  schedules: "Chargement des horaires...",
  profile: "Chargement du profil...",
  documents: "Chargement des documents...",
  initial: "Initialisation du tableau de bord..."
};

export const SUCCESS_MESSAGES = {
  APPOINTMENT_UPDATED: "Statut du rendez-vous mis à jour avec succès",
  MEDICAL_RECORD_CREATED: "Dossier médical créé avec succès",
  PRESCRIPTION_CREATED: "Ordonnance créée avec succès",
  PROFILE_UPDATED: "Profil mis à jour avec succès",
  PHOTO_UPDATED: "Photo de profil mise à jour avec succès",
  DOCUMENT_DOWNLOADED: "Document téléchargé avec succès",
  SCHEDULES_UPDATED: "Horaires mis à jour avec succès"
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Accès non autorisé",
  NETWORK_ERROR: "Erreur de connexion. Veuillez réessayer.",
  UNKNOWN_ERROR: "Une erreur inattendue s'est produite",
  PATIENT_NOT_FOUND: "Patient non trouvé",
  DOCUMENT_NOT_FOUND: "Document non trouvé",
  INVALID_FILE_TYPE: "Type de fichier non autorisé",
  FILE_TOO_LARGE: "Le fichier est trop volumineux"
};

export const FORM_VALIDATION = {
  REQUIRED_FIELD: "Ce champ est requis",
  EMAIL_INVALID: "Adresse email invalide",
  PASSWORD_MIN_LENGTH: "Le mot de passe doit contenir au moins 8 caractères",
  PASSWORDS_NO_MATCH: "Les mots de passe ne correspondent pas",
  PHONE_INVALID: "Numéro de téléphone invalide",
  DATE_INVALID: "Date invalide",
  FILE_SIZE_EXCEEDED: "La taille du fichier dépasse la limite autorisée",
  FILE_TYPE_NOT_ALLOWED: "Type de fichier non autorisé"
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100]
};

export const COLORS = {
  PRIMARY: "#2a8d8e",
  PRIMARY_LIGHT: "#e6f5f5",
  PRIMARY_DARK: "#1a6364",
  SUCCESS: "#28a745",
  WARNING: "#ffc107",
  DANGER: "#dc3545",
  INFO: "#17a2b8",
  LIGHT: "#f8f9fa",
  DARK: "#343a40"
};