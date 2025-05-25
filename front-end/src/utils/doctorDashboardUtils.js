// src/utils/doctorDashboardUtils.js
import { APPOINTMENT_STATUSES, INVOICE_STATUSES, FILE_TYPES } from '../constants/doctorDashboard';

/**
 * Utilitaires pour les dates
 */
export const dateUtils = {
  // Formatter une date au format français
  formatDate: (dateString, options = {}) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      ...options
    };
    return date.toLocaleDateString('fr-FR', defaultOptions);
  },

  // Formatter une date avec le jour de la semaine
  formatDateWithDay: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
  getTodayString: () => {
    return new Date().toISOString().split('T')[0];
  },

  // Vérifier si une date est aujourd'hui
  isToday: (dateString) => {
    return dateString === dateUtils.getTodayString();
  },

  // Vérifier si une date est dans le passé
  isPast: (dateString) => {
    return new Date(dateString) < new Date(dateUtils.getTodayString());
  },

  // Vérifier si une date est dans le futur
  isFuture: (dateString) => {
    return new Date(dateString) > new Date(dateUtils.getTodayString());
  },

  // Calculer l'âge à partir d'une date de naissance
  calculateAge: (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  // Formatter le temps relatif (il y a X jours)
  formatRelativeTime: (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "À l'instant";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `Il y a ${diffInMonths} mois`;
  }
};

/**
 * Utilitaires pour les montants
 */
export const currencyUtils = {
  // Formatter un montant en euros
  formatCurrency: (amount, options = {}) => {
    const defaultOptions = {
      style: 'currency',
      currency: 'EUR',
      ...options
    };
    return new Intl.NumberFormat('fr-FR', defaultOptions).format(amount || 0);
  },

  // Parser un string en nombre pour les calculs
  parseCurrency: (value) => {
    if (typeof value === 'number') return value;
    const cleanValue = value?.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  }
};

/**
 * Utilitaires pour les statuts
 */
export const statusUtils = {
  // Obtenir les informations d'un statut de rendez-vous
  getAppointmentStatus: (status) => {
    return APPOINTMENT_STATUSES[status] || { 
      label: status, 
      class: 'unknown',
      color: '#6c757d'
    };
  },

  // Obtenir les informations d'un statut de facture
  getInvoiceStatus: (status) => {
    return INVOICE_STATUSES[status] || { 
      label: status, 
      class: 'unknown',
      color: '#6c757d'
    };
  },

  // Obtenir la classe CSS pour un badge de statut
  getStatusBadgeClass: (status, type = 'appointment') => {
    const statusInfo = type === 'invoice' 
      ? statusUtils.getInvoiceStatus(status)
      : statusUtils.getAppointmentStatus(status);
    return `status-badge ${statusInfo.class}`;
  }
};

/**
 * Utilitaires pour les fichiers
 */
export const fileUtils = {
  // Vérifier si un type de fichier est autorisé
  isFileTypeAllowed: (fileType) => {
    return FILE_TYPES.ALLOWED.includes(fileType);
  },

  // Vérifier si la taille du fichier est acceptable
  isFileSizeValid: (fileSize) => {
    return fileSize <= FILE_TYPES.MAX_SIZE;
  },

  // Obtenir l'icône pour un type de fichier
  getFileIcon: (fileType) => {
    if (!fileType) return FILE_TYPES.ICONS.default;
    
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) return FILE_TYPES.ICONS.pdf;
    if (type.includes('image')) return FILE_TYPES.ICONS.image;
    if (type.includes('word') || type.includes('doc')) return FILE_TYPES.ICONS.word;
    if (type.includes('excel') || type.includes('sheet')) return FILE_TYPES.ICONS.excel;
    if (type.includes('text')) return FILE_TYPES.ICONS.text;
    
    return FILE_TYPES.ICONS.default;
  },

  // Formatter la taille d'un fichier
  formatFileSize: (bytes) => {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  },

  // Valider un fichier
  validateFile: (file) => {
    const errors = [];
    
    if (!fileUtils.isFileTypeAllowed(file.type)) {
      errors.push(`Type de fichier non autorisé: ${file.type}`);
    }
    
    if (!fileUtils.isFileSizeValid(file.size)) {
      errors.push(`Fichier trop volumineux: ${fileUtils.formatFileSize(file.size)} (max: ${fileUtils.formatFileSize(FILE_TYPES.MAX_SIZE)})`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Utilitaires pour les collections
 */
export const collectionUtils = {
  // Filtrer une liste par terme de recherche
  filterBySearchTerm: (items, searchTerm, fields = ['name']) => {
    if (!searchTerm || searchTerm.trim() === '') return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      })
    );
  },

  // Trier une liste par un champ
  sortBy: (items, field, direction = 'asc') => {
    return [...items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // Grouper une liste par un champ
  groupBy: (items, field) => {
    return items.reduce((groups, item) => {
      const key = item[field];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  },

  // Paginer une liste
  paginate: (items, page = 1, pageSize = 10) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      items: items.slice(startIndex, endIndex),
      totalItems: items.length,
      totalPages: Math.ceil(items.length / pageSize),
      currentPage: page,
      pageSize,
      hasNextPage: endIndex < items.length,
      hasPreviousPage: page > 1
    };
  }
};

/**
 * Utilitaires pour la validation
 */
export const validationUtils = {
  // Valider un email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Valider un numéro de téléphone français
  isValidPhoneNumber: (phone) => {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(phone);
  },

  // Valider une date
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  // Valider un mot de passe
  isValidPassword: (password) => {
    return password && password.length >= 8;
  },

  // Nettoyer et valider les données d'un formulaire
  sanitizeFormData: (data) => {
    const sanitized = {};
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }
};

/**
 * Utilitaires pour les erreurs
 */
export const errorUtils = {
  // Extraire un message d'erreur lisible depuis une réponse API
  extractErrorMessage: (error, defaultMessage = "Une erreur inattendue s'est produite") => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return defaultMessage;
  },

  // Vérifier si une erreur est due à un problème d'authentification
  isAuthError: (error) => {
    return error.response?.status === 401;
  },

  // Vérifier si une erreur est due à un problème de permission
  isPermissionError: (error) => {
    return error.response?.status === 403;
  },

  // Vérifier si une erreur est due à un problème de réseau
  isNetworkError: (error) => {
    return !error.response && error.code === 'NETWORK_ERROR';
  }
};

/**
 * Utilitaires pour le stockage local
 */
export const storageUtils = {
  // Sauvegarder des données dans le localStorage
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  },

  // Récupérer des données du localStorage
  load: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return defaultValue;
    }
  },

  // Supprimer des données du localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  },

  // Vider tout le localStorage
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erreur lors du vidage:', error);
      return false;
    }
  }
};

export default {
  dateUtils,
  currencyUtils,
  statusUtils,
  fileUtils,
  collectionUtils,
  validationUtils,
  errorUtils,
  storageUtils
};