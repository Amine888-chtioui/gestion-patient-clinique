// src/utils/adminDashboardUtils.js
import { USER_ROLES, APPOINTMENT_STATUSES, NOTIFICATION_TYPES } from '../constants/adminDashboard';

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

  // Formatter une date et heure
  formatDateTime: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
  },

  // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
  getTodayString: () => {
    return new Date().toISOString().split('T')[0];
  },

  // Vérifier si une date est aujourd'hui
  isToday: (dateString) => {
    return dateString === dateUtils.getTodayString();
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

  // Formatter le temps relatif
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

  // Parser un string en nombre
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
  // Obtenir les informations d'un rôle utilisateur
  getUserRole: (role) => {
    return USER_ROLES[role] || { 
      label: role, 
      class: 'unknown',
      color: '#6c757d'
    };
  },

  // Obtenir les informations d'un statut de rendez-vous
  getAppointmentStatus: (status) => {
    return APPOINTMENT_STATUSES[status] || { 
      label: status, 
      class: 'unknown',
      color: '#6c757d'
    };
  },

  // Obtenir les informations d'un type de notification
  getNotificationType: (type) => {
    return NOTIFICATION_TYPES[type] || {
      icon: 'fa-bell',
      class: 'text-primary'
    };
  },

  // Obtenir la classe CSS pour un badge de statut
  getStatusBadgeClass: (status, type = 'appointment') => {
    let statusInfo;
    switch (type) {
      case 'role':
        statusInfo = statusUtils.getUserRole(status);
        break;
      case 'appointment':
      default:
        statusInfo = statusUtils.getAppointmentStatus(status);
        break;
    }
    return `status-badge ${statusInfo.class}`;
  },

  // Obtenir la classe CSS pour un badge de rôle
  getRoleBadgeClass: (role) => {
    const roleInfo = statusUtils.getUserRole(role);
    return `role-badge ${roleInfo.class}`;
  }
};

/**
 * Utilitaires pour les fichiers
 */
export const fileUtils = {
  // Formater la taille d'un fichier
  formatFileSize: (bytes) => {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  },

  // Valider un fichier
  validateFile: (file, maxSize = 2 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png']) => {
    const errors = [];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Type de fichier non autorisé: ${file.type}`);
    }
    
    if (file.size > maxSize) {
      errors.push(`Fichier trop volumineux: ${fileUtils.formatFileSize(file.size)} (max: ${fileUtils.formatFileSize(maxSize)})`);
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

  // Nettoyer les données d'un formulaire
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
  // Extraire un message d'erreur lisible
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

  // Vérifier si une erreur est due à l'authentification
  isAuthError: (error) => {
    return error.response?.status === 401;
  },

  // Vérifier si une erreur est due aux permissions
  isPermissionError: (error) => {
    return error.response?.status === 403;
  },

  // Vérifier si une erreur est due à la validation
  isValidationError: (error) => {
    return error.response?.status === 422;
  }
};

/**
 * Utilitaires pour les statistiques
 */
export const statsUtils = {
  // Calculer un pourcentage
  calculatePercentage: (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  // Calculer un taux de croissance
  calculateGrowthRate: (currentValue, previousValue) => {
    if (!previousValue || previousValue === 0) return 0;
    return Math.round(((currentValue - previousValue) / previousValue) * 100);
  },

  // Formater un nombre avec séparateurs
  formatNumber: (number) => {
    return new Intl.NumberFormat('fr-FR').format(number || 0);
  },

  // Calculer la moyenne d'un tableau
  calculateAverage: (numbers) => {
    if (!numbers || numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + (num || 0), 0);
    return Math.round(sum / numbers.length);
  },

  // Obtenir les données pour un graphique en camembert
  getPieChartData: (data, total) => {
    return Object.entries(data).map(([key, value]) => ({
      name: key,
      value: value,
      percentage: statsUtils.calculatePercentage(value, total)
    }));
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
  }
};

/**
 * Utilitaires pour les graphiques
 */
export const chartUtils = {
  // Obtenir le nom du mois
  getMonthName: (monthNumber) => {
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return months[monthNumber - 1] || '';
  },

  // Transformer les données de rendez-vous par mois
  formatAppointmentsByMonth: (data) => {
    return Object.entries(data || {}).map(([month, count]) => ({
      name: chartUtils.getMonthName(parseInt(month)),
      value: count
    }));
  },

  // Transformer les données de revenus par mois
  formatRevenueByMonth: (data) => {
    return Object.entries(data || {}).map(([month, revenue]) => ({
      name: chartUtils.getMonthName(parseInt(month)),
      montant: revenue.amount || 0,
      nombre: revenue.count || 0
    }));
  },

  // Générer des couleurs pour les graphiques
  generateColors: (count) => {
    const baseColors = ['#6a1b9a', '#1976d2', '#28a745', '#ffc107', '#dc3545', '#17a2b8'];
    const colors = [];
    
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }
};

/**
 * Utilitaires pour les notifications
 */
export const notificationUtils = {
  // Obtenir l'icône d'une notification
  getNotificationIcon: (type) => {
    const typeInfo = statusUtils.getNotificationType(type);
    return typeInfo.icon;
  },

  // Obtenir la classe CSS d'une notification
  getNotificationClass: (type) => {
    const typeInfo = statusUtils.getNotificationType(type);
    return typeInfo.class;
  },

  // Formater le titre d'une notification
  formatNotificationTitle: (notification) => {
    if (!notification.title) return 'Notification';
    
    return notification.title.length > 50 
      ? `${notification.title.substring(0, 50)}...`
      : notification.title;
  },

  // Formater le message d'une notification
  formatNotificationMessage: (notification) => {
    if (!notification.message) return '';
    
    return notification.message.length > 100
      ? `${notification.message.substring(0, 100)}...`
      : notification.message;
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
  statsUtils,
  storageUtils,
  chartUtils,
  notificationUtils
};