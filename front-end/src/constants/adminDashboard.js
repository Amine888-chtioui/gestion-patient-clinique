// src/constants/adminDashboard.js
export const ADMIN_TABS = [
  { id: "overview", icon: "home", label: "Tableau de bord" },
  { id: "patients", icon: "user-injured", label: "Patients" },
  { id: "doctors", icon: "user-md", label: "Médecins" },
  { id: "appointments", icon: "calendar-alt", label: "Rendez-vous" },
  { id: "medicalRecords", icon: "file-medical", label: "Dossiers médicaux" },
  { id: "prescriptions", icon: "prescription", label: "Ordonnances" },
  { id: "services", icon: "hospital", label: "Services" },
  { id: "invoices", icon: "file-invoice-dollar", label: "Factures" },
  { id: "payments", icon: "credit-card", label: "Paiements" },
  { id: "contacts", icon: "envelope", label: "Messages" },
  { id: "statistics", icon: "chart-bar", label: "Statistiques" },
  { id: "users", icon: "users", label: "Utilisateurs" }
];

export const MOBILE_ADMIN_TABS = [
  { id: "overview", icon: "home", label: "Accueil" },
  { id: "patients", icon: "user-injured", label: "Patients" },
  { id: "appointments", icon: "calendar-alt", label: "RDV" },
  { id: "doctors", icon: "user-md", label: "Médecins" }
];

export const MOBILE_MORE_TABS = [
  { id: "medicalRecords", icon: "file-medical", label: "Dossiers" },
  { id: "invoices", icon: "file-invoice-dollar", label: "Factures" },
  { id: "services", icon: "hospital", label: "Services" },
  { id: "payments", icon: "credit-card", label: "Paiements" },
  { id: "contacts", icon: "envelope", label: "Messages" },
  { id: "statistics", icon: "chart-bar", label: "Stats" },
  { id: "users", icon: "users", label: "Utilisateurs" },
  { id: "profile", icon: "user-cog", label: "Profil" }
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

export const USER_ROLES = {
  admin: { 
    label: "Administrateur", 
    class: "admin",
    color: "#6a1b9a"
  },
  doctor: { 
    label: "Médecin", 
    class: "doctor",
    color: "#1976d2"
  },
  patient: { 
    label: "Patient", 
    class: "patient",
    color: "#4caf50"
  }
};

export const MEDICAL_RECORD_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "analyse", label: "Analyse/Examen" },
  { value: "chirurgie", label: "Intervention chirurgicale" },
  { value: "suivi", label: "Consultation de suivi" },
  { value: "autre", label: "Autre" }
];

export const BLOOD_TYPES = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" }
];

export const NOTIFICATION_TYPES = {
  success: {
    icon: "fa-check-circle",
    class: "text-success"
  },
  warning: {
    icon: "fa-exclamation-triangle", 
    class: "text-warning"
  },
  error: {
    icon: "fa-times-circle",
    class: "text-danger"
  },
  info: {
    icon: "fa-info-circle",
    class: "text-info"
  },
  appointment: {
    icon: "fa-calendar-check",
    class: "text-primary"
  },
  medical: {
    icon: "fa-file-medical",
    class: "text-info"
  },
  prescription: {
    icon: "fa-prescription",
    class: "text-primary"
  },
  patient: {
    icon: "fa-user-injured",
    class: "text-info"
  }
};

export const LOADING_MESSAGES = {
  overview: "Chargement du tableau de bord...",
  patients: "Chargement des patients...",
  doctors: "Chargement des médecins...",
  appointments: "Chargement des rendez-vous...",
  medicalRecords: "Chargement des dossiers médicaux...",
  prescriptions: "Chargement des ordonnances...",
  statistics: "Chargement des statistiques...",
  users: "Chargement des utilisateurs...",
  services: "Chargement des services...",
  invoices: "Chargement des factures...",
  payments: "Chargement des paiements...",
  contacts: "Chargement des messages...",
  profile: "Chargement du profil...",
  initial: "Initialisation du tableau de bord administrateur..."
};

export const SUCCESS_MESSAGES = {
  PATIENT_CREATED: "Patient créé avec succès",
  PATIENT_UPDATED: "Patient mis à jour avec succès", 
  PATIENT_DELETED: "Patient supprimé avec succès",
  DOCTOR_CREATED: "Médecin créé avec succès",
  DOCTOR_UPDATED: "Médecin mis à jour avec succès",
  DOCTOR_DELETED: "Médecin supprimé avec succès",
  APPOINTMENT_CREATED: "Rendez-vous créé avec succès",
  APPOINTMENT_UPDATED: "Rendez-vous mis à jour avec succès",
  APPOINTMENT_DELETED: "Rendez-vous supprimé avec succès",
  USER_CREATED: "Utilisateur créé avec succès",
  USER_UPDATED: "Utilisateur mis à jour avec succès",
  USER_DELETED: "Utilisateur supprimé avec succès",
  PRESCRIPTION_CREATED: "Ordonnance créée avec succès",
  PRESCRIPTION_UPDATED: "Ordonnance mise à jour avec succès",
  PRESCRIPTION_DELETED: "Ordonnance supprimée avec succès",
  PROFILE_UPDATED: "Profil mis à jour avec succès",
  PHOTO_UPDATED: "Photo de profil mise à jour avec succès",
  PASSWORD_UPDATED: "Mot de passe mis à jour avec succès",
  SERVICE_CREATED: "Service créé avec succès",
  SERVICE_UPDATED: "Service mis à jour avec succès",
  SERVICE_DELETED: "Service supprimé avec succès",
  CONTACT_READ: "Message marqué comme lu",
  CONTACT_DELETED: "Message supprimé avec succès"
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Accès non autorisé",
  NETWORK_ERROR: "Erreur de connexion. Veuillez réessayer.",
  UNKNOWN_ERROR: "Une erreur inattendue s'est produite",
  VALIDATION_ERROR: "Erreur de validation des données",
  NOT_FOUND: "Élément non trouvé",
  DUPLICATE_EMAIL: "Cette adresse email est déjà utilisée",
  WEAK_PASSWORD: "Le mot de passe doit contenir au moins 8 caractères",
  FILE_TOO_LARGE: "Le fichier est trop volumineux",
  INVALID_FILE_TYPE: "Type de fichier non autorisé"
};

export const FORM_VALIDATION = {
  REQUIRED_FIELD: "Ce champ est requis",
  EMAIL_INVALID: "Adresse email invalide",
  PASSWORD_MIN_LENGTH: "Le mot de passe doit contenir au moins 8 caractères",
  PASSWORDS_NO_MATCH: "Les mots de passe ne correspondent pas",
  PHONE_INVALID: "Numéro de téléphone invalide",
  DATE_INVALID: "Date invalide",
  POSITIVE_NUMBER: "Doit être un nombre positif"
};

export const API_ENDPOINTS = {
  USER: "/api/user",
  ADMIN: {
    PROFILE: "/api/admin/profile",
    STATISTICS: "/api/admin/statistics",
    PATIENTS: "/api/admin/patients",
    DOCTORS: "/api/admin/doctors", 
    APPOINTMENTS: "/api/admin/appointments",
    MEDICAL_RECORDS: "/api/admin/medical-records",
    PRESCRIPTIONS: "/api/admin/prescriptions",
    USERS: "/api/admin/users",
    SERVICES: "/api/admin/services",
    CONTACTS: "/api/admin/contacts",
    PAYMENT_METHODS: "/api/admin/payment-methods"
  },
  LOGOUT: "/api/logout"
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100]
};

export const FILE_UPLOAD = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

export const CHART_COLORS = {
  PRIMARY: "#6a1b9a",
  SUCCESS: "#28a745", 
  WARNING: "#ffc107",
  DANGER: "#dc3545",
  INFO: "#17a2b8",
  SECONDARY: "#6c757d"
};

export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 992,
  DESKTOP: 1200
};